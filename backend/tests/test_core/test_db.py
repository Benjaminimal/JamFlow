import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import text


@pytest.mark.dependency()
@pytest.mark.asyncio
async def test_rollbacks_between_functions_create_table(session: AsyncSession):
    # Create the table
    await session.execute(text("CREATE TABLE isolation_test (id INTEGER PRIMARY KEY)"))
    await session.commit()

    # Check if the table exists
    result = await session.execute(
        text(
            "SELECT 1 FROM information_schema.tables WHERE table_name = 'isolation_test'"
        )
    )
    table_exists = result.scalar()

    assert table_exists, "Table 'isolation_test' was not created"


@pytest.mark.dependency(depens=["test_table_creation"])
@pytest.mark.asyncio
async def test_rollbacks_between_functions_select_table(session: AsyncSession):
    # Check if the table does not exist
    result = await session.execute(
        text(
            "SELECT 1 FROM information_schema.tables WHERE table_name = 'isolation_test'"
        )
    )
    table_exists = result.scalar()

    assert not table_exists, "Table 'isolation_test' still exists"
