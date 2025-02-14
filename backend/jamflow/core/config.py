import importlib
import os

from pydantic import PostgresDsn, computed_field
from pydantic_settings import BaseSettings
from sqlalchemy.pool import Pool


class Settings(
    BaseSettings,
    env_file=os.getenv("ENV_FILE", "../.env"),
    env_ignore_empty=True,
    extra="ignore",
):
    PROJECT_NAME: str = "JamFlow"

    DEBUG: bool = False

    DB_HOST: str
    DB_PORT: int
    DB_NAME: str
    DB_USER: str
    DB_PASSWORD: str
    DB_POOL: str | None = None

    @computed_field
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> PostgresDsn:
        return PostgresDsn.build(
            scheme="postgresql+asyncpg",
            host=self.DB_HOST,
            port=self.DB_PORT,
            path=self.DB_NAME,
            username=self.DB_USER,
            password=self.DB_PASSWORD,
        )

    @computed_field
    @property
    def SQLALCHEMY_DATABASE_ROOT_URI(self) -> PostgresDsn:
        return PostgresDsn.build(
            scheme="postgresql+asyncpg",
            host=self.DB_HOST,
            port=self.DB_PORT,
            username=self.DB_USER,
            password=self.DB_PASSWORD,
        )

    @computed_field
    @property
    def DB_POOL_CLASS(self) -> Pool | None:
        if not self.DB_POOL:
            return None

        pool_module = importlib.import_module("sqlalchemy.pool")
        pool_class = getattr(pool_module, self.DB_POOL)
        return pool_class


settings = Settings()  # pyright: ignore [reportCallIssue]
