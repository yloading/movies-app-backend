import * as cheerio from "cheerio";
import { writeFile } from "fs";
import { MovieDataType, TopStarsType } from "../types/MovieDataType";

const IMDB_URL = "https://www.imdb.com/find?q=";
const movieTitles: string[] = [
  "Casper",
  "Dumb and Dumber",
  "Stand by Me",
  "Toy Story",
  "Drop Dead Fred",
];

// Function to fetch HTML from a URL
async function fetchHTML(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch HTML from ${url}: ${response.statusText}`);
  }
  const data = await response.text();
  return data;
}

// Function to scrape the movie page
async function scrapeImdb(movieTitle: string) {
  try {
    // Fetch search results page
    const searchHtml = await fetchHTML(IMDB_URL + movieTitle);
    const $ = cheerio.load(searchHtml);

    // Find the first search result that matches "Casper"
    const firstResult = $(".find-result-item").first();
    const movieLink = firstResult
      .find(".ipc-metadata-list-summary-item__c a")
      .attr("href");

    if (!movieLink) {
      console.log("Movie not found");
      return;
    }

    const movieUrl = `https://www.imdb.com${movieLink}`;

    // Fetch movie details page
    const movieHtml = await fetchHTML(movieUrl);
    const $$ = cheerio.load(movieHtml);
    const movieSectionClassName = ".sc-1f50b7c-4";

    const id = getMovieId(movieLink);

    // Scrape the necessary details
    const title = $$(
      'span.hero__primary-text[data-testid="hero__primary-text"]'
    )
      .first()
      .text();
    console.log(title);
    const rating = $$(".sc-eb51e184-1").first().contents().text().trim();
    const contentRating = $$(".sc-ec65ba05-2 li:nth-of-type(2) a")
      .text()
      .trim();

    const reviews = $$(".sc-eb51e184-3").first().contents().text().trim();
    const director = $$(".ipc-metadata-list-item__list-content-item--link")
      .first()
      .contents()
      .text()
      .trim();
    const duration = $$(".sc-ec65ba05-2 li:nth-of-type(3)")
      .first()
      .text()
      .trim();
    const releaseDate = $$("div")
      .find('[data-testid="title-details-section"] ul li div ul li a')
      .contents()
      .text()
      .trim();
    const summary = $$(`${movieSectionClassName} p span`).first().text().trim();
    const releaseYear = $$(".sc-ec65ba05-2 li").first().text().trim();
    const categories = $$(
      `${movieSectionClassName} div div:nth-of-type(2) a span`
    )
      .get()
      .map((x) => $$(x).text());
    const writers = $$(".sc-1f50b7c-3 div ul li:nth-of-type(2) div ul a")
      .get()
      .map((x) => $$(x).text());
    const stars = $$(".sc-1f50b7c-3 div ul li:nth-of-type(3) div ul a")
      .get()
      .map((x) => $$(x).text());
    const topStars: TopStarsType[] = [];

    $$(".sc-bfec09a1-5").each((i, element) => {
      // Extract title and rating
      const actorName = $$(element).find(".sc-bfec09a1-1").text().trim();
      const characterName = $$(element).find(".sc-bfec09a1-4").text().trim();
      // Create an object and push it into the array
      topStars.push({
        actorName,
        characterName,
      });
    });

    const photos: string[] = [];

    $$('section [data-testid="Photos"] section div a').each((i, element) => {
      const imgUrl = $$(element).find("div img").attr("src");
      if (imgUrl) photos.push(imgUrl);
    });

    const movieObj: MovieDataType = {
      id,
      title,
      scores: {
        imdb: { rating, reviews },
      },
      contentRating,
      releaseDate,
      releaseYear,
      duration,
      categories,
      summary,
      director,
      writers,
      stars,
      topStars,
      photos,
    };

    return movieObj;
  } catch (error) {
    console.error("Error scraping movie:", error);
  }
}

const getMovieId = (url: string) => {
  const idMatch = url.match(/\/title\/(tt\d+)\//);

  const id = idMatch ? idMatch[1] : null;

  return id;
};

const scrapeRottenTomatoes = async (movieTitle: string) => {
  try {
    // Encode the movie title for the URL
    const query = encodeURIComponent(movieTitle);

    // Step 1: Search for the movie
    const searchUrl = `https://www.rottentomatoes.com/search?search=${query}`;
    const searchHtml = await fetchHTML(searchUrl);

    // Step 2: Parse the search results
    const $ = cheerio.load(searchHtml);

    // Rotten Tomatoes search result has movie links like /m/movie_name
    const movieLink = $("search-page-media-row a").attr("href");

    if (!movieLink) {
      console.log("Movie not found.");
      return;
    }

    // Step 3: Visit the movie's page to scrape the rating
    // const movieUrl = `https://www.rottentomatoes.com${movieLink}`;
    const movieHtml = await fetchHTML(movieLink);
    // const movieHtml = movieResponse.data;

    const $$ = cheerio.load(movieHtml);

    // Get the rating from the movie page
    const rating = $$("rt-button")
      .find('[slot="audienceScore"] rt-text')
      .first()
      .text()
      .trim();
    const reviews = $$('rt-link[slot="audienceReviews"]').text().trim();

    return {
      movieTitle,
      rating,
      reviews,
    };
  } catch (error) {
    console.error("An error occurred:", error);
  }
};

const scrapeMetacritic = async (movieTitle: string) => {
  try {
    // Encode the movie title for the URL
    const query = encodeURIComponent(movieTitle);

    // Step 1: Search for the movie on Metacritic
    const searchUrl = `https://www.metacritic.com/search/${query}`;
    const searchHtml = await fetchHTML(searchUrl);

    // Step 2: Parse the search results
    const $ = cheerio.load(searchHtml);

    let movieLink;
    // Metacritic search results have movie links like /movie/movie_name
    $(".c-pageSiteSearch-results div:nth-of-type(2) div a").each(
      (i, element) => {
        const aElement = $(element).find("div:nth-of-type(2) p").text().trim();

        if (aElement === movieTitle) {
          const url = $(element).attr("href");

          if (url?.includes("/movie/")) {
            movieLink = url;
            return;
          }
        }
      }
    );

    if (!movieLink) {
      console.log(`Movie not found for title: ${movieTitle}`);
    }

    // Step 3: Visit the movie's page to scrape the rating
    const movieUrl = `https://www.metacritic.com${movieLink}`;
    const movieHtml = await fetchHTML(movieUrl);

    const $$ = cheerio.load(movieHtml);

    // Get the Metascore from the movie page
    const rating = $$(
      ".c-productScoreInfo_scoreNumber div .c-siteReviewScore_user span"
    )
      .text()
      .trim();

    const reviews = $$(".c-productScoreInfo_reviewsTotal a span").eq(1).text();

    if (rating && reviews) {
      return {
        movieTitle,
        rating,
        reviews,
      };
    } else {
      console.log(`Could not find the rating for ${movieTitle}`);
    }
  } catch (error) {
    console.error(
      `An error occurred while processing "${movieTitle}":`
      // error
    );
  }
};

const writeJsonFile = async (movieData: Array<Record<any, any>>) => {
  if (movieData.length > 1) {
    const jsonData = JSON.stringify(movieData, null, 2);

    // Write JSON string to a file
    writeFile("./src/data/imdb.json", jsonData, (err) => {
      if (err) {
        console.error("Error writing to file", err);
      } else {
        console.log("JSON file has been created successfully");
      }
    });
  }
};

const main = async () => {
  try {
    const arr: MovieDataType[] = [];

    await Promise.all(
      movieTitles.map(async (title) => {
        const imdbData = await scrapeImdb(title);
        if (imdbData) arr.push(imdbData);

        const rottenTomatoData = await scrapeRottenTomatoes(title);
        if (rottenTomatoData) {
          arr.map((movie) => {
            if (movie.title === rottenTomatoData.movieTitle) {
              movie.scores.rottenTomato = {
                rating: rottenTomatoData.rating,
                reviews: rottenTomatoData.reviews,
              };
            }
          });
        }

        const metaCriticData = await scrapeMetacritic(title);
        if (metaCriticData) {
          arr.map((movie) => {
            if (movie.title === metaCriticData.movieTitle) {
              movie.scores.metaCritic = {
                rating: metaCriticData.rating,
                reviews: metaCriticData.reviews,
              };
            }
          });
        }
      })
    );
    writeJsonFile(arr);
  } catch (err) {
    console.error(err);
  }
};

main();
