# MedConnect

Платформа для онлайн-консультаций с врачами (чат, видео, оплата).

Курсовой проект выполняется в виде серии лабораторных работ. Каждая лабораторная
работа находится в отдельной ветке репозитория и содержит весь накопленный код,
поэтому любую ветку можно запустить и проверить независимо.

| Ветка | Работа | Содержание |
|-------|--------|------------|
| `21` | ЛР №1 | REST API на Node.js + Express, хранение во временном массиве |
| `22`, `lab12` | ЛР №2 | PostgreSQL + ORM Sequelize, модели, миграции, сиды |

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
