from enum import StrEnum

import pytest
from pytest_mock import MockerFixture

from jamflow.models.enums import str_enum_to_sa_column


@pytest.fixture
def test_enum():
    class TestEnum(StrEnum):
        VALUE_ONE = "VALUEONE"
        VALUE_TWO = "ValueTwo"
        VALUE_THREE = "valuethree"

    return TestEnum


def test_str_enum_column_values_are_actual_values(test_enum):
    class TestEnum(StrEnum):
        VALUE_ONE = "VALUEONE"
        VALUE_TWO = "ValueTwo"
        VALUE_THREE = "valuethree"

    column = str_enum_to_sa_column(TestEnum)
    assert column.type.enums == ["VALUEONE", "ValueTwo", "valuethree"]
    assert column.type.name == "testenum"
    assert column.type.__class__.__name__ == "Enum"


def test_str_enum_column_passes_kwargs(
    mocker: MockerFixture,
    test_enum,
):
    mock_column = mocker.patch("jamflow.models.enums.Column")

    str_enum_to_sa_column(test_enum, nullable=True, default="VALUE_ONE")
    mock_column.assert_called_once_with(mocker.ANY, nullable=True, default="VALUE_ONE")
