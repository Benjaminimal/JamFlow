from jamflow.core.exceptions import ApplicationError


def test_error_hierarchy_is_has_no_great_granchildren():
    children = ApplicationError.__subclasses__()
    grand_children = (sc for child in children for sc in child.__subclasses__())
    for exec_type in grand_children:
        assert exec_type.__subclasses__() == [], (
            f"{exec_type} has subclasses, expected depth 2 hierarchy"
        )
