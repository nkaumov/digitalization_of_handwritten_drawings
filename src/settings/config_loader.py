from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Iterable, Mapping

import yaml


class ConfigError(Exception):
    """Raised when configuration loading fails."""


class ConfigLoader:
    """Utility class for loading and merging YAML configuration files."""

    @staticmethod
    def load_yaml(path: str | Path) -> Dict[str, Any]:
        config_path = Path(path)

        if not config_path.exists():
            raise ConfigError(f"Configuration file does not exist: {config_path}")

        if config_path.suffix.lower() not in {".yaml", ".yml"}:
            raise ConfigError(f"Unsupported configuration format: {config_path}")

        with config_path.open("r", encoding="utf-8") as file:
            data = yaml.safe_load(file) or {}

        if not isinstance(data, dict):
            raise ConfigError(
                f"Top-level YAML object must be a mapping: {config_path}"
            )

        return data

    @classmethod
    def load_many(cls, paths: Iterable[str | Path]) -> Dict[str, Any]:
        merged: Dict[str, Any] = {}

        for path in paths:
            loaded = cls.load_yaml(path)
            merged = cls.deep_merge(merged, loaded)

        return merged

    @staticmethod
    def deep_merge(base: Mapping[str, Any], update: Mapping[str, Any]) -> Dict[str, Any]:
        result: Dict[str, Any] = dict(base)

        for key, value in update.items():
            base_value = result.get(key)

            if isinstance(base_value, dict) and isinstance(value, dict):
                result[key] = ConfigLoader.deep_merge(base_value, value)
            else:
                result[key] = value

        return result

    @classmethod
    def load_project_configs(cls, repo_root: str | Path) -> Dict[str, Any]:
        root = Path(repo_root)
        config_paths = [
            root / "configs" / "project" / "paths.yaml",
            root / "configs" / "project" / "runtime.yaml",
            root / "configs" / "project" / "seeds.yaml",
        ]
        return cls.load_many(config_paths)
