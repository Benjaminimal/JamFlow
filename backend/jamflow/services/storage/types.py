from types import TracebackType
from typing import BinaryIO, Protocol, Self


class StorageService(Protocol):
    """
    Storage service used to interact with remote file storage.

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

    async def purge(self) -> None:
        """
        Delete all files from storage.

        :raises StorageError: if the storage could not be purged.
        """
        ...

    async def generate_expiring_url(self, path: str, expiration: int = 3600) -> str:
        """
        Generate an URL for accessing a file that will expire after some time.

        param path: The path to the file in storage.
        :param expiration: Time in seconds for the presigned URL to remain valid.
                           Defaults to 3600 seconds (1 hour).
        :raises StorageError: if the URL could not be generated.
        """
        ...
