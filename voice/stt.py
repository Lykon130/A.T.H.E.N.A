"""Speech-to-text via faster-whisper. CPU-only by default — no audio ever
leaves the machine."""

import sys
import types

import numpy as np

# faster-whisper imports PyAV (`av`) at module load purely to support
# decode_audio() for arbitrary file/container inputs. This module never uses
# that path — capture.py already hands over a raw PCM numpy array — but the
# import happens unconditionally. On some locked-down Windows machines PyAV's
# bundled FFmpeg DLLs get blocked by Application Control policy, which would
# otherwise make faster-whisper unimportable for a feature we don't use.
# Stub it out before importing if the real one can't load.
try:
    import av  # noqa: F401
except ImportError:
    stub = types.ModuleType("av")
    stub.audio = types.ModuleType("av.audio")
    stub.audio.resampler = types.ModuleType("av.audio.resampler")
    stub.audio.resampler.AudioResampler = object
    sys.modules["av"] = stub
    sys.modules["av.audio"] = stub.audio
    sys.modules["av.audio.resampler"] = stub.audio.resampler

from faster_whisper import WhisperModel

_model = None


def _get_model(model_size: str, device: str, compute_type: str) -> WhisperModel:
    global _model
    if _model is None:
        _model = WhisperModel(model_size, device=device, compute_type=compute_type)
    return _model


def transcribe(audio_int16: np.ndarray, sample_rate: int, model_size: str,
               device: str, compute_type: str) -> str:
    audio_f32 = audio_int16.astype(np.float32) / 32768.0
    model = _get_model(model_size, device, compute_type)
    segments, _ = model.transcribe(audio_f32, language="en", vad_filter=False)
    return " ".join(segment.text.strip() for segment in segments).strip()
