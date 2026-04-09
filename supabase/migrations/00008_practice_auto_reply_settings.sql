-- Practice-level auto-reply configuration
ALTER TABLE practices ADD COLUMN auto_reply_enabled boolean DEFAULT false;
ALTER TABLE practices ADD COLUMN max_auto_replies integer DEFAULT 3;
