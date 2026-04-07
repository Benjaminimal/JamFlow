from jamflow.core.repositories import SQLModelBaseRepository
from jamflow.recordings.models import Track


class TrackRepository(SQLModelBaseRepository[Track]):
    model_class = Track
