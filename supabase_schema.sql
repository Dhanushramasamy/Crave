-- Run this SQL in your Supabase SQL Editor to set up the database schema and storage

-- 1. Create the items table
CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    room TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    sketch_data TEXT,
    type TEXT NOT NULL
);

-- 2. Enable Row Level Security (RLS) on the table
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy that allows anyone to insert/select/update/delete (for development purposes)
CREATE POLICY "Enable all for anon on items" ON items FOR ALL USING (true) WITH CHECK (true);

-- 4. Create the storage bucket for images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('items', 'items', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Set up storage policies for the 'items' bucket to allow public access and uploads
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'items');
CREATE POLICY "Public Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'items');
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'items');
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'items');

-- 6. Create categories table
CREATE TABLE IF NOT EXISTS categories (
    name TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. Enable RLS on categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 8. Policy for categories
CREATE POLICY "Enable all for anon on categories" ON categories FOR ALL USING (true) WITH CHECK (true);

