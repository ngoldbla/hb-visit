-- Create locations table for managing NFC tap locations
CREATE TABLE IF NOT EXISTS locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on slug for quick lookups
CREATE INDEX IF NOT EXISTS idx_locations_slug ON locations(slug);

-- Create index on is_active for filtering
CREATE INDEX IF NOT EXISTS idx_locations_is_active ON locations(is_active);

-- Add base_url setting to kiosk_settings if not exists
INSERT INTO kiosk_settings (setting_key, setting_value)
VALUES ('base_url', '"https://visit.hatchbridge.com"')
ON CONFLICT (setting_key) DO NOTHING;

-- Grant permissions (adjust based on your RLS policies)
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active locations
CREATE POLICY "Allow public read access to active locations" ON locations
  FOR SELECT USING (is_active = true);

-- Allow authenticated users full access (for admin)
CREATE POLICY "Allow authenticated users full access" ON locations
  FOR ALL USING (true);
