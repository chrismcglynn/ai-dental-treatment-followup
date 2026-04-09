-- Business hours for auto-reply enforcement
-- Stores per-day open/close times so AI auto-replies respect office hours
ALTER TABLE practices ADD COLUMN business_hours jsonb DEFAULT '{
  "Monday":    {"open": "08:00", "close": "17:00", "enabled": true},
  "Tuesday":   {"open": "08:00", "close": "17:00", "enabled": true},
  "Wednesday": {"open": "08:00", "close": "17:00", "enabled": true},
  "Thursday":  {"open": "08:00", "close": "17:00", "enabled": true},
  "Friday":    {"open": "08:00", "close": "17:00", "enabled": true},
  "Saturday":  {"open": "09:00", "close": "13:00", "enabled": false},
  "Sunday":    {"open": "09:00", "close": "13:00", "enabled": false}
}'::jsonb;
