"""Shared edge-tts helpers: synthesize text -> mp3 + word timings (ms)."""
import asyncio
import json
import subprocess
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / "config" / "video.json"


def load_config():
    return json.loads(CONFIG.read_text())


async def _synth(text, voice, rate, pitch, mp3_path: Path):
    comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary="WordBoundary")
    words = []
    with open(mp3_path, "wb") as f:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                start = chunk["offset"] / 10_000  # 100ns ticks -> ms
                words.append({
                    "text": chunk["text"],
                    "startMs": round(start),
                    "endMs": round(start + chunk["duration"] / 10_000),
                })
    return words


def synth(text, voice, rate, pitch, mp3_path: Path, retries=3):
    mp3_path.parent.mkdir(parents=True, exist_ok=True)
    for attempt in range(retries):
        try:
            return asyncio.run(_synth(text, voice, rate, pitch, mp3_path))
        except Exception as e:  # network hiccups from the TTS service
            if attempt == retries - 1:
                raise
            print(f"  retry {attempt + 1} after error: {e}")


def probe_duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    return float(out)
