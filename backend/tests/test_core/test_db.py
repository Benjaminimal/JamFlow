import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from jamflow.models.user import User


@pytest.mark.asyncio
async def test_create_user(session: AsyncSession):
    existing_users = (await session.execute(select(User))).scalars().all()
    assert len(existing_users) == 0

    test_name = "test"
    session.add(User(username=test_name))
    await session.commit()

    existing_users = (await session.execute(select(User))).scalars().all()
    assert len(existing_users) == 1
    assert existing_users[0].username == test_name


@pytest.mark.asyncio
async def test_rollbacks_between_functions(session: AsyncSession):
    existing_users = (await session.execute(select(User))).scalars().all()
    assert len(existing_users) == 0
