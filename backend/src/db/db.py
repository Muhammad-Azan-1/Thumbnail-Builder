from uuid import uuid4
from datetime import datetime , timezone

from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine , async_sessionmaker
from sqlmodel import  SQLModel 

from ..core.config import DATABASE_URL

import logging

logger = logging.getLogger(__name__)

def _uuid() -> str: 
    return str(uuid4())

def _now() -> datetime:
    return datetime.now(timezone.utc)


engine = create_async_engine(DATABASE_URL)
async_session_maker = async_sessionmaker(engine ,  class_=AsyncSession  , expire_on_commit=False)


async def create_db_and_tables():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
        logger.info("Database and tables created successfully")


async def get_async_session():
    async with async_session_maker() as session:
        yield session
        
        
        
#! Important

# By adding class_=AsyncSession to your async_sessionmaker, you are telling 
# SQLAlchemy: "Manage the connections for me, but hand me back a SQLModel session so I can write cleaner code."