CREATE TABLE IF NOT EXISTS recognition_job_stage_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  recognition_job_id BIGINT UNSIGNED NOT NULL,
  stage_name VARCHAR(64) NOT NULL,
  level ENUM('info', 'warning', 'error') NOT NULL DEFAULT 'info',
  message VARCHAR(1024) NOT NULL,
  meta_payload JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_recognition_stage_logs_job_id (recognition_job_id),
  INDEX idx_recognition_stage_logs_stage_name (stage_name),
  CONSTRAINT fk_recognition_stage_logs_job_id
    FOREIGN KEY (recognition_job_id) REFERENCES recognition_jobs (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

