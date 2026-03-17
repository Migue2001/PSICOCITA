-- Esquema base para autenticación y roles con Supabase Auth

-- 1. Tabla de perfiles vinculada a auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text default 'user' check (role in ('user','admin','super_admin')),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 2. Función + trigger para crear perfil automáticamente
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 3. Habilitar RLS
alter table public.profiles enable row level security;

-- 4. Políticas de seguridad
-- Ver y actualizar tu propio perfil
create policy "Users can view their own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id);

-- Admin / Super admin pueden ver todo (evitar recursión consultando la misma tabla)
create policy "Admins can view all profiles"
on public.profiles for select
using (auth.jwt()->>'email' = 'vasquezocupamiguel@gmail.com' or auth.uid() = id);

-- Solo super_admin (correo específico) puede cambiar roles o desactivar usuarios
create policy "Admins can manage roles"
on public.profiles for update
using (auth.jwt()->>'email' = 'vasquezocupamiguel@gmail.com')
with check (true);

-- 5. Tabla de horarios de la licenciada/admin
create table if not exists public.provider_schedules (
  user_id uuid primary key references auth.users(id) on delete cascade,
  start_hour int not null default 9,
  end_hour int not null default 18,
  slot_minutes int not null default 45,
  blocked_ranges jsonb default '[]'::jsonb,
  updated_at timestamptz default now()
);

alter table public.provider_schedules enable row level security;

-- Cualquier usuario puede consultar el horario (para ver disponibilidad)
create policy "Anyone can read schedules"
on public.provider_schedules for select
using (true);

-- Solo admin y super_admin pueden insertar/actualizar horarios
create policy "Admins manage schedules"
on public.provider_schedules
for all
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','super_admin')))
with check (true);

-- Índices útiles
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_created_at on public.profiles(created_at);
