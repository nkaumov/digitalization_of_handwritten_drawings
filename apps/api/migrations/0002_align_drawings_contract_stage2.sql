ALTER TABLE drawings
  ADD COLUMN IF NOT EXISTS source_type ENUM('blank', 'photo') NOT NULL DEFAULT 'blank' AFTER title,
  ADD COLUMN IF NOT EXISTS locale VARCHAR(16) NOT NULL DEFAULT 'ru' AFTER source_type;

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

