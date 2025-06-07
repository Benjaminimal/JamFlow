import uuid

from jamflow.utils import timezone_now


def generate_track_path(unique_id: uuid.UUID, extension: str) -> str:
    """
    Generate a path including the file name for storing track files in a structured
    format based on the current time.

    :raise ValueError: If the extension is empty.
    """
    if not extension:
        raise ValueError("Extension must not be empty")

    now = timezone_now()

    hex_digest = unique_id.hex
    file_name = f"{hex_digest}.{extension}"

    path = "/".join(
        (
            "tracks",
            now.strftime("%Y"),
            now.strftime("%m"),
            hex_digest,
            file_name,
        )
    )

    return path


def generate_clip_path(track_path: str, clip_id: uuid.UUID, extension: str) -> str:
    """
    Generate a path including the file name for storing clip files within the track's
    directory.

    :raise ValueError: If the extension is empty or if the track path does not contain
        a directory.
    """
    if not extension:
        raise ValueError("Extension must not be empty")

    file_name = f"{clip_id.hex}.{extension}"

    path_tokens = track_path.split("/")
    if len(path_tokens) < 2:
        raise ValueError("Track path must contain directories")

    path = "/".join(
        (
            *path_tokens[:-1],
            "clips",
            file_name,
        )
    )

    return path
