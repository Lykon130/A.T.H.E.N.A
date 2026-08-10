"""Shared config loading for the voice module."""

from pathlib import Path

import yaml

VOICE_DIR = Path(__file__).resolve().parent


def load_config() -> dict:
    config_path = VOICE_DIR / "config.yaml"
    if not config_path.exists():
        raise FileNotFoundError(
            "voice/config.yaml not found. Run the voice-setup skill first, "
            "or copy voice/config.example.yaml to voice/config.yaml."
        )
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def resolve(config: dict, key_path: str) -> Path:
    """Resolve a dotted config key (e.g. 'wake_word.model_path') to an absolute Path under voice/."""
    node = config
    for key in key_path.split("."):
        node = node[key]
    return (VOICE_DIR / node).resolve()
