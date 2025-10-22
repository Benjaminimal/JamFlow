import functools
from types import SimpleNamespace

from jamflow.models.track import Track

from .primitives import create, get_by_id, list
from .types import TrackRepository

track_repository: TrackRepository = SimpleNamespace(
    get_by_id=functools.partial(get_by_id, Track),
    list=functools.partial(list, Track),
    create=create,
)
