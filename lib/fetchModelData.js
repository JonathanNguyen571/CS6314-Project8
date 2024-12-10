/**
 * fetchModel - Fetch a model from the web server.
 *
 * @param {string} url      The URL to issue the GET request.
 *
 * @returns {Promise} that resolves with the response of the GET request
 * parsed as a JSON object and returned in the property named "data" of an
 * object. If the request has an error, the Promise is rejected with an
 * Error object containing the properties:
 * {number} status          The HTTP response status
 * {string} statusText      The statusText from the response
 */
function fetchModel(url) {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then((response) => {
        if (!response.ok) {
          // Reject promise if response is not okay
          return reject(new Error(`Error: ${response.status} ${response.statusText}`));
        }
        // Parse and resolve promise with JSON data
        return response.json();
      })
      .then((data) => resolve({ data }))
      .catch((error) => {
        reject(new Error(error.message || "Network error"));
      });
  });
}

export default fetchModel;
