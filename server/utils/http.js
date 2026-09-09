// Небольшие помощники, общие для всех маршрутов.

// Разбор и проверка идентификатора из параметров маршрута
function parseId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

function badRequest(res, message) {
  return res.status(400).json({ error: message });
}

module.exports = { parseId, badRequest };
