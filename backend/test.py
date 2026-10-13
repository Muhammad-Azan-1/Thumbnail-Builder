
import asyncio
import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
os.chdir(BACKEND_DIR)
sys.path.insert(0, str(BACKEND_DIR))

from sqlmodel import select
from src.db.db import async_session_maker
from src.models.models import Job


async def main() -> None:
    async with async_session_maker() as session:
        job_ids = (
            await session.exec(select(Job.id).order_by(Job.created_at.desc()))
        ).all()

    if not job_ids:
        print("No jobs found.")
        return

    for job_id in job_ids:
        print(job_id)


if __name__ == "__main__":
    asyncio.run(main())

# 57731cfe-c8ff-4158-94c6-6919e4a8658c
# bb49fe3a-d608-4c53-96f6-0c4b1a87df7e
# d284eb3e-758f-4a0e-8c7a-b530b1f521fe
# cc4887b0-d5e2-4235-8135-4094e0cc0169 # iphone 17 2 generated images
# e045a28c-fc99-4660-85eb-2694b33038bb
# d3d28434-9a27-462e-a91d-b7cac83e7102
# 0897ef68-bc36-462c-9f6f-44a1552b422f
# 9ce56094-72af-4298-b983-3a4f5390f084
# d7981b7c-0e00-4cd5-ac99-b914510b16a9
# 65d3f7a2-d6c1-4102-8019-3bc7946122aa
# 5e5dc1cb-7533-4eb0-9b06-fd3698bd749b


# 57c673be-dd9b-460e-9af5-bf4ac75c8ac9
# eb135fed-a236-48be-8b58-eea82a008d1a
# 133d56d2-cc00-4b94-9c15-ab2599af9ebf
# 25521e11-965e-449b-9b49-7f4f96633183