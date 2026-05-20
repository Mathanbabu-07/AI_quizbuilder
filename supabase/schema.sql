-- EMOJI RUSH ONLY - Supabase schema.
-- Run this in Supabase SQL Editor to add/reset only Emoji Rush storage.
-- This does not touch AI quizzes, manual quizzes, multiplayer rooms, or Hand Cricket.

create extension if not exists pgcrypto;

drop table if exists public.emoji_rush_leaderboard cascade;
drop table if exists public.emoji_rush_rounds cascade;
drop table if exists public.emoji_rush_sessions cascade;

create table public.emoji_rush_sessions (
  id uuid primary key default gen_random_uuid(),
  player_id text not null,
  player_name text not null default 'Player',
  status text not null default 'active',
  current_round integer not null default 1,
  completed_rounds integer not null default 0,
  total_score integer not null default 0,
  medal text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  completed_at timestamp with time zone,
  constraint emoji_rush_sessions_status_check check (status in ('active', 'completed', 'abandoned')),
  constraint emoji_rush_sessions_current_round_check check (current_round >= 1 and current_round <= 5),
  constraint emoji_rush_sessions_completed_rounds_check check (completed_rounds >= 0 and completed_rounds <= 5),
  constraint emoji_rush_sessions_total_score_check check (total_score >= 0 and total_score <= 1250),
  constraint emoji_rush_sessions_medal_check check (medal is null or medal in ('gold', 'silver', 'bronze', 'none'))
);

create table public.emoji_rush_rounds (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.emoji_rush_sessions(id) on delete cascade,
  round_number integer not null,
  points integer not null default 0,
  match3_count integer not null default 0,
  match5_count integer not null default 0,
  max_combo integer not null default 0,
  moves integer not null default 0,
  duration_ms integer not null default 0,
  completed boolean not null default false,
  board_size integer not null,
  emoji_variety integer not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint emoji_rush_rounds_unique_round unique (session_id, round_number),
  constraint emoji_rush_rounds_round_number_check check (round_number >= 1 and round_number <= 5),
  constraint emoji_rush_rounds_points_check check (points >= 0 and points <= 250),
  constraint emoji_rush_rounds_match3_check check (match3_count >= 0 and match3_count <= 100),
  constraint emoji_rush_rounds_match5_check check (match5_count >= 0 and match5_count <= 80),
  constraint emoji_rush_rounds_max_combo_check check (max_combo >= 0 and max_combo <= 40),
  constraint emoji_rush_rounds_moves_check check (moves >= 0 and moves <= 120),
  constraint emoji_rush_rounds_duration_check check (duration_ms >= 0 and duration_ms <= 600000),
  constraint emoji_rush_rounds_board_size_check check (board_size >= 5 and board_size <= 11),
  constraint emoji_rush_rounds_variety_check check (emoji_variety >= 4 and emoji_variety <= 10)
);

create table public.emoji_rush_leaderboard (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.emoji_rush_sessions(id) on delete cascade,
  player_id text not null,
  player_name text not null default 'Player',
  total_score integer not null default 0,
  completed_rounds integer not null default 0,
  medal text not null default 'none',
  best_combo integer not null default 0,
  created_at timestamp with time zone not null default now(),
  constraint emoji_rush_leaderboard_session_unique unique (session_id),
  constraint emoji_rush_leaderboard_score_check check (total_score >= 0 and total_score <= 1250),
  constraint emoji_rush_leaderboard_rounds_check check (completed_rounds >= 0 and completed_rounds <= 5),
  constraint emoji_rush_leaderboard_medal_check check (medal in ('gold', 'silver', 'bronze', 'none')),
  constraint emoji_rush_leaderboard_combo_check check (best_combo >= 0 and best_combo <= 40)
);

create index emoji_rush_sessions_player_updated_idx
on public.emoji_rush_sessions(player_id, updated_at desc);

create index emoji_rush_rounds_session_round_idx
on public.emoji_rush_rounds(session_id, round_number);

create index emoji_rush_leaderboard_score_idx
on public.emoji_rush_leaderboard(total_score desc, completed_rounds desc, created_at desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists emoji_rush_sessions_set_updated_at on public.emoji_rush_sessions;
create trigger emoji_rush_sessions_set_updated_at
before update on public.emoji_rush_sessions
for each row execute function public.set_updated_at();

drop trigger if exists emoji_rush_rounds_set_updated_at on public.emoji_rush_rounds;
create trigger emoji_rush_rounds_set_updated_at
before update on public.emoji_rush_rounds
for each row execute function public.set_updated_at();

alter table public.emoji_rush_sessions disable row level security;
alter table public.emoji_rush_rounds disable row level security;
alter table public.emoji_rush_leaderboard disable row level security;
