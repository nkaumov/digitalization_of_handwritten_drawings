# 02. Architecture Overview

## 1. Architectural principle

The system follows a controlled multi-stage architecture:

**learn perception -> validate structure -> solve geometry -> export payload**

The project does not treat the full task as a single opaque transformation from image to final JSON.
Instead, it separates the problem into measurable stages.

---

## 2. Main system blocks

```text
photo
  -> preprocessing
  -> contour perception
  -> contour postprocessing and vectorization
  -> text region detection
  -> digit recognition and sequence building
  -> dimension-to-side linking
  -> geometry solver
  -> payload export
```

---

## 3. Block descriptions

## 3.1. Preprocessing
Purpose:
- normalize input images;
- reduce noise;
- improve contrast;
- suppress graph paper or background interference when useful;
- produce stable inputs for downstream stages.

Outputs:
- normalized image;
- optional denoised image;
- optional binary or auxiliary masks;
- visual debug artifacts.

This block must be parameterized and benchmarked.

---

## 3.2. Contour perception
Purpose:
- identify which strokes belong to the main contour;
- ignore non-structural clutter;
- remain robust to broken lines and visually inaccurate corners.

Typical outputs:
- contour mask;
- optional corner / junction heatmap;
- confidence signals.

This is a learned perception problem.

---

## 3.3. Contour postprocessing and vectorization
Purpose:
- transform contour evidence into a structured path or graph;
- merge fragmented contour pieces;
- extract candidate vertices and segment order;
- estimate closure state.

Typical outputs:
- candidate graph;
- ordered contour path;
- vector primitives;
- contour diagnostics.

This block may combine classical geometry with learned outputs.

---

## 3.4. Text region detection
Purpose:
- detect image areas that contain numeric dimensions or related dimension text.

Typical outputs:
- text boxes;
- orientations;
- confidence scores.

This block may be learned, rule-based, or hybrid depending on the selected baseline.

---

## 3.5. Digit recognition and sequence building
Purpose:
- recognize individual digits;
- assemble them into full numbers;
- preserve raw recognition history;
- support ambiguous cases.

Typical outputs:
- recognized number candidates;
- raw text;
- parsed numeric values;
- confidence scores.

This is separate from contour reconstruction and must be evaluated separately.

---

## 3.6. Dimension-to-side linking
Purpose:
- determine which recognized dimension belongs to which contour segment;
- handle ambiguous placements;
- support warnings when no confident link exists.

Typical outputs:
- segment-dimension links;
- ranked link candidates;
- ambiguity flags.

---

## 3.7. Geometry solver
Purpose:
- combine contour structure and dimension evidence;
- repair open or inconsistent geometry when possible;
- prioritize structural consistency and numeric constraints over visual drawing distortion.

Typical responsibilities:
- order points and segments;
- compute closure repair;
- apply angle priors;
- fit side lengths to recognized dimensions;
- preserve warnings for unresolved cases.

This block is a product-critical component.

---

## 3.8. Payload export
Purpose:
- convert the solved internal representation into the target editor payload;
- attach warnings and confidence;
- preserve enough debug information for analysis.

This block must be deterministic and testable.

---

## 4. Why the architecture is split

The task includes several different uncertainty sources:
- noisy photos;
- messy handwriting;
- structurally broken contours;
- numeric ambiguity;
- geometric inconsistency.

A split architecture is preferred because it allows:
- isolated evaluation;
- targeted debugging;
- per-stage retraining;
- more controlled failure handling;
- easier integration of new models or heuristics.

---

## 5. Data flow types

The project should distinguish the following data types:

1. raw image inputs;
2. intermediate visual artifacts;
3. model outputs;
4. structured candidate objects;
5. final solved payloads;
6. run-level metrics and reports.

This separation is important for traceability.

---

## 6. Error handling philosophy

The system should prefer:
- explicit warnings over silent omission;
- confidence-aware export over fake certainty;
- partial valid outputs over total collapse when possible.

The goal is to preserve as much useful structure as possible without hiding uncertainty.

---

## 7. Evaluation philosophy

Each block must have:
- dedicated metrics;
- saved artifacts;
- best/worst case visualization;
- failure categories.

The final end-to-end score is important, but it must not replace per-block analysis.

---

## 8. Long-term extensibility

The architecture should allow future additions such as:
- active learning loops;
- improved contour backbones;
- stronger OCR models;
- richer semantic drawing elements;
- API packaging and deployment.

The v5 foundation must therefore remain modular from the start.

