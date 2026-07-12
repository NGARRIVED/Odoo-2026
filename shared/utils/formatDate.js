function formatDate(value) {
  return new Date(value).toISOString();
}

module.exports = { formatDate };
