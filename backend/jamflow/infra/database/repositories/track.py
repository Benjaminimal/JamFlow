from jamflow.infra.database.repositories import SQLModelBaseRepository
from jamflow.recordings.models import Track


class SQLModelTrackRepository(SQLModelBaseRepository[Track]):
    model_class = Track
