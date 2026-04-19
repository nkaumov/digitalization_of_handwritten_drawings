# Data Directory

This directory stores all project data.

Expected structure:
- `raw/` — immutable source data;
- `interim/` — intermediate transformation outputs;
- `annotations/` — labels and review artifacts;
- `processed/` — model-ready datasets;
- `splits/` — deterministic split files;
- `sample_sets/` — curated benchmark subsets.

Do not store throwaway experiments here.
