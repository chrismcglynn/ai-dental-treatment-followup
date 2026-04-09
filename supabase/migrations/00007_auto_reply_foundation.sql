-- Migration: Auto-Reply Foundation
-- Adds conversation automation fields, message sender tracking, and sequence auto-reply opt-in

-- Conversation automation fields
ALTER TABLE conversations ADD COLUMN conversation_mode text DEFAULT 'manual'
  CHECK (conversation_mode IN ('manual','auto_idle','auto_replying','escalated','staff_handling'));
ALTER TABLE conversations ADD COLUMN auto_reply_count integer DEFAULT 0;
ALTER TABLE conversations ADD COLUMN escalation_reason text;
ALTER TABLE conversations ADD COLUMN escalated_at timestamptz;

-- Message sender tracking (audit trail for AI vs staff vs system messages)
ALTER TABLE messages ADD COLUMN sent_by text DEFAULT 'staff'
  CHECK (sent_by IN ('staff','ai_auto','system'));

-- Sequence automation opt-in
ALTER TABLE sequences ADD COLUMN auto_reply_enabled boolean DEFAULT false;

-- Fast lookup for escalated/active conversations
CREATE INDEX idx_conversations_mode ON conversations(practice_id, conversation_mode)
  WHERE conversation_mode IN ('escalated','auto_replying');
