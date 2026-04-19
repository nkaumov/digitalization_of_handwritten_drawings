from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict


@dataclass
class RunContext:
    run_id: str
    run_dir: Path
    artifact_dirs: Dict[str, Path]


class PathManager:
    """Centralized access to project directories and experiment run paths."""

    def __init__(self, repo_root: str | Path, path_config: Dict[str, Any]) -> None:
        self.repo_root = Path(repo_root).resolve()
        self.path_config = path_config

        raw_paths = self.path_config.get("paths", {})
        if not raw_paths:
            raise ValueError("Missing 'paths' section in path configuration.")

        self.paths: Dict[str, Path] = {
            name: self.repo_root / relative_path
            for name, relative_path in raw_paths.items()
        }

    @classmethod
    def from_default_root(cls, path_config: Dict[str, Any]) -> "PathManager":
        repo_root = Path(__file__).resolve().parents[2]
        return cls(repo_root=repo_root, path_config=path_config)

    def get(self, key: str) -> Path:
        if key not in self.paths:
            available = ", ".join(sorted(self.paths))
            raise KeyError(f"Unknown path key: {key}. Available keys: {available}")
        return self.paths[key]

    def as_dict(self) -> Dict[str, str]:
        return {key: str(path) for key, path in self.paths.items()}

    def ensure_directories(self) -> None:
        for path in self.paths.values():
            path.mkdir(parents=True, exist_ok=True)

    def build_run_id(
        self,
        stage: str,
        experiment_name: str,
        runtime_config: Dict[str, Any],
    ) -> str:
        runtime_section = runtime_config.get("runtime", {})
        use_timestamp = runtime_section.get("use_timestamp_in_run_id", True)
        time_format = runtime_section.get("run_id_time_format", "%Y_%m_%d_%H%M%S")

        if use_timestamp:
            timestamp = datetime.now().strftime(time_format)
            return f"{timestamp}_{stage}_{experiment_name}"

        return f"{stage}_{experiment_name}"

    def create_run_context(
        self,
        stage: str,
        experiment_name: str,
        runtime_config: Dict[str, Any],
    ) -> RunContext:
        run_id = self.build_run_id(
            stage=stage,
            experiment_name=experiment_name,
            runtime_config=runtime_config,
        )

        runs_root = self.get("experiment_runs_dir")
        run_dir = runs_root / run_id
        run_dir.mkdir(parents=True, exist_ok=True)

        artifact_names = runtime_config.get("artifacts", {}).get("subdirectories", [])
        artifact_dirs: Dict[str, Path] = {}

        for artifact_name in artifact_names:
            artifact_dir = run_dir / artifact_name
            artifact_dir.mkdir(parents=True, exist_ok=True)
            artifact_dirs[artifact_name] = artifact_dir

        return RunContext(run_id=run_id, run_dir=run_dir, artifact_dirs=artifact_dirs)
