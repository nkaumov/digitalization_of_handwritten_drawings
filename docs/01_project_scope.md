# TODO

# 01. Project Scope

## 1. Problem statement

The project must convert a photo of a hand-drawn room drawing into a structured digital representation that can be imported into an editor and further edited there.

The drawing on the photo is not expected to be visually precise:
- angles may be drawn inaccurately;
- side lengths may not be proportional;
- the contour may be broken or visually open;
- the contour may contain extra strokes;
- numeric dimensions may be written unevenly or at different orientations;
- the background may contain graph paper, shadows, texture, blur, or low contrast.

The system must reconstruct a usable structured result despite these imperfections.

---

## 2. Product goal

The output is not a decorative image enhancement.
The output is a valid structured payload that represents:
- contour geometry;
- ordered points;
- ordered segments;
- recognized dimensions;
- warnings and confidence signals.

The final result must be suitable for import into an editor.

---

## 3. In-scope for v5

The v5 scope includes:

1. project foundation and reproducible research environment;
2. dataset structure and dataset registration;
3. annotation specification for contour and dimension tasks;
4. preprocessing research environment;
5. contour perception track;
6. text region detection track;
7. handwritten digit recognition track;
8. dimension-to-side linking track;
9. geometry solver track;
10. end-to-end benchmark and release validation.

---

## 4. Out-of-scope for the current foundation stage

The following are not part of the current foundation stage:
- production API service;
- frontend editor integration details;
- user authentication;
- cloud deployment;
- support for curved geometry;
- furniture / symbol recognition;
- full semantic room understanding;
- multi-floor building plans.

These may be added later, but they are intentionally excluded from the current stage.

---

## 5. Core technical position

This project is based on a hybrid design:
- learned perception models detect contour and text information;
- deterministic logic validates and links information;
- a geometry solver reconstructs the controlled final structure.

We do **not** assume that a single end-to-end black-box model is the correct first solution for this problem.

---

## 6. Data sources

The project will use three categories of data:

### 6.1. Real photos
Photos of actual hand-drawn drawings.
This is the most important domain for final validation.

### 6.2. Synthetic data
Artificially generated drawings with known ground truth.
This is important for scale, controlled experiments, and stress testing.

### 6.3. Public external datasets
External datasets may be used as auxiliary sources for:
- handwritten digits;
- rough line style priors;
- floor plan structure priors.

Public datasets are supporting assets, not the sole foundation of the project.

---

## 7. Success criteria

The project is considered successful only if it can produce an editor-usable payload with measurable quality.

Success is not defined by:
- visually nice overlays alone;
- isolated strong performance on one image;
- manual correction hidden inside the pipeline;
- undocumented tuning.

Success is defined by:
- reproducible metrics;
- stable behavior on benchmark sets;
- clear failure reporting;
- editable exported structure.

---

## 8. Mandatory quality requirements

The system must be designed so that:

1. every stage has clear metrics;
2. every stage has visual diagnostics;
3. every experiment is reproducible;
4. every important decision is documented;
5. hard cases are accumulated rather than ignored;
6. silent failures are minimized;
7. warnings are preserved rather than hidden.

---

## 9. Future extension direction

The v5 structure should be future-proof for:
- improved contour models;
- better OCR models;
- active learning loops;
- richer editor contracts;
- more advanced geometry repair logic.

The foundation must therefore stay modular and well documented.

