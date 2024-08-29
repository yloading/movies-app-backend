/**
 * @module MovieAPI
 * This module creates a basic REST API using Express.js to fetch movie data from a local JSON file.
 * The API reads the file asynchronously, parses its contents, and sends the data as a JSON response.
 */

import express, { Express, Request, response, Response } from "express";
import { readFile } from "fs";
import { join } from "path";
import { responseTemplate } from "./utils/responseTemplate.js";
import cors from "cors";

const PORT = 8001;

const app: Express = express();

app.use(cors());

/**
 * @endpoint /api/movies
 * @description Handles GET requests to fetch movie data from a JSON file.
 *
 * @param {Request} req - The incoming HTTP request.
 * @param {Response} res - The outgoing HTTP response.
 *
 * @returns {JSON} JSON object with movies data, or an error if the file cannot be read or parsed.
 */
app.get("/api/movies", (req: Request, res: Response) => {
  // Reads the movie data JSON file asynchronously.
  readFile(join("./src/data", "imdb.json"), (err, fileData) => {
    if (err) {
      console.log(err);
      res.status(500).json({ error: "Failed to read the file" });
      return;
    }

    try {
      // Parses the JSON data and sends a success response with the movie data.
      const data = JSON.parse(fileData.toString());
      const response = responseTemplate(
        200,
        "Successfully fetched imdb movies data",
        data
      );

      res.status(200).json(response);
    } catch (parseError) {
      // Catches and logs any JSON parsing errors, then sends a 500 response.
      console.log(parseError);
      res.status(500).json({ error: "Failed to parse JSON" });
    }
  });
});

/**
 * Starts the API server and listens on the defined port (8001).
 * Logs the message to the console indicating that the server is running.
 */
app.listen(PORT, () => {
  console.log(`API is now listening to port: ${PORT}`);
});
