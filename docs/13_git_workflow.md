# 13. Git Workflow

## 1. Purpose

This document defines how the repository should be used during development.
The goal is to keep the project history understandable, stable, and useful.

---

## 2. Branch model

Recommended branches:
- `main` — stable state only;
- `dev` — current integration branch;
- feature branches — focused work units.

Recommended feature branch naming:
- `feat/project-bootstrap`
- `feat/dataset-audit`
- `feat/contour-baseline`
- `feat/digit-baseline`
- `feat/solver-baseline`
- `docs/foundation-wave-2`
- `exp/preprocessing-search-v1`

---

## 3. What belongs in git

Track in git:
- source code in `src/`;
- configs in `configs/`;
- docs in `docs/`;
- tests in `tests/`;
- notebooks in `notebooks/`;
- project-level files such as `README.md` and `.gitignore`.

Do not track in git by default:
- raw data;
- large processed data;
- experiment run folders;
- generated figures;
- checkpoints;
- temporary exports.

---

## 4. Commit style

Commits should be small, understandable, and purpose-driven.

Recommended prefixes:
- `init:`
- `docs:`
- `feat:`
- `fix:`
- `refactor:`
- `test:`
- `exp:`
- `chore:`

Examples:
- `init: create v5 project skeleton`
- `docs: add architecture and notebook rules`
- `feat: add path manager and config loader`
- `exp: add preprocessing search baseline`
- `fix: correct contour manifest generation`

---

## 5. Notebook commit rule

Notebooks may be committed, but they should not become unreadable garbage.

Preferred practice:
- keep notebook structure clean;
- save important outputs to run folders;
- avoid committing huge accidental output spam;
- commit notebooks when they represent a real milestone.

If notebook outputs become too noisy, clear irrelevant output before commit.

---

## 6. Config-first rule

Whenever a meaningful experiment is introduced, the config should be committed alongside the code or notebook that uses it.
This makes experiments easier to reproduce.

---

## 7. Documentation rule

Important architectural or workflow changes should update documentation in the same branch when possible.

Examples:
- new dataset family -> update dataset specification;
- new metric -> update metrics catalog;
- new tuning flow -> update tuning strategy.

---

## 8. Merge rule

A branch should be merged only when:
- the change has a clear purpose;
- the repository remains consistent;
- docs are not left misleading;
- obviously broken code is not introduced intentionally.

For experimental branches, it is acceptable to merge partial research support code if it is clearly scoped and does not break the project foundation.

---

## 9. Tagging and milestone rule

Recommended milestone tags later in the project:
- `v5-foundation`
- `v5-data-audit`
- `v5-contour-baseline`
- `v5-ocr-baseline`
- `v5-solver-baseline`
- `v5-end-to-end-alpha`

Tags should reflect meaningful project states.

---

## 10. Recommended working rhythm

1. create a focused branch;
2. make one coherent unit of progress;
3. save configs and docs with the change;
4. commit with a meaningful message;
5. merge into `dev`;
6. promote to `main` only when stable.

---

## 11. Repository hygiene rule

The repository must not become a storage dump.
If an artifact is large or generated, it should usually live outside git and be reproducible from code, manifests, or configs.

---

## 12. Final principle

Git history should explain the evolution of the project, not hide it.
A good commit history reduces confusion and speeds up future decisions.

