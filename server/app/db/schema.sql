CREATE TABLE IF NOT EXISTS journal (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    query TEXT,
    title TEXT,
    description TEXT,
    image_url TEXT,
    audio_url TEXT,
    user_creeated BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS record (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title TEXT,
    description TEXT,
    image_url TEXT,
    audio_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Existing tables kept for reference/fallback if needed, but the app will migrate to the above
-- 1. Table for Journeys
CREATE TABLE IF NOT EXISTS journeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_query TEXT NOT NULL,
    title TEXT,
    description TEXT,
    date_range TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Table for Archival Records
CREATE TABLE IF NOT EXISTS archival_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journey_id UUID REFERENCES journeys(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    source_url TEXT,
    record_date TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Table for User Media (Uploads)
CREATE TABLE IF NOT EXISTS user_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journey_id UUID REFERENCES journeys(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL, -- 'image' or 'audio'
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (Optional, but good practice)
-- For a hackathon, we might keep it simple or allow all access
ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE archival_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE record ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow all for anonymous access during hackathon)
CREATE POLICY "Allow all access to journeys" ON journeys FOR ALL USING (true);
CREATE POLICY "Allow all access to archival_records" ON archival_records FOR ALL USING (true);
CREATE POLICY "Allow all access to user_media" ON user_media FOR ALL USING (true);
CREATE POLICY "Allow all access to journal" ON journal FOR ALL USING (true);
CREATE POLICY "Allow all access to record" ON record FOR ALL USING (true);
