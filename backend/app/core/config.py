from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Online Tryout System API"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "supersecretkeythatyoushouldchangeinproduction"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # DATABASE
    DATABASE_URL: str = "mssql+pyodbc://sa:YourStrongPassword123!@SQL_Server_Docker:1433/tryout_db?driver=ODBC+Driver+17+for+SQL+Server"

    class Config:
        env_file = ".env"

settings = Settings()
