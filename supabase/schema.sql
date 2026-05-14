-- GENQUIZ manual quiz storage.
-- Run this in the Supabase SQL editor before using the manual quiz builder.

create extension if not exists pgcrypto;

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  host_id text not null,
  creator_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  question_count integer not null default 0,
  mode text not null default 'manual',
  status text not null default 'draft',
  constraint quizzes_status_check check (status in ('draft', 'ready', 'archived'))
);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question_text text not null,
  question_type text not null,
  options jsonb not null default '[]'::jsonb,
  correct_answers jsonb not null default '[]'::jsonb,
  points integer not null default 1,
  time_limit integer not null default 30,
  order_index integer not null default 0,
  constraint quiz_questions_type_check check (
    question_type in ('mcq', 'multiselect', 'true_false', 'fill_blank', 'passage')
  ),
  constraint quiz_questions_points_check check (points > 0),
  constraint quiz_questions_time_check check (time_limit > 0)
);

create table if not exists public.saved_quizzes (
  host_id text not null,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  last_edited timestamptz not null default now(),
  draft_status text not null default 'draft',
  primary key (host_id, quiz_id)
);

create index if not exists quizzes_host_updated_idx on public.quizzes(host_id, updated_at desc);
create index if not exists quiz_questions_quiz_order_idx on public.quiz_questions(quiz_id, order_index);
create index if not exists saved_quizzes_host_idx on public.saved_quizzes(host_id, last_edited desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists quizzes_set_updated_at on public.quizzes;
create trigger quizzes_set_updated_at
before update on public.quizzes
for each row execute function public.set_updated_at();

create or replace function public.set_saved_quiz_last_edited()
returns trigger as $$
begin
  new.last_edited = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists saved_quizzes_set_last_edited on public.saved_quizzes;
create trigger saved_quizzes_set_last_edited
before insert or update on public.saved_quizzes
for each row execute function public.set_saved_quiz_last_edited();

alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.saved_quizzes enable row level security;

-- No public RLS policies are created intentionally.
-- GENQUIZ writes through the FastAPI backend with SUPABASE_SERVICE_ROLE_KEY,
-- and the backend filters every saved quiz by the device-scoped host_id.
