# Codex workflow rules

- Source of truth:
  - docs/tz_mvp.md
  - docs/dev_plan.md
  - docs/entities_and_contracts_stage_2.md

- Do not implement future stages unless explicitly asked.
- Keep files small and modular.
- No inline UI strings. Use i18n.
- Prefer minimal dependencies.
- At the end of each task, return:
  - changed files
  - short result
  - manual checks
- Do not paste large code blocks in the response unless asked.

- Default task style:
  - one prompt = one commit
  - do not print full code in the response
  - do not print full project tree unless explicitly asked
  - keep explanations short
  - reuse existing project structure and configs
  - do not reread unrelated docs unless explicitly asked

- Repository workflow:
  - each stage is developed in its own branch
  - all stable results are merged into dev
  - before starting a new stage, assume dev is up to date unless told otherwise

- Current local stack:
  - no Docker
  - local MySQL/phpMyAdmin
  - web/api/ai-service already scaffolded
  - use existing workspace and scripts if present

- For architecture tasks:
  - prefer interfaces/contracts/managers before feature logic
  - do not implement business features while creating architecture skeletons
  - add only the minimum code required for the current task