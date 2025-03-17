import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import text


@pytest.mark.integration
@pytest.mark.asyncio
async def test_rollbacks_between_functions_ping(db_session: AsyncSession):
    # Check if the table does not exist
    result = await db_session.execute(
        text(
            "SELECT 1 FROM information_schema.tables WHERE table_name = 'isolation_test'"
        )
    )
    table_exists = result.scalar()

    assert not table_exists, "Table 'isolation_test' still exists"

    # Create the table
    await db_session.execute(
        text("CREATE TABLE isolation_test (id INTEGER PRIMARY KEY)")
    )
    await db_session.commit()

    # Check if the table exists
    result = await db_session.execute(
        text(
            "SELECT 1 FROM information_schema.tables WHERE table_name = 'isolation_test'"
        )
    )
    table_exists = result.scalar()

    assert table_exists, "Table 'isolation_test' was not created"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_rollbacks_between_functions_pong(db_session: AsyncSession):
    # Check if the table does not exist
    result = await db_session.execute(
        text(
            "SELECT 1 FROM information_schema.tables WHERE table_name = 'isolation_test'"
        )
    )
    table_exists = result.scalar()

    assert not table_exists, "Table 'isolation_test' still exists"

    # Create the table
    await db_session.execute(
        text("CREATE TABLE isolation_test (id INTEGER PRIMARY KEY)")
    )
    await db_session.commit()

    # Check if the table exists
    result = await db_session.execute(
        text(
            "SELECT 1 FROM information_schema.tables WHERE table_name = 'isolation_test'"
        )
    )
    table_exists = result.scalar()

    assert table_exists, "Table 'isolation_test' was not created"
