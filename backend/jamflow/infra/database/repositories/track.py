from jamflow.recordings.models import Track

from .base import SQLModelBaseRepository


class SQLModelTrackRepository(SQLModelBaseRepository[Track]):
    model_class = Track
