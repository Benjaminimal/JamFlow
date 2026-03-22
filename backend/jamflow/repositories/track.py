from jamflow.models import Track
from jamflow.repositories.base import SQLModelBaseRepository


class TrackRepository(SQLModelBaseRepository[Track]):
    model_class = Track
