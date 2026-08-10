"""Continuous wake-word detection via openWakeWord.

Streams the mic in small frames and blocks until the configured wake word
crosses its detection threshold. Nothing captured before the trigger is kept
or sent anywhere.
"""

import queue

import numpy as np
import sounddevice as sd
from openwakeword.model import Model

FRAME_SAMPLES = 1280  # 80ms @ 16kHz, openWakeWord's expected frame size


class WakeWordDetector:
    def __init__(self, model_path: str, threshold: float, sample_rate: int, input_device):
        self.threshold = threshold
        self.sample_rate = sample_rate
        self.input_device = input_device
        self.model = Model(wakeword_models=[model_path], inference_framework="onnx")
        self._wake_name = list(self.model.models.keys())[0]

    def wait_for_wake(self) -> None:
        """Blocks until the wake word is detected, then returns."""
        audio_q: queue.Queue = queue.Queue()

        def callback(indata, frames, time_info, status):
            audio_q.put(indata[:, 0].copy())

        with sd.InputStream(
            samplerate=self.sample_rate,
            channels=1,
            dtype="int16",
            blocksize=FRAME_SAMPLES,
            device=self.input_device,
            callback=callback,
        ):
            while True:
                frame = audio_q.get()
                if len(frame) != FRAME_SAMPLES:
                    continue
                predictions = self.model.predict(frame)
                score = predictions.get(self._wake_name, 0.0)
                if score >= self.threshold:
                    self.model.reset()
                    return
