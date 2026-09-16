import uvicorn
from dotenv import load_dotenv

load_dotenv()

from src.core.logger import setup_logging

def main():
    setup_logging()
    uvicorn.run("src.app:app", host="localhost", port=8000, reload=True)

if __name__ == "__main__":
    main()
