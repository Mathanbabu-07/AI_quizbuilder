-- GENQUIZ URL-to-Quiz persistence additions.
-- Safe to run in Supabase SQL Editor after the base/manual schema exists.

create extension if not exists pgcrypto;

create table if not exists public.generated_quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  quiz_data jsonb not null,
  mode text not null default 'solo',
  source_type text,
  source_url text,
  host_id text,
  created_at timestamp with time zone not null default now(),
  constraint generated_quizzes_title_check check (char_length(trim(title)) > 0),
  constraint generated_quizzes_mode_check check (mode in ('solo', 'multiplayer')),
  constraint generated_quizzes_data_check check (
    jsonb_typeof(quiz_data) = 'object'
    and jsonb_typeof(quiz_data->'questions') = 'array'
    and jsonb_array_length(quiz_data->'questions') > 0
  )
);

alter table public.generated_quizzes
add column if not exists source_type text;

alter table public.generated_quizzes
add column if not exists source_url text;

create table if not exists public.multiplayer_rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique,
  quiz_id uuid references public.generated_quizzes(id) on delete set null,
  host_name text not null default 'Host',
  status text not null default 'waiting',
  created_at timestamp with time zone not null default now(),
  constraint multiplayer_rooms_code_check check (room_code ~ '^[A-Z0-9]{4,10}$'),
  constraint multiplayer_rooms_status_check check (status in ('waiting', 'started', 'finished', 'closed'))
);

create table if not exists public.room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.multiplayer_rooms(id) on delete cascade,
  player_name text not null default 'Player',
  score integer not null default 0,
  joined_at timestamp with time zone not null default now(),
  constraint room_players_name_check check (char_length(trim(player_name)) > 0),
  constraint room_players_score_check check (score >= 0)
);

create index if not exists generated_quizzes_source_created_idx
on public.generated_quizzes(source_type, created_at desc);

create index if not exists generated_quizzes_source_url_idx
on public.generated_quizzes(source_url);

create index if not exists multiplayer_rooms_code_idx
on public.multiplayer_rooms(room_code);

create index if not exists room_players_room_joined_idx
on public.room_players(room_id, joined_at);

alter table public.generated_quizzes disable row level security;
alter table public.multiplayer_rooms disable row level security;
alter table public.room_players disable row level security;
