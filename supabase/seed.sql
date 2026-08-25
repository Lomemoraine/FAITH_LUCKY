-- Supabase seed data
-- Default active rooms
INSERT INTO public.rooms (id, name, description, sort_order, is_active) VALUES
('all', 'All Rooms', 'Everything happening across our supportive community.', 0, true),
('anxiety', 'Stress & Overwhelm', 'A gentle place to share burdens, work fatigue, and quiet worry.', 1, true),
('relationships', 'Relationships & Family', 'Navigating marriage, parenting, friendships, and boundaries.', 2, true),
('burnout', 'Career & Hustle Burnout', 'Honest conversations when work pressure feels unbearable.', 3, true),
('grief', 'Grief & Healing', 'Space to honor loss, sorrow, and finding your breath again.', 4, true),
('wins', 'Small Wins & Gratitude', 'Celebrate tiny steps forward, answered prayers, and healing.', 5, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;
