-- GENQUIZ manual quiz storage reset.
-- WARNING: this drops the previous manual quiz storage tables and their data.
-- Run this once in the Supabase SQL editor, then redeploy the backend.

create extension if not exists pgcrypto;

drop table if exists public.participants cascade;
drop table if exists public.hand_cricket_matches cascade;
drop table if exists public.multiplayer_rooms cascade;
drop table if exists public.manual_questions cascade;
drop table if exists public.manual_quizzes cascade;

-- Legacy tables from the earlier GENQUIZ schema. Remove them to avoid backend/schema mismatch.
drop table if exists public.saved_quizzes cascade;
drop table if exists public.quiz_questions cascade;
drop table if exists public.quizzes cascade;

create table public.manual_quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  host_id text,
  question_type text not null,
  total_questions integer not null default 0,
  multiplayer boolean not null default false,
  room_code text unique,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint manual_quizzes_question_type_check check (
    question_type in ('mcq', 'multiselect', 'true_false', 'fill_blank', 'passage')
  ),
  constraint manual_quizzes_total_questions_check check (total_questions >= 0)
);

create table public.manual_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.manual_quizzes(id) on delete cascade,
  question_index integer not null default 0,
  question_text text not null,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  correct_answer text not null,
  time_per_question integer not null default 30,
  points integer not null default 1,
  created_at timestamp with time zone not null default now(),
  constraint manual_questions_question_index_check check (question_index >= 0),
  constraint manual_questions_time_check check (time_per_question >= 5),
  constraint manual_questions_points_check check (points > 0)
);

create table public.multiplayer_rooms (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.manual_quizzes(id) on delete cascade,
  room_code text unique not null,
  host_name text,
  started boolean not null default false,
  created_at timestamp with time zone not null default now()
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  room_code text not null references public.multiplayer_rooms(room_code) on update cascade on delete cascade,
  player_name text,
  score integer not null default 0,
  joined_at timestamp with time zone not null default now()
);

create table public.hand_cricket_matches (
  id uuid primary key default gen_random_uuid(),
  player_name text not null default 'Player',
  player_score integer not null default 0,
  ai_score integer not null default 0,
  winner text not null,
  created_at timestamp with time zone not null default now(),
  constraint hand_cricket_matches_player_score_check check (player_score >= 0 and player_score <= 36),
  constraint hand_cricket_matches_ai_score_check check (ai_score >= 0 and ai_score <= 36),
  constraint hand_cricket_matches_winner_check check (winner in ('player', 'ai', 'draw'))
);

create index manual_quizzes_host_updated_idx on public.manual_quizzes(host_id, updated_at desc);
create index manual_quizzes_room_code_idx on public.manual_quizzes(room_code);
create index manual_questions_quiz_order_idx on public.manual_questions(quiz_id, question_index);
create index multiplayer_rooms_room_code_idx on public.multiplayer_rooms(room_code);
create index participants_room_joined_idx on public.participants(room_code, joined_at);
create index hand_cricket_matches_created_idx on public.hand_cricket_matches(created_at desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists manual_quizzes_set_updated_at on public.manual_quizzes;
create trigger manual_quizzes_set_updated_at
before update on public.manual_quizzes
for each row execute function public.set_updated_at();

-- Development/testing phase: RLS is disabled intentionally.
-- Backend still writes through SUPABASE_SERVICE_ROLE_KEY and filters saved quizzes by host_id.
alter table public.manual_quizzes disable row level security;
alter table public.manual_questions disable row level security;
alter table public.multiplayer_rooms disable row level security;
alter table public.participants disable row level security;
alter table public.hand_cricket_matches disable row level security;
