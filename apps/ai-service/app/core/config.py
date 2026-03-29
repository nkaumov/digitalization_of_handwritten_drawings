from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="AI_SERVICE_", extra="ignore")

    host: str = Field(default="127.0.0.1")
    port: int = Field(default=8001)
    log_level: str = Field(default="INFO")
    env: str = Field(default="development")
    title: str = Field(default="AI Service MVP Skeleton")


settings = Settings()
