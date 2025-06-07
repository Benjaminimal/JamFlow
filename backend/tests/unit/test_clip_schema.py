import uuid

import pytest

from jamflow.schemas.clip import ClipCreateDto


@pytest.fixture
def track_id() -> uuid.UUID:
    return uuid.UUID("123e4567-e89b-42d3-a456-426614174000", version=4)


def test_clip_create_dto_constructs_sucessfully(track_id: uuid.UUID):
    dto = ClipCreateDto(
        title="Test Clip",
        track_id=track_id,
        start=1200,
        end=2100,
    )
    assert dto.title == "Test Clip"
    assert str(dto.track_id) == "123e4567-e89b-42d3-a456-426614174000"
    assert dto.start == 1200
    assert dto.end == 2100


@pytest.mark.parametrize("start, end", [(1200, 1200), (2100, 1200)])
def test_clip_create_dto_with_overlapping_times_raises_error(
    start,
    end,
    track_id: uuid.UUID,
):
    with pytest.raises(ValueError, match="Start must be less than end"):
        ClipCreateDto(
            title="Test Clip",
            track_id=track_id,
            start=start,
            end=end,
        )


def test_clip_create_dto_with_negative_start_raises_error(track_id: uuid.UUID):
    with pytest.raises(
        ValueError, match=r"start\s+Input should be greater than or equal to 0"
    ):
        ClipCreateDto(
            title="Test Clip",
            track_id=track_id,
            start=-1,
            end=2100,
        )


def test_clip_create_dto_with_negative_end_raises_error(track_id: uuid.UUID):
    with pytest.raises(
        ValueError, match=r"end\s+Input should be greater than or equal to 0"
    ):
        ClipCreateDto(
            title="Test Clip",
            track_id=track_id,
            start=1200,
            end=-1,
        )


@pytest.mark.parametrize(
    "title,expected_message",
    [
        ("", "String should have at least 1 character"),
        (" ", "String should have at least 1 character"),
        ("\n", "String should have at least 1 character"),
        ("\t", "String should have at least 1 character"),
        ("\r", "String should have at least 1 character"),
        ("\f", "String should have at least 1 character"),
        ("\v", "String should have at least 1 character"),
        ("A" * 256, "String should have at most 255 characters"),
    ],
)
def test_clip_create_dto_with_empty_title_raises_error(
    title, expected_message, track_id: uuid.UUID
):
    with pytest.raises(ValueError, match=expected_message):
        ClipCreateDto(
            title=title,
            track_id=track_id,
            start=1200,
            end=2100,
        )
