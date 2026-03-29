SET @schema_name := DATABASE();

SET @has_source_type := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'drawings'
    AND COLUMN_NAME = 'source_type'
);

SET @sql_source_type := IF(
  @has_source_type = 0,
  "ALTER TABLE drawings ADD COLUMN source_type ENUM('blank', 'photo') NOT NULL DEFAULT 'blank' AFTER title",
  "SELECT 1"
);
PREPARE stmt_source_type FROM @sql_source_type;
EXECUTE stmt_source_type;
DEALLOCATE PREPARE stmt_source_type;

SET @has_locale := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'drawings'
    AND COLUMN_NAME = 'locale'
);

SET @sql_locale := IF(
  @has_locale = 0,
  "ALTER TABLE drawings ADD COLUMN locale VARCHAR(16) NOT NULL DEFAULT 'ru' AFTER source_type",
  "SELECT 1"
);
PREPARE stmt_locale FROM @sql_locale;
EXECUTE stmt_locale;
DEALLOCATE PREPARE stmt_locale;

UPDATE drawings SET status = 'draft' WHERE status = 'new';
UPDATE drawings SET status = 'blank_ready' WHERE status = 'empty';
UPDATE drawings SET status = 'recognition_processing' WHERE status = 'processing';
UPDATE drawings SET status = 'needs_review' WHERE status = 'needs_revision';

ALTER TABLE drawings
  MODIFY COLUMN status ENUM(
    'draft',
    'blank_ready',
    'recognition_pending',
    'recognition_processing',
    'recognized',
    'needs_review',
    'saved',
    'error'
  ) NOT NULL DEFAULT 'draft';

