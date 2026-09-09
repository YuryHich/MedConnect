// Middleware аутентификации: извлекает JWT из заголовка Authorization,
// проверяет подпись и срок действия, прикрепляет данные пользователя к запросу.
const jwt = require('jsonwebtoken');

function extractToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (!token || scheme.toLowerCase() !== 'bearer') return null;
  return token;
}

function authenticate(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authorization header with Bearer token is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Мягкая проверка: если токен передан и валиден - пользователь известен,
// иначе запрос продолжается как анонимный.
function optionalAuthenticate(req, res, next) {
  const token = extractToken(req);
  if (!token) return next();
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    // анонимный доступ, ошибку игнорируем
  }
  return next();
}

module.exports = { authenticate, optionalAuthenticate, extractToken };
