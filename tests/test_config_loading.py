from pathlib import Path

from src.settings import ConfigLoader


def test_load_project_configs() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    config = ConfigLoader.load_project_configs(repo_root)

    assert "paths" in config
    assert "runtime" in config
    assert "seeds" in config
