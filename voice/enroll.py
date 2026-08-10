"""One-time enrollment: records a few samples of your voice and builds a
local voiceprint used by verify.py to gate every future wake-word trigger.

Run manually: python voice/enroll.py
"""

import sys

import numpy as np
import sounddevice as sd

from common import load_config, resolve, VOICE_DIR
from verify import embed_audio

SAMPLE_SECONDS = 6
NUM_SAMPLES = 5

PROMPTS = [
    "Say a sentence about your day, naturally, for a few seconds.",
    "Count slowly from one to twenty.",
    "Say \"Hey Jarvis\" a few times, with pauses between (today's wake word).",
    "Read a sentence of your choice out loud.",
    "Say another sentence, in your normal speaking voice and volume.",
]


def record_sample(sample_rate: int, input_device, seconds: int) -> np.ndarray:
    audio = sd.rec(int(seconds * sample_rate), samplerate=sample_rate, channels=1,
                    dtype="int16", device=input_device)
    sd.wait()
    return audio[:, 0]


def main() -> None:
    config = load_config()
    sample_rate = config["audio"]["sample_rate"]
    input_device = config["audio"]["input_device"]

    print("Voice enrollment — this builds a local voiceprint used to verify it's you.")
    print("Nothing recorded here leaves this machine.")
    print("Tips for a solid enrollment: quiet room, normal speaking volume, mic within")
    print("arm's reach, speak continuously rather than in short bursts.\n")

    embeddings = []
    for i in range(NUM_SAMPLES):
        prompt = PROMPTS[i % len(PROMPTS)]
        input(f"[{i + 1}/{NUM_SAMPLES}] {prompt}\nPress Enter, then speak for ~{SAMPLE_SECONDS}s...")
        print("Recording...")
        audio = record_sample(sample_rate, input_device, SAMPLE_SECONDS)
        if np.abs(audio).max() < 200:
            print("That came through nearly silent — check your mic. Retrying this sample.")
            continue
        embeddings.append(embed_audio(audio, sample_rate))
        print("Captured.\n")

    if len(embeddings) < 2:
        print("Not enough usable samples captured. Run enroll.py again.")
        sys.exit(1)

    voiceprint = np.mean(embeddings, axis=0)
    out_path = resolve(config, "speaker_verification.voiceprint_path")
    np.save(out_path, voiceprint)
    print(f"Voiceprint saved to {out_path}")

    # Self-check: how consistent were the samples with each other and with
    # the final averaged voiceprint? Low numbers here predict false
    # rejections during real use — worth re-running enrollment if so.
    pairwise = []
    for i in range(len(embeddings)):
        for j in range(i + 1, len(embeddings)):
            a, b = embeddings[i], embeddings[j]
            pairwise.append(float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))))
    to_mean = [
        float(np.dot(e, voiceprint) / (np.linalg.norm(e) * np.linalg.norm(voiceprint)))
        for e in embeddings
    ]
    print(f"\nSample-to-sample consistency: avg {np.mean(pairwise):.2f} (min {min(pairwise):.2f})")
    print(f"Sample-to-voiceprint match:   avg {np.mean(to_mean):.2f} (min {min(to_mean):.2f})")
    if min(to_mean) < 0.6:
        print("\nOne or more samples is a weaker match than ideal — consider re-running")
        print("enroll.py in a quieter setting, closer to the mic.")
    else:
        print("\nLooks solid. Set speaker_verification.accept_threshold in config.yaml")
        print("partway between this sample-to-voiceprint match average and 1.0, then")
        print("confirm it actually rejects someone else's voice before trusting it.")


if __name__ == "__main__":
    main()
