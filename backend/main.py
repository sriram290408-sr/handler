from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from core.security import hash_password
from database import Base, SessionLocal, engine
from models.user import User
from routers import auth, student, dashboard

def seed_default_admin() -> None:
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == settings.admin_email).first()
        if user:
            return

        db_user = User(
            username=settings.admin_username,
            email=settings.admin_email,
            hashed_password=hash_password(settings.admin_password),
            is_active=True,
        )
        db.add(db_user)
        db.commit()
    except Exception as e:
        print("Seed error:", e)
    finally:
        db.close()

app = FastAPI(title="Student Management API")

@app.on_event("startup")
def startup():
    try:
        print("Starting app...")
        Base.metadata.create_all(bind=engine)

        # Seed admin
        seed_default_admin()

        print("Startup completed")

    except Exception as e:
        print("Startup error:", str(e))


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(student.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {"message": "Student Management API running"}