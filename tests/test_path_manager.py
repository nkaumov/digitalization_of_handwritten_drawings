from pathlib import Path

from src.settings import ConfigLoader, PathManager


def test_path_manager_builds_core_paths() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    config = ConfigLoader.load_project_configs(repo_root)
    path_manager = PathManager(repo_root, config)

    assert path_manager.get("data_dir").name == "data"
    assert path_manager.get("experiment_runs_dir").name == "runs"
