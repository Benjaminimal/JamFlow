default:
    @just --list --list-submodules

mod backend 'backend/justfile'
mod frontend 'frontend/justfile'

start:
    @just backend start & just frontend start & wait
