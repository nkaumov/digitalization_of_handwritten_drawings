# История выполнения задач

## Этап 1. Формализация MVP и правил работы системы
### Результат этапа
- Утвержденный список сценариев.
- Утвержденные ограничения MVP.
- Утвержденные правила поведения системы.

- Документ по зафиксированным решениям 
/docs/Recorded_decisions_stage_1.md

## Этап 2. Проектирование доменной модели и внутренних контрактов
### Результат этапа
- Сформированы сущности системы и их структура.
- Зафиксированы внутренние контракты данных между модулями.
- Подготовлен документ этапа 2:
/docs/entities_and_contracts_stage_2.md

## Этап 3. Подготовка структуры проекта и инфраструктуры
### Результат этапа
- Подготовлена структура монорепозитория (`apps`, `packages`, `scripts`, `storage`).
- Поднят локально запускаемый каркас сервисов:
frontend (`apps/web`), backend (`apps/api`), ai-service (`apps/ai-service`).
- Добавлены `.env.example` для root и сервисов.
- Добавлены root-скрипты запуска и проверок (`dev:*`, `dev:all`, `check:health`).
- Зафиксирована карта портов и обновлена документация по локальному запуску.

## Этап 4. Проектирование модульной и hook-архитектуры
### Что зафиксировано по факту
- В `apps/web` оформлены домены editor frontend:
`viewport`, `grid`, `geometry`, `selection`, `dimensions`, `tools`, `import`, `save`, `export`.
- В `apps/api` оформлены домены backend:
`drawings`, `recognition-jobs`, `files`, `exports`.
- В `apps/ai-service` оформлены домены pipeline stages:
`normalize-image`, `detect-lines`, `detect-text`, `parse-dimensions`,
`build-graph`, `find-contours`, `normalize-units`, `assemble-result`.
- Добавлен базовый `EditorHookManager` каркас в `apps/web`:
typed hook names/contexts/payloads, register/unregister/execute, safe execution.
- Добавлен базовый `PipelineManager` каркас в `apps/ai-service`:
stage contracts, stage registry, safe sequential execution, структура ошибок и debug contracts.
- Для `EditorHookManager` и `PipelineManager` добавлено базовое логирование выполнения
 (start/finish/error) и режим continue-on-safe-failure для архитектурного каркаса.
- Доделана детализация hook/stage points, форматов регистрации внутренних модулей,
вызова обработчиков и runtime-контекста в `apps/web`, `apps/api`, `apps/ai-service`.
- Добавлено единообразное chain-логирование и safe-failure политики для расширяемого каркаса.

### Статус этапа
- Этап 4 закрыт по факту как архитектурный каркас.
- Feature-логика по плану в этап 4 не входит и реализуется на следующих этапах.
