from ..models import Thumbnails , Job
from sqlmodel import select , delete
from sqlmodel.ext.asyncio.session import AsyncSession

async def delete_empty_jobs(
    session: AsyncSession,
    job_ids: set[str] ,
):
    for job_id in job_ids:
        remaining = (
            await session.exec(
                select(Thumbnails).where(Thumbnails.job_id == job_id)
            )
        ).first()

        if remaining is None:
            await session.exec(
                delete(Job).where(Job.id == job_id)
            )