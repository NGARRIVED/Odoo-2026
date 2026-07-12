async function apiClient(url, options) {
  return fetch(url, options);
}

module.exports = { apiClient };
