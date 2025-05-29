import pytest
from pytest_mock import MockerFixture


@pytest.fixture
def mock_db_session(mocker: MockerFixture):
    session = mocker.AsyncMock()
    session.add = mocker.Mock()  # Explicitly mock `add` as a synchronous method
    return session
