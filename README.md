# MedConnect

Платформа для онлайн-консультаций с врачами (чат, видео, оплата).

Курсовой проект выполняется в виде серии лабораторных работ. Каждая лабораторная
работа находится в отдельной ветке репозитория и содержит весь накопленный код,
поэтому любую ветку можно запустить и проверить независимо.

| Ветка | Работа | Содержание |
|-------|--------|------------|
| `21` | ЛР №1 | REST API на Node.js + Express, хранение во временном массиве |
| `22`, `lab12` | ЛР №2 | PostgreSQL + ORM Sequelize, модели, миграции, сиды |
| `23` | ЛР №3 | Аутентификация JWT, bcrypt, ролевая модель доступа (RBAC) |

## Лабораторная работа №3 (ветка 23)

Аутентификация по JWT и ролевая модель доступа. Роли: `patient`, `doctor`,
`admin`.

### Запуск

Дополнительно к шагам ЛР №2 в `.env` задаются `JWT_SECRET` и `JWT_EXPIRES_IN`
(см. `.env.example`). После `db:seed:all` доступны демонстрационные учётные
записи:

| Роль | Email | Пароль |
|------|-------|--------|
| admin | `admin@medconnect.by` | `Admin123!` |
| doctor | `doctor@medconnect.by` | `Doctor123!` |
| patient | `patient@medconnect.by` | `Patient123!` |

### Маршруты аутентификации

| Метод | Маршрут | Назначение | Успешный статус |
|-------|---------|------------|-----------------|
| POST | `/auth/register` | Регистрация (`email`, `password`, `fullName`, `role`) | 201 |
| POST | `/auth/login` | Вход, выдача JWT | 200 |
| GET | `/auth/me` | Текущий пользователь по токену | 200 |
| GET | `/profile` | Профиль и консультации пользователя | 200 |
| GET | `/users` | Список пользователей (только admin) | 200 |
| PATCH | `/users/:id/role` | Изменение роли (только admin) | 200 |
| DELETE | `/users/:id` | Удаление пользователя (только admin) | 204 |

Токен передаётся в заголовке `Authorization: Bearer <token>`.

### Права доступа

| Маршрут | Аноним | patient | doctor | admin |
|---------|--------|---------|--------|-------|
| `GET /doctors` | + | + | + | + |
| `POST/PUT/DELETE /doctors` | 401 | 403 | 403 | + |
| `GET /consultations` | 401 | только свои | все | все |
| `POST /consultations` | 401 | + | + | + |
| `PUT/DELETE /consultations/:id` | 401 | только свои | все | все |
| `GET /users` | 401 | 403 | 403 | + |

### Демонстрационные скрипты

```bash
node scripts/jwt-demo.js      # структура JWT и проверка подписи
node scripts/bcrypt-demo.js   # влияние соли на хеш пароля
```

## Лабораторная работа №2 (ветки 22 и lab12)

Данные хранятся в PostgreSQL, доступ через ORM Sequelize. Модель данных:
`Doctor` (врач) и `Consultation` (консультация), связанные отношением
один-ко-многим.

### 1. База данных

PostgreSQL запускается в Docker (данные сохраняются в именованном томе):

```bash
docker run -d --name medconnect-pg \
  -e POSTGRES_USER=medconnect \
  -e POSTGRES_PASSWORD=medconnect \
  -e POSTGRES_DB=medconnect \
  -p 5432:5432 \
  -v medconnect_pgdata:/var/lib/postgresql/data \
  postgres:16-alpine
```

Опционально pgAdmin для просмотра структуры (`http://localhost:5050`):

```bash
docker run -d --name medconnect-pgadmin \
  -e PGADMIN_DEFAULT_EMAIL=admin@medconnect.by \
  -e PGADMIN_DEFAULT_PASSWORD=medconnect \
  -p 5050:80 dpage/pgadmin4:latest
```

### 2. Приложение

```bash
cd server
npm install
copy .env.example .env          # Linux/macOS: cp .env.example .env
npx sequelize-cli db:migrate    # создание таблиц + миграция добавления price
npx sequelize-cli db:seed:all   # тестовые данные
npm run dev
```

Сервер поднимается на `http://localhost:3000`.

### Маршруты

Все маршруты доступны как по корневому пути, так и с префиксом `/api`.

| Метод | Маршрут | Назначение | Успешный статус |
|-------|---------|------------|-----------------|
| GET | `/consultations` | Список консультаций (с данными врача) | 200 |
| GET | `/consultations/:id` | Консультация по идентификатору | 200 |
| POST | `/consultations` | Создание консультации | 201 |
| PUT | `/consultations/:id` | Полное обновление консультации | 200 |
| DELETE | `/consultations/:id` | Удаление консультации | 204 |
| GET | `/doctors` | Список врачей (`?limit=&offset=&specialty=`) | 200 |
| GET | `/doctors/:id` | Врач вместе со своими консультациями | 200 |
| POST | `/doctors` | Создание врача | 201 |
| PUT | `/doctors/:id` | Полное обновление врача | 200 |
| DELETE | `/doctors/:id` | Удаление врача (каскадно) | 204 |
| GET | `/health` | Проверка сервера и соединения с БД | 200 |

Ошибки возвращаются в формате `{ "error": "текст ошибки" }` со статусами
400 (некорректные данные), 404 (ресурс не найден), 409 (нарушение уникальности)
и 500 (внутренняя ошибка).

### Пример запроса

```bash
curl -X POST http://localhost:3000/consultations \
  -H "Content-Type: application/json" \
  -d '{"doctorId":4,"patientName":"Ольга Климова","date":"2026-09-15","startTime":"10:00","endTime":"10:30","format":"video","price":55}'
```
