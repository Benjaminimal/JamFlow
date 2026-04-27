from sqlmodel import text
from sqlmodel.ext.asyncio.session import AsyncSession


async def test_rollbacks_between_functions_ping(pg_session: AsyncSession):
    # Check if the table does not exist
    result = await pg_session.exec(  # ty: ignore[no-matching-overload]
        text(
            "SELECT 1 FROM information_schema.tables WHERE table_name = 'isolation_test'"
        )
    )
    table_exists = result.first()

    assert not table_exists, "Table 'isolation_test' still exists"

    # Create the table
    await pg_session.exec(  # ty: ignore[no-matching-overload]
        text("CREATE TABLE isolation_test (id INTEGER PRIMARY KEY)"),
    )
    await pg_session.commit()

    # Check if the table exists
    result = await pg_session.exec(  # ty: ignore[no-matching-overload]
        text(
            "SELECT 1 FROM information_schema.tables WHERE table_name = 'isolation_test'"
        )
    )
    table_exists = result.first()

    assert table_exists, "Table 'isolation_test' was not created"


async def test_rollbacks_between_functions_pong(pg_session: AsyncSession):
    # Check if the table does not exist
    result = await pg_session.exec(  # ty: ignore[no-matching-overload]
        text(
            "SELECT 1 FROM information_schema.tables WHERE table_name = 'isolation_test'"
        )
    )
    table_exists = result.first()

    assert not table_exists, "Table 'isolation_test' still exists"

    # Create the table
    await pg_session.exec(  # ty: ignore[no-matching-overload]
        text("CREATE TABLE isolation_test (id INTEGER PRIMARY KEY)"),
    )
    await pg_session.commit()

    # Check if the table exists
    result = await pg_session.exec(  # ty: ignore[no-matching-overload]
        text(
            "SELECT 1 FROM information_schema.tables WHERE table_name = 'isolation_test'"
        )
    )
    table_exists = result.first()

    assert table_exists, "Table 'isolation_test' was not created"
