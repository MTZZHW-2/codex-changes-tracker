import asyncio
import json
import math
import subprocess
from datetime import datetime, timedelta, timezone
from pathlib import Path

import edge_tts

FPS = 30
VOICE = "zh-CN-YunxiNeural"
RATE = "-5%"

VIDEO_DIR = Path(__file__).resolve().parents[1]
REPO_DIR = VIDEO_DIR.parent
AUDIO_DIR = VIDEO_DIR / "public" / "audio"
META_FILE = VIDEO_DIR / "src" / "voice-meta.json"


def sg_date(iso: str) -> str:
    dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    return (dt.astimezone(timezone(timedelta(hours=8)))).date().isoformat()


def duration_seconds(path: Path) -> float:
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return float(result.stdout.strip())


async def main() -> None:
    changes = json.loads((REPO_DIR / "changes.json").read_text(encoding="utf-8"))
    changes.sort(key=lambda x: x["merged_at"], reverse=True)

    latest_date = sg_date(changes[0]["merged_at"]) if changes else None
    today = [x for x in changes if latest_date and sg_date(x["merged_at"]) == latest_date]

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    meta = {}

    for item in today:
        path = AUDIO_DIR / f'{item["pr"]}.mp3'
        text = "。".join([item["summary"], *item["details"]])
        await edge_tts.Communicate(text=text, voice=VOICE, rate=RATE).save(str(path))

        seconds = duration_seconds(path)
        meta[str(item["pr"])] = {
            "seconds": round(seconds, 3),
            "frames": max(180, math.ceil((seconds + 1.2) * FPS)),
        }

    META_FILE.write_text(
        json.dumps(meta, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    asyncio.run(main())
