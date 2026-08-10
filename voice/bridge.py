"""Sends a verified voice command to Claude Code headlessly and returns its
reply. Uses a dedicated session (separate from any interactive terminal
session) so voice turns build on each other without mixing into unrelated
conversations."""

import os
import subprocess
import uuid
from pathlib import Path


def _session_id(session_id_path: Path) -> tuple[str, bool]:
    """Returns (session_id, is_new)."""
    if session_id_path.exists():
        return session_id_path.read_text(encoding="utf-8").strip(), False
    new_id = str(uuid.uuid4())
    session_id_path.write_text(new_id, encoding="utf-8")
    return new_id, True


def ask_claude(text: str, session_id_path: Path, repo_root: Path) -> str:
    session_id, is_new = _session_id(session_id_path)

    cmd = ["claude", "-p", "--output-format", "text"]
    cmd += ["--session-id", session_id] if is_new else ["--resume", session_id]
    cmd.append(text)

    result = subprocess.run(
        cmd, cwd=str(repo_root), capture_output=True, text=True, timeout=120,
        encoding="utf-8", errors="replace",  # Windows' default console codepage mangles
        # Claude's UTF-8 output (em-dashes etc.) otherwise
        shell=(os.name == "nt"),  # `claude` is a .cmd shim on Windows, not a direct executable
    )
    if result.returncode != 0:
        return f"Claude Code call failed: {result.stderr.strip()[:300]}"
    return result.stdout.strip()
