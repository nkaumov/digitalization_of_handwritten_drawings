# 09. Metrics Catalog

## 1. Purpose

This document defines the main metrics used to evaluate project stages.
The catalog is not limited to one model family.
It defines what quality means in this project.

---

## 2. Metric design principles

A useful metric in this project must be:
- interpretable;
- stage-appropriate;
- stable enough for comparison;
- not misleading when used alone.

Therefore, most stages should use both:
- one primary metric;
- several supporting metrics.

---

## 3. Preprocessing metrics

These metrics evaluate whether preprocessing improves downstream usefulness.

### 3.1. Contour visibility score
Measures how strongly the main contour remains visible after preprocessing.

### 3.2. Noise suppression ratio
Measures how much irrelevant noise is reduced.

### 3.3. Text preservation ratio
Measures whether numeric text remains readable after preprocessing.

### 3.4. Grid suppression ratio
Measures whether graph paper interference is reduced without destroying drawing content.

### 3.5. Edge continuity score
Measures whether contour strokes remain connected rather than fragmented.

### 3.6. Binarization stability score
Measures whether thresholding behaves consistently across different image conditions.

Primary metric recommendation:
- choose one downstream-linked metric rather than trusting only visual appearance.

---

## 4. Contour metrics

## 4.1. Mask IoU
Intersection over Union between predicted contour mask and ground-truth mask.

Use when:
- evaluating segmentation masks.

## 4.2. Boundary F1
F1 score on contour boundaries.

Use when:
- boundary precision matters more than filled area.

## 4.3. Contour coverage
Measures how much of the true contour was captured.

Use when:
- missing contour sections are critical.

## 4.4. False contour area ratio
Measures how much predicted contour area belongs to non-contour clutter.

Use when:
- over-detection is a common failure.

## 4.5. Vertex count error
Difference between predicted and target number of key vertices.

Use when:
- vectorization quality matters.

## 4.6. Segment count error
Difference between predicted and target number of contour segments.

## 4.7. Closure error
Distance between final path endpoints when a contour should be closed.

## 4.8. Closed contour success rate
Share of samples where the pipeline produces a valid closed contour when required.

Primary metric recommendation:
- `boundary_f1` or `closed_contour_success_rate`, depending on the experiment stage.

---

## 5. Text detection metrics

## 5.1. Precision
Fraction of predicted text regions that are valid text regions.

## 5.2. Recall
Fraction of true text regions that were detected.

## 5.3. F1 score
Balanced precision-recall measure.

## 5.4. Box IoU
Intersection over Union of predicted vs labeled text boxes.

## 5.5. Orientation accuracy
Measures whether text orientation is predicted correctly enough for OCR.

Primary metric recommendation:
- `f1` with supporting `orientation_accuracy`.

---

## 6. Digit and number recognition metrics

## 6.1. Digit accuracy
Accuracy of single-character recognition.

## 6.2. Sequence accuracy
Share of samples where the entire multi-digit number is recognized correctly.

## 6.3. Character error rate
Character-level error rate for full sequences.

## 6.4. Full-value accuracy
Share of samples where the parsed numeric value is correct.

## 6.5. Unit accuracy
Share of samples where the recognized unit is correct.

Primary metric recommendation:
- `sequence_accuracy` for dimension values;
- `digit_accuracy` only for isolated digit datasets.

---

## 7. Linking metrics

## 7.1. Side assignment accuracy
Share of dimensions correctly linked to the intended contour segment.

## 7.2. Ambiguity rate
Share of samples where the system cannot confidently choose one target segment.

## 7.3. Unresolved dimension rate
Share of dimensions left unlinked.

## 7.4. False link rate
Share of linked dimensions that point to the wrong segment.

Primary metric recommendation:
- `side_assignment_accuracy` with `false_link_rate` as a critical supporting metric.

---

## 8. Geometry solver metrics

## 8.1. Valid payload rate
Share of samples that produce a structurally valid output payload.

## 8.2. Geometric consistency score
Measures whether the final structure is internally coherent.

## 8.3. Closure success rate
Share of samples where the solver produces a valid closed contour when expected.

## 8.4. Normalized length error
Difference between solved segment lengths and target dimension values after normalization.

## 8.5. Warning rate
Share of samples exported with one or more warnings.

## 8.6. Critical failure rate
Share of samples where output cannot be used by the editor or benchmark consumer.

Primary metric recommendation:
- `valid_payload_rate` or `normalized_length_error`, depending on solver stage objective.

---

## 9. End-to-end metrics

## 9.1. Full valid JSON rate
Share of samples that complete the full pipeline and produce a valid export payload.

## 9.2. Editable payload rate
Share of payloads that can be imported and meaningfully edited.

## 9.3. Manual correction burden score
Estimated amount of correction needed after import.

## 9.4. End-to-end latency
Average processing time per image for the full pipeline.

## 9.5. Stage survival rate
Share of samples that successfully pass each pipeline stage.

Primary metric recommendation:
- `editable_payload_rate` as the business-facing metric.

---

## 10. Supporting qualitative metrics

Not all project decisions should rely only on scalar metrics.
The following qualitative diagnostics should also be used:
- best/worst sample review;
- failure category distribution;
- confidence distribution;
- visual overlay quality;
- parameter sensitivity plots.

---

## 11. Metric reporting rule

Every stage must define:
- one primary metric;
- at least two supporting metrics;
- at least one visual review method.

This is required for meaningful comparisons.

---

## 12. Metric selection rule

Metric choice must match the question being asked.

Examples:
- for contour mask quality -> `boundary_f1`;
- for OCR number correctness -> `sequence_accuracy`;
- for solver correctness -> `valid_payload_rate`;
- for business readiness -> `editable_payload_rate`.

There is no universal metric for the entire project.

