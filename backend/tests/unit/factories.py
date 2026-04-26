from polyfactory.decorators import post_generated
from polyfactory.factories.pydantic_factory import ModelFactory

from jamflow.recordings.models import AudioFileFormat, Clip, Track
from jamflow.recordings.schemas import ClipCreateDto


class ClipCreateDtoFactory(ModelFactory[ClipCreateDto]):
    start = 1_000

    @post_generated
    @classmethod
    def end(cls, start: int) -> int:
        return start + 1_000


class TrackFactory(ModelFactory[Track]):
    duration = lambda: TrackFactory.__faker__.pyint(min_value=60_000, max_value=120_000)  # noqa: E731

    @post_generated
    @classmethod
    def path(cls, format: AudioFileFormat) -> str:
        return cls.__faker__.file_path(depth=5, extension=format)


class ClipFactory(ModelFactory[Clip]):
    start = 1_000

    @post_generated
    @classmethod
    def end(cls, start: int, duration: int) -> int:
        return start + duration

    @post_generated
    @classmethod
    def path(cls, format: AudioFileFormat) -> str:
        return cls.__faker__.file_path(depth=5, extension=format)
