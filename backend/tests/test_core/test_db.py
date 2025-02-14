import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import text


@pytest.mark.asyncio
async def test_database_name_ends_with_test(session: AsyncSession):
    # Get the current database name
    result = await session.execute(text("SELECT current_database()"))
    db_name = result.scalar()

    # Ensure the database name ends with "_test"
    assert db_name, "Database name is empty"
    assert db_name.endswith("_test"), (
        f"Database name '{db_name}' does not end with '_test'"
    )


@pytest.mark.dependency(depends=["test_database_name_ends_with_test"])
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
