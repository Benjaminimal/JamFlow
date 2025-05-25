import uuid

from jamflow.utils import timezone_now


def generate_file_path(extension: str) -> str:
    """
    Generate a path including the file name for storing files in a structured
    format based on the current time.
    """
    now = timezone_now()

    timestamp = now.strftime("%Y%m%d%H%M%S")
    file_name = f"{timestamp}_{uuid.uuid4().hex}.{extension}"

    path = "/".join(
        (
            now.strftime("%Y"),
            now.strftime("%m"),
            file_name,
        )
    )

    return path
