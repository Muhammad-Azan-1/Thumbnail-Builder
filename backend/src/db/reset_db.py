# reset_db.py
import asyncio
from sqlmodel import SQLModel
from src.db.db import engine      # your AsyncEngine
import src.models                 # registers every model on the metadata

async def reset():
    async with engine.begin() as conn:                    # opens a connection + transaction
        await conn.run_sync(SQLModel.metadata.drop_all)   # sync DDL runs via run_sync
        await conn.run_sync(SQLModel.metadata.create_all)
    await engine.dispose()                                # close the pool cleanly
    print("done")

# asyncio.run(reset()) 
# #* do not use this in production otherwise all data in the columns will be gone
#* this function use to drop everything all the tables and columns and re create all of them