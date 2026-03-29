# Digitalization of Handwritten Drawings

Проект по созданию MVP-системы цифровизации рукописных чертежей.

## Основные документы

- [`docs/tz_mvp.md`](docs/tz_mvp.md) — общее ТЗ проекта.
- [`docs/dev_plan.md`](docs/dev_plan.md) — детализированный поэтапный план.
- [`docs/dev_history.md`](docs/dev_history.md) — журнал фактически выполненных этапов.
- [`docs/Recorded_decisions_stage_1.md`](docs/Recorded_decisions_stage_1.md) — решения этапа 1.
- [`docs/entities_and_contracts_stage_2.md`](docs/entities_and_contracts_stage_2.md) — результаты этапа 2.

## Текущий статус

- Этап 1 выполнен.
- Этап 2 выполнен.
- Этап 3 выполнен как локально запускаемый инфраструктурный каркас.
- Этап 4 закрыт по факту на уровне архитектурного каркаса (домены, hooks/stages, contracts, registry/manager, chain-логирование и safe-failure правила).
- Этап 5 закрыт по факту в рамках backend-ядра (БД/миграции, drawings/files/recognition-jobs/exports endpoints, единый формат ошибок, логирование запросов и стадий).
- Следующий рабочий шаг: переход к этапу 6 (реализация frontend-редактора).

## Структура проекта

- `apps/web` — frontend-каркас (React + TypeScript + Vite, i18n, layout-заглушки).
- `apps/api` — backend-ядро MVP (Fastify + TypeScript, DB/migrations, API modules, error format, request logging).
- `apps/ai-service` — AI service-каркас (FastAPI, env, logger, health, pipeline placeholders).
- `packages/contracts` — общие typed-контракты между web/api/ai.
- `scripts` — служебные скрипты запуска и проверок.
- `storage/uploads`, `storage/exports`, `storage/debug` — локальные директории артефактов.
- `docs` — ТЗ, план, история и зафиксированные решения по этапам.

## Карта портов

- `web`: `127.0.0.1:5173`
- `api`: `127.0.0.1:3001`
- `ai-service`: `127.0.0.1:8001`
- `mysql`: `127.0.0.1:3306` (локально установленный MySQL)

## Env файлы

- `/.env.example`
- `apps/api/.env.example`
- `apps/web/.env.example`
- `apps/ai-service/.env.example`

## Локальный запуск

Текущее правило:
- Docker не используется.
- Используются локально установленный MySQL и phpMyAdmin.

1. Установить JS-зависимости из корня:
- `npm run setup`

2. Создать Python-окружение AI-сервиса (один раз):
- `python -m venv apps/ai-service/.venv`
- `apps/ai-service/.venv/Scripts/python.exe -m pip install -r apps/ai-service/requirements.txt`

3. Запустить сервисы:
- API: `npm run dev:api`
- Web: `npm run dev:web`
- AI: `npm run dev:ai`

4. Либо запустить все сразу:
- `npm run dev:all`

5. Управление сервисами после `dev:all`:
- `npm run status:all` (проверка, какие сервисы и порты активны)
- `npm run stop:all` (остановка всех сервисов одной командой)

6. Проверить health всех сервисов:
- `npm run check:health`

## Что готово в этапе 3

- Базовый workspace и структура монорепозитория.
- Локально запускаемые каркасы `web`, `api`, `ai-service`.
- Базовые env-конфиги и root-скрипты запуска/проверок.
- Health endpoints для `api` и `ai-service`.
- Typed-контракты в `packages/contracts`.

## Что еще не реализовано

- Реальная логика редактора (SVG viewport/tools).
- OCR/OpenCV и реальный recognition pipeline.
- Реальная интеграция backend ↔ ai-service (вызов внешнего AI-service вместо backend placeholder-flow).

## Что готово по этапу 4 (каркас)

- В `apps/web` выделены домены editor frontend: `viewport`, `grid`, `geometry`, `selection`, `dimensions`, `tools`, `import`, `save`, `export`.
- В `apps/web` добавлен базовый hook manager skeleton с типизированными hook names/contexts/payloads, register/unregister/execute и безопасным выполнением handlers.
- В `apps/api` выделены домены backend: `drawings`, `recognition-jobs`, `files`, `exports` (структурные модули без бизнес-логики).
- В `apps/ai-service` выделены stage-домены пайплайна: `normalize-image`, `detect-lines`, `detect-text`, `parse-dimensions`, `build-graph`, `find-contours`, `normalize-units`, `assemble-result`.
- В `apps/ai-service` добавлен базовый pipeline manager skeleton: stage contracts, registry, sequential safe execution, placeholder stage registry.
- Для frontend hooks и AI pipeline добавлено базовое логирование (start/finish/error) и режим безопасного продолжения выполнения при допустимых ошибках (`continue-on-safe-failure` на уровне каркаса).

## Границы этапа 4

- Этап 4 завершен как архитектурный каркас и сознательно не включает feature-реализацию.
- Реальная логика редактора, backend CRUD/бизнес-логика, OCR/OpenCV и интеграции переходят в этапы 5+.

## Что готово по этапу 5 (backend-ядро)

- В `apps/api` реализованы подключение к MySQL, миграции и актуальная главная схема `apps/api/schema.sql`.
- Реализован `drawings` модуль: CRUD, создание пустого чертежа, получение по id, обновление, сохранение исправленного чертежа и структуры геометрии с валидацией payload.
- Реализован `files` модуль: прием файла изображения (`multipart`) и хранение исходного изображения в `storage/uploads` + запись в `stored_files`.
- Реализован `recognition-jobs` модуль: запуск распознавания, получение статуса, получение итогового результата, служебное логирование стадий в БД и логи API.
- Реализован `exports` модуль: endpoint экспорта в PDF и в изображение с сохранением export-артефакта и записи в `exports`/`stored_files`.
- Поддержан единый формат API-ошибок через `AppError` и global error handler.
- Добавлено отдельное логирование HTTP-запросов (method/url/status/duration/requestId).

## Что после этапа 5 еще не реализовано

- Реальная AI-логика распознавания и OCR/OpenCV обработка.
- Реальный render-экспорт чертежа (сейчас backend placeholder-артефакты для API-ядра).
- Полноценный frontend-редактор и пользовательская прикладная логика следующих этапов.
