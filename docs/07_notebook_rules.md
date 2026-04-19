# 07. Notebook Rules

## 1. Purpose

This document defines the mandatory rules for all project notebooks.
The goal is to make notebooks readable, reproducible, comparable, and useful for real model and parameter decisions.

---

## 2. Role of notebooks

In this project, notebooks are used for:
- data audit;
- visual diagnostics;
- baseline experiments;
- parameter searches;
- error analysis;
- benchmark reporting.

Notebooks are **not** the place for large permanent business logic.
That logic belongs in `src/`.

---

## 3. Mandatory notebook structure

Every serious notebook should follow this order:

1. title and objective;
2. imports;
3. config loading;
4. path setup and run initialization;
5. dataset loading;
6. baseline execution;
7. parameter sweep or tuning block;
8. metrics computation;
9. visual diagnostics;
10. failure case review;
11. final configuration selection;
12. artifact export;
13. decision note.

This structure may be extended, but should not be broken without reason.

---

## 4. Run initialization rules

Each notebook run must define:
- `run_id`;
- `random_seed`;
- `config_path` or config object;
- output directory inside `experiments/runs/`.

The notebook must save a config snapshot before the main experiment begins.

---

## 5. Thin-notebook rule

The notebook should orchestrate operations, not implement them in-place.

Allowed in notebooks:
- experiment flow;
- exploratory checks;
- visualization;
- comparison tables;
- temporary inspection code.

Not allowed as long-term project practice:
- large duplicated helper functions;
- permanent model code copied into cells;
- hidden preprocessing logic that only exists inside one notebook.

If a block becomes reusable, move it into `src/`.

---

## 6. Visual diagnostics are mandatory

A notebook is incomplete if it only reports numbers.

Each serious notebook must save visual artifacts appropriate to its task.
Examples:
- original vs processed image comparisons;
- overlay visualizations;
- best-case galleries;
- worst-case galleries;
- error examples;
- confidence distributions;
- parameter-versus-metric plots.

---

## 7. Metrics are mandatory

Every notebook must define the metrics that justify its conclusions.

Examples by track:
- preprocessing -> visibility, continuity, suppression, stability;
- contour -> IoU, boundary F1, closure error, segment count error;
- text -> precision, recall, IoU, orientation accuracy;
- digits -> digit accuracy, sequence accuracy, character error rate;
- solver -> valid payload rate, closure success rate, length error.

A notebook conclusion without metrics is not considered valid.

---

## 8. Parameter-search rules

If a notebook tunes parameters, it must:
- explicitly define the search space;
- define the objective metric;
- save the top configurations;
- save comparison plots;
- save the final chosen configuration;
- record why it was selected.

There must be no hidden manual tuning that cannot be reconstructed.

---

## 9. Failure-case analysis rules

Every serious notebook must review failures.
At minimum it must show:
- representative worst cases;
- common failure patterns;
- probable reasons for failure;
- whether the problem is due to data, model, postprocessing, or metrics.

We do not treat errors as noise to ignore.
We treat them as input for the next iteration.

---

## 10. Required saved artifacts

Each serious notebook run should save:
- `config_snapshot.yaml`
- `metrics.json`
- `metrics.csv`
- `summary.md`
- `plots/`
- `best_samples/`
- `worst_samples/`
- `debug_images/`

Additional artifacts may be added per task.

---

## 11. Final decision note

Every serious notebook must end with a short decision section that answers:
- what was tested;
- what configuration performed best;
- which metric justified that choice;
- what still failed;
- what the next step should be.

This note should also be saved to disk.

---

## 12. Notebook naming rules

Notebook names must:
- start with a numeric order prefix;
- include the track name;
- include the experiment purpose.

Good examples:
- `21_preprocessing_parameter_search.ipynb`
- `31_contour_model_baseline.ipynb`
- `52_digit_recognition_tuning.ipynb`
- `81_end_to_end_benchmark.ipynb`

Bad examples:
- `final.ipynb`
- `new.ipynb`
- `test123.ipynb`
- `aaa.ipynb`

---

## 13. Output hygiene

A notebook should not leave important results only in cell output.
Important results must be exported.

A notebook should also avoid becoming unreadable due to massive uncontrolled print spam.
Use:
- concise progress logs;
- summary tables;
- saved image galleries;
- structured markdown conclusions.

---

## 14. Promotion rule

When a notebook step becomes stable and repeatedly useful, it should be promoted into:
- a reusable function in `src/`, or
- a reusable experiment utility.

Notebook code is allowed to start exploratory.
It is not allowed to remain permanently chaotic.

---

## 15. Final notebook standard

A notebook is considered complete only if it is:
- reproducible;
- measurable;
- visually inspectable;
- documented;
- exportable;
- useful for the next stage of the pipeline.

