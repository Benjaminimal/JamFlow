lint project:
    just --justfile {{ project }}/justfile lint

typecheck project:
    just --justfile {{ project }}/justfile typecheck

formatcheck project:
    just --justfile {{ project }}/justfile formatcheck

setup project:
    just --justfile {{ project }}/justfile setup
