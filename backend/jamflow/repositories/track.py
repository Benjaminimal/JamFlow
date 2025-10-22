import functools
from types import SimpleNamespace

from jamflow.models.track import Track

from . import primitives
from .types import TrackRepository

track_repository: TrackRepository = SimpleNamespace(
    get_by_id=functools.partial(
        primitives.get_by_id,
        model_class=Track,
    ),
    list=functools.partial(
        primitives.list,
        model_class=Track,
    ),
    create=primitives.create,
)
