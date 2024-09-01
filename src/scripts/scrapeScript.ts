import * as cheerio from "cheerio";
import { MovieDataType, TopStarsType } from "../types/MovieDataType";
import { getMovieId, writeJsonFile } from "../utils/scrapeUtils.js";

// Although this functionality could be made dynamic by executing requests through an API endpoint,
// for the purpose of this exercise, I have chosen to declare static movie titles here.
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

// Function to scrape the movies from imdb rating
async function scrapeImdb(movieTitle: string) {
  try {
    const IMDB_URL = "https://www.imdb.com/find?q=";

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
      // Extract actor name and character name
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

    // return movieObj which contains all the data we extracted
    const movieObj: MovieDataType = {
      id,
      title: movieTitle,
      scores: {
        imdb: { rating, reviews, link: movieUrl },
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

const scrapeRottenTomatoes = async (movieTitle: string) => {
  try {
    // Encode the movie title for the URL
    const query = encodeURIComponent(movieTitle);

    // Search for the movie
    const searchUrl = `https://www.rottentomatoes.com/search?search=${query}`;
    const searchHtml = await fetchHTML(searchUrl);

    // Parse the search results
    const $ = cheerio.load(searchHtml);

    // Rotten Tomatoes search result has movie links like /m/movie_name
    const movieLink = $("search-page-media-row a").attr("href");

    if (!movieLink) {
      console.log("Movie not found.");
      return;
    }

    // Visit the movie's page to scrape the rating
    const movieHtml = await fetchHTML(movieLink);

    const $$ = cheerio.load(movieHtml);

    // Get the rating from the movie page
    const rating = $$("rt-button")
      .find('[slot="criticsScore"] rt-text')
      .first()
      .text()
      .trim();

    // Get the reviews from the movie page
    const reviews = $$('rt-link[slot="criticsReviews"]').text().trim();

    // return data that we gathered
    return {
      movieTitle,
      rating,
      reviews,
      link: movieLink,
    };
  } catch (error) {
    console.error("An error occurred:", error);
  }
};

const scrapeMetacritic = async (movieTitle: string) => {
  try {
    // Encode the movie title for the URL
    const query = encodeURIComponent(movieTitle);

    // Search for the movie on Metacritic
    const searchUrl = `https://www.metacritic.com/search/${query}`;
    const searchHtml = await fetchHTML(searchUrl);

    // Parse the search results
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

    // Visit the movie's page to scrape the rating and reviews
    const movieUrl = `https://www.metacritic.com${movieLink}`;
    const movieHtml = await fetchHTML(movieUrl);

    const $$ = cheerio.load(movieHtml);

    // Get the Metascore from the movie page
    const rating = $$(
      ".c-productScoreInfo_scoreNumber div .c-siteReviewScore span"
    )
      .first()
      .text()
      .trim();

    const reviews = $$(".c-productScoreInfo_reviewsTotal a span")
      .first()
      .text();

    if (rating && reviews) {
      return {
        movieTitle,
        rating,
        reviews,
        link: movieUrl,
      };
    } else {
      console.log(`Could not find the rating for ${movieTitle}`);
    }
  } catch (error) {
    console.error(`An error occurred while processing "${movieTitle}":`);
  }
};

const main = async () => {
  try {
    const arr: MovieDataType[] = [];

    console.log("Scraping movies...");
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
                link: rottenTomatoData.link,
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
                link: metaCriticData.link,
              };
            }
          });
        }
      })
    );
    console.log("Writing JSON file");
    writeJsonFile(arr);
  } catch (err) {
    console.error(err);
  }
};

main();
