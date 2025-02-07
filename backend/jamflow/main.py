from fastapi import FastAPI

from jamflow.core.config import settings

app = FastAPI()


@app.get("/")
async def read_root():
    return {"message": f"Hello World. Welcome to {settings.PROJECT_NAME}!"}


@app.get("/items/{item_id}")
async def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}
