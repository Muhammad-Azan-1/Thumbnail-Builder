from fastapi import FastAPI , Request 
from contextlib import asynccontextmanager
from src.db.db import create_db_and_tables
from src.routes.thumbnails import router as thumbnails_router
from src.routes.users import router as users_router
from fastapi.middleware.cors import CORSMiddleware
from src.core.exceptions import ApplicationException
from src.core.error_handler import (
    application_exception_handler,
    generic_exception_handler,
    rate_limit_exceeded_handler,
)
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware


from src.core.limter import limiter
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

#* rate limiter
# What is this and how is it working
# app.state is a general-purpose storage space on your app object, a place to attach things you want to be reachable 
# from anywhere the app is available. You can put any attribute on it.
# This line attaches your limiter object to the app under the name limiter.
# slowapi needs it because its middleware and its exception handler don’t receive your limiter variable.
# They only receive the request and the app. So slowapi looks for the limiter at request.app.state.limiter.

# Your decorator: @limiter.limit("5/minute")   → marks the route with its limit
# slowapi later:  request.app.state.limiter    → finds the limiter to check the counts

# If you forget this line, you get an error saying the app has no limiter attribute.
#  So it’s just a way of handing the limiter to slowapi’s internal code.

app.state.limiter = limiter
 

#* Error handlers 
#  "Whenever an ApplicationException is raised anywhere in the app and is not caught, don't crash 
# — call this function instead and return its response."
# "child class instance is also considered the instance of the parent class so when ever we raise  NotFoundException
# so the pplication_exception_handler runs bcz that NotFoundException class inherts from ApplicationException"
app.add_exception_handler(ApplicationException, application_exception_handler)

#  The generic_exception_handler only runs for errors that are not ApplicationException or its subclasses — like a random
#  AttributeError, TypeError, DB crash, etc. 
app.add_exception_handler(Exception, generic_exception_handler)

# This handler preserves SlowAPI's 429 and rate-limit headers, and adds a scope
# header so the frontend can distinguish application-wide limits from route limits.
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)



#* routes
app.include_router(router=thumbnails_router , prefix="/api/v1") # this becomes /api/v1/thumbnails (prefix combines with the prefix of thumbnails_router)
app.include_router(router=users_router , prefix="/api/v1") 


#* middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=['*']

)

#
# Middleware is code that sits between the incoming request and your route function, so it runs for every request.
# Request → SlowAPIMiddleware (checks the limit) → your route → response.
# The middleware is what applies your default_limits (the 50/minute baseline) to every route automatically.
# Routes you decorated with @limiter.limit(...) are checked with their own limit.
# Without the middleware, only decorated routes are limited, and the default limit applies to nothing. 
# This is why we call it the global baseline.
app.add_middleware(SlowAPIMiddleware)   # applies default_limits to every route




#* for debuging what the Request object holds 


# @app.get("/api/data")
# @limiter.limit("5/minute") # Limits to 5 requests per minute per IP
# async def get_data(request: Request):
#     # You can also manually check the IP here if needed
#     client_ip =  request.headers.get("x-forwarded-for") 
#     host = request.client.host

#     return {
#         "message": "Success! You are within the rate limit.",
#         "your_ip": client_ip,
#         "host" :  host
#     }