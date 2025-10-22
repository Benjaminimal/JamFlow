import functools
from types import SimpleNamespace

from jamflow.models.clip import Clip

from .primitives import create, get_by_id, list
from .types import ClipRepository

clip_repository: ClipRepository = SimpleNamespace(
    get_by_id=functools.partial(get_by_id, Clip),
    list=functools.partial(list, Clip),
    create=create,
)
