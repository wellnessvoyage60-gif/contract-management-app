from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # Security
    SECRET_KEY: str = 'change-me-to-random-64-chars'
    ALGORITHM: str = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # Admin (hardcoded kill switch)
    ADMIN_USERNAME: str = 'superadmin'
    ADMIN_PASSWORD: str = 'admin123'

    # Email (SMTP)
    SMTP_HOST: str = 'localhost'
    SMTP_PORT: int = 1025
    SMTP_USER: str = ''
    SMTP_PASSWORD: str = ''
    EMAIL_FROM: str = 'contracts@local.dev'

    # Active Directory
    AD_MODE: str = 'mock'       # 'mock' for dev, 'live' for production
    AD_SERVER: str = 'ldap://dummy'
    AD_DOMAIN: str = 'DUMMY'
    AD_BASE_DN: str = 'DC=dummy,DC=com'
    AD_BIND_USER: str = 'dummy'
    AD_BIND_PASSWORD: str = 'dummy'

    # Application
    APP_URL: str = 'http://host.docker.internal:8000'
    UPLOAD_DIR: str = './uploads'
    ARCHIVE_DIR: str = './archive'

    # OnlyOffice
    ONLYOFFICE_URL: str = 'http://localhost:8080'
    ONLYOFFICE_JWT_SECRET: str = 'MyContractAppSecret2026'

    class Config:
        env_file = '.env'
        extra = 'ignore'    # Prevents crash from unknown .env vars


settings = Settings()
