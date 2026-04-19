# 03. Directory Structure

## 1. Purpose

This document defines the role of each top-level directory in the project.
The goal is to prevent chaotic growth of files, notebooks, temporary outputs, and undocumented artifacts.

---

## 2. Top-level structure

## `configs/`
Stores configuration files used by code and notebooks.

Recommended contents:
- project paths;
- runtime settings;
- dataset definitions;
- model parameters;
- tuning search spaces;
- experiment templates.

Rules:
- configs must be versioned;
- configs must be readable;
- configs must be separated by concern.

---

## `data/`
Stores all project data except for transient run artifacts.

### `data/raw/`
Original source data.
No destructive edits allowed.

Subdirectories:
- `real/` — real photos from the target domain;
- `external/` — public datasets and external downloads;
- `synthetic/` — generated source images and generator metadata.

### `data/interim/`
Intermediate transformation outputs.
Examples:
- normalized images;
- denoised images;
- candidate masks;
- temporary crops.

### `data/annotations/`
Human-created or validated labels.
Examples:
- contour masks;
- contour vertices;
- contour paths;
- text boxes;
- text links.

### `data/processed/`
Model-ready datasets and export-ready structured sets.
Examples:
- contour training manifests;
- text detector datasets;
- digit recognizer datasets;
- solver datasets.

### `data/splits/`
Train / validation / test split files.
Must be deterministic and versioned.

### `data/sample_sets/`
Curated small subsets for smoke tests, hard cases, and release checks.

---

## `docs/`
Stores all long-form project documentation.

This folder is not optional.
It defines the rules of the project.

Recommended document categories:
- project scope;
- architecture;
- data contracts;
- annotation guide;
- notebook rules;
- experiment protocol;
- metrics catalog;
- tuning strategy;
- git workflow.

---

## `notebooks/`
Stores notebooks used for experiments, diagnostics, audits, and benchmarks.

Rules:
- notebooks are orchestrators, not monolithic code containers;
- production logic must be moved into `src/`;
- notebooks must save metrics and artifacts;
- notebook numbering reflects the project flow.

Recommended groups:
- `00-09` foundation and audit;
- `10-19` synthetic data;
- `20-29` preprocessing;
- `30-39` contour track;
- `40-49` text track;
- `50-59` digit track;
- `60-69` linking track;
- `70-79` solver track;
- `80-89` end-to-end and release checks.

---

## `src/`
Stores reusable Python modules.

This is the main codebase of the project.

Suggested module groups:
- settings;
- utils;
- visualization;
- metrics;
- tuning;
- data;
- preprocessing;
- synthetic;
- contour;
- text;
- digits;
- linking;
- solver;
- pipeline.

Rules:
- code must be modular;
- code must be testable;
- code must be reusable from notebooks and scripts.

---

## `tests/`
Stores tests for code integrity.

These tests are not limited to unit tests.
They may include:
- payload validation checks;
- geometry consistency checks;
- dataset manifest integrity checks;
- config loading checks.

---

## `experiments/`
Stores run-level experiment results and leaderboards.

### `experiments/runs/`
Each serious run should get its own directory.
Suggested contents:
- config snapshot;
- metrics;
- plots;
- best samples;
- worst samples;
- decision note.

### `experiments/leaderboards/`
Stores rolling score tables for major tracks.
Examples:
- contour leaderboard;
- OCR leaderboard;
- solver leaderboard;
- end-to-end leaderboard.

### `experiments/templates/`
Stores templates for experiment summaries and decision logs.

---

## `reports/`
Stores human-readable reporting artifacts.

Suggested subdirectories:
- daily notes;
- experiment summaries;
- benchmark reports;
- release reports;
- figures.

This folder is intended for communication and review, not only for raw metrics.

---

## `models/`
Stores model-related assets.

Subdirectories:
- `checkpoints/` — training checkpoints;
- `exported/` — final export formats such as ONNX;
- `registry/` — model metadata and selected best versions.

Large binary artifacts should usually stay out of git.

---

## `sandbox/`
Stores disposable and non-authoritative experiments.

Purpose:
- quick checks;
- temporary conversions;
- throwaway exports.

Rules:
- never treat sandbox output as authoritative project state;
- move anything important into the proper project folder.

---

## 3. Naming rules

Recommended naming conventions:
- snake_case for files and directories;
- numeric notebook prefixes for ordering;
- explicit track names in filenames;
- no ambiguous names like `final.ipynb`, `new_test.ipynb`, or `aaa.py`.

Examples:
- `31_contour_model_baseline.ipynb`
- `solver_search.yaml`
- `dataset_registry.yaml`
- `contour_metrics.py`

---

## 4. Storage principles

1. raw data is immutable;
2. processed data is reproducible;
3. every important output has a known home;
4. run artifacts do not pollute source code folders;
5. large generated files stay out of git unless there is a deliberate exception.

---

## 5. Directory ownership logic

To avoid confusion, each artifact type should have a clear destination:

- source image -> `data/raw/`
- annotation -> `data/annotations/`
- normalized image -> `data/interim/`
- model-ready dataset -> `data/processed/`
- notebook -> `notebooks/`
- reusable code -> `src/`
- test -> `tests/`
- run artifact -> `experiments/runs/`
- benchmark report -> `reports/`
- model file -> `models/`

---

## 6. Final rule

If a file does not have an obvious place in this structure, it should not be created until its role is clarified.

