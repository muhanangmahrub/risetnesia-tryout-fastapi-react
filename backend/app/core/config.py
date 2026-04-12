from pydantic_settings import BaseSettings
from typing import Optional, List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Online Tryout System API"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = ""  # WAJIB diset via env var, tidak ada default di production
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # DATABASE
    DATABASE_URL: str = ""

    # ADMIN
    ADMIN_EMAIL: str = "muhanangmahrub@gmail.com"
    ADMIN_PASSWORD: str = "AdminPassword123!"
    ADMIN_NAME: str = "Muhamad Anang Mahrub"

    # CORS — pisahkan dengan koma jika lebih dari satu domain
    # Contoh: https://app.risetnesia.com,https://www.risetnesia.com
    BACKEND_CORS_ORIGINS: str = "*"

    # CLOUDINARY
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None

    def get_cors_origins(self) -> List[str]:
        """Parse BACKEND_CORS_ORIGINS menjadi list."""
        if self.BACKEND_CORS_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"

settings = Settings()
