-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Journals Table (Stores the container for memories)
create table public.journal (
  id uuid default uuid_generate_v4() primary key,
  query text, -- Null if user-uploaded
  user_created boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Records Table (Stores individual items/memories)
create table public.records (
  id uuid default uuid_generate_v4() primary key,
  journal_id uuid references public.journal(id) on delete cascade not null,
  title text not null,
  description text,
  image_url text,
  audio_url text, -- Nullable, can be generated later
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable Row Level Security (RLS) - Optional for now, but good practice
alter table public.journal enable row level security;
alter table public.records enable row level security;

-- 4. Create Policies (Public Access for Hackathon speed)
-- Allow anyone to read
create policy "Public Read Journal" on public.journal for select using (true);
create policy "Public Read Records" on public.records for select using (true);

-- Allow backend (service role) to insert/update - implicitly allowed if using service key, 
-- but if using anon key, we need this:
create policy "Public Insert Journal" on public.journal for insert with check (true);
create policy "Public Insert Records" on public.records for insert with check (true);
