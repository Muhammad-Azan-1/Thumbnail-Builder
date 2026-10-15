from fastapi import APIRouter, Depends, HTTPException
from src.models.models import User
import logging


logger = logging.getLogger(__name__)

router = APIRouter( prefix="/auth", tags=["Auth"])