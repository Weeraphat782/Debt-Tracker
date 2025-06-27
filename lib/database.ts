import { supabase } from './supabase'
import type { Database } from './supabase'

// Type definitions
type DebtRow = Database['public']['Tables']['debts']['Row']
type DebtInsert = Database['public']['Tables']['debts']['Insert']
type DebtUpdate = Database['public']['Tables']['debts']['Update']
type PaymentRow = Database['public']['Tables']['payments']['Row']
type PaymentInsert = Database['public']['Tables']['payments']['Insert']

// Interface สำหรับ Frontend (เหมือนเดิม)
export interface Debt {
  id: string
  borrowerName: string
  principalAmount: number
  interestAmount: number
  paidPrincipal: number
  paidInterest: number
  dueDate: string
  createdDate: string
  payments: Payment[]
  interestOnlyPayments: number
}

export interface Payment {
  id: string
  date: string
  principalPayment: number
  interestPayment: number
  totalPayment: number
  remainingPrincipal: number
  notes?: string
}

// Helper functions สำหรับแปลงข้อมูลระหว่าง Database และ Frontend
function mapDebtRowToDebt(debtRow: DebtRow, payments: PaymentRow[] = []): Debt {
  return {
    id: debtRow.id,
    borrowerName: debtRow.borrower_name,
    principalAmount: Number(debtRow.principal_amount),
    interestAmount: Number(debtRow.interest_amount),
    paidPrincipal: Number(debtRow.paid_principal),
    paidInterest: Number(debtRow.paid_interest),
    dueDate: debtRow.due_date,
    createdDate: debtRow.created_date,
    interestOnlyPayments: debtRow.interest_only_payments,
    payments: payments.map(mapPaymentRowToPayment)
  }
}

function mapPaymentRowToPayment(paymentRow: PaymentRow): Payment {
  return {
    id: paymentRow.id,
    date: paymentRow.date,
    principalPayment: Number(paymentRow.principal_payment),
    interestPayment: Number(paymentRow.interest_payment),
    totalPayment: Number(paymentRow.total_payment),
    remainingPrincipal: Number(paymentRow.remaining_principal),
    notes: paymentRow.notes || undefined
  }
}

// Database Service Functions
export class DebtService {
  // ดึงหนี้ทั้งหมดพร้อมประวัติการจ่าย
  static async getAllDebts(): Promise<Debt[]> {
    try {
      const { data: debts, error: debtsError } = await supabase
        .from('debts')
        .select('*')
        .order('created_at', { ascending: false })

      if (debtsError) throw debtsError

      // ดึงประวัติการจ่ายสำหรับหนี้ทั้งหมด
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('date', { ascending: false })

      if (paymentsError) throw paymentsError

      // จัดกลุ่มการจ่ายตาม debt_id
      const paymentsMap = new Map<string, PaymentRow[]>()
      payments?.forEach(payment => {
        if (!paymentsMap.has(payment.debt_id)) {
          paymentsMap.set(payment.debt_id, [])
        }
        paymentsMap.get(payment.debt_id)!.push(payment)
      })

      // แปลงข้อมูลและรวมการจ่าย
      return debts?.map(debt => 
        mapDebtRowToDebt(debt, paymentsMap.get(debt.id) || [])
      ) || []

    } catch (error) {
      console.error('Error fetching debts:', error)
      throw error
    }
  }

  // เพิ่มหนี้ใหม่
  static async createDebt(debt: Omit<Debt, 'id' | 'payments'>): Promise<Debt> {
    try {
      const debtInsert: DebtInsert = {
        borrower_name: debt.borrowerName,
        principal_amount: debt.principalAmount,
        interest_amount: debt.interestAmount,
        paid_principal: debt.paidPrincipal,
        paid_interest: debt.paidInterest,
        due_date: debt.dueDate,
        created_date: debt.createdDate,
        interest_only_payments: debt.interestOnlyPayments
      }

      const { data, error } = await supabase
        .from('debts')
        .insert(debtInsert)
        .select()
        .single()

      if (error) throw error

      return mapDebtRowToDebt(data)
    } catch (error) {
      console.error('Error creating debt:', error)
      throw error
    }
  }

  // อัพเดทหนี้
  static async updateDebt(id: string, updates: Partial<Debt>): Promise<Debt> {
    try {
      const debtUpdate: DebtUpdate = {}
      
      if (updates.borrowerName !== undefined) debtUpdate.borrower_name = updates.borrowerName
      if (updates.principalAmount !== undefined) debtUpdate.principal_amount = updates.principalAmount
      if (updates.interestAmount !== undefined) debtUpdate.interest_amount = updates.interestAmount
      if (updates.paidPrincipal !== undefined) debtUpdate.paid_principal = updates.paidPrincipal
      if (updates.paidInterest !== undefined) debtUpdate.paid_interest = updates.paidInterest
      if (updates.dueDate !== undefined) debtUpdate.due_date = updates.dueDate
      if (updates.interestOnlyPayments !== undefined) debtUpdate.interest_only_payments = updates.interestOnlyPayments

      const { data, error } = await supabase
        .from('debts')
        .update(debtUpdate)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return mapDebtRowToDebt(data)
    } catch (error) {
      console.error('Error updating debt:', error)
      throw error
    }
  }

  // ลบหนี้
  static async deleteDebt(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('debts')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting debt:', error)
      throw error
    }
  }

  // เพิ่มประวัติการจ่าย
  static async addPayment(debtId: string, payment: Omit<Payment, 'id'>): Promise<Payment> {
    try {
      const paymentInsert: PaymentInsert = {
        debt_id: debtId,
        date: payment.date,
        principal_payment: payment.principalPayment,
        interest_payment: payment.interestPayment,
        total_payment: payment.totalPayment,
        remaining_principal: payment.remainingPrincipal,
        notes: payment.notes || null
      }

      const { data, error } = await supabase
        .from('payments')
        .insert(paymentInsert)
        .select()
        .single()

      if (error) throw error

      return mapPaymentRowToPayment(data)
    } catch (error) {
      console.error('Error adding payment:', error)
      throw error
    }
  }

  // ดึงประวัติการจ่ายของหนี้เฉพาะ
  static async getPaymentsByDebtId(debtId: string): Promise<Payment[]> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('debt_id', debtId)
        .order('date', { ascending: false })

      if (error) throw error

      return data?.map(mapPaymentRowToPayment) || []
    } catch (error) {
      console.error('Error fetching payments:', error)
      throw error
    }
  }
} 