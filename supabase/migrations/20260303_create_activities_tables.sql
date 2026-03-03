-- Activity Series: groups related activities for multi-day tracking
CREATE TABLE activity_series (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Activities: individual events linked to locations and optionally to a series
CREATE TABLE activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  location_id UUID NOT NULL REFERENCES locations(id),
  series_id UUID REFERENCES activity_series(id) ON DELETE SET NULL,
  event_date DATE,
  start_time TIME,
  end_time TIME,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add activity_id to check_ins for activity-specific check-ins
ALTER TABLE check_ins ADD COLUMN activity_id UUID REFERENCES activities(id) ON DELETE SET NULL;

-- Indexes for common queries
CREATE INDEX idx_activities_location_id ON activities(location_id);
CREATE INDEX idx_activities_series_id ON activities(series_id);
CREATE INDEX idx_activities_slug ON activities(slug);
CREATE INDEX idx_activities_event_date ON activities(event_date);
CREATE INDEX idx_check_ins_activity_id ON check_ins(activity_id);
