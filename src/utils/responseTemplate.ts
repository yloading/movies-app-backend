/**
 * @function responseTemplate
 * @description This utility function generates a consistent structure for API responses.
 * It ensures that all responses include a status code, message, and data payload.
 *
 * @param {number} statusCode - The HTTP status code indicating the result of the API request (e.g., 200 for success, 404 for not found, etc.).
 * @param {string} message - A human-readable message providing context or details about the result of the API request.
 * @param {any} data - The data payload that is returned in response to the API request. This can be any data type (e.g., object, array, string, etc.).
 *
 * @returns {object} A structured response object containing the status code, message, and data fields.
 *
 * @example
 * // Example usage in an API response:
 * const response = responseTemplate(200, "Request successful", { id: 1, name: "John Doe" });
 * res.json(response);
 */

export const responseTemplate = (
  statusCode: number,
  message: string,
  data: any
): object => {
  let response = {
    statusCode: statusCode,
    message: message,
    data: data,
  };

  return response;
};
