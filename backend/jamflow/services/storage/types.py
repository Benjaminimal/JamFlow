from types import TracebackType
from typing import IO, Protocol, Self


class StorageService(Protocol):
    """
    Storage service used to interact with remote file storage.

    :raises StorageException: if the storage can't be accessed.
    """

    async def __aenter__(self) -> Self: ...

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc_value: BaseException | None,
        traceback: TracebackType | None,
    ) -> None: ...

    async def store_file(self, path: str, file: bytes | IO[bytes]) -> None:
        """
        Put a file into storage under a given path.

        :param path: The path where the file should be stored.
        :param file: The file data to be stored, as bytes or a file-like object.
        :raises StorageException: if the file could not be stored.
        """
        ...
