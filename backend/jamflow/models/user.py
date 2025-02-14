import uuid

from sqlmodel import Field, SQLModel  # pyright: ignore [reportUnknownVariableType]


class User(SQLModel, table=True):
    id: uuid.UUID = Field(primary_key=True, default_factory=uuid.uuid4)
    username: str

    def __repr__(self):
        return f"<User {self.username}>"
