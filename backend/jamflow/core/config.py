from pydantic import PostgresDsn, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        # Use top level .env file (one level above ./backend/)
        env_file="../.env",
        env_ignore_empty=True,
        extra="ignore",
    )

    PROJECT_NAME: str

    DEBUG: bool = False
    TESTING: bool = False

    DB_HOST: str
    DB_PORT: int
    DB_NAME: str
    DB_USER: str
    DB_PASSWORD: str

    @computed_field
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> PostgresDsn:
        db_name = f"{self.DB_NAME}_test" if self.TESTING else self.DB_NAME
        return PostgresDsn.build(
            scheme="postgresql+asyncpg",
            host=self.DB_HOST,
            port=self.DB_PORT,
            path=db_name,
            username=self.DB_USER,
            password=self.DB_PASSWORD,
        )


settings = Settings()  # pyright: ignore [reportCallIssue]
