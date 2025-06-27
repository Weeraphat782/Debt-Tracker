import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export type Database = {
  public: {
    Tables: {
      debts: {
        Row: {
          id: string
          borrower_name: string
          principal_amount: number
          interest_amount: number
          paid_principal: number
          paid_interest: number
          due_date: string
          created_date: string
          interest_only_payments: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          borrower_name: string
          principal_amount: number
          interest_amount: number
          paid_principal?: number
          paid_interest?: number
          due_date: string
          created_date: string
          interest_only_payments?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          borrower_name?: string
          principal_amount?: number
          interest_amount?: number
          paid_principal?: number
          paid_interest?: number
          due_date?: string
          created_date?: string
          interest_only_payments?: number
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          debt_id: string
          date: string
          principal_payment: number
          interest_payment: number
          total_payment: number
          remaining_principal: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          debt_id: string
          date: string
          principal_payment: number
          interest_payment: number
          total_payment: number
          remaining_principal: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          debt_id?: string
          date?: string
          principal_payment?: number
          interest_payment?: number
          total_payment?: number
          remaining_principal?: number
          notes?: string | null
          created_at?: string
        }
      }
    }
  }
} 