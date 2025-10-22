import functools
from types import SimpleNamespace

from sqlmodel.sql.expression import SelectOfScalar

from jamflow.models.clip import Clip
from jamflow.schemas.clip import ClipFilters

from .primitives import create, get_by_id, list
from .types import ClipRepository


def clip_filters_hook(
    statement: SelectOfScalar[Clip], filters: ClipFilters
) -> SelectOfScalar[Clip]:
    if filters.track_id is not None:
        statement = statement.where(Clip.track_id == filters.track_id)
    return statement


clip_repository: ClipRepository = SimpleNamespace(
    get_by_id=functools.partial(get_by_id, Clip),
    list=functools.partial(list, Clip, filters_hook=clip_filters_hook),
    create=create,
)
