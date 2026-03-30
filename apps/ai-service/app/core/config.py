from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="AI_SERVICE_", extra="ignore")

    host: str = Field(default="127.0.0.1")
    port: int = Field(default=8001)
    log_level: str = Field(default="INFO")
    env: str = Field(default="development")
    title: str = Field(default="AI Service MVP Skeleton")
    pipeline_stage_order: str | None = Field(default=None)
    pipeline_disabled_stages: str | None = Field(default=None)
    pipeline_continue_on_stage_failure: bool = Field(default=True)
    debug_artifacts_enabled: bool = Field(default=True)
    debug_artifacts_dir: str = Field(default="storage/debug/ai-service")


settings = Settings()
