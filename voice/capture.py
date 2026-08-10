"""Records one utterance after the wake word fires, ending on trailing silence."""

import queue

import numpy as np
import sounddevice as sd
import webrtcvad

FRAME_MS = 30
TRAILING_SILENCE_MS = 900
MAX_UTTERANCE_MS = 15000


def record_utterance(sample_rate: int, input_device) -> np.ndarray:
    frame_samples = int(sample_rate * FRAME_MS / 1000)
    vad = webrtcvad.Vad(2)  # 0-3, higher = more aggressive about filtering non-speech

    audio_q: queue.Queue = queue.Queue()

    def callback(indata, frames, time_info, status):
        audio_q.put(indata[:, 0].copy())

    frames = []
    silence_ms = 0
    heard_speech = False

    with sd.InputStream(
        samplerate=sample_rate,
        channels=1,
        dtype="int16",
        blocksize=frame_samples,
        device=input_device,
        callback=callback,
    ):
        while True:
            frame = audio_q.get()
            if len(frame) != frame_samples:
                continue
            frames.append(frame)

            is_speech = vad.is_speech(frame.tobytes(), sample_rate)
            if is_speech:
                heard_speech = True
                silence_ms = 0
            elif heard_speech:
                silence_ms += FRAME_MS

            total_ms = len(frames) * FRAME_MS
            if heard_speech and silence_ms >= TRAILING_SILENCE_MS:
                break
            if total_ms >= MAX_UTTERANCE_MS:
                break

    return np.concatenate(frames) if frames else np.array([], dtype=np.int16)
