#!/usr/bin/env python3
"""Add neural narration and a cinematic score to the recorded PyanThit demo."""

from __future__ import annotations

import asyncio
import json
import math
import shutil
import struct
import subprocess
import tempfile
import wave
from pathlib import Path

import edge_tts


ROOT = Path(__file__).resolve().parents[1]
RECORDING_DIR = ROOT / ".demo-recording"
PRESENTATION = ROOT / "public" / "presentation"
FULL_DEMO = PRESENTATION / "pyanthit-full-product-demo.mp4"
HACKATHON_DEMO = PRESENTATION / "pyanthit-hackathon-presentation.mp4"
PROBLEM_STORY = PRESENTATION / "pyanthit-problem-story.mp4"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
SAMPLE_RATE = 48_000
INTRO_DURATION = 5


def run(*command: str) -> None:
    subprocess.run(command, check=True)


def duration(path: Path) -> float:
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


def timestamp(seconds: float) -> str:
    milliseconds = round(seconds * 1000)
    hours, milliseconds = divmod(milliseconds, 3_600_000)
    minutes, milliseconds = divmod(milliseconds, 60_000)
    whole_seconds, milliseconds = divmod(milliseconds, 1000)
    return f"{hours:02}:{minutes:02}:{whole_seconds:02}.{milliseconds:03}"


def write_captions(chapters: list[dict], end: float) -> None:
    lines = ["WEBVTT", ""]
    for index, chapter in enumerate(chapters):
        cue_start = INTRO_DURATION + chapter["start"] + 0.25
        next_start = chapters[index + 1]["start"] if index + 1 < len(chapters) else end
        cue_end = INTRO_DURATION + next_start - 0.35
        lines.extend(
            [
                f"{timestamp(cue_start)} --> {timestamp(cue_end)}",
                chapter["narration"],
                "",
            ]
        )
    (PRESENTATION / "full-product-demo-captions.vtt").write_text("\n".join(lines), encoding="utf-8")


def render_score(path: Path, total_duration: int) -> None:
    chords = (
        (98.00, 123.47, 146.83),
        (110.00, 130.81, 164.81),
        (130.81, 164.81, 196.00),
        (123.47, 146.83, 185.00),
    )
    with wave.open(str(path), "w") as output:
        output.setparams((2, 2, SAMPLE_RATE, total_duration * SAMPLE_RATE, "NONE", "not compressed"))
        for frame in range(total_duration * SAMPLE_RATE):
            time = frame / SAMPLE_RATE
            chord = chords[int(time // 16) % len(chords)]
            fade = min(time / 2, 1, (total_duration - time) / 3)
            pad = sum(
                math.sin(2 * math.pi * frequency * time + index * 0.27)
                for index, frequency in enumerate(chord)
            ) / len(chord)
            pulse_envelope = max(0, 1 - ((time * 2) % 1) * 5)
            pulse = math.sin(2 * math.pi * 49 * time) * pulse_envelope
            sparkle = math.sin(2 * math.pi * chord[-1] * 2 * time) * 0.012
            sample = max(-1, min(1, fade * (0.11 * pad + 0.025 * pulse + sparkle)))
            packed = struct.pack("<hh", int(sample * 32767), int(sample * 32767))
            output.writeframesraw(packed)


async def generate_narration(chapters: list[dict], target: Path) -> list[Path]:
    clips = []
    for index, chapter in enumerate(chapters):
        clip = target / f"chapter-{index:02}.mp3"
        communicate = edge_tts.Communicate(
            chapter["narration"],
            voice="en-SG-LunaNeural",
            rate="+12%",
            pitch="-2Hz",
        )
        await communicate.save(str(clip))
        clips.append(clip)
    return clips


def render_full_demo(
    recording: Path,
    chapters: list[dict],
    end: float,
    clips: list[Path],
    score: Path,
) -> None:
    command = ["ffmpeg", "-hide_banner", "-loglevel", "warning", "-y", "-i", str(recording)]
    command.extend(
        [
            "-f",
            "lavfi",
            "-t",
            str(INTRO_DURATION),
            "-i",
            "color=c=0x071b14:s=1920x1080:r=30",
            "-loop",
            "1",
            "-t",
            str(INTRO_DURATION),
            "-i",
            str(ROOT / "public" / "pyanthit-icon.png"),
        ]
    )
    for clip in clips:
        command.extend(["-i", str(clip)])
    score_index = 3 + len(clips)
    command.extend(["-i", str(score)])

    filters = [
        "[0:v]scale=1728:1080:force_original_aspect_ratio=decrease,"
        "pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x071b14,fps=30,format=yuv420p[demo]",
        "[2:v]scale=180:180,format=rgba[logo]",
        "[1:v][logo]overlay=(W-w)/2:(H-h)/2-150[intro-logo]",
        f"[intro-logo]drawtext=fontfile='{FONT_BOLD}':text='PYANTHIT':"
        "fontcolor=white:fontsize=68:x=(w-text_w)/2:y=h*0.59,"
        f"drawtext=fontfile='{FONT_REGULAR}':text='FULL PRODUCT WALKTHROUGH':"
        "fontcolor=0xd8f25b:fontsize=25:x=(w-text_w)/2:y=h*0.69,"
        "fade=t=in:st=0:d=0.6,fade=t=out:st=4.4:d=0.6[intro]",
        "[intro][demo]concat=n=2:v=1:a=0[vout]",
    ]

    voice_labels = []
    for index, (chapter, clip) in enumerate(zip(chapters, clips, strict=True)):
        available = (
            (chapters[index + 1]["start"] if index + 1 < len(chapters) else end)
            - chapter["start"]
            - 0.55
        )
        clip_duration = duration(clip)
        tempo = max(1.0, clip_duration / max(available, 0.1))
        delay = round((INTRO_DURATION + chapter["start"] + 0.2) * 1000)
        input_index = 3 + index
        label = f"voice{index}"
        filters.append(
            f"[{input_index}:a]atempo={tempo:.5f},adelay={delay}|{delay},volume=1.28[{label}]"
        )
        voice_labels.append(f"[{label}]")

    total_duration = INTRO_DURATION + duration(recording)
    filters.append(
        f"[{score_index}:a]volume=0.30,afade=t=in:st=0:d=2,"
        f"afade=t=out:st={total_duration - 3:.2f}:d=3[score]"
    )
    filters.append(
        f"{''.join(voice_labels)}[score]amix=inputs={len(voice_labels) + 1}:"
        "duration=longest:normalize=0,"
        "loudnorm=I=-16:TP=-1.5:LRA=9[aout]"
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
            "20",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-movflags",
            "+faststart",
            "-t",
            f"{total_duration:.3f}",
            str(FULL_DEMO),
        ]
    )
    run(*command)


def render_hackathon_cut() -> None:
    run(
        "ffmpeg",
        "-hide_banner",
        "-loglevel",
        "warning",
        "-y",
        "-i",
        str(PROBLEM_STORY),
        "-i",
        str(FULL_DEMO),
        "-filter_complex",
        "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]",
        "-map",
        "[v]",
        "-map",
        "[a]",
        "-c:v",
        "libx264",
        "-preset",
        "slow",
        "-crf",
        "20",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-movflags",
        "+faststart",
        str(HACKATHON_DEMO),
    )


def main() -> None:
    if shutil.which("ffmpeg") is None:
        raise RuntimeError("ffmpeg is required")
    timeline = json.loads((RECORDING_DIR / "timeline.json").read_text(encoding="utf-8"))
    chapters = timeline[:-1]
    end = timeline[-1]["end"]
    recording_path = Path((RECORDING_DIR / "recording-path.txt").read_text().strip())
    if not recording_path.exists():
        raise FileNotFoundError(recording_path)

    write_captions(chapters, end)
    total_duration = math.ceil(INTRO_DURATION + duration(recording_path))
    with tempfile.TemporaryDirectory(prefix="pyanthit-full-demo-") as temp:
        temp_dir = Path(temp)
        clips = asyncio.run(generate_narration(chapters, temp_dir))
        score = temp_dir / "score.wav"
        render_score(score, total_duration)
        render_full_demo(recording_path, chapters, end, clips, score)
    render_hackathon_cut()
    print(f"Rendered {FULL_DEMO.relative_to(ROOT)}")
    print(f"Rendered {HACKATHON_DEMO.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
