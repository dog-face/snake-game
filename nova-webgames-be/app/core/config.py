from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
import os
import warnings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Snake Game API"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = Field(
        default="your-secret-key-here-change-in-production",
        description="Secret key for JWT token signing. MUST be set via SECRET_KEY environment variable in production."
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    @field_validator('SECRET_KEY')
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        """Validate that SECRET_KEY is secure in production."""
        insecure_defaults = [
            "your-secret-key-here",
            "your-secret-key-here-change-in-production",
            "secret",
            "changeme",
        ]
        
        if v in insecure_defaults:
            # Check if we're in production (common production indicators)
            is_production = (
                os.getenv("ENVIRONMENT", "").lower() in ("production", "prod")
                or os.getenv("ENV", "").lower() in ("production", "prod")
                or os.getenv("FLASK_ENV", "").lower() == "production"
            )
            
            if is_production:
                raise ValueError(
                    "SECRET_KEY must be set to a secure value via environment variable in production. "
                    "The default insecure value cannot be used in production."
                )
            else:
                warnings.warn(
                    f"SECRET_KEY is set to an insecure default value. "
                    f"Set SECRET_KEY environment variable to a secure random string for production. "
                    f"Generate one with: python -c 'import secrets; print(secrets.token_urlsafe(32))'",
                    UserWarning,
                    stacklevel=2
                )
        
        # Ensure minimum length for security
        if len(v) < 32:
            raise ValueError(
                f"SECRET_KEY must be at least 32 characters long for security. "
                f"Current length: {len(v)}. "
                f"Generate a secure key with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
            )
        
        return v
    
    # Database
    # For PostgreSQL: postgresql://user:password@host:port/dbname
    #   Local development: postgresql://your_username@localhost:5432/snake_game
    #   Docker: postgresql://postgres:postgres@postgres:5432/snake_game
    # For SQLite: sqlite:///./snake_game.db
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/snake_game"
    
    # Session timeout in seconds (default 5 minutes)
    SESSION_TIMEOUT: int = 300
    
    # CORS settings
    # For development, use "*" to allow all origins
    # For production, specify exact origins: "https://yourdomain.com,https://www.yourdomain.com"
    CORS_ORIGINS: str = "*"  # Allow all origins for development
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
