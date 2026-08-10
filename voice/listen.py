"""Always-on voice assistant loop for A.T.H.E.N.A.

No keypress anywhere: wake word triggers listening, speaker verification
gates every command before it reaches Claude or gets logged. Ctrl+C to stop
the process — that's process management, not activation.
"""

from common import load_config, resolve, VOICE_DIR
from wake import WakeWordDetector
from capture import record_utterance
from verify import embed_audio, load_voiceprint, is_match
from stt import transcribe
from tts import speak
from bridge import ask_claude
from logger import log_turn, log_rejection


def main() -> None:
    config = load_config()
    sample_rate = config["audio"]["sample_rate"]
    input_device = config["audio"]["input_device"]
    output_device = config["audio"]["output_device"]

    wake_model_path = str(resolve(config, "wake_word.model_path"))
    wake_threshold = config["wake_word"]["threshold"]

    voiceprint_path = resolve(config, "speaker_verification.voiceprint_path")
    accept_threshold = config["speaker_verification"]["accept_threshold"]
    voiceprint = load_voiceprint(voiceprint_path)

    stt_model_size = config["stt"]["model_size"]
    stt_device = config["stt"]["device"]
    stt_compute_type = config["stt"]["compute_type"]

    tts_voice_path = str(resolve(config, "tts.voice_model_path"))

    session_id_path = resolve(config, "claude.session_id_path")
    repo_root = VOICE_DIR.parent

    session_dir = resolve(config, "logging.vault_session_dir")

    detector = WakeWordDetector(wake_model_path, wake_threshold, sample_rate, input_device)

    print("Athena is listening. Say the wake word to start a command. Ctrl+C to stop.")

    while True:
        detector.wait_for_wake()
        print("Wake word detected, listening for a command...")

        audio = record_utterance(sample_rate, input_device)
        if audio.size == 0:
            continue
        duration_s = len(audio) / sample_rate
        print(f"Captured {duration_s:.2f}s of audio.")

        embedding = embed_audio(audio, sample_rate)
        matched, similarity = is_match(embedding, voiceprint, accept_threshold)
        if not matched:
            print(f"Voice not recognized (similarity {similarity:.2f}), discarding.")
            log_rejection(session_dir)
            continue
        print(f"Voice verified (similarity {similarity:.2f}).")

        text = transcribe(audio, sample_rate, stt_model_size, stt_device, stt_compute_type)
        if not text:
            continue
        print(f"You: {text}")

        response = ask_claude(text, session_id_path, repo_root)
        print(f"Athena: {response}")

        log_turn(session_dir, text, response)
        speak(response, tts_voice_path, output_device)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nStopped.")
