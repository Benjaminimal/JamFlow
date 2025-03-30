import pytest
from sqlmodel import text
from sqlmodel.ext.asyncio.session import AsyncSession

pytestmark = pytest.mark.integration


async def test_rollbacks_between_functions_ping(db_session: AsyncSession):
    # Check if the table does not exist
    result = await db_session.exec(
        text(
            "SELECT 1 FROM information_schema.tables WHERE table_name = 'isolation_test'"
        )
    )
    table_exists = result.first()

    assert not table_exists, "Table 'isolation_test' still exists"

    # Create the table
    await db_session.exec(text("CREATE TABLE isolation_test (id INTEGER PRIMARY KEY)"))
    await db_session.commit()

    # Check if the table exists
    result = await db_session.exec(
        text(
            "SELECT 1 FROM information_schema.tables WHERE table_name = 'isolation_test'"
        )
    )
    table_exists = result.first()

    assert table_exists, "Table 'isolation_test' was not created"


async def test_rollbacks_between_functions_pong(db_session: AsyncSession):
    # Check if the table does not exist
    result = await db_session.exec(
        text(
            "SELECT 1 FROM information_schema.tables WHERE table_name = 'isolation_test'"
        )
    )
    table_exists = result.first()

    assert not table_exists, "Table 'isolation_test' still exists"

    # Create the table
    await db_session.exec(text("CREATE TABLE isolation_test (id INTEGER PRIMARY KEY)"))
    await db_session.commit()

    # Check if the table exists
    result = await db_session.exec(
        text(
            "SELECT 1 FROM information_schema.tables WHERE table_name = 'isolation_test'"
        )
    )
    table_exists = result.first()

    assert table_exists, "Table 'isolation_test' was not created"
