-- --------------------------------------------------------
-- 1. CONFIGURAÇÕES INICIAIS E ENUMS
-- --------------------------------------------------------

-- Função para atualizar o updated_at automaticamente
create or replace function public.handle_updated_at() 
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Enums (Tipos personalizados para garantir integridade)
create type public.course_status as enum ('DRAFT', 'PUBLISHED', 'ARCHIVED');
create type public.enrollment_status as enum ('ACTIVE', 'CANCELED', 'REFUNDED');
create type public.payment_status as enum ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
create type public.app_role as enum ('STUDENT', 'TEACHER', 'ADMIN');

-- --------------------------------------------------------
-- 2. TABELAS DE USUÁRIOS E PERMISSÕES
-- --------------------------------------------------------

-- Tabela USERS (Sincronizada com auth.users)
create table public.users (
  id uuid not null primary key references auth.users(id) on delete cascade,
  name varchar(255),
  email varchar(255) unique not null,
  avatar_url varchar,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabela ROLES (Papeis do sistema)
create table public.roles (
  id uuid not null default gen_random_uuid() primary key,
  name public.app_role unique not null
);

-- Inserir os roles padrões
insert into public.roles (name) values ('STUDENT'), ('TEACHER'), ('ADMIN');

-- Tabela USER_ROLES (Pivot: Um usuário pode ser Professor E Aluno)
create table public.user_roles (
  user_id uuid not null references public.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  primary key (user_id, role_id)
);

-- --------------------------------------------------------
-- 3. ESTRUTURA DO CURSO (Conteúdo)
-- --------------------------------------------------------

create table public.courses (
  id uuid not null default gen_random_uuid() primary key,
  teacher_id uuid not null references public.users(id),
  title varchar(255) not null,
  description text,
  status public.course_status default 'DRAFT',
  price_cents integer default 0, -- R$ 0,00
  currency varchar(3) default 'BRL',
  thumbnail_url varchar,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.course_sections (
  id uuid not null default gen_random_uuid() primary key,
  course_id uuid not null references public.courses(id) on delete cascade,
  title varchar(255) not null,
  position integer not null default 0,
  created_at timestamptz default now(),
  unique (course_id, position) deferrable initially deferred
);

create table public.lessons (
  id uuid not null default gen_random_uuid() primary key,
  section_id uuid not null references public.course_sections(id) on delete cascade,
  title varchar(255) not null,
  position integer not null default 0,
  youtube_url varchar,
  created_at timestamptz default now(),
  unique (section_id, position) deferrable initially deferred
);

-- --------------------------------------------------------
-- 4. VENDAS E ALUNOS
-- --------------------------------------------------------

create table public.enrollments (
  id uuid not null default gen_random_uuid() primary key,
  student_id uuid not null references public.users(id),
  course_id uuid not null references public.courses(id),
  status public.enrollment_status default 'ACTIVE',
  price_paid_cents integer not null,
  currency varchar(3) default 'BRL',
  enrolled_at timestamptz default now(),
  unique (student_id, course_id)
);

create table public.course_reviews (
  id uuid not null default gen_random_uuid() primary key,
  student_id uuid not null references public.users(id),
  course_id uuid not null references public.courses(id),
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now(),
  unique (student_id, course_id)
);

-- --------------------------------------------------------
-- 5. FINANCEIRO
-- --------------------------------------------------------

create table public.payments (
  id uuid not null default gen_random_uuid() primary key,
  enrollment_id uuid not null references public.enrollments(id) unique,
  amount_cents integer not null,
  currency varchar(3) default 'BRL',
  provider varchar(50) not null, -- 'stripe', 'pagarme'
  provider_payment_id varchar(255) unique,
  status public.payment_status default 'PENDING',
  paid_at timestamptz,
  created_at timestamptz default now()
);

create table public.teacher_earnings (
  id uuid not null default gen_random_uuid() primary key,
  teacher_id uuid not null references public.users(id),
  enrollment_id uuid not null references public.enrollments(id) unique,
  gross_amount_cents integer not null,
  platform_fee_cents integer not null,
  net_amount_cents integer not null,
  created_at timestamptz default now()
);

-- --------------------------------------------------------
-- 6. ÍNDICES E TRIGGERS
-- --------------------------------------------------------

-- Índices para performance
create index idx_courses_teacher on public.courses(teacher_id);
create index idx_enrollments_student on public.enrollments(student_id);
create index idx_enrollments_course on public.enrollments(course_id);
create index idx_payments_status on public.payments(status);
create index idx_earnings_teacher on public.teacher_earnings(teacher_id);

-- Triggers de Updated_at (para atualizar a data automaticamente)
create trigger set_users_updated_at before update on public.users
for each row execute procedure public.handle_updated_at();

create trigger set_courses_updated_at before update on public.courses
for each row execute procedure public.handle_updated_at();

-- Trigger Automático: Cria usuário público quando registra no Auth do Supabase
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.users (id, email, name, avatar_url)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  );
  -- Opcional: Dar role de STUDENT padrão
  insert into public.user_roles (user_id, role_id)
  select new.id, id from public.roles where name = 'STUDENT';
  
  return new;
end;
$$ language plpgsql security definer;

-- Ativa o trigger acima na tabela do sistema
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Habilitar RLS em tudo (Segurança Padrão)
alter table public.users enable row level security;
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;
alter table public.courses enable row level security;
alter table public.course_sections enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.course_reviews enable row level security;
alter table public.payments enable row level security;
alter table public.teacher_earnings enable row level security;