"""Appends voice session activity to the vault, matching the raw/<department>
convention used everywhere else. Direct file writes — no MCP/REST dependency,
so this works even when Obsidian isn't running."""

import datetime
from pathlib import Path


def _today_path(session_dir: Path) -> Path:
    session_dir.mkdir(parents=True, exist_ok=True)
    return session_dir / f"{datetime.date.today().isoformat()}.md"


def log_turn(session_dir: Path, user_text: str, assistant_text: str) -> None:
    path = _today_path(session_dir)
    timestamp = datetime.datetime.now().strftime("%H:%M:%S")
    entry = f"\n### {timestamp}\n**You:** {user_text}\n\n**Athena:** {assistant_text}\n"
    with open(path, "a", encoding="utf-8") as f:
        f.write(entry)


def log_rejection(session_dir: Path) -> None:
    """Wake word fired but the voice didn't match the enrolled voiceprint.
    No audio or transcript content is recorded — timestamp only, for audit."""
    path = _today_path(session_dir)
    timestamp = datetime.datetime.now().strftime("%H:%M:%S")
    with open(path, "a", encoding="utf-8") as f:
        f.write(f"\n### {timestamp}\n_Wake word triggered, voice not recognized — command discarded._\n")
