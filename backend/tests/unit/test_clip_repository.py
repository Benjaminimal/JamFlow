import uuid
from datetime import date

import pytest
from sqlmodel.ext.asyncio.session import AsyncSession

from jamflow.core.models import AudioFileFormat
from jamflow.recordings.models import Clip, Track
from jamflow.recordings.repositories import ClipRepository

pytestmark = [pytest.mark.asyncio]


@pytest.fixture
async def repo(sqli_session: AsyncSession) -> ClipRepository:
    return ClipRepository(sqli_session)


async def save_obj[M](sqli_session: AsyncSession, obj: M) -> M:
    sqli_session.add(obj)
    await sqli_session.flush()
    return obj


@pytest.fixture
async def track_1(sqli_session: AsyncSession) -> Track:
    return await save_obj(
        sqli_session,
        Track(
            id=uuid.uuid4(),
            title="Track 1",
            duration=2400,
            format=AudioFileFormat.MP3,
            size=1234,
            path="path/to/track.mp3",
            recorded_date=date.today(),
        ),
    )


@pytest.fixture
async def clip_1(sqli_session: AsyncSession, track_1: Track) -> Clip:
    return await save_obj(
        sqli_session,
        Clip(
            id=uuid.uuid4(),
            title="Test Clip 1",
            track_id=track_1.id,
            duration=900,
            start=1200,
            end=2100,
            format=AudioFileFormat.MP3,
            size=7750,
            path="path/to/clip1.mp3",
        ),
    )


@pytest.fixture
async def clip_2(sqli_session: AsyncSession, track_1: Track) -> Clip:
    return await save_obj(
        sqli_session,
        Clip(
            id=uuid.uuid4(),
            title="Test Clip 2",
            track_id=track_1.id,
            duration=900,
            start=1200,
            end=2100,
            format=AudioFileFormat.MP3,
            size=7750,
            path="path/to/clip2.mp3",
        ),
    )


@pytest.fixture
async def track_2(sqli_session: AsyncSession) -> Track:
    return await save_obj(
        sqli_session,
        Track(
            id=uuid.uuid4(),
            title="Track 2",
            duration=3700,
            format=AudioFileFormat.OGG,
            size=5678,
            path="path/to/track.ogg",
            recorded_date=date.today(),
        ),
    )


@pytest.fixture
async def clip_3(
    sqli_session: AsyncSession,
    track_2: Track,
) -> Clip:
    return await save_obj(
        sqli_session,
        Clip(
            id=uuid.uuid4(),
            title="Test Clip 3",
            track_id=track_2.id,
            duration=900,
            start=500,
            end=1400,
            format=AudioFileFormat.OGG,
            size=7800,
            path="path/to/clip2.mp3",
        ),
    )


async def test_list_by_track_id__returns_clips_scoped_by_track(
    repo: ClipRepository,
    track_1: Track,
    clip_1: Clip,
    clip_2: Clip,
    clip_3: Clip,  # noqa: ARG001
):
    clips = await repo.list_by_track_id(track_1.id)

    assert len(clips) == 2
    clip_ids = [c.id for c in clips]
    assert clip_1.id in clip_ids
    assert clip_2.id in clip_ids


async def test_list_by_track_id__returns_clips_ordered_by_created_at_desc(
    repo: ClipRepository,
    track_1: Track,
    clip_1: Clip,  # noqa: ARG001
    clip_2: Clip,  # noqa: ARG001
):
    clips = await repo.list_by_track_id(track_1.id)

    assert len(clips) == 2
    assert clips[0].created_at > clips[1].created_at


async def test_list_by_track_id__without_clips_return_nothing(
    repo: ClipRepository,
    track_1: Track,
):
    clips = await repo.list_by_track_id(track_1.id)

    assert len(clips) == 0


async def test_list_by_track_id__for_non_exising_track_returns_nothing(
    repo: ClipRepository,
):
    clips = await repo.list_by_track_id(uuid.uuid4())

    assert len(clips) == 0
