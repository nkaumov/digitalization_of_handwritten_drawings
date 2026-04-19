$ProjectRoot = Get-Location

$Directories = @(
    "configs/project",
    "configs/data",
    "data/raw/real/contour_only",
    "data/raw/real/digits_only",
    "data/raw/real/drawings_with_dimensions",
    "data/raw/real/difficult_cases",
    "data/raw/external",
    "data/raw/synthetic",
    "data/interim",
    "data/annotations/contour_masks",
    "data/annotations/contour_vertices",
    "data/annotations/text_boxes",
    "data/annotations/dimension_links",
    "data/annotations/qc_reports",
    "data/processed",
    "data/splits",
    "data/sample_sets/smoke_test",
    "data/sample_sets/visual_benchmark",
    "data/sample_sets/hard_cases",
    "docs",
    "notebooks",
    "src/settings",
    "src/data",
    "src/utils",
    "src/visualization",
    "src/metrics",
    "src/preprocessing",
    "src/contour",
    "src/text",
    "src/digits",
    "src/linking",
    "src/solver",
    "src/pipeline",
    "tests",
    "experiments/runs",
    "experiments/leaderboards",
    "experiments/templates",
    "reports/daily_notes",
    "reports/experiment_summaries",
    "reports/benchmark_reports",
    "reports/release_reports",
    "reports/figures",
    "models/checkpoints",
    "models/exported",
    "models/registry",
    "sandbox/quick_checks",
    "sandbox/throwaway_exports",
    "scripts"
)

foreach ($dir in $Directories) {
    $fullPath = Join-Path $ProjectRoot $dir
    New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
}

Write-Host "Project structure created successfully at: $ProjectRoot"
