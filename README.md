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
- Этап 4 частично выполнен на уровне архитектурного каркаса (домены, hooks, pipeline contracts/managers, базовое логирование и отказоустойчивость выполнения).
- Следующий рабочий шаг: продолжение этапа 4 (дальнейшая детализация hook points и стыковка модулей без feature-логики).

## Структура проекта

- `apps/web` — frontend-каркас (React + TypeScript + Vite, i18n, layout-заглушки).
- `apps/api` — backend-каркас (Fastify + TypeScript, env, logger, health endpoints, error format).
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
- CRUD и прикладная бизнес-логика backend.
- OCR/OpenCV и реальный recognition pipeline.
- Интеграция backend ↔ ai-service.

## Что готово по этапу 4 (каркас)

- В `apps/web` выделены домены editor frontend: `viewport`, `grid`, `geometry`, `selection`, `dimensions`, `tools`, `import`, `save`, `export`.
- В `apps/web` добавлен базовый hook manager skeleton с типизированными hook names/contexts/payloads, register/unregister/execute и безопасным выполнением handlers.
- В `apps/api` выделены домены backend: `drawings`, `recognition-jobs`, `files`, `exports` (структурные модули без бизнес-логики).
- В `apps/ai-service` выделены stage-домены пайплайна: `normalize-image`, `detect-lines`, `detect-text`, `parse-dimensions`, `build-graph`, `find-contours`, `normalize-units`, `assemble-result`.
- В `apps/ai-service` добавлен базовый pipeline manager skeleton: stage contracts, registry, sequential safe execution, placeholder stage registry.
- Для frontend hooks и AI pipeline добавлено базовое логирование (start/finish/error) и режим безопасного продолжения выполнения при допустимых ошибках (`continue-on-safe-failure` на уровне каркаса).

## Что по этапу 4 еще не реализовано

- Внутренние hook-точки и hook-chain orchestration покрыты не полностью (нужна дальнейшая детализация по всем доменам).
- Нет feature-логики модулей и доменов (только архитектурные placeholders).
- Нет реальных pipeline-алгоритмов распознавания, OCR и обработки изображений.
