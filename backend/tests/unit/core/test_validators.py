from jamflow.core.validators import empty_string_to_none


def test_empty_string_to_none_casts_empty_string():
    assert empty_string_to_none("") is None


def test_empty_string_to_none_keeps_none():
    assert empty_string_to_none(None) is None


def test_empty_string_to_none_keeps_none_empty():
    assert empty_string_to_none("test") == "test"
