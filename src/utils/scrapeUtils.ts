import { writeFile } from "fs";

/**
 * Extracts the movie ID from a given URL.
 *
 * This utility function takes a URL string as input and extracts the movie ID
 * from it. The movie ID is expected to be in the format of `tt` followed by digits,
 * which is used in IMDb URLs. The function uses a regular expression to
 * find and return this ID.
 *
 * @param {string} url - The IMDb URL.
 * @returns {string | null} The extracted movie ID if present, otherwise `null`.
 *
 * @example
 * // Example URL: 'https://www.imdb.com/title/tt1234567/'
 * const movieId = getMovieId('https://www.imdb.com/title/tt1234567/');
 * console.log(movieId); // Output: 'tt1234567'
 *
 * @example
 * // Example URL without movie ID
 * const movieId = getMovieId('https://www.example.com/somepath/');
 * console.log(movieId); // Output: null
 */
export const getMovieId = (url: string): string | null => {
  // Use a regular expression to match the movie ID in the URL
  const idMatch = url.match(/\/title\/(tt\d+)\//);

  // Extract and return the movie ID if a match is found, otherwise return null
  const id = idMatch ? idMatch[1] : null;

  return id;
};

/**
 * Writes an array of movie data to a JSON file.
 *
 * This asynchronous function takes an array of movie data objects and writes it to a JSON file.
 * It uses `JSON.stringify` to convert the array into a formatted JSON string before writing it
 * to the specified file path. The function performs a check to ensure that the array contains more
 * than one item before proceeding with writing to the file.
 *
 * @param {Array<Record<any, any>>} movieData - An array of movie data objects to be written to the file.
 *   Each object in the array can have arbitrary keys and values, as indicated by `Record<any, any>`.
 *
 * @returns {Promise<void>} A promise that resolves when the file has been successfully written.
 *   The function does not return a value but logs success or error messages to the console.
 *
 * @example
 * // Example data array
 * const movies = [
 *   { title: "Movie 1", rating: 8.5 },
 *   { title: "Movie 2", rating: 7.2 }
 * ];
 *
 * // Write the movie data to a JSON file
 * writeJsonFile(movies)
 *   .then(() => console.log("Movies data has been written to file"))
 *   .catch(error => console.error("Error writing movies data:", error));
 */

export const writeJsonFile = async (
  movieData: Array<Record<any, any>>
): Promise<void> => {
  // Check if the movieData array has more than one item
  if (movieData.length > 1) {
    // Convert the array to a formatted JSON string
    const jsonData = JSON.stringify(movieData, null, 2);

    // Write the JSON string to a file
    writeFile("./src/data/movies.json", jsonData, (err) => {
      if (err) {
        // Log an error message if writing to the file fails
        console.error("Error writing to file", err);
      } else {
        // Log a success message if writing to the file succeeds
        console.log("JSON file has been created successfully");
      }
    });
  }
};
