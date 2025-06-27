-- สร้างตาราง debts (หนี้)
CREATE TABLE IF NOT EXISTS public.debts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    borrower_name TEXT NOT NULL,
    principal_amount DECIMAL(10,2) NOT NULL,
    interest_amount DECIMAL(10,2) NOT NULL,
    paid_principal DECIMAL(10,2) DEFAULT 0,
    paid_interest DECIMAL(10,2) DEFAULT 0,
    due_date DATE NOT NULL,
    created_date DATE NOT NULL,
    interest_only_payments INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- สร้างตาราง payments (ประวัติการจ่ายเงิน)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    principal_payment DECIMAL(10,2) NOT NULL DEFAULT 0,
    interest_payment DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_payment DECIMAL(10,2) NOT NULL,
    remaining_principal DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- สร้าง index เพื่อเพิ่มประสิทธิภาพการค้นหา
CREATE INDEX IF NOT EXISTS idx_debts_created_date ON public.debts(created_date);
CREATE INDEX IF NOT EXISTS idx_debts_due_date ON public.debts(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_debt_id ON public.payments(debt_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(date);

-- สร้าง function สำหรับอัพเดท updated_at อัตโนมัติ
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- สร้าง trigger เพื่อเรียกใช้ function อัตโนมัติ
CREATE TRIGGER update_debts_updated_at 
    BEFORE UPDATE ON public.debts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- เปิดใช้งาน Row Level Security (RLS)
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- สร้าง Policy สำหรับการเข้าถึงข้อมูล (อนุญาตทุกคนในขณะนี้)
-- ในอนาคตสามารถปรับเป็น user-based access ได้
CREATE POLICY "Allow all operations on debts" ON public.debts
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on payments" ON public.payments
    FOR ALL USING (true) WITH CHECK (true);

-- เพิ่มคอมเมนต์อธิบายตาราง
COMMENT ON TABLE public.debts IS 'ตารางเก็บข้อมูลหนี้';
COMMENT ON TABLE public.payments IS 'ตารางเก็บประวัติการจ่ายเงิน';

COMMENT ON COLUMN public.debts.borrower_name IS 'ชื่อผู้ยืม';
COMMENT ON COLUMN public.debts.principal_amount IS 'จำนวนเงินต้น';
COMMENT ON COLUMN public.debts.interest_amount IS 'จำนวนดอกเบี้ย (คงที่)';
COMMENT ON COLUMN public.debts.paid_principal IS 'เงินต้นที่จ่ายแล้ว';
COMMENT ON COLUMN public.debts.paid_interest IS 'ดอกเบี้ยที่จ่ายแล้ว';
COMMENT ON COLUMN public.debts.interest_only_payments IS 'จำนวนครั้งที่จ่ายเฉพาะดอกเบี้ย';

COMMENT ON COLUMN public.payments.debt_id IS 'รหัสหนี้ที่อ้างอิง';
COMMENT ON COLUMN public.payments.principal_payment IS 'จำนวนเงินต้นที่จ่าย';
COMMENT ON COLUMN public.payments.interest_payment IS 'จำนวนดอกเบี้ยที่จ่าย';
COMMENT ON COLUMN public.payments.total_payment IS 'จำนวนเงินรวมที่จ่าย';
COMMENT ON COLUMN public.payments.remaining_principal IS 'เงินต้นคงเหลือหลังการจ่าย';
COMMENT ON COLUMN public.payments.notes IS 'หมายเหตุ (เช่น จ่ายเฉพาะดอกเบี้ย)'; 