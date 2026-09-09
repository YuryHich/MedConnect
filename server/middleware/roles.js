// Ролевая модель доступа (RBAC). Используется после middleware authenticate,
// поэтому в req.user уже находятся данные из проверенного JWT.

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication is required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied: role "${req.user.role}" is not allowed, required: ${roles.join(' or ')}`,
      });
    }
    return next();
  };
}

const isAdmin = requireRole('admin');
const isStaff = requireRole('doctor', 'admin');

module.exports = { requireRole, isAdmin, isStaff };
