function toSafeNumber(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function paginate(items, limit, offset) {
  const safeOffset = Math.max(toSafeNumber(offset, 0), 0);
  const safeLimit = Math.min(Math.max(toSafeNumber(limit, 50), 1), 500);
  return items.slice(safeOffset, safeOffset + safeLimit);
}

module.exports = {
  paginate
};
