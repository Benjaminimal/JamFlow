from pydantic import HttpUrl, PostgresDsn, computed_field
from pydantic_settings import BaseSettings


class Settings(
    BaseSettings,
    env_file="../.env",
    env_ignore_empty=True,
    extra="ignore",
):
    PROJECT_NAME: str = "JamFlow"

    DEBUG: bool = False

    LOG_LEVEL: str = "INFO"
    LOG_JSON: bool = True

    STORAGE_URL: HttpUrl
    STORAGE_ACCESS_KEY: str
    STORAGE_SECRET_KEY: str
    STORAGE_NAME_AUDIO: str

    DB_HOST: str
    DB_PORT: int
    DB_NAME: str
    DB_USER: str
    DB_PASSWORD: str
    DB_ROOT_NAME: str

    @computed_field  # type: ignore[prop-decorator]
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

    @computed_field  # type: ignore[prop-decorator]
    @property
    def SQLALCHEMY_DATABASE_ROOT_URI(self) -> PostgresDsn:
        return PostgresDsn.build(
            scheme="postgresql+asyncpg",
            host=self.DB_HOST,
            port=self.DB_PORT,
            path=self.DB_ROOT_NAME,
            username=self.DB_USER,
            password=self.DB_PASSWORD,
        )


settings = Settings()  # type: ignore[call-arg]
