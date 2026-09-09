// Маршруты аутентификации: регистрация, вход и данные текущего пользователя.
const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authenticate } = require('../middleware/auth');
const { badRequest } = require('../utils/http');

const router = express.Router();

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const MIN_PASSWORD_LENGTH = 6;

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// POST /auth/register - регистрация пользователя
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, fullName, role } = req.body || {};

    if (!email || !password) {
      return badRequest(res, 'Fields "email" and "password" are required');
    }
    if (String(password).length < MIN_PASSWORD_LENGTH) {
      return badRequest(res, `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
    }

    // Проверка уникальности email до вставки, чтобы вернуть понятную ошибку
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Роль admin нельзя получить самостоятельной регистрацией
    const requestedRole = role === 'doctor' ? 'doctor' : 'patient';

    const user = await User.create({
      email,
      passwordHash: await User.hashPassword(String(password)),
      fullName: fullName || null,
      role: requestedRole,
    });

    return res.status(201).json({
      message: 'User registered successfully',
      user: user.toPublicJSON(),
    });
  } catch (err) {
    return next(err);
  }
});

// POST /auth/login - вход, выдача JWT
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return badRequest(res, 'Fields "email" and "password" are required');
    }

    // Хеш пароля исключён из выборок по умолчанию, поэтому нужен явный scope
    const user = await User.scope('withPassword').findOne({ where: { email } });
    if (!user || !(await user.comparePassword(String(password)))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    return res.status(200).json({
      token: signToken(user),
      expiresIn: JWT_EXPIRES_IN,
      user: user.toPublicJSON(),
    });
  } catch (err) {
    return next(err);
  }
});

// GET /auth/me - данные текущего пользователя по токену
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json(user.toPublicJSON());
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
