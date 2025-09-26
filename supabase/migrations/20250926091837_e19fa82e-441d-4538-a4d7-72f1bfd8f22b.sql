-- Enable real-time updates for postcode_zones table
ALTER TABLE public.postcode_zones REPLICA IDENTITY FULL;

-- Add the table to the supabase_realtime publication  
ALTER PUBLICATION supabase_realtime ADD TABLE public.postcode_zones;