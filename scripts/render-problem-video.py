#!/usr/bin/env python3
"""Render the PyanThit presentation opener from generated stills and narration."""

from __future__ import annotations

import math
import shutil
import struct
import subprocess
import tempfile
import wave
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PRESENTATION = ROOT / "public" / "presentation"
OUTPUT = PRESENTATION / "pyanthit-problem-story.mp4"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
SAMPLE_RATE = 48_000
DURATION = 55


def render_score(path: Path) -> None:
    """Create a restrained, original cinematic underscore without extra dependencies."""
    chord_progression = (
        (110.00, 130.81, 164.81),
        (98.00, 123.47, 146.83),
        (87.31, 110.00, 130.81),
        (98.00, 123.47, 164.81),
    )

    with wave.open(str(path), "w") as output:
        output.setparams((2, 2, SAMPLE_RATE, DURATION * SAMPLE_RATE, "NONE", "not compressed"))
        for frame in range(DURATION * SAMPLE_RATE):
            time = frame / SAMPLE_RATE
            chord = chord_progression[min(int(time // 13), 3)]
            fade_in = min(time / 3, 1)
            fade_out = min((DURATION - time) / 3, 1)
            envelope = fade_in * fade_out
            pad = sum(
                math.sin(2 * math.pi * frequency * time + index * 0.35)
                for index, frequency in enumerate(chord)
            ) / len(chord)
            pulse_envelope = max(0, 1 - ((time * 2) % 1) * 4)
            pulse = math.sin(2 * math.pi * 55 * time) * pulse_envelope
            shimmer = math.sin(2 * math.pi * 329.63 * time) * (0.04 if time > 48 else 0)
            sample = max(-1, min(1, envelope * (0.16 * pad + 0.045 * pulse + shimmer)))
            packed = struct.pack("<hh", int(sample * 32767), int(sample * 32767))
            output.writeframesraw(packed)


def draw_text(
    text: str,
    start: float,
    end: float,
    *,
    y: str = "h*0.73",
    size: int = 54,
    font: str = FONT_BOLD,
) -> str:
    return (
        f"drawtext=fontfile='{font}':text='{text}':"
        f"fontcolor=white:fontsize={size}:x=(w-text_w)/2:y={y}:"
        "box=1:boxcolor=0x071b14@0.72:boxborderw=22:"
        f"enable='between(t,{start},{end})'"
    )


def render_video(score: Path) -> None:
    stills = [PRESENTATION / "stills" / f"problem-{number:02}.jpg" for number in range(1, 5)]
    narration = PRESENTATION / "audio" / "narration.mp3"
    required = [*stills, narration, ROOT / "public" / "pyanthit-icon.png"]
    missing = [str(path) for path in required if not path.exists()]
    if missing:
        raise FileNotFoundError(f"Missing render inputs: {', '.join(missing)}")

    command = ["ffmpeg", "-hide_banner", "-loglevel", "warning", "-y"]
    for still in stills:
        command.extend(["-loop", "1", "-t", "13", "-i", str(still)])
    command.extend(
        [
            "-f",
            "lavfi",
            "-t",
            "7",
            "-i",
            "color=c=0x071b14:s=1920x1080:r=30",
            "-loop",
            "1",
            "-t",
            "7",
            "-i",
            str(ROOT / "public" / "pyanthit-icon.png"),
            "-i",
            str(narration),
            "-i",
            str(score),
        ]
    )

    filters: list[str] = []
    pans = (
        ("iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)"),
        ("iw/2-(iw/zoom/2)+40", "ih/2-(ih/zoom/2)"),
        ("iw/2-(iw/zoom/2)-35", "ih/2-(ih/zoom/2)"),
        ("iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)+25"),
    )
    for index, (x, y) in enumerate(pans):
        filters.append(
            f"[{index}:v]scale=1920:1280,crop=1920:1080,"
            f"zoompan=z='min(zoom+0.000075,1.03)':x='{x}':y='{y}':"
            "d=390:s=1920x1080:fps=30,"
            "eq=contrast=1.04:saturation=0.93,format=yuv420p"
            f"[scene{index}]"
        )

    filters.extend(
        [
            "[4:v]format=yuv420p[finalbg]",
            "[5:v]scale=168:168,format=rgba[logo]",
            "[finalbg][logo]overlay=(W-w)/2:(H-h)/2-105[final]",
            "[scene0][scene1]xfade=transition=fade:duration=1:offset=12[x1]",
            "[x1][scene2]xfade=transition=fade:duration=1:offset=24[x2]",
            "[x2][scene3]xfade=transition=fade:duration=1:offset=36[x3]",
            "[x3][final]xfade=transition=fadeblack:duration=1:offset=48[story]",
        ]
    )

    text_filters = [
        draw_text("A PHONE SHE COULD FINALLY AFFORD.", 1.0, 6.2),
        draw_text("PAY FIRST.", 12.4, 17.6),
        draw_text("NO ESCROW.  NO EVIDENCE.", 18.0, 23.5),
        draw_text("THE PHONE DOES NOT WORK.", 25.0, 31.8),
        draw_text("THE SELLER DISAPPEARS.", 36.7, 42.5),
        draw_text("WHO PROTECTS THE BUYER?", 43.0, 48.2),
        draw_text("THERE IS A SAFER WAY.", 49.3, 54.8, y="h*0.59", size=62),
        draw_text(
            "NOW, LET US FIX THIS WITH PYANTHIT.",
            50.3,
            54.8,
            y="h*0.72",
            size=30,
            font=FONT_REGULAR,
        ),
    ]
    filters.append(f"[story]{','.join(text_filters)},fade=t=out:st=54.4:d=0.6[vout]")
    filters.extend(
        [
            "[6:a]adelay=700|700,volume=1.35[narration]",
            "[7:a]volume=0.42,afade=t=in:st=0:d=2,afade=t=out:st=52:d=3[score]",
            "[narration][score]amix=inputs=2:duration=longest:normalize=0,"
            "loudnorm=I=-16:TP=-1.5:LRA=9[aout]",
        ]
    )

    command.extend(
        [
            "-filter_complex",
            ";".join(filters),
            "-map",
            "[vout]",
            "-map",
            "[aout]",
            "-c:v",
            "libx264",
            "-preset",
            "slow",
            "-crf",
            "19",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-movflags",
            "+faststart",
            "-t",
            str(DURATION),
            str(OUTPUT),
        ]
    )
    subprocess.run(command, check=True)


def main() -> None:
    if shutil.which("ffmpeg") is None:
        raise RuntimeError("ffmpeg is required to render the presentation video")
    with tempfile.TemporaryDirectory(prefix="pyanthit-video-") as temp_dir:
        score = Path(temp_dir) / "score.wav"
        render_score(score)
        render_video(score)
    print(f"Rendered {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
