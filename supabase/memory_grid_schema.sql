-- MEMORY GRID ONLY - Supabase schema.
-- Run this in Supabase SQL Editor to add/reset only Memory Grid storage.
-- This does not touch AI quizzes, manual quizzes, multiplayer rooms, Hand Cricket, or Emoji Rush.

create extension if not exists pgcrypto;

drop table if exists public.memory_grid_leaderboard cascade;
drop table if exists public.memory_grid_lifeline_events cascade;
drop table if exists public.memory_grid_rounds cascade;
drop table if exists public.memory_grid_sessions cascade;

create table public.memory_grid_sessions (
  id uuid primary key default gen_random_uuid(),
  player_id text not null,
  player_name text not null default 'Player',
  status text not null default 'active',
  current_round integer not null default 1,
  completed_rounds integer not null default 0,
  total_score integer not null default 0,
  hearts_remaining integer not null default 4,
  total_accuracy numeric(5,2) not null default 100,
  completion_time_ms integer not null default 0,
  result text not null default 'active',
  medal text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  completed_at timestamp with time zone,
  constraint memory_grid_sessions_status_check check (status in ('active', 'completed', 'abandoned')),
  constraint memory_grid_sessions_current_round_check check (current_round >= 1 and current_round <= 5),
  constraint memory_grid_sessions_completed_rounds_check check (completed_rounds >= 0 and completed_rounds <= 5),
  constraint memory_grid_sessions_total_score_check check (total_score >= 0 and total_score <= 8500),
  constraint memory_grid_sessions_hearts_check check (hearts_remaining >= 0 and hearts_remaining <= 4),
  constraint memory_grid_sessions_accuracy_check check (total_accuracy >= 0 and total_accuracy <= 100),
  constraint memory_grid_sessions_completion_time_check check (completion_time_ms >= 0 and completion_time_ms <= 1200000),
  constraint memory_grid_sessions_result_check check (result in ('active', 'victory', 'game_over', 'abandoned')),
  constraint memory_grid_sessions_medal_check check (medal is null or medal in ('gold', 'silver', 'bronze', 'none'))
);

create table public.memory_grid_rounds (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.memory_grid_sessions(id) on delete cascade,
  round_number integer not null,
  score integer not null default 0,
  correct_targets integer not null default 0,
  wrong_attempts integer not null default 0,
  total_selections integer not null default 0,
  remaining_hearts integer not null default 4,
  duration_ms integer not null default 0,
  completed boolean not null default false,
  grid_rows integer not null,
  grid_cols integer not null,
  memorize_seconds integer not null,
  target_count integer not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint memory_grid_rounds_unique_round unique (session_id, round_number),
  constraint memory_grid_rounds_round_number_check check (round_number >= 1 and round_number <= 5),
  constraint memory_grid_rounds_score_check check (score >= 0 and score <= 2400),
  constraint memory_grid_rounds_correct_check check (correct_targets >= 0 and correct_targets <= 6),
  constraint memory_grid_rounds_wrong_check check (wrong_attempts >= 0 and wrong_attempts <= 30),
  constraint memory_grid_rounds_selections_check check (total_selections >= 0 and total_selections <= 50),
  constraint memory_grid_rounds_hearts_check check (remaining_hearts >= 0 and remaining_hearts <= 4),
  constraint memory_grid_rounds_duration_check check (duration_ms >= 0 and duration_ms <= 600000),
  constraint memory_grid_rounds_rows_check check (grid_rows >= 3 and grid_rows <= 6),
  constraint memory_grid_rounds_cols_check check (grid_cols >= 3 and grid_cols <= 6),
  constraint memory_grid_rounds_memorize_check check (memorize_seconds >= 5 and memorize_seconds <= 7),
  constraint memory_grid_rounds_target_check check (target_count >= 3 and target_count <= 6)
);

create table public.memory_grid_lifeline_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.memory_grid_sessions(id) on delete cascade,
  round_number integer not null,
  previous_hearts integer not null,
  remaining_hearts integer not null,
  wrong_attempts integer not null default 0,
  reason text not null,
  created_at timestamp with time zone not null default now(),
  constraint memory_grid_lifeline_round_check check (round_number >= 1 and round_number <= 5),
  constraint memory_grid_lifeline_previous_check check (previous_hearts >= 0 and previous_hearts <= 4),
  constraint memory_grid_lifeline_remaining_check check (remaining_hearts >= 0 and remaining_hearts <= 4),
  constraint memory_grid_lifeline_wrong_check check (wrong_attempts >= 0 and wrong_attempts <= 30),
  constraint memory_grid_lifeline_reason_check check (reason in ('wrong_selection', 'timeout'))
);

create table public.memory_grid_leaderboard (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.memory_grid_sessions(id) on delete cascade,
  player_id text not null,
  player_name text not null default 'Player',
  total_score integer not null default 0,
  completed_rounds integer not null default 0,
  hearts_remaining integer not null default 0,
  total_accuracy numeric(5,2) not null default 0,
  completion_time_ms integer not null default 0,
  medal text not null default 'none',
  created_at timestamp with time zone not null default now(),
  constraint memory_grid_leaderboard_session_unique unique (session_id),
  constraint memory_grid_leaderboard_score_check check (total_score >= 0 and total_score <= 8500),
  constraint memory_grid_leaderboard_rounds_check check (completed_rounds >= 0 and completed_rounds <= 5),
  constraint memory_grid_leaderboard_hearts_check check (hearts_remaining >= 0 and hearts_remaining <= 4),
  constraint memory_grid_leaderboard_accuracy_check check (total_accuracy >= 0 and total_accuracy <= 100),
  constraint memory_grid_leaderboard_completion_time_check check (completion_time_ms >= 0 and completion_time_ms <= 1200000),
  constraint memory_grid_leaderboard_medal_check check (medal in ('gold', 'silver', 'bronze', 'none'))
);

create index memory_grid_sessions_player_updated_idx
on public.memory_grid_sessions(player_id, updated_at desc);

create index memory_grid_rounds_session_round_idx
on public.memory_grid_rounds(session_id, round_number);

create index memory_grid_lifeline_session_idx
on public.memory_grid_lifeline_events(session_id, created_at desc);

create index memory_grid_leaderboard_score_idx
on public.memory_grid_leaderboard(total_score desc, completed_rounds desc, total_accuracy desc, created_at desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists memory_grid_sessions_set_updated_at on public.memory_grid_sessions;
create trigger memory_grid_sessions_set_updated_at
before update on public.memory_grid_sessions
for each row execute function public.set_updated_at();

drop trigger if exists memory_grid_rounds_set_updated_at on public.memory_grid_rounds;
create trigger memory_grid_rounds_set_updated_at
before update on public.memory_grid_rounds
for each row execute function public.set_updated_at();

alter table public.memory_grid_sessions disable row level security;
alter table public.memory_grid_rounds disable row level security;
alter table public.memory_grid_lifeline_events disable row level security;
alter table public.memory_grid_leaderboard disable row level security;
