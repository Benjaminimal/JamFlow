from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from jamflow.core.database import get_session

SessionDep = Annotated[AsyncSession, Depends(get_session)]
