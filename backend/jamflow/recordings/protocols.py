import uuid
from types import TracebackType
from typing import BinaryIO, Protocol, Self, Sequence

from jamflow.core.protocols import Repository
from jamflow.infra.audio import AudioMimeType
from jamflow.recordings.models import AudioFileFormat, Clip, Track


class TrackRepository(Repository[Track], Protocol): ...


class ClipRepository(Repository[Clip], Protocol):
    async def list_by_track_id(self, track_id: uuid.UUID) -> Sequence[Clip]: ...


class AudioProcessor(Protocol):
    def get_format(self, file: BinaryIO) -> AudioFileFormat: ...
    def get_duration(self, file: BinaryIO, file_format: AudioFileFormat) -> int: ...
    def get_size(self, file: BinaryIO) -> int: ...
    def get_mime_type(self, file_format: AudioFileFormat) -> AudioMimeType: ...
    def clip(
        self, file: BinaryIO, file_format: AudioFileFormat, *, start: int, end: int
    ) -> BinaryIO: ...


class AudioStorage(Protocol):
    """
    Storage service used to interact with remote file storage.

    Must be used as an async context manager on each call site:

    ```
    async with self.audio_storage as storage:
        await storage.store_file(...)
    ```

    :raises StorageError: if the storage can't be accessed.
    """

    async def __aenter__(self) -> Self: ...

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc_value: BaseException | None,
        traceback: TracebackType | None,
    ) -> None: ...

    async def store_file(
        self,
        file: bytes | BinaryIO,
        *,
        path: str,
        content_type: str,
    ) -> None:
        """
        Put a file into storage under a given path.

        :param path: The path where the file should be stored.
        :param file: The file data to be stored, as bytes or a file-like object.
        :raises StorageError: if the file could not be stored.
        """
        ...

    async def get_file(self, path: str) -> BinaryIO:
        """
        Get a file from storage.

        :param path: The path to the file in storage.
        :raises StorageError: if the file could not be retrieved.
        """
        ...

    async def generate_expiring_url(self, path: str, expiration: int = 3600) -> str:
        """
        Generate an URL for accessing a file that will expire after some time.

        :param path: The path to the file in storage.
        :param expiration: Time in seconds for the presigned URL to remain valid.
                           Defaults to 3600 seconds (1 hour).
        :raises StorageError: if the URL could not be generated.
        """
        ...
