# 05. Dataset Specification

## 1. Purpose

This document defines the dataset layout and dataset roles used in the project.
It is intended to support:
- reproducible experiments;
- controlled train/validation/test splits;
- mixed use of real, synthetic, and external data;
- future dataset growth without chaos.

---

## 2. Dataset families

The project uses four dataset families.

## 2.1. Real target-domain datasets
These are the most important datasets for evaluation.
They contain real photos from the actual problem domain.

Expected subsets:
- `contour_only`
- `digits_only`
- `drawings_with_dimensions`
- `difficult_cases`

### Purpose
- final validation;
- realistic error analysis;
- hard-case accumulation;
- solver validation.

---

## 2.2. Synthetic datasets
These are artificially generated samples with known structure.

Expected outputs:
- rendered synthetic images;
- perfect contour masks;
- perfect vertices and paths;
- text boxes;
- dimension values;
- exact geometry metadata.

### Purpose
- large-scale controlled training;
- stress testing;
- coverage of rare geometric cases;
- parameter sensitivity analysis.

---

## 2.3. External public datasets
These are auxiliary datasets from outside the project.

Possible uses:
- digit pretraining;
- handwriting style priors;
- floor-plan structural priors.

### Rules
- never mix external data into benchmark conclusions without explicit tagging;
- always keep source provenance;
- use only as supporting data, not as a substitute for target-domain validation.

---

## 2.4. Derived processed datasets
These are model-ready datasets created from raw data and annotations.

Examples:
- contour segmentation dataset;
- text detector dataset;
- digit recognizer dataset;
- solver dataset.

Derived datasets must be reproducible from manifests and source data.

---

## 3. Dataset subsets and intended use

## 3.1. `data/raw/real/contour_only/`
Contains images focused on the contour task without dimension text dependence.

### Purpose
- contour perception baseline;
- vectorization baseline;
- preprocessing experiments focused on contour quality.

### Expected labels
- contour masks;
- optional vertices;
- optional path order.

---

## 3.2. `data/raw/real/digits_only/`
Contains images focused on handwritten numbers.

### Purpose
- digit recognition experiments;
- sequence building;
- OCR preprocessing research.

### Expected labels
- digit labels;
- number sequence labels;
- unit labels where relevant.

---

## 3.3. `data/raw/real/drawings_with_dimensions/`
Contains full target-domain samples.

### Purpose
- text detection;
- contour + dimensions interaction;
- dimension linking;
- end-to-end validation.

### Expected labels
- contour masks;
- text boxes;
- number values;
- segment links;
- optional solved structure.

---

## 3.4. `data/raw/real/difficult_cases/`
Contains challenging samples collected during experiments.

### Purpose
- failure analysis;
- regression testing;
- robustness evaluation.

### Examples of difficult cases
- strong shadows;
- graph paper interference;
- open contours;
- very low contrast;
- overlapping text and lines;
- extra clutter strokes.

---

## 4. Manifest-first principle

Every meaningful dataset subset must have a manifest file.
The manifest is the authoritative index of samples.

Recommended manifest fields:
- `sample_id`
- `image_path`
- `source_type`
- `subset`
- `width`
- `height`
- `difficulty`
- `label_status`
- `split`

A dataset without a reliable manifest is considered unstable.

---

## 5. Split policy

The project must maintain deterministic splits.

Recommended split categories:
- `train`
- `val`
- `test`
- `holdout`

### Rules
1. splits must be saved to disk;
2. the same real sample must not leak across train and test in different transformed forms;
3. hard cases should be explicitly tracked;
4. benchmark sets must remain stable over time.

---

## 6. Benchmark subsets

The project should maintain several small curated benchmark subsets.

## 6.1. Smoke test set
Very small and fast.
Used to validate pipeline integrity.

## 6.2. Visual benchmark set
Used for qualitative side-by-side comparison.
Must contain representative easy, medium, and hard cases.

## 6.3. Hard-case set
Used to track robustness improvements.
Must not be silently altered.

## 6.4. Release check set
Used before declaring a stage stable.
Should be treated as a protected benchmark subset.

---

## 7. Annotation status levels

Each sample should carry a label status.
Recommended values:
- `unlabeled`
- `partial`
- `review_needed`
- `validated`
- `rejected`

This is necessary for filtering experiments safely.

---

## 8. Synthetic dataset requirements

Synthetic generation should vary at least the following dimensions:
- contour topology;
- side count;
- open vs closed appearance;
- handwriting style;
- text placement;
- rotation;
- drawing thickness;
- background type;
- noise level;
- blur level;
- perspective distortion;
- clutter strokes.

Synthetic metadata should record generation parameters for each sample.

---

## 9. Derived dataset requirements

Processed datasets should include:
- manifest;
- transform version;
- source subset provenance;
- label provenance;
- feature or crop paths;
- split assignment.

Each processed dataset must be rebuildable.

---

## 10. Versioning principles

Raw source data is immutable.
Annotations and processed datasets may evolve, but changes must be tracked.

Recommended conventions:
- annotate version in manifest metadata;
- record generation date;
- record script or notebook source;
- record config used.

---

## 11. Minimum viable dataset plan for v5

### Stage 1
- collect and register all existing real photos;
- separate them into contour-only, digits-only, and full drawings;
- define hard-case tags;
- build manifests.

### Stage 2
- create the first synthetic generator;
- generate small validation batches;
- verify metadata integrity.

### Stage 3
- prepare the first processed contour dataset;
- prepare the first processed digit dataset;
- prepare the first full-scene subset for end-to-end experiments.

---

## 12. Final rule

No new dataset subset should be introduced informally.
Every new subset must have:
- a clear purpose;
- a directory;
- a manifest;
- a documented label status policy.

