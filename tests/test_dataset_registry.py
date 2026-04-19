from pathlib import Path

from src.data import DatasetRegistry


def test_dataset_registry_loads_entries() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    registry = DatasetRegistry(repo_root)

    assert len(registry.list_all()) >= 1
    assert registry.by_name("real_contour_only").subset == "contour_only"
