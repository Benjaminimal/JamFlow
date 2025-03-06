from datetime import date

from fastapi import File, Form, UploadFile
from pydantic import BaseModel


class TrackCreateDto(BaseModel):
    title: str = Form(..., max_length=255)
    recorded_date: date | None = Form(...)
    upload_file: UploadFile = File(...)
