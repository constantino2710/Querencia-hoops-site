-- 1. Tabela de Matrículas (Enrollments)
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT now(),
    status public.enrollment_status DEFAULT 'ACTIVE',
    price_paid_cents INTEGER NOT NULL, -- Preço no momento da compra
    currency TEXT DEFAULT 'BRL'
);

-- 2. Tabela de Pagamentos (Payments)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE UNIQUE,
    amount_cents INTEGER NOT NULL,
    provider TEXT NOT NULL, -- Ex: 'MANUAL', 'PAGARME'
    provider_payment_id TEXT,
    status public.payment_status DEFAULT 'PENDING',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de Ganhos dos Professores (Teacher Earnings)
-- Esta tabela garante que cada curso vendido gere um crédito individual para o professor dono do curso
CREATE TABLE IF NOT EXISTS public.teacher_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE UNIQUE,
    gross_amount_cents INTEGER NOT NULL,    -- Valor total pago pelo aluno
    platform_fee_cents INTEGER NOT NULL,    -- Taxa da plataforma (ex: 10%)
    net_amount_cents INTEGER NOT NULL,      -- Valor limpo para o professor
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Habilitar RLS (Segurança)
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_earnings ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Segurança (Exemplos básicos)
-- Alunos podem ver suas próprias matrículas
CREATE POLICY "Users can view own enrollments" ON public.enrollments
    FOR SELECT USING (auth.uid() = student_id);

-- Professores podem ver os ganhos vinculados ao seu ID
CREATE POLICY "Teachers can view own earnings" ON public.teacher_earnings
    FOR SELECT USING (auth.uid() = teacher_id);

-- 6. Índices para performance
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_earnings_teacher ON public.teacher_earnings(teacher_id);