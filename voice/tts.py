"""Text-to-speech via Piper (local, no cloud). Plays audio directly through
sounddevice rather than round-tripping through a temp file."""

import re
import time

import numpy as np
import sounddevice as sd
from piper.voice import PiperVoice

_voice = None
_voice_path = None

# How often to sample playback amplitude for the HUD, and over how wide a
# window. 30/s matches typical UI frame budgets without flooding the bridge;
# int16 peak is the normalizer since Piper outputs int16 PCM, and the gain
# compensates for speech RMS normally sitting well below full scale.
AMPLITUDE_REPORT_INTERVAL_S = 1 / 30
AMPLITUDE_WINDOW_S = 0.05
AMPLITUDE_GAIN = 4.0
_INT16_PEAK = float(np.iinfo(np.int16).max)


def _report_amplitude_while_playing(audio: np.ndarray, sample_rate: int, hud) -> None:
    """Streams real playback amplitude to the HUD in step with audio that's
    already been handed to sd.play(). Timed off the wall clock rather than an
    audio callback, since we already know the exact buffer being played."""
    window_samples = max(1, int(AMPLITUDE_WINDOW_S * sample_rate))
    total_samples = len(audio)
    start = time.monotonic()

    while True:
        idx = int((time.monotonic() - start) * sample_rate)
        if idx >= total_samples:
            break
        window = audio[idx : idx + window_samples]
        if window.size == 0:
            break
        rms = float(np.sqrt(np.mean(window.astype(np.float64) ** 2))) / _INT16_PEAK
        hud.notify_speaking(min(1.0, rms * AMPLITUDE_GAIN))
        time.sleep(AMPLITUDE_REPORT_INTERVAL_S)


def _get_voice(model_path: str) -> PiperVoice:
    global _voice, _voice_path
    if _voice is None or _voice_path != model_path:
        _voice = PiperVoice.load(model_path)
        _voice_path = model_path
    return _voice


def strip_markdown(text: str) -> str:
    """Claude's replies are markdown-formatted; Piper has no markdown
    awareness and will phonetically spell out repeated symbols like "**" or
    "//" ("asterisk asterisk", "slash slash") instead of treating them as
    formatting. Strip that before it reaches TTS — the logged transcript
    keeps the original formatting, only the spoken version is cleaned."""
    # fenced code blocks -> just their content
    text = re.sub(r"```[a-zA-Z]*\n?(.*?)```", r"\1", text, flags=re.DOTALL)
    # inline code, bold, italic markers -> unwrap, keep content
    text = re.sub(r"`([^`]+)`", r"\1", text)
    text = re.sub(r"\*\*\*([^*]+)\*\*\*", r"\1", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    text = re.sub(r"\*([^*]+)\*", r"\1", text)
    text = re.sub(r"__([^_]+)__", r"\1", text)
    # markdown links [text](url) -> text
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    # headers, blockquotes, list bullets at line start
    text = re.sub(r"^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+", "", text, flags=re.MULTILINE)
    # horizontal rules
    text = re.sub(r"^\s*([-*_]\s*){3,}$", "", text, flags=re.MULTILINE)
    # Windows drive-letter paths (D:\A.T.H.E.N.A\voice): Piper spells out
    # single ":" and "\" characters here rather than skipping them, since
    # they don't look like normal punctuation in this context. Strip the
    # drive colon and turn backslashes into spaces so the path just reads as
    # words.
    text = re.sub(r"\b([A-Za-z]):\\+", r"\1 ", text)
    text = text.replace("\\", " ")
    # any remaining run of 2+ symbol characters (path separators, markdown
    # leftovers) collapses to a single space rather than being read aloud
    text = re.sub(r"[*_`#/\\]{2,}", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def speak(text: str, voice_model_path: str, output_device=None, hud=None) -> None:
    text = strip_markdown(text)
    if not text.strip():
        return
    voice = _get_voice(voice_model_path)
    chunks = [np.frombuffer(chunk.audio_int16_bytes, dtype=np.int16) for chunk in voice.synthesize(text)]
    if not chunks:
        return
    audio = np.concatenate(chunks)
    sample_rate = voice.config.sample_rate

    sd.play(audio, samplerate=sample_rate, device=output_device)
    if hud is not None:
        _report_amplitude_while_playing(audio, sample_rate, hud)
        hud.notify_idle()
    sd.wait()
