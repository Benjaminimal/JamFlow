from polyfactory.decorators import post_generated
from polyfactory.factories.pydantic_factory import ModelFactory

from jamflow.recordings.models import AudioFileFormat, Track
from jamflow.recordings.schemas import ClipCreateDto


class ClipCreateDtoFactory(ModelFactory[ClipCreateDto]):
    start = 1_000

    @post_generated
    @classmethod
    def end(cls, start: int) -> int:
        return start + 1_000


class TrackFactory(ModelFactory[Track]):
    @post_generated
    @classmethod
    def path(cls, format: AudioFileFormat) -> str:
        return cls.__faker__.file_path(depth=5, extension=format)
