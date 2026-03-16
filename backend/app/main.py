from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.core.database import Base, engine
from app import models  # noqa: F401

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.db_auto_create:
        for attempt in range(1, 21):
            try:
                async with engine.begin() as conn:
                    await conn.run_sync(Base.metadata.create_all)
                break
            except Exception:
                if attempt == 20:
                    raise
                await asyncio.sleep(1)
    yield


app = FastAPI(title="Target App API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
