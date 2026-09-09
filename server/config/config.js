require('dotenv').config();

// Строка подключения хранится в переменной окружения DATABASE_URL (файл .env),
// поэтому один и тот же конфиг работает и локально, и в контейнере, и в облаке
// (Neon / Supabase) - меняется только значение переменной.
const useSsl = process.env.DB_SSL === 'true';

const base = {
  use_env_variable: 'DATABASE_URL',
  dialect: 'postgres',
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  dialectOptions: useSsl ? { ssl: { require: true, rejectUnauthorized: false } } : {},
};

module.exports = {
  development: base,
  test: base,
  production: base,
};
