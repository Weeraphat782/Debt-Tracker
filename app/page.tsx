"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Plus,
  Calendar,
  DollarSign,
  User,
  Calculator,
  Trash2,
  CreditCard,
  Filter,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Search,
  X,
  RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DebtService, type Debt, type Payment } from "@/lib/database"

type FilterType = "all" | "unpaid" | "partial" | "paid"

export default function DebtTracker() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)
  const [filter, setFilter] = useState<FilterType>("all")
  const [hidePaidDebts, setHidePaidDebts] = useState(true) // Default = true เพื่อซ่อนหนี้ที่จ่ายครบแล้ว
  const [searchQuery, setSearchQuery] = useState("") // ค้นหาตามชื่อผู้ยืม
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    borrowerName: "",
    principalAmount: "",
    interestAmount: "",  // จำนวนเงินดอกเบี้ย
    dueDate: "",
  })
  const [paymentData, setPaymentData] = useState({
    principalPayment: "",
    interestPayment: "",
    newDueDate: "",  // วันครบกำหนดใหม่เมื่อจ่ายแค่ดอกเบี้ย
  })

  // Load debts from database on component mount
  useEffect(() => {
    setMounted(true)
    loadDebts()
  }, [])

  const loadDebts = async () => {
    try {
      setLoading(true)
      const allDebts = await DebtService.getAllDebts()
      setDebts(allDebts)
    } catch (error) {
      console.error('Error loading debts:', error)
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  const getRemainingPrincipal = (debt: Debt) => {
    return Math.max(0, debt.principalAmount - debt.paidPrincipal)
  }

  const getRemainingInterest = (debt: Debt) => {
    // ดอกเบี้ยรวม = ดอกเบี้ยเริ่มต้น + (จำนวนครั้งที่จ่ายเฉพาะดอกเบี้ย × ดอกเบี้ยต่อเดือน)
    const totalInterestDue = debt.interestAmount + (debt.interestOnlyPayments * debt.interestAmount)
    return Math.max(0, totalInterestDue - debt.paidInterest)
  }

  const getTotalAmount = (debt: Debt) => {
    return debt.principalAmount + debt.interestAmount
  }

  const getPaymentStatus = (debt: Debt) => {
    const totalRemaining = getRemainingPrincipal(debt) + getRemainingInterest(debt)
    if (totalRemaining === 0) return "paid"
    if (debt.paidPrincipal > 0 || debt.paidInterest > 0) return "partial"
    return "unpaid"
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.borrowerName || !formData.principalAmount || !formData.interestAmount || !formData.dueDate) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน")
      return
    }

    try {
      setSaving(true)
      const newDebt: Omit<Debt, 'id' | 'payments'> = {
        borrowerName: formData.borrowerName,
        principalAmount: Number.parseFloat(formData.principalAmount),
        interestAmount: Number.parseFloat(formData.interestAmount),
        paidPrincipal: 0,
        paidInterest: 0,
        dueDate: formData.dueDate,
        createdDate: new Date().toISOString().split("T")[0],
        interestOnlyPayments: 0,
      }

      const createdDebt = await DebtService.createDebt(newDebt)
      setDebts([...debts, createdDebt])
      setFormData({
        borrowerName: "",
        principalAmount: "",
        interestAmount: "",
        dueDate: "",
      })
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error creating debt:', error)
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    } finally {
      setSaving(false)
    }
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDebt) return

    const principalPayment = Number.parseFloat(paymentData.principalPayment) || 0
    const interestPayment = Number.parseFloat(paymentData.interestPayment) || 0

    // ตรวจสอบและเตือนเมื่อจ่ายแค่ดอกเบี้ย
    if (principalPayment === 0 && interestPayment > 0) {
      if (!paymentData.newDueDate) {
        alert("กรุณากำหนดวันครบกำหนดใหม่เมื่อจ่ายเฉพาะดอกเบี้ย")
        return
      }
      
      const confirmed = confirm(
        "⚠️ คุณกำลังจ่ายเฉพาะดอกเบี้ย!\n\nเงินต้นจะยังคงค้างอยู่ และวันครบกำหนดจะเปลี่ยนเป็น: " + 
        new Date(paymentData.newDueDate).toLocaleDateString('th-TH') + 
        "\n\nคุณต้องการดำเนินการต่อหรือไม่?"
      )
      if (!confirmed) return
    }

    try {
      setSaving(true)
      
      // อัพเดทวันครบกำหนดใหม่เมื่อจ่ายแค่ดอกเบี้ย
      const updatedDueDate = principalPayment === 0 && interestPayment > 0 && paymentData.newDueDate 
        ? paymentData.newDueDate 
        : selectedDebt.dueDate

      const updatedDebt: Debt = {
        ...selectedDebt,
        paidPrincipal: Math.min(selectedDebt.principalAmount, selectedDebt.paidPrincipal + principalPayment),
        // เมื่อจ่ายเฉพาะดอกเบี้ย: บันทึกว่าได้รับดอกเบี้ยคืนแล้ว แต่จะมีดอกเบี้ยใหม่เกิดขึ้น
        paidInterest: principalPayment === 0 && interestPayment > 0 
          ? selectedDebt.paidInterest + interestPayment  // บันทึกดอกเบี้ยที่ได้รับคืน
          : Math.min(selectedDebt.interestAmount + (selectedDebt.interestOnlyPayments * selectedDebt.interestAmount), selectedDebt.paidInterest + interestPayment),
        // นับจำนวนครั้งที่จ่ายเฉพาะดอกเบี้ย (เพิ่มก่อนคำนวณ paidInterest)
        interestOnlyPayments: principalPayment === 0 && interestPayment > 0 
          ? selectedDebt.interestOnlyPayments + 1  // เพิ่มจำนวนครั้งที่จ่ายเฉพาะดอกเบี้ย
          : selectedDebt.interestOnlyPayments,
        dueDate: updatedDueDate,
      }

      const newPayment: Omit<Payment, 'id'> = {
        date: new Date().toISOString().split("T")[0],
        principalPayment,
        interestPayment,
        totalPayment: principalPayment + interestPayment,
        remainingPrincipal: selectedDebt.principalAmount - (selectedDebt.paidPrincipal + principalPayment),
        notes: principalPayment === 0 ? "จ่ายดอกเบี้ยเท่านั้น - เงินต้นยังค้างอยู่" : undefined
      }

      // Update debt and add payment to database
      await DebtService.updateDebt(selectedDebt.id, updatedDebt)
      const createdPayment = await DebtService.addPayment(selectedDebt.id, newPayment)

      // Update local state
      const updatedDebts = debts.map((debt) => {
        if (debt.id === selectedDebt.id) {
          return {
            ...updatedDebt,
            payments: [...debt.payments, createdPayment],
          }
        }
        return debt
      })

      setDebts(updatedDebts)
      setPaymentData({ principalPayment: "", interestPayment: "", newDueDate: "" })
      setIsPaymentDialogOpen(false)
      setSelectedDebt(null)
    } catch (error) {
      console.error('Error processing payment:', error)
      alert('เกิดข้อผิดพลาดในการบันทึกการจ่ายเงิน')
    } finally {
      setSaving(false)
    }
  }

  const openPaymentDialog = (debt: Debt) => {
    setSelectedDebt(debt)
    setIsPaymentDialogOpen(true)
  }

  const deleteDebt = async (id: string) => {
    try {
      setSaving(true)
      await DebtService.deleteDebt(id)
      setDebts(debts.filter((debt) => debt.id !== id))
    } catch (error) {
      console.error('Error deleting debt:', error)
      alert('เกิดข้อผิดพลาดในการลบข้อมูล')
    } finally {
      setSaving(false)
    }
  }

  const handleRollOverInterest = async (debt: Debt) => {
    const nextMonth = new Date(debt.dueDate)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    
    // จัดการกรณีวันที่ 31 ทบไปเดือนที่มีน้อยกว่า 31 วัน
    if (nextMonth.getDate() !== new Date(debt.dueDate).getDate()) {
      nextMonth.setDate(0) // วันสุดท้ายของเดือนก่อนหน้า
    }
    
    const formattedNextMonth = nextMonth.toISOString().split('T')[0]
    
    const confirmed = confirm(
      `⚠️ ยืนยันการทบยอดดอกเบี้ย?\n\n` +
      `ดอกเบี้ยจะค้างสะสมเพิ่มขึ้นอีก ${formatCurrency(debt.interestAmount)}\n` +
      `และวันครบกำหนดจะเปลี่ยนเป็น: ${formatDate(formattedNextMonth)}\n\n` +
      `คุณต้องการดำเนินการต่อหรือไม่?`
    )
    
    if (!confirmed) return

    try {
      setSaving(true)
      const updatedDebt = {
        ...debt,
        interestOnlyPayments: debt.interestOnlyPayments + 1,
        dueDate: formattedNextMonth,
      }

      await DebtService.updateDebt(debt.id, updatedDebt)
      
      // 📝 เพิ่มบันทึกลงในประวัติว่ามีการทบยอด
      // ยอดดอกเบี้ยรวมใหม่ = ดอกเบี้ยต่อรอบ * (1 + จำนวนครั้งที่ทบยอด)
      const newTotalInterestEachPeriod = debt.interestAmount + (updatedDebt.interestOnlyPayments * debt.interestAmount)

      const rollOverPayment: Omit<Payment, 'id'> = {
        date: new Date().toISOString().split("T")[0],
        principalPayment: 0,
        interestPayment: 0,
        totalPayment: 0,
        remainingPrincipal: debt.principalAmount - debt.paidPrincipal,
        notes: `🔄 ทบยอดดอกเบี้ยไปเดือนถัดไป (ยอดค้างรวม: ${formatCurrency(newTotalInterestEachPeriod - debt.paidInterest)})`
      }
      
      await DebtService.addPayment(debt.id, rollOverPayment)
      
      // ✅ Re-fetch debts from database to ensure UI is perfectly in sync
      await loadDebts()
    } catch (error) {
      console.error('Error rolling over interest:', error)
      alert('เกิดข้อผิดพลาดในการทบยอดดอกเบี้ย')
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getFilteredDebts = () => {
    const filtered = debts.filter((debt) => {
      const status = getPaymentStatus(debt)
      
      // ถ้าเปิด hidePaidDebts และหนี้นี้จ่ายครบแล้ว ให้ซ่อน
      if (hidePaidDebts && status === "paid") {
        return false
      }
      
      // Filter ตามชื่อผู้ยืม
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase().trim()
        if (!debt.borrowerName.toLowerCase().includes(query)) {
          return false
        }
      }
      
      // Filter ตามประเภทหนี้
      if (filter === "all") return true
      return status === filter
    })

    // เรียงลำดับตามวันครบกำหนด: ใกล้ครบกำหนดที่สุดแสดงก่อน
    return filtered.sort((a, b) => {
      const statusA = getPaymentStatus(a)
      const statusB = getPaymentStatus(b)
      
      // หนี้ที่จ่ายครบแล้วให้อยู่ท้ายสุด
      if (statusA === "paid" && statusB !== "paid") return 1
      if (statusA !== "paid" && statusB === "paid") return -1
      
      // หนี้ที่เกินกำหนดให้อยู่ด้านบนสุด
      const isOverdueA = isOverdue(a.dueDate) && (getRemainingPrincipal(a) + getRemainingInterest(a)) > 0
      const isOverdueB = isOverdue(b.dueDate) && (getRemainingPrincipal(b) + getRemainingInterest(b)) > 0
      
      if (isOverdueA && !isOverdueB) return -1
      if (!isOverdueA && isOverdueB) return 1
      
      // เรียงตามวันครบกำหนด (วันที่ใกล้ที่สุดก่อน)
      const dateA = new Date(a.dueDate).getTime()
      const dateB = new Date(b.dueDate).getTime()
      
      return dateA - dateB
    })
  }

  const getTotalDebtAmount = () => {
    return debts.reduce((total, debt) => total + getTotalAmount(debt), 0)
  }

  const getTotalPrincipal = () => {
    return debts.reduce((total, debt) => total + debt.principalAmount, 0)
  }

  const getTotalInterest = () => {
    return debts.reduce((total, debt) => total + debt.interestAmount, 0)
  }

  const getTotalPaid = () => {
    return debts.reduce((total, debt) => total + debt.paidPrincipal + debt.paidInterest, 0)
  }

  const getTotalPaidPrincipal = () => {
    return debts.reduce((total, debt) => total + debt.paidPrincipal, 0)
  }

  const getTotalPaidInterest = () => {
    return debts.reduce((total, debt) => total + debt.paidInterest, 0)
  }

  // ดึงรายชื่อผู้ยืมทั้งหมด (ไม่ซ้ำ)
  const getAllBorrowerNames = () => {
    const names = debts.map(debt => debt.borrowerName)
    return [...new Set(names)].sort()
  }

  const filteredDebts = getFilteredDebts()

  // 🚨 HYDRATION FIX: Return null on server and before client-side mount
  if (!mounted) {
    return null
  }

  // 🔄 LOADING STATE: Only show after mounting to ensure stable hydration
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-3 sm:p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center animate-in fade-in duration-500">
          <div className="w-16 h-16 bg-secondary rounded-2xl border-4 border-primary shadow-lg flex items-center justify-center animate-bounce">
            <span className="text-[10px] font-black text-primary uppercase text-center leading-none">FNV<br/>STATION</span>
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-primary uppercase tracking-tighter">FNV Debt Tracker</h2>
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <p className="text-xs font-bold text-primary opacity-60 uppercase tracking-widest">กำลังดำเนินการ...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6 pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex flex-col items-center gap-5 py-8 border-b-2 border-primary/10">
          {/* 📸 LOGO GROUP: Branding area with 3 symmetrical slots */}
          <div className="flex items-center gap-3">
            {/* SLOT 2: Moved to left */}
            <div className="w-20 h-20 bg-secondary rounded-2xl border-4 border-primary shadow-lg overflow-hidden shrink-0 transition-all hover:scale-105">
              <img 
                src="/3_d62c59a3-c43b-42b2-b064-f93135086b1a.webp" 
                alt="Branding Slot 2" 
                className="w-full h-full object-cover" 
              />
            </div>
            
            {/* SLOT 1: Primary FNV Logo (Now in center as requested) */}
            <div className="w-20 h-20 bg-secondary rounded-2xl border-4 border-primary shadow-lg overflow-hidden shrink-0 transition-all hover:scale-105">
              <img 
                src="/a0e96d9e-618c-431d-b7dc-b9f9dc11f1dd.jpg" 
                alt="FNV Logo" 
                className="w-full h-full object-cover" 
              />
            </div>

            {/* SLOT 3: Stays on right */}
            <div className="w-20 h-20 bg-secondary rounded-2xl border-4 border-primary shadow-lg overflow-hidden shrink-0 transition-all hover:scale-105">
              <img 
                src="/bef7623f-b8e9-41c8-9b22-8d0927dd20f3.jpg" 
                alt="Branding Slot 3" 
                className="w-full h-full object-cover" 
              />
            </div>
          </div>
          
          {/* Header Title & Info Area */}
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-accent text-primary font-black px-2 py-0.5 text-[10px] uppercase tracking-widest rounded-md border-none shadow-sm">
                V 2.1
              </Badge>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-secondary/30 px-2 py-0.5 rounded">
                Official App
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-primary tracking-tighter uppercase leading-none mb-1">
              FNV Debt Tracker
            </h1>
            <p className="text-xs font-black text-primary/70 uppercase tracking-widest">
              ระบบจัดการหนี้สินและดอกเบี้ยระดับพรีเมียม
            </p>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="bg-accent text-primary border-2 border-primary/20 shadow-md overflow-hidden relative rounded-2xl">
            <div className="absolute -right-3 -top-3 opacity-10">
              <DollarSign className="h-16 w-16" />
            </div>
            <CardHeader className="pb-1 p-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-wider opacity-60">ยอดเงินต้นทั้งหมด</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-black">{formatCurrency(getTotalPrincipal())}</div>
            </CardContent>
          </Card>

          <Card className="bg-secondary text-secondary-foreground border-none shadow-md overflow-hidden relative rounded-2xl">
            <div className="absolute -right-3 -top-3 opacity-10">
              <CheckCircle className="h-16 w-16" />
            </div>
            <CardHeader className="pb-1 p-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-wider opacity-80">คืนเงินต้นแล้ว</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-black">{formatCurrency(getTotalPaidPrincipal())}</div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-card border-4 border-primary shadow-md overflow-hidden relative rounded-2xl">
            <div className="absolute -right-3 -top-3 opacity-5">
              <Calculator className="h-16 w-16 text-primary" />
            </div>
            <CardHeader className="pb-1 p-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">ดอกเบี้ยที่ได้แล้ว</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-black text-primary">{formatCurrency(getTotalPaidInterest())}</div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="h-12 text-base font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg flex-1 rounded-xl">
                  <Plus className="mr-2 h-5 w-5" />
                  เพิ่มหนี้ใหม่
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] border-4 border-primary rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black text-primary">เพิ่มหนี้ใหม่</DialogTitle>
                  <DialogDescription className="font-bold text-muted-foreground text-xs">กรอกข้อมูลหนี้ที่ต้องการเพิ่มลงในระบบ</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                  <div className="space-y-1">
                    <Label htmlFor="borrowerName" className="text-sm font-black">ชื่อผู้ยืม</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                      <Input
                        id="borrowerName"
                        placeholder="ชื่อผู้ยืมเงิน"
                        value={formData.borrowerName}
                        onChange={(e) => setFormData({ ...formData, borrowerName: e.target.value })}
                        className="pl-11 h-11 border-2 border-primary/20 focus:border-primary font-bold text-sm rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="principalAmount" className="text-sm font-black">เงินต้น (บาท)</Label>
                      <Input
                        id="principalAmount"
                        type="number"
                        placeholder="0"
                        value={formData.principalAmount}
                        onChange={(e) => setFormData({ ...formData, principalAmount: e.target.value })}
                        className="h-11 border-2 border-primary/20 focus:border-primary font-bold text-sm rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="interestAmount" className="text-sm font-black">ดอกเบี้ย (บาท)</Label>
                      <Input
                        id="interestAmount"
                        type="number"
                        placeholder="0"
                        value={formData.interestAmount}
                        onChange={(e) => setFormData({ ...formData, interestAmount: e.target.value })}
                        className="h-11 border-2 border-primary/20 focus:border-primary font-bold text-sm rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="dueDate" className="text-sm font-black">วันครบกำหนด</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="h-11 border-2 border-primary/20 focus:border-primary font-bold text-sm rounded-xl"
                    />
                  </div>

                  <Button type="submit" className="w-full h-11 text-base font-black bg-primary rounded-xl" disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "บันทึกข้อมูล"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Search and Filters Row */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <Input
                placeholder="🔍 ค้นหาชื่อผู้ยืม..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 border-4 border-primary/10 focus:border-primary font-bold text-base rounded-xl shadow-sm"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 p-0 hover:bg-primary/10 rounded-xl"
                >
                  <X className="h-6 w-6 text-primary" />
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="flex-1 min-w-[140px]">
                <Select value={filter} onValueChange={(value: FilterType) => setFilter(value)}>
                  <SelectTrigger className="h-10 border-2 border-primary/20 font-bold rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      <Filter className="h-3 w-3" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="border-2 border-primary rounded-lg font-bold">
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="unpaid">ยังไม่คืน</SelectItem>
                    <SelectItem value="partial">คืนบางส่วน</SelectItem>
                    <SelectItem value="paid">คืนครบแล้ว</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant={hidePaidDebts ? "default" : "outline"}
                size="sm"
                onClick={() => setHidePaidDebts(!hidePaidDebts)}
                className={`h-10 font-bold rounded-lg border-2 flex-1 min-w-[140px] text-xs ${
                  hidePaidDebts ? "bg-primary text-primary-foreground border-primary" : "border-primary/20 text-primary"
                }`}
              >
                {hidePaidDebts ? <CheckCircle className="mr-2 h-4 w-4" /> : <X className="mr-2 h-4 w-4" />}
                {hidePaidDebts ? "ซ่อนที่คืนครบ" : "แสดงที่คืนครบ"}
              </Button>
            </div>
          </div>
        </div>

        {/* Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="sm:max-w-[450px] border-4 border-primary rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-primary">บันทึกการชำระเงิน</DialogTitle>
              <DialogDescription className="font-bold text-muted-foreground text-xs">
                {selectedDebt && `บัญชี: ${selectedDebt.borrowerName}`}
              </DialogDescription>
            </DialogHeader>
            {selectedDebt && (
              <form onSubmit={handlePayment} className="space-y-6">
                <div className="grid grid-cols-2 gap-4 p-3 bg-secondary/10 rounded-xl border-2 border-secondary/20">
                  <div className="space-y-1 text-center">
                    <p className="text-[10px] font-black uppercase text-primary/60">เงินต้นคงเหลือ</p>
                    <p className="text-lg font-black text-primary">{formatCurrency(getRemainingPrincipal(selectedDebt))}</p>
                  </div>
                  <div className="space-y-1 text-center border-l-2 border-secondary/20">
                    <p className="text-[10px] font-black uppercase text-primary/60">ดอกเบี้ยคงเหลือ</p>
                    <p className="text-lg font-black text-primary">
                      {formatCurrency(getRemainingInterest(selectedDebt))}
                    </p>
                  </div>
                </div>

                {(paymentData.principalPayment === "" || paymentData.principalPayment === "0" || Number.parseFloat(paymentData.principalPayment || "0") === 0) && 
                 (paymentData.interestPayment !== "" && Number.parseFloat(paymentData.interestPayment || "0") > 0) && (
                  <Alert className="border-destructive bg-destructive/10">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <AlertDescription className="text-destructive font-black text-xs">
                      🚨 จ่ายเฉพาะดอกเบี้ย! ต้องกำหนดวันครบกำหนดใหม่
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="principalPayment" className="text-sm font-black">ชำระเงินต้น (บาท)</Label>
                    <Input
                      id="principalPayment"
                      type="number"
                      placeholder="0"
                      value={paymentData.principalPayment}
                      onChange={(e) => setPaymentData({ ...paymentData, principalPayment: e.target.value })}
                      className="h-11 border-2 border-primary/20 font-bold text-base focus:border-primary rounded-xl"
                      max={getRemainingPrincipal(selectedDebt)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interestPayment" className="text-sm font-black">ชำระดอกเบี้ย (บาท)</Label>
                    <Input
                      id="interestPayment"
                      type="number"
                      placeholder="0"
                      value={paymentData.interestPayment}
                      onChange={(e) => setPaymentData({ ...paymentData, interestPayment: e.target.value })}
                      className="h-11 border-2 border-primary/20 font-bold text-base focus:border-primary rounded-xl"
                      max={getRemainingInterest(selectedDebt)}
                    />
                  </div>

                  {/* วันครบกำหนดใหม่ */}
                  {(paymentData.principalPayment === "" || paymentData.principalPayment === "0" || Number.parseFloat(paymentData.principalPayment || "0") === 0) && 
                   (paymentData.interestPayment !== "" && Number.parseFloat(paymentData.interestPayment || "0") > 0) && (
                    <div className="p-3 bg-primary/5 border-2 border-primary rounded-xl space-y-2">
                      <Label htmlFor="newDueDate" className="text-primary font-black flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        กำหนดวันครบกำหนดใหม่
                      </Label>
                      <Input
                        id="newDueDate"
                        type="date"
                        value={paymentData.newDueDate}
                        onChange={(e) => setPaymentData({ ...paymentData, newDueDate: e.target.value })}
                        className="h-11 border-2 border-primary font-bold bg-white text-sm rounded-lg"
                        required
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-black bg-primary shadow-md rounded-xl"
                  disabled={
                    saving ||
                    (!paymentData.principalPayment && !paymentData.interestPayment) ||
                    ((paymentData.principalPayment === "" || paymentData.principalPayment === "0" || Number.parseFloat(paymentData.principalPayment || "0") === 0) && 
                     (paymentData.interestPayment !== "" && Number.parseFloat(paymentData.interestPayment || "0") > 0) && 
                     !paymentData.newDueDate)
                  }
                >
                  {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "ยืนยันการชำระเงิน"}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Debts List */}
        <div className="space-y-4">
          {filteredDebts.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-primary/5 border-2 border-primary/20 rounded-xl">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-[10px] text-primary font-black uppercase tracking-tight">
                เรียงตามวันครบกำหนด 📅
              </span>
            </div>
          )}
          
          {filteredDebts.length === 0 ? (
            <Card className="border-2 border-dashed border-primary/20 bg-primary/5 rounded-2xl">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-6xl mb-4 grayscale opacity-20">📂</div>
                <h3 className="text-lg font-black text-primary mb-1">
                  {debts.length === 0 
                    ? "ยังไม่มีหนี้ในระบบ" 
                    : searchQuery.trim() !== "" 
                    ? `ไม่พบหน้าของ "${searchQuery}"`
                    : "ไม่มีรายการที่ตรงเงื่อนไข"}
                </h3>
                <p className="text-xs text-muted-foreground font-bold text-center">
                  ลองเพิ่มหนี้ใหม่ หรือเปลี่ยนเงื่อนไขการค้นหา
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredDebts.map((debt) => {
              const status = getPaymentStatus(debt)
              const remainingTotal = getRemainingPrincipal(debt) + getRemainingInterest(debt)
              const overdue = isOverdue(debt.dueDate) && remainingTotal > 0

              return (
                <Card
                  key={debt.id}
                  className={`group transition-all hover:shadow-lg border-2 rounded-2xl overflow-hidden ${
                    overdue ? "border-destructive bg-destructive/5" : "border-primary/5 hover:border-primary/20"
                  }`}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-primary text-primary-foreground rounded-xl shadow-md">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-black text-primary tracking-tight leading-tight">
                              {debt.borrowerName}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-0.5">
                              {overdue && <Badge className="bg-destructive text-white font-black text-[10px] py-0.5 px-2 leading-tight">เกินกำหนด!</Badge>}
                              {status === "paid" && <Badge className="bg-green-600 text-white font-black text-[10px] py-0.5 px-2 leading-tight">คืนครบ ✅</Badge>}
                              {status === "partial" && <Badge className="bg-secondary text-secondary-foreground font-black border border-primary/10 text-[10px] py-0.5 px-2 leading-tight">บางส่วน</Badge>}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        {overdue && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleRollOverInterest(debt)}
                            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-black px-3 h-9 rounded-lg text-[10px] shadow-sm border border-primary/10"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            ทบยอด
                          </Button>
                        )}
                        {remainingTotal > 0 && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => openPaymentDialog(debt)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-4 h-9 rounded-lg text-xs shadow-md"
                          >
                            <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                            ชำระ
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteDebt(debt.id)}
                          className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-2">
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                        <p className="text-[9px] font-black uppercase text-primary/60 mb-0.5">ให้ยืม</p>
                        <p className="text-xs font-black text-primary">{formatDate(debt.createdDate)}</p>
                      </div>
                      <div className={`p-3 rounded-xl border ${overdue ? "bg-destructive/10 border-destructive/20" : "bg-secondary/10 border-secondary/20"}`}>
                        <p className={`text-[9px] font-black uppercase mb-0.5 ${overdue ? "text-destructive/80" : "text-primary/60"}`}>ครบกำหนด</p>
                        <p className={`text-xs font-black ${overdue ? "text-destructive" : "text-primary"}`}>{formatDate(debt.dueDate)}</p>
                      </div>
                    </div>

                    <Tabs defaultValue="summary" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 h-9 p-0.5 bg-muted rounded-lg mb-3">
                        <TabsTrigger value="summary" className="font-black text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">สรุป</TabsTrigger>
                        <TabsTrigger value="details" className="font-black text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">ยอดโอน</TabsTrigger>
                        <TabsTrigger value="history" className="font-black text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">ประวัติ</TabsTrigger>
                      </TabsList>

                      <TabsContent value="summary" className="mt-0">
                        <div className="p-4 bg-accent text-primary rounded-2xl shadow-sm border border-primary/10 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-2 opacity-5">
                            <DollarSign className="h-12 w-12" />
                          </div>
                          <div className="flex justify-between items-end">
                            <div className="space-y-0.5">
                              <p className="text-[9px] font-black uppercase opacity-60">ยอดค้างชำระ</p>
                              <p className="text-2xl font-black">{formatCurrency(remainingTotal)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] font-black uppercase opacity-60">รวม</p>
                              <p className="text-base font-bold">{formatCurrency(getTotalAmount(debt))}</p>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="details">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                              <h4 className="font-black text-primary uppercase text-[9px]">เงินต้น</h4>
                            </div>
                            <div className="space-y-1 p-3 bg-primary/5 rounded-xl border border-primary/10">
                              <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                                <span>รวม:</span>
                                <span>{formatCurrency(debt.principalAmount)}</span>
                              </div>
                              <div className="flex justify-between text-[9px] font-bold text-green-600">
                                <span>คืนแล้ว:</span>
                                <span>{formatCurrency(debt.paidPrincipal)}</span>
                              </div>
                              <div className="pt-1 border-t border-primary/10 flex justify-between font-black text-primary text-[10px]">
                                <span>คงเหลือ:</span>
                                <span>{formatCurrency(getRemainingPrincipal(debt))}</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                              <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                              <h4 className="font-black text-primary uppercase text-[9px]">ดอกเบี้ย</h4>
                            </div>
                            <div className="space-y-1 p-3 bg-secondary/5 rounded-xl border border-secondary/20">
                              <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                                <span>กำหนด:</span>
                                <span>{formatCurrency(debt.interestAmount)}</span>
                              </div>
                              <div className="flex justify-between text-[9px] font-bold text-green-600">
                                <span>คืนแล้ว:</span>
                                <span>{formatCurrency(debt.paidInterest)}</span>
                              </div>
                              <div className="pt-1 border-t border-secondary/20 flex justify-between font-black text-primary text-[10px]">
                                <span>คงเหลือ:</span>
                                <span>{formatCurrency(getRemainingInterest(debt))}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="history">
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar p-0.5">
                          {debt.payments.length === 0 ? (
                            <div className="text-center py-8 bg-primary/5 rounded-xl border border-dashed border-primary/20">
                              <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-20 text-primary" />
                              <p className="font-black text-primary/40 uppercase text-[9px]">ไม่มีประวัติ</p>
                            </div>
                          ) : (
                            debt.payments.slice().reverse().map((payment) => (
                              <Card key={payment.id} className="p-3 border border-primary/10 rounded-xl font-black text-primary shadow-sm hover:shadow-md transition-all active:scale-95">
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1.5">
                                      <div className="h-6 w-6 bg-primary/10 rounded text-primary flex items-center justify-center">
                                        <Calendar className="h-3 w-3" />
                                      </div>
                                      <p className="font-black text-primary text-[10px]">{formatDate(payment.date)}</p>
                                    </div>
                                    <Badge className="bg-primary/20 text-primary hover:bg-primary/20 border-none font-black text-[9px] h-4">
                                      {formatCurrency(payment.totalPayment)}
                                    </Badge>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="p-2 bg-secondary/5 rounded-lg border border-secondary/10">
                                      <p className="text-[8px] font-black uppercase text-primary/40 leading-none mb-1">เงินต้น</p>
                                      <p className="font-black text-primary text-[10px] leading-none">{formatCurrency(payment.principalPayment)}</p>
                                    </div>
                                    <div className="p-2 bg-primary/5 rounded-lg border border-primary/10">
                                      <p className="text-[8px] font-black uppercase text-primary/40 leading-none mb-1">ดอกเบี้ย</p>
                                      <p className="font-black text-primary text-[10px] leading-none">{formatCurrency(payment.interestPayment)}</p>
                                    </div>
                                  </div>

                                  {payment.notes && (
                                    <div className="p-2 bg-yellow-400/20 text-yellow-900 rounded-lg font-bold text-[9px] flex gap-1.5 items-start">
                                      <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                      <span>{payment.notes}</span>
                                    </div>
                                  )}
                                </div>
                              </Card>
                            ))
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
