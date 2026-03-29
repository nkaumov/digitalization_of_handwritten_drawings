-- Main backend schema snapshot.
-- This file should reflect the final structure after applying all migrations.
-- Update this file whenever migrations change table definitions.

CREATE TABLE IF NOT EXISTS stored_files (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  kind ENUM('source-image', 'debug-artifact', 'export-artifact', 'other') NOT NULL DEFAULT 'other',
  storage_path VARCHAR(1024) NOT NULL,
  mime_type VARCHAR(255) NULL,
  original_name VARCHAR(512) NULL,
  size_bytes BIGINT UNSIGNED NULL,
  checksum_sha256 CHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS drawings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL DEFAULT 'Untitled drawing',
  source_type ENUM('blank', 'photo') NOT NULL DEFAULT 'blank',
  locale VARCHAR(16) NOT NULL DEFAULT 'ru',
  status ENUM('draft', 'blank_ready', 'recognition_pending', 'recognition_processing', 'recognized', 'needs_review', 'saved', 'error') NOT NULL DEFAULT 'draft',
  source_file_id BIGINT UNSIGNED NULL,
  recognized_payload JSON NULL,
  edited_payload JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_drawings_status (status),
  INDEX idx_drawings_source_file_id (source_file_id),
  CONSTRAINT fk_drawings_source_file_id FOREIGN KEY (source_file_id) REFERENCES stored_files (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recognition_jobs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  drawing_id BIGINT UNSIGNED NOT NULL,
  source_file_id BIGINT UNSIGNED NOT NULL,
  status ENUM('queued', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'queued',
  error_message TEXT NULL,
  warnings_payload JSON NULL,
  debug_payload JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_recognition_jobs_drawing_id (drawing_id),
  INDEX idx_recognition_jobs_source_file_id (source_file_id),
  INDEX idx_recognition_jobs_status (status),
  CONSTRAINT fk_recognition_jobs_drawing_id FOREIGN KEY (drawing_id) REFERENCES drawings (id),
  CONSTRAINT fk_recognition_jobs_source_file_id FOREIGN KEY (source_file_id) REFERENCES stored_files (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE IF NOT EXISTS contours (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  drawing_id BIGINT UNSIGNED NOT NULL,
  contour_index INT UNSIGNED NOT NULL,
  is_closed TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_contours_drawing_order (drawing_id, contour_index),
  INDEX idx_contours_drawing_id (drawing_id),
  CONSTRAINT fk_contours_drawing_id FOREIGN KEY (drawing_id) REFERENCES drawings (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS points (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  drawing_id BIGINT UNSIGNED NOT NULL,
  contour_id BIGINT UNSIGNED NULL,
  point_index INT UNSIGNED NOT NULL,
  x DECIMAL(14,6) NOT NULL,
  y DECIMAL(14,6) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_points_drawing_id (drawing_id),
  INDEX idx_points_contour_id (contour_id),
  UNIQUE KEY uq_points_contour_order (contour_id, point_index),
  CONSTRAINT fk_points_drawing_id FOREIGN KEY (drawing_id) REFERENCES drawings (id),
  CONSTRAINT fk_points_contour_id FOREIGN KEY (contour_id) REFERENCES contours (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS segments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  drawing_id BIGINT UNSIGNED NOT NULL,
  contour_id BIGINT UNSIGNED NULL,
  segment_index INT UNSIGNED NOT NULL,
  start_point_id BIGINT UNSIGNED NOT NULL,
  end_point_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_segments_drawing_id (drawing_id),
  INDEX idx_segments_contour_id (contour_id),
  INDEX idx_segments_start_point_id (start_point_id),
  INDEX idx_segments_end_point_id (end_point_id),
  UNIQUE KEY uq_segments_contour_order (contour_id, segment_index),
  CONSTRAINT fk_segments_drawing_id FOREIGN KEY (drawing_id) REFERENCES drawings (id),
  CONSTRAINT fk_segments_contour_id FOREIGN KEY (contour_id) REFERENCES contours (id),
  CONSTRAINT fk_segments_start_point_id FOREIGN KEY (start_point_id) REFERENCES points (id),
  CONSTRAINT fk_segments_end_point_id FOREIGN KEY (end_point_id) REFERENCES points (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dimensions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  drawing_id BIGINT UNSIGNED NOT NULL,
  segment_id BIGINT UNSIGNED NULL,
  label VARCHAR(255) NULL,
  raw_value VARCHAR(255) NULL,
  normalized_value DECIMAL(14,6) NULL,
  unit ENUM('mm') NOT NULL DEFAULT 'mm',
  confidence DECIMAL(5,4) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_dimensions_drawing_id (drawing_id),
  INDEX idx_dimensions_segment_id (segment_id),
  CONSTRAINT fk_dimensions_drawing_id FOREIGN KEY (drawing_id) REFERENCES drawings (id),
  CONSTRAINT fk_dimensions_segment_id FOREIGN KEY (segment_id) REFERENCES segments (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exports (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  drawing_id BIGINT UNSIGNED NOT NULL,
  file_id BIGINT UNSIGNED NOT NULL,
  format ENUM('pdf', 'image') NOT NULL,
  status ENUM('queued', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'queued',
  error_message TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_exports_drawing_id (drawing_id),
  INDEX idx_exports_file_id (file_id),
  INDEX idx_exports_status (status),
  CONSTRAINT fk_exports_drawing_id FOREIGN KEY (drawing_id) REFERENCES drawings (id),
  CONSTRAINT fk_exports_file_id FOREIGN KEY (file_id) REFERENCES stored_files (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

