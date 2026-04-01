-- Add intent classification columns for AI-powered reply categorization

ALTER TABLE messages ADD COLUMN intent text DEFAULT NULL;
ALTER TABLE messages ADD COLUMN intent_confidence real DEFAULT NULL;

ALTER TABLE conversations ADD COLUMN latest_intent text DEFAULT NULL;
