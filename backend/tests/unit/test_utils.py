from datetime import datetime

import pytest
from pytest_mock import MockerFixture

from jamflow.services.utils import generate_file_path


def test_generate_file_path_success(mocker: MockerFixture):
    mock_timezone_now = mocker.patch("jamflow.services.utils.timezone_now")
    mock_timezone_now.return_value = datetime(2023, 1, 1, 1, 1, 1)

    mock_uuid = mocker.patch("jamflow.services.utils.uuid.uuid4")
    mock_uuid.return_value.hex = "1234567890abcdef1234567890abcdef"

    extension = "txt"
    path = generate_file_path(extension)

    assert path == "2023/01/20230101010101_1234567890abcdef1234567890abcdef.txt"


# TODO: implement empty extension handling
@pytest.skip("Empty extension handling is not implemented yet")
def test_generate_file_empty_extension_error(mocker: MockerFixture):
    with pytest.raises(ValueError):
        generate_file_path("")
