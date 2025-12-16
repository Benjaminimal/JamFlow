import functools
from types import SimpleNamespace

from sqlmodel.sql.expression import SelectOfScalar

from jamflow.models.clip import Clip
from jamflow.schemas.clip import ClipFilters

from . import primitives
from .types import ClipRepository


def clip_filters_hook(
    statement: SelectOfScalar[Clip], filters: ClipFilters
) -> SelectOfScalar[Clip]:
    if filters.track_id is not None:
        statement = statement.where(Clip.track_id == filters.track_id)
    return statement


clip_repository: ClipRepository = SimpleNamespace(
    get_by_id=functools.partial(
        primitives.get_by_id,
        model_class=Clip,
    ),
    list=functools.partial(
        primitives.list,
        model_class=Clip,
        filters_hook=clip_filters_hook,
    ),
    create=primitives.create,
)
