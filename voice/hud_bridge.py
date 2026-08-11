"""Best-effort live link from the voice loop to the desktop HUD (hud/), over
a local WebSocket the HUD's main process hosts. The HUD is optional — voice/
must keep working with no HUD running, so every call here is fire-and-forget:
a missing or unreachable HUD silently no-ops rather than slowing down or
breaking a real conversation turn."""

import json

import websocket  # websocket-client


class HudBridge:
    def __init__(self, url: str, connect_timeout: float = 0.2, send_timeout: float = 0.2) -> None:
        self._url = url
        self._connect_timeout = connect_timeout
        self._send_timeout = send_timeout
        self._ws: websocket.WebSocket | None = None

    def _ensure_connected(self) -> bool:
        if self._ws is not None:
            return True
        try:
            self._ws = websocket.create_connection(self._url, timeout=self._connect_timeout)
            self._ws.settimeout(self._send_timeout)
            return True
        except OSError:
            self._ws = None
            return False

    def _send(self, payload: dict) -> None:
        if not self._ensure_connected():
            return
        try:
            self._ws.send(json.dumps(payload))
        except OSError:
            self._ws = None  # drop and let the next call retry the connection

    def notify_speaking(self, amplitude: float) -> None:
        self._send({"speaking": True, "amplitude": amplitude})

    def notify_idle(self) -> None:
        self._send({"speaking": False})
