-- Add show_archived_records column to user_settings table
ALTER TABLE user_settings
ADD COLUMN show_archived_records BOOLEAN DEFAULT FALSE;

