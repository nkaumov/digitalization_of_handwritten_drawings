# 04. Data Contracts

## 1. Purpose

This document defines the internal data contracts used across the project.
The goal is to keep all stages compatible and reproducible.

A contract in this project is a documented structure that defines:
- required fields;
- field types;
- allowed values;
- file location expectations;
- downstream usage.

These contracts are internal research and pipeline contracts. A final export adapter may later convert internal solved geometry into the editor-specific payload.

---

## 2. General rules

1. All field names must be written in English.
2. All numeric values must use explicit units where relevant.
3. Every file-based artifact must include a unique sample identifier.
4. Optional fields must be clearly marked as optional.
5. Unknown information must be represented explicitly, not silently omitted.
6. Confidence values must be normalized to the range `[0.0, 1.0]`.

---

## 3. Sample identifier contract

Each source sample must have a unique `sample_id`.

Recommended format:

```text
<source>_<subset>_<6-digit-sequence>
```

Examples:
- `real_drawings_000123`
- `real_contour_only_000021`
- `synthetic_layout_001504`

Rules:
- `sample_id` must be stable across all derived artifacts;
- all annotations and predictions must reference the same `sample_id`.

---

## 4. Source image manifest contract

Each dataset subset should have a manifest file in JSON or CSV form.
Recommended JSON object format:

```json
{
  "sample_id": "real_drawings_000123",
  "image_path": "data/raw/real/drawings_with_dimensions/real_drawings_000123.jpg",
  "source_type": "real",
  "subset": "drawings_with_dimensions",
  "width": 3024,
  "height": 4032,
  "has_contour": true,
  "has_dimensions": true,
  "background_type": "graph_paper",
  "drawing_tool": "pen",
  "difficulty": "medium",
  "notes": "slight shadow on upper edge"
}
```

### Required fields
- `sample_id: str`
- `image_path: str`
- `source_type: str`
- `subset: str`
- `width: int`
- `height: int`

### Optional fields
- `has_contour: bool`
- `has_dimensions: bool`
- `background_type: str`
- `drawing_tool: str`
- `difficulty: str`
- `notes: str`

---

## 5. Contour mask label contract

Used for contour segmentation tasks.

```json
{
  "sample_id": "real_drawings_000123",
  "mask_path": "data/annotations/contour_masks/real_drawings_000123.png",
  "mask_type": "main_contour",
  "is_closed_in_ground_truth": false,
  "quality_flag": "validated"
}
```

### Required fields
- `sample_id: str`
- `mask_path: str`
- `mask_type: str`

### Optional fields
- `is_closed_in_ground_truth: bool`
- `quality_flag: str`

Allowed `mask_type` values:
- `main_contour`
- `auxiliary_contour`
- `ignore_region`

For v5, the primary focus is `main_contour`.

---

## 6. Contour vertex annotation contract

Used when a sample has manually defined key contour points.

```json
{
  "sample_id": "real_drawings_000123",
  "vertices": [
    {"vertex_id": 0, "x": 142.0, "y": 501.0},
    {"vertex_id": 1, "x": 620.0, "y": 488.0},
    {"vertex_id": 2, "x": 615.0, "y": 910.0}
  ],
  "order_type": "clockwise",
  "is_complete": true
}
```

### Required fields
- `sample_id: str`
- `vertices: list`

Each vertex object requires:
- `vertex_id: int`
- `x: float`
- `y: float`

### Optional fields
- `order_type: str`
- `is_complete: bool`

---

## 7. Contour path contract

Used for structured contour sequence annotations or post-vectorization outputs.

```json
{
  "sample_id": "real_drawings_000123",
  "segments": [
    {
      "segment_id": 0,
      "start_vertex_id": 0,
      "end_vertex_id": 1,
      "kind": "line",
      "is_main": true
    }
  ],
  "is_closed": false,
  "closure_gap": 14.2
}
```

### Required fields
- `sample_id: str`
- `segments: list`

Each segment object requires:
- `segment_id: int`
- `start_vertex_id: int`
- `end_vertex_id: int`
- `kind: str`

### Optional fields
- `is_main: bool`
- `is_closed: bool`
- `closure_gap: float`

For the current MVP track, `kind` is expected to be `line`.

---

## 8. Text box annotation contract

Used for text region detection.

```json
{
  "sample_id": "real_drawings_000123",
  "text_boxes": [
    {
      "box_id": 0,
      "x_min": 812,
      "y_min": 420,
      "x_max": 925,
      "y_max": 477,
      "rotation_deg": 0.0,
      "text_role": "dimension_value"
    }
  ]
}
```

### Required fields
- `sample_id: str`
- `text_boxes: list`

Each box object requires:
- `box_id: int`
- `x_min: int`
- `y_min: int`
- `x_max: int`
- `y_max: int`

### Optional fields
- `rotation_deg: float`
- `text_role: str`

Allowed `text_role` values:
- `dimension_value`
- `unit`
- `other`
- `ignore`

---

## 9. Digit recognition label contract

Used for digit crops or full-number transcription tasks.

### Single digit example

```json
{
  "sample_id": "digit_crop_000014",
  "image_path": "data/interim/digit_crops/digit_crop_000014.png",
  "label": "7"
}
```

### Full sequence example

```json
{
  "sample_id": "real_drawings_000123_box_0",
  "crop_path": "data/interim/text_region_crops/real_drawings_000123_box_0.png",
  "raw_text": "1250",
  "normalized_value": 1250.0,
  "unit": "mm"
}
```

---

## 10. Dimension-to-side link contract

Used for linking recognized dimension values to contour segments.

```json
{
  "sample_id": "real_drawings_000123",
  "links": [
    {
      "link_id": 0,
      "text_box_id": 0,
      "segment_id": 3,
      "value": 1250.0,
      "unit": "mm",
      "confidence": 0.94,
      "status": "linked"
    }
  ]
}
```

### Required fields per link
- `link_id: int`
- `text_box_id: int`
- `segment_id: int`
- `value: float`
- `confidence: float`
- `status: str`

### Optional fields
- `unit: str`
- `notes: str`

Allowed `status` values:
- `linked`
- `ambiguous`
- `unresolved`
- `rejected`

---

## 11. Prediction contract

Every prediction stage should produce a consistent output object.

Example:

```json
{
  "sample_id": "real_drawings_000123",
  "stage_name": "contour_model_baseline",
  "run_id": "2026_04_19_153000_contour_baseline",
  "prediction_path": "experiments/runs/.../predictions/real_drawings_000123.json",
  "confidence": 0.87,
  "warnings": ["open_contour_detected"]
}
```

---

## 12. Solved geometry contract

This is the internal structured result before final export adaptation.

```json
{
  "sample_id": "real_drawings_000123",
  "vertices": [
    {"vertex_id": 0, "x": 0.0, "y": 0.0},
    {"vertex_id": 1, "x": 1250.0, "y": 0.0}
  ],
  "segments": [
    {
      "segment_id": 0,
      "start_vertex_id": 0,
      "end_vertex_id": 1,
      "kind": "line",
      "length_value": 1250.0,
      "length_unit": "mm"
    }
  ],
  "is_closed": true,
  "warnings": [],
  "confidence": 0.91
}
```

### Required fields
- `sample_id: str`
- `vertices: list`
- `segments: list`
- `is_closed: bool`
- `warnings: list`

### Optional fields
- `confidence: float`
- `solver_diagnostics: dict`

---

## 13. Final export payload contract

The final export payload is the editor-facing structure.
The exact field mapping may evolve, but the export adapter must always be deterministic.

At minimum, it must be able to represent:
- ordered points;
- ordered segments;
- dimension values;
- warnings;
- confidence or diagnostic metadata when needed.

This contract should remain aligned with the target editor import specification.

---

## 14. Metrics record contract

Each experiment run should save a metrics record.

```json
{
  "run_id": "2026_04_19_153000_contour_baseline",
  "stage": "contour",
  "config_name": "contour_baseline",
  "primary_metric": "boundary_f1",
  "primary_score": 0.812,
  "metrics": {
    "mask_iou": 0.768,
    "boundary_f1": 0.812,
    "closure_error_mean": 12.4
  }
}
```

---

## 15. Summary rule

No stage may invent its own hidden ad-hoc output format.
If a new artifact type appears, its contract must be documented here or in a directly linked extension document.

