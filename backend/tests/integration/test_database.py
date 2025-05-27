import uuid

from sqlmodel import text
from sqlmodel.ext.asyncio.session import AsyncSession

from jamflow.models.track import Track


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


async def test_set_uuid_before_save(db_session: AsyncSession):
    id_ = uuid.uuid4()
    track = Track(
        id=id_,
        title="Test Track",
        duration=3000,
        format="MP3",
        size=12345,
        path="/some/path.mp3",
    )
    db_session.add(track)
    await db_session.commit()
    await db_session.refresh(track)
    assert track.id == id_, "Track ID was not set before saving"
