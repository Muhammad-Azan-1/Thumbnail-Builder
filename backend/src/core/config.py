from dotenv  import load_dotenv
import os

load_dotenv()

OPENAI_API_KEY=os.getenv("OPENAI_API_KEY","")
IMAGEKIT_PRIVATE_KEY=os.getenv("IMAGEKIT_PRIVATE_KEY","")
IMAGEKIT_PUBLIC_KEY=os.getenv("IMAGEKIT_PUBLIC_KEY","")
IMAGEKIT_URL_ENDPOINT=os.getenv("IMAGEKIT_URL_ENDPOINT","")

DATABASE_URL=os.getenv("DATABASE_URL" ,"")
# print(f"DATABASE_URL: {DATABASE_URL}")

REFRESH_TOKEN_EXPIRY=os.getenv("REFRESH_TOKEN_EXPIRY" ,"7d")
REFRESH_TOKEN_SECRET=os.getenv("REFRESH_TOKEN_SECRET" ,"")

ACCESS_TOKEN_EXPIRY=os.getenv("ACCESS_TOKEN_EXPIRY" ,"1d")
ACCESS_TOKEN_SECRET=os.getenv("ACCESS_TOKEN_SECRET" ,"")

ALOGRITHEM="HS256"

FRONTEND_URL=os.getenv("FRONTEND_URL" ,"http://localhost:3000")

#* mailtrap email setup
MAILTRAP_USERNAME=os.getenv("MAILTRAP_USERNAME" ,"")
MAILTRAP_PASSWORD=os.getenv("MAILTRAP_PASSWORD" ,"")    
MAILTRAP_HOST=os.getenv("MAILTRAP_HOST" ,"")
MAILTRAP_PORT=os.getenv("MAILTRAP_PORT" ,"")
MAILTRAP_TOKEN=os.getenv("MAILTRAP_TOKEN" ,"")


#* gmail email setup
GMAIL_USERNAME=os.getenv("EMAIL_USER" ,"")
GMAIL_PASSWORD=os.getenv("EMAIL_PASS" ,"")    


#* email provider setup
EMAIL_PROVIDER=os.getenv("EMAIL_PROVIDER" ,"mailtrap")

#* google clinet id
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID" , None)
