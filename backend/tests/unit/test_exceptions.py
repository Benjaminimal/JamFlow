from jamflow.core.exceptions import ApplicationError


def test_error_hierarchy_is_flat():
    all_subclasses = ApplicationError.__subclasses__()
    for exec_type in all_subclasses:
        assert exec_type.__subclasses__() == [], (
            f"{exec_type} has subclasses, expected depth 1 hierarchy"
        )
