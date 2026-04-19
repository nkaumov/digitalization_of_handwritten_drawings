from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List

from src.settings import ConfigLoader


@dataclass
class DatasetEntry:
    dataset_name: str
    source_type: str
    subset: str
    root_dir: str
    manifest_path: str
    task_types: List[str]
    label_status: str
    split_strategy: str
    is_active: bool
    notes: str = ""


class DatasetRegistry:
    def __init__(self, repo_root: str | Path) -> None:
        self.repo_root = Path(repo_root).resolve()
        self.registry_path = self.repo_root / "configs" / "data" / "dataset_registry.yaml"
        self.raw_registry = ConfigLoader.load_yaml(self.registry_path)
        self.datasets = self._parse_datasets(self.raw_registry)

    def _parse_datasets(self, raw_registry: Dict[str, Any]) -> List[DatasetEntry]:
        dataset_rows = raw_registry.get("datasets", [])
        parsed: List[DatasetEntry] = []

        for row in dataset_rows:
            parsed.append(DatasetEntry(**row))

        return parsed

    def list_all(self) -> List[DatasetEntry]:
        return self.datasets

    def list_active(self) -> List[DatasetEntry]:
        return [dataset for dataset in self.datasets if dataset.is_active]

    def by_name(self, dataset_name: str) -> DatasetEntry:
        for dataset in self.datasets:
            if dataset.dataset_name == dataset_name:
                return dataset
        raise KeyError(f"Dataset not found: {dataset_name}")

    def to_rows(self) -> List[Dict[str, Any]]:
        rows: List[Dict[str, Any]] = []

        for dataset in self.datasets:
            rows.append(
                {
                    "dataset_name": dataset.dataset_name,
                    "source_type": dataset.source_type,
                    "subset": dataset.subset,
                    "root_dir": str(self.repo_root / dataset.root_dir),
                    "manifest_path": str(self.repo_root / dataset.manifest_path),
                    "task_types": ", ".join(dataset.task_types),
                    "label_status": dataset.label_status,
                    "split_strategy": dataset.split_strategy,
                    "is_active": dataset.is_active,
                    "notes": dataset.notes,
                }
            )

        return rows
