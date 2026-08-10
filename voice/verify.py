"""Local speaker verification: embed an utterance and compare against the
enrolled voiceprint. Nothing here leaves the machine or touches Claude.

Uses SpeechBrain's ECAPA-TDNN (spkrec-ecapa-voxceleb), a model purpose-built
for speaker verification. An earlier version of this module used
resemblyzer's GE2E encoder (designed for voice-cloning conditioning, not
telling two specific people apart) and it produced a real false accept in
testing — a different person's voice scored 0.82 cosine similarity against
the enrolled voiceprint, well past the 0.78 threshold, while the genuine
owner's own samples scored only 0.68-0.69. ECAPA-TDNN gives much wider
separation between distinct speakers on the same mic."""

from pathlib import Path

import numpy as np
import torch
from speechbrain.inference.speaker import EncoderClassifier

_classifier = None


def _get_classifier() -> EncoderClassifier:
    global _classifier
    if _classifier is None:
        from speechbrain.utils.fetching import LocalStrategy
        _classifier = EncoderClassifier.from_hparams(
            source="speechbrain/spkrec-ecapa-voxceleb",
            savedir=str(Path(__file__).resolve().parent / "models" / "ecapa"),
            local_strategy=LocalStrategy.COPY,  # symlinks need elevated privileges on Windows
        )
    return _classifier


def embed_audio(audio_int16: np.ndarray, sample_rate: int) -> np.ndarray:
    assert sample_rate == 16000, "ECAPA-TDNN expects 16kHz input; resample before calling"
    wav = torch.from_numpy(audio_int16.astype(np.float32) / 32768.0).unsqueeze(0)
    with torch.no_grad():
        embedding = _get_classifier().encode_batch(wav)
    return embedding.squeeze().cpu().numpy()


def load_voiceprint(path: Path) -> np.ndarray:
    if not path.exists():
        raise FileNotFoundError(
            f"No voiceprint at {path}. Run `python voice/enroll.py` first."
        )
    return np.load(path)


def is_match(candidate_embedding: np.ndarray, voiceprint: np.ndarray, threshold: float) -> tuple[bool, float]:
    similarity = float(np.dot(candidate_embedding, voiceprint) /
                        (np.linalg.norm(candidate_embedding) * np.linalg.norm(voiceprint)))
    return similarity >= threshold, similarity
