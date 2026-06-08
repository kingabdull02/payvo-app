-- Database Schema for Payvo
-- Execute this script in the Supabase SQL Editor to set up tables and Row Level Security (RLS).

-- 1. Create profiles table (linked to auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  reminder_days integer default 3 not null,
  email_notifications boolean default true not null,
  is_premium boolean default false not null,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Trigger to create a profile automatically on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, reminder_days, email_notifications, is_premium, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Ny Användare'),
    new.email,
    3,
    true,
    false,
    ''
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Create recurring_invoices (Fasta)
create table public.recurring_invoices (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  amount numeric not null check (amount > 0),
  due_day integer not null check (due_day >= 1 and due_day <= 31),
  category text not null,
  icon text not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on recurring_invoices
alter table public.recurring_invoices enable row level security;

-- Policies for recurring_invoices
create policy "Users can perform all actions on their own recurring invoices" on public.recurring_invoices
  for all using (auth.uid() = user_id);


-- 3. Create invoices (Instances + Variable)
create table public.invoices (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  recurring_id uuid references public.recurring_invoices on delete set null,
  name text not null,
  amount numeric not null check (amount > 0),
  due_date date not null,
  is_paid boolean default false not null,
  category text not null,
  icon text not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on invoices
alter table public.invoices enable row level security;

-- Policies for invoices
create policy "Users can perform all actions on their own invoices" on public.invoices
  for all using (auth.uid() = user_id);
