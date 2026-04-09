from typing import Annotated

from fastapi import Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from jamflow.infra.database import get_session

SessionDep = Annotated[AsyncSession, Depends(get_session)]
