-- Drafts table for saving incomplete forms
CREATE TABLE IF NOT EXISTS drafts (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('job', 'cv')),
    draft_data JSONB NOT NULL DEFAULT '{}',
    user_id VARCHAR(255) NULL, -- Can be null for anonymous users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_drafts_user_type ON drafts(user_id, type);
CREATE INDEX IF NOT EXISTS idx_drafts_created_at ON drafts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_drafts_type ON drafts(type);

-- JSONB index for draft_data
CREATE INDEX IF NOT EXISTS idx_drafts_data ON drafts USING GIN (draft_data);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_drafts_updated_at
    BEFORE UPDATE ON drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_drafts_updated_at();

-- Clean up old anonymous drafts (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_drafts()
RETURNS void AS $$
BEGIN
    DELETE FROM drafts 
    WHERE user_id IS NULL 
    AND created_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE drafts IS 'Stores draft form data for jobs and CVs';
COMMENT ON COLUMN drafts.type IS 'Type of draft: job or cv';
COMMENT ON COLUMN drafts.draft_data IS 'JSON data containing form fields and values';
COMMENT ON COLUMN drafts.user_id IS 'User identifier, can be null for anonymous users';