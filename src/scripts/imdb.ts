import * as cheerio from "cheerio";
import { writeFile } from "fs";

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
async function scrapeMovie(movieTitle: string) {
  try {
    // Fetch search results page
    const searchHtml = await fetchHTML(IMDB_URL + movieTitle);
    const $ = cheerio.load(searchHtml);

    // Find the first search result that matches "Casper"
    const firstResult = $(".find-result-item").first();
    const movieLink = firstResult
      .find(".ipc-metadata-list-summary-item__c a")
      .attr("href");

    console.log(firstResult);

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
    const topStars: Array<object> = [];

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

    const photos: Array<string | undefined> = [];

    $$('section [data-testid="Photos"] section div a').each((i, element) => {
      const imgUrl = $$(element).find("div img").attr("src");

      photos.push(imgUrl);
    });

    const movieObj = {
      id,
      title,
      rating,
      reviews,
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

const writeJsonFile = async (movieList: string[]) => {
  const moviesArr: Array<any> = [];
  const movies = movieList.length > 0 ? movieList : movieTitles;

  await Promise.all(
    movies.map(async (title: string, index) => {
      const movieObj = await scrapeMovie(title);
      if (movieObj) {
        moviesArr.push(movieObj);
      }
    })
  );

  if (moviesArr.length > 1) {
    const jsonData = JSON.stringify(moviesArr, null, 2);

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

const getMovieId = (url: string) => {
  const idMatch = url.match(/\/title\/(tt\d+)\//);

  const id = idMatch ? idMatch[1] : null;

  return id;
};

writeJsonFile([]);
