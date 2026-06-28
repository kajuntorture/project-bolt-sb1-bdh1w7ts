-- Waypoints table for marine navigation
CREATE TABLE waypoints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  symbol TEXT DEFAULT 'waypoint',
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_public BOOLEAN DEFAULT FALSE
);

-- Navigation tracks (recorded paths)
CREATE TABLE navigation_tracks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  distance_meters DOUBLE PRECISION DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

-- Track points (individual GPS points within a track)
CREATE TABLE track_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id UUID REFERENCES navigation_tracks(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  altitude DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  accuracy DOUBLE PRECISION
);

-- Downloaded tile regions for offline use
CREATE TABLE offline_tile_regions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bounds JSONB NOT NULL,
  min_zoom INTEGER DEFAULT 8,
  max_zoom INTEGER DEFAULT 16,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  tile_count INTEGER DEFAULT 0,
  size_bytes BIGINT DEFAULT 0,
  status TEXT DEFAULT 'pending'
);

-- Enable RLS
ALTER TABLE waypoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_tile_regions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for waypoints
CREATE POLICY "select_own_waypoints" ON waypoints FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR is_public = TRUE);
CREATE POLICY "insert_own_waypoints" ON waypoints FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_waypoints" ON waypoints FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_waypoints" ON waypoints FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for navigation_tracks
CREATE POLICY "select_own_tracks" ON navigation_tracks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_tracks" ON navigation_tracks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_tracks" ON navigation_tracks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_tracks" ON navigation_tracks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for track_points
CREATE POLICY "select_own_track_points" ON track_points FOR SELECT
  TO authenticated USING (auth.uid() IN (
    SELECT user_id FROM navigation_tracks WHERE id = track_id
  ));
CREATE POLICY "insert_own_track_points" ON track_points FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IN (
    SELECT user_id FROM navigation_tracks WHERE id = track_id
  ));
CREATE POLICY "delete_own_track_points" ON track_points FOR DELETE
  TO authenticated USING (auth.uid() IN (
    SELECT user_id FROM navigation_tracks WHERE id = track_id
  ));

-- RLS Policies for offline_tile_regions
CREATE POLICY "select_own_tile_regions" ON offline_tile_regions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_tile_regions" ON offline_tile_regions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_tile_regions" ON offline_tile_regions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_tile_regions" ON offline_tile_regions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_waypoints_user ON waypoints(user_id);
CREATE INDEX idx_waypoints_coords ON waypoints(latitude, longitude);
CREATE INDEX idx_navigation_tracks_user ON navigation_tracks(user_id);
CREATE INDEX idx_track_points_track ON track_points(track_id);
CREATE INDEX idx_track_points_time ON track_points(recorded_at);