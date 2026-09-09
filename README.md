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
| `24` | ЛР №4 | React-клиент (Vite), useState/useEffect, localStorage |
| `25` | ЛР №5 | Интеграция React с REST API: axios, JWT, оптимистичные обновления |
| `26` | ЛР №6 | MongoDB + Mongoose, вложенные документы (отзывы, теги, расписание) |

## Лабораторная работа №6 (ветка 26)

Параллельно с реляционным API (PostgreSQL + Sequelize) реализовано документное
хранилище профилей врачей на MongoDB и Mongoose. Реляционные маршруты `/doctors`
сохранены, документные доступны по префиксу `/mongo/doctors`.

Выбран локальный MongoDB 7 в Docker (п. 8 задания допускает локальную установку
вместо Atlas). Данные просматриваются в mongo-express.

### Запуск MongoDB

```bash
docker network create medconnect-net

docker run -d --name medconnect-mongo --network medconnect-net \
  -p 27017:27017 -v medconnect_mongodata:/data/db mongo:7

docker run -d --name medconnect-mongo-express --network medconnect-net \
  -e ME_CONFIG_MONGODB_URL=mongodb://medconnect-mongo:27017 \
  -e ME_CONFIG_BASICAUTH=false -e ME_CONFIG_MONGODB_ENABLE_ADMIN=true \
  -p 8081:8081 mongo-express:latest
```

mongo-express: `http://localhost:8081`.

### Запуск приложения

Дополнительно к шагам ЛР №5 в `.env` задаётся `MONGO_URI` (см. `.env.example`):

```bash
cd server
npm install
npm run seed:mongo     # профили врачей с отзывами и расписанием
npm run dev            # http://localhost:3000
```

### Маршруты документного API

| Метод | Маршрут | Назначение |
|-------|---------|------------|
| GET | `/mongo/doctors` | Список (`?specialty=&tag=&city=&limit=&skip=`) |
| GET | `/mongo/doctors/stats` | Агрегация: средний рейтинг по специализациям |
| GET | `/mongo/doctors/:id` | Профиль целиком, включая вложенные массивы |
| POST | `/mongo/doctors` | Создание документа |
| PUT | `/mongo/doctors/:id` | Обновление документа |
| DELETE | `/mongo/doctors/:id` | Удаление с возвратом удалённого документа |
| POST | `/mongo/doctors/:id/reviews` | `$push` отзыва |
| PATCH | `/mongo/doctors/:id/reviews/:reviewId` | позиционный оператор `$` |
| DELETE | `/mongo/doctors/:id/reviews/:reviewId` | `$pull` отзыва |
| POST | `/mongo/doctors/:id/tags` | `$addToSet` тега |
| POST | `/mongo/doctors/:id/schedule` | слот в расписании (`$addToSet` / `$push`) |

## Лабораторная работа №5 (ветка 25)

Клиент работает с серверным API: список консультаций загружается с сервера,
в `localStorage` остаётся только JWT-токен.

### Запуск

Нужны два процесса. Сначала сервер (см. ЛР №3), затем клиент:

```bash
# терминал 1
cd server
npm install
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
npm run dev            # http://localhost:3000

# терминал 2
cd client
npm install
copy .env.example .env # VITE_API_URL=http://localhost:3000/api
npm run dev            # http://localhost:5173
```

Войти можно любой демонстрационной учётной записью из таблицы ЛР №3.

### Реализовано

- `src/api.js`: экземпляр axios, перехватчик запроса с `Authorization: Bearer`,
  перехватчик ответа с единой обработкой ошибок и выходом по 401
- состояния загрузки и ошибки, кнопка «Повторить»
- оптимистичные добавление, редактирование и удаление с откатом по снимку
- серверный поиск с задержкой 400 мс (`?search=`)
- постраничная навигация (`?limit=&offset=`)
- отмена запросов через `AbortController`

### Изменение в API

`GET /consultations` теперь принимает `?search=&status=&format=&limit=&offset=`
и возвращает `{ items, total, limit, offset }`.

## Лабораторная работа №4 (ветка 24)

Клиентская часть на React + Vite. Автономное приложение: список консультаций
хранится в `localStorage` браузера под ключом `medconnect.consultations`,
серверное API не используется.

### Запуск

```bash
cd client
npm install
npm run dev
```

Приложение открывается на `http://localhost:5173`.

### Реализовано

- CRUD консультаций: добавление, редактирование, удаление, переключение статуса
- фильтрация по специализации и статусу, поиск по врачу и пациенту
- сортировка по дате, стоимости и имени врача (5 вариантов)
- сводная статистика по статусам и сумме проведённых консультаций
- хук `useLocalStorage` с ленивой инициализацией состояния
- побочные эффекты: `document.title`, имитация загрузки (1 с),
  автосохранение с задержкой 500 мс
- горячие клавиши: `Enter` — добавить, `Escape` — отменить редактирование

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
