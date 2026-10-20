from fastapi import FastAPI
from contextlib import asynccontextmanager
from src.db.db import create_db_and_tables
from src.routes.thumbnails import router as thumbnails_router
from src.routes.users import router as users_router
from fastapi.middleware.cors import CORSMiddleware
from src.core.exceptions import ApplicationException
from src.core.error_handler import application_exception_handler, generic_exception_handler

from src.core.logger import setup_logging

#* Initialize colored logging setup
setup_logging()


#* Lifespan context manager for FastAPI application
# before the FastAPI application starts, this function will run and executes its code unless and until it reaches the yield statement.
# As the yield statement hit, the FastAPI application will start and run its code. When the FastAPI application is shutting down, 
# the code after the yield statement will execute.

@asynccontextmanager
async def lifespan(app:FastAPI):
    # Perform any startup tasks here
    await create_db_and_tables()
    yield
    print("application stopped")
    # Perform any shutdown tasks here


app = FastAPI(title="Thumbnail Generator", version="1.0.0", lifespan=lifespan)


#* Error handlers 
#  "Whenever an ApplicationException is raised anywhere in the app and is not caught, don't crash 
# — call this function instead and return its response."
# "child class instance is also considered the instance of the parent class so when ever we raise  NotFoundException
# so the pplication_exception_handler runs bcz that NotFoundException class inherts from ApplicationException"
app.add_exception_handler(ApplicationException, application_exception_handler)

#  The generic_exception_handler only runs for errors that are not ApplicationException or its subclasses — like a random
#  AttributeError, TypeError, DB crash, etc. 
app.add_exception_handler(Exception, generic_exception_handler)


#* routes
app.include_router(router=thumbnails_router , prefix="/api/v1") # this becomes /api/v1/thumbnails (prefix combines with the prefix of thumbnails_router)
app.include_router(router=users_router , prefix="/api/v1") 


#* middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=[]

)


