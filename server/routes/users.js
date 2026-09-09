// Управление пользователями. Доступно только администратору - демонстрация
// работы ролевой модели (RBAC).
const express = require('express');
const { User } = require('../models');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roles');
const { parseId, badRequest } = require('../utils/http');

const router = express.Router();

router.use(authenticate, isAdmin);

// GET /users - список всех пользователей
router.get('/', async (req, res, next) => {
  try {
    const users = await User.findAll({ order: [['id', 'ASC']] });
    res.status(200).json(users.map((user) => user.toPublicJSON()));
  } catch (err) {
    next(err);
  }
});

// PATCH /users/:id/role - изменение роли пользователя
router.patch('/:id/role', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return badRequest(res, 'User id must be a positive integer');
    }
    if (!User.ROLES.includes(req.body?.role)) {
      return badRequest(res, `Field "role" must be one of: ${User.ROLES.join(', ')}`);
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({ role: req.body.role });
    return res.status(200).json(user.toPublicJSON());
  } catch (err) {
    return next(err);
  }
});

// DELETE /users/:id - удаление пользователя
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return badRequest(res, 'User id must be a positive integer');
    }
    if (id === req.user.id) {
      return badRequest(res, 'Administrator cannot delete their own account');
    }

    const removed = await User.destroy({ where: { id } });
    if (removed === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
