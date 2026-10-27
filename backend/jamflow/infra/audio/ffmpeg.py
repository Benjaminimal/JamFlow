import asyncio

_TIMEOUT_SECONDS = 60


class FFmpegError(Exception):
    def __init__(
        self,
        message: str,
        *,
        stderr: bytes = b"",
        return_code: int | None = None,
    ) -> None:
        super().__init__(message)
        self.stderr = stderr
        self.return_code = return_code


class FFmpegTimeout(FFmpegError):
    pass


async def clip(*, input: str, output: str, start: int, end: int) -> None:
    """Extract an audio clip from input and write it to output.

    :param input: Input media URL or file path. Remove URLs should supports range requests for efficient seeking.
    :param output: File path where the clipped audio should be written.
    :param start: Start position in milliseconds.
    :param end: End position in milliseconds.

    :raises FFmpegError: If FFmpeg fails to create the clip.
    :raises FFmpegTimeout: If FFmpeg does not complete within the configured timeout.
    """
    start_seconds = start / 1000
    clip_duration_seconds = (end - start) / 1000

    await _run(
        [
            "-ss",
            str(start_seconds),
            "-i",
            input,
            "-t",
            str(clip_duration_seconds),
            "-c",
            "copy",
            output,
        ]
    )


async def _run(ffmpeg_args: list[str]) -> None:
    process = await asyncio.create_subprocess_exec(
        "ffmpeg",
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        *ffmpeg_args,
        stderr=asyncio.subprocess.PIPE,
    )

    try:
        try:
            _, stderr = await asyncio.wait_for(process.communicate(), _TIMEOUT_SECONDS)
        except TimeoutError as exc:
            raise FFmpegTimeout(
                f"ffmpeg timed out after {_TIMEOUT_SECONDS} seconds"
            ) from exc

        if process.returncode != 0:
            raise FFmpegError(
                "ffmpeg invocation failed" + str(stderr),
                stderr=stderr,
                return_code=process.returncode,
            )
    finally:
        if process.returncode is None:
            process.kill()
            await process.wait()
