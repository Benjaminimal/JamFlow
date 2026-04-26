import uuid
from io import BytesIO
from types import TracebackType
from typing import BinaryIO, Literal, Self, Sequence

from jamflow.core.exceptions import StorageError
from jamflow.infra.database.models import BaseSQLModel
from jamflow.recordings.models import AudioFileFormat, Clip, Track


class FakeBaseRepository[M: BaseSQLModel]:
    def __init__(self):
        self.models: dict[uuid.UUID, M] = {}

    async def create(self, model: M) -> M:
        self.models[model.id] = model
        return model

    async def get_by_id(self, id: uuid.UUID) -> M | None:
        return self.models.get(id, None)

    async def list_all(self) -> Sequence[M]:
        return list(self.models.values())

    async def list_by_ids(self, ids: list[uuid.UUID]) -> Sequence[M]:
        return [m for (i, m) in self.models.items() if i in ids]


class FakeTrackRepository(FakeBaseRepository[Track]):
    pass


class FakeClipRepository(FakeBaseRepository[Clip]):
    async def list_by_track_id(self, track_id: uuid.UUID) -> Sequence[Clip]:
        return [c for c in self.models.values() if c.track_id == track_id]


class FakeAudioProcessor:
    def __init__(
        self,
        *,
        file_format: AudioFileFormat = AudioFileFormat.MP3,
        duration: int = 42_000,
        size: int = 1024,
        clip_bytes: bytes = b"default bytes",
    ):
        self.file_format = file_format
        self.duration = duration
        self.size = size
        self.clip_bytes = clip_bytes
        self._fail_on = {}

    def get_format(self, file: BinaryIO) -> AudioFileFormat:
        self._maybe_fail("get_format")
        return self.file_format

    def get_duration(self, file: BinaryIO, file_format: AudioFileFormat) -> int:
        self._maybe_fail("get_duration")
        return self.duration

    def get_size(self, file: BinaryIO) -> int:
        self._maybe_fail("get_size")
        return self.size

    def clip(
        self, file: BinaryIO, file_format: AudioFileFormat, *, start: int, end: int
    ) -> BinaryIO:
        self._maybe_fail("clip")
        return BytesIO(self.clip_bytes)

    def fail_on(
        self,
        method_name: Literal["get_format", "get_duration", "get_size", "clip"],
        exc: Exception | None = None,
    ) -> Self:
        self._fail_on[method_name] = exc or Exception(f"Failed {method_name}")
        return self

    def _maybe_fail(
        self,
        method_name: Literal["get_format", "get_duration", "get_size", "clip"],
    ) -> None:
        if exc := self._fail_on.get(method_name):
            raise exc


class FakeAudioStorage:
    def __init__(self):
        self.files: dict[str, BinaryIO] = {}
        self._checkpoint: set[str] = set()

    async def __aenter__(self) -> Self:
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc_value: BaseException | None,
        traceback: TracebackType | None,
    ) -> None:
        pass

    async def store_file(
        self,
        file: bytes | BinaryIO,
        *,
        path: str,
        content_type: str,
    ) -> None:
        if isinstance(file, bytes):
            file = BytesIO(file)
        self.files[path] = file

    async def get_file(self, path: str) -> BinaryIO:
        if path not in self.files:
            raise StorageError(f"Unable to retrieve file: Invalid {path=}")

        return self.files[path]

    async def generate_expiring_url(self, path: str, expiration: int = 3600) -> str:
        return f"http://bogus.url/{path}?expiration={expiration}"

    def checkpoint(self) -> Self:
        """
        Store the current state of files in the storage for to exclude them from a later `new_files` call.
        """
        self._checkpoint = set(self.files.keys())
        return self

    def new_files(self) -> set[str]:
        """
        Return the paths of files stored since the most recent call to `checkpoint`.
        """
        return set(self.files.keys()) - self._checkpoint
