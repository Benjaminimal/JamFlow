from collections.abc import AsyncGenerator

from sqlalchemy import NullPool
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from jamflow.core.config import settings

pool_args = {"poolclass": NullPool} if settings.TESTING else {}

engine = create_async_engine(
    str(settings.SQLALCHEMY_DATABASE_URI),
    future=True,
    echo=settings.DEBUG,
    **pool_args,
)
session_factory = async_sessionmaker(engine, expire_on_commit=False)


async def get_session() -> AsyncGenerator[AsyncSession]:
    async with session_factory() as session:
        yield session
