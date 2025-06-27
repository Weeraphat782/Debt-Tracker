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
  const [loading, setLoading] = useState(true)
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
    return debts.filter((debt) => {
      const status = getPaymentStatus(debt)
      
      // ถ้าเปิด hidePaidDebts และหนี้นี้จ่ายครบแล้ว ให้ซ่อน
      if (hidePaidDebts && status === "paid") {
        return false
      }
      
      // Filter ตามประเภทหนี้
      if (filter === "all") return true
      return status === filter
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

  const filteredDebts = getFilteredDebts()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">📋 แอพจดหนี้</h1>
            <p className="text-sm sm:text-base text-gray-600">จัดการและติดตามหนี้สินของคุณอย่างง่ายดาย</p>
          </div>
          <div className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">📋 แอพจดหนี้</h1>
          <p className="text-sm sm:text-base text-gray-600">จัดการและติดตามหนี้สินของคุณอย่างง่ายดาย</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">ยอดรวมเงินต้นที่ถูกยืมทั้งหมด</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{formatCurrency(getTotalPrincipal())}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">เงินต้นที่คืนแล้วทั้งหมด</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{formatCurrency(getTotalPaidPrincipal())}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">ยอดรวมดอกที่ได้คืน</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">{formatCurrency(getTotalPaidInterest())}</div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มหนี้ใหม่
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>เพิ่มหนี้ใหม่</DialogTitle>
                <DialogDescription>กรอกข้อมูลหนี้ที่ต้องการเพิ่มลงในระบบ</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="borrowerName">ชื่อผู้ยืม</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="borrowerName"
                      placeholder="ชื่อผู้ยืมเงิน"
                      value={formData.borrowerName}
                      onChange={(e) => setFormData({ ...formData, borrowerName: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="principalAmount">จำนวนเงินต้น (บาท)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="principalAmount"
                      type="number"
                      placeholder="1000"
                      value={formData.principalAmount}
                      onChange={(e) => setFormData({ ...formData, principalAmount: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interestAmount">ดอกเบี้ย (บาท)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="interestAmount"
                      type="number"
                      placeholder="250"
                      value={formData.interestAmount}
                      onChange={(e) => setFormData({ ...formData, interestAmount: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-sm text-gray-500">ตัวอย่าง: เงินต้น 1,000 บาท ดอกเบี้ย 250 บาท</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">วันครบกำหนดชำระ</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    'เพิ่มหนี้'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={filter} onValueChange={(value: FilterType) => setFilter(value)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="unpaid">ยังไม่ได้รับคืน</SelectItem>
                  <SelectItem value="partial">ได้รับคืนบางส่วน</SelectItem>
                  <SelectItem value="paid">ได้รับคืนครบแล้ว</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant={hidePaidDebts ? "default" : "outline"}
              size="sm"
              onClick={() => setHidePaidDebts(!hidePaidDebts)}
              className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start"
            >
              {hidePaidDebts ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">ซ่อนหนี้ที่จ่ายครบแล้ว</span>
                  <span className="sm:hidden">ซ่อนหนี้ครบ</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 opacity-50" />
                  <span className="hidden sm:inline">แสดงหนี้ที่จ่ายครบแล้ว</span>
                  <span className="sm:hidden">แสดงหนี้ครบ</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>บันทึกการชำระเงิน</DialogTitle>
              <DialogDescription>{selectedDebt && `บันทึกการชำระเงินของ ${selectedDebt.borrowerName}`}</DialogDescription>
            </DialogHeader>
            {selectedDebt && (
              <form onSubmit={handlePayment} className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">เงินต้นคงเหลือ</p>
                    <p className="font-semibold text-blue-600">{formatCurrency(getRemainingPrincipal(selectedDebt))}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ดอกเบี้ยคงเหลือ</p>
                    <p className="font-semibold text-orange-600">
                      {formatCurrency(getRemainingInterest(selectedDebt))}
                    </p>
                  </div>
                </div>

                {(paymentData.principalPayment === "" || paymentData.principalPayment === "0" || Number.parseFloat(paymentData.principalPayment || "0") === 0) && 
                 (paymentData.interestPayment !== "" && Number.parseFloat(paymentData.interestPayment || "0") > 0) && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 font-medium">
                      🚨 <strong>จ่ายเฉพาะดอกเบี้ย!</strong> เงินต้นยังค้างอยู่ คุณต้องกำหนดวันครบกำหนดใหม่ด้านล่าง
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="principalPayment">ชำระเงินต้น (บาท)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="principalPayment"
                      type="number"
                      placeholder="0"
                      value={paymentData.principalPayment}
                      onChange={(e) => setPaymentData({ ...paymentData, principalPayment: e.target.value })}
                      className="pl-10"
                      max={getRemainingPrincipal(selectedDebt)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interestPayment">ชำระดอกเบี้ย (บาท)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="interestPayment"
                      type="number"
                      placeholder="0"
                      value={paymentData.interestPayment}
                      onChange={(e) => setPaymentData({ ...paymentData, interestPayment: e.target.value })}
                      className="pl-10"
                      max={getRemainingInterest(selectedDebt)}
                    />
                  </div>
                </div>

                {/* ฟิลด์วันครบกำหนดใหม่ เมื่อจ่ายแค่ดอกเบี้ย - บังคับกรอก */}
                {(paymentData.principalPayment === "" || paymentData.principalPayment === "0" || Number.parseFloat(paymentData.principalPayment || "0") === 0) && 
                 (paymentData.interestPayment !== "" && Number.parseFloat(paymentData.interestPayment || "0") > 0) && (
                  <div className="space-y-3 p-5 bg-red-50 border-2 border-red-300 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-red-600" />
                      <Label htmlFor="newDueDate" className="text-red-800 font-bold text-base">
                        📅 กำหนดวันครบกำหนดใหม่ (บังคับกรอก)
                      </Label>
                      <span className="text-red-600 font-bold">*</span>
                    </div>
                    
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-red-600" />
                      <Input
                        id="newDueDate"
                        type="date"
                        value={paymentData.newDueDate}
                        onChange={(e) => setPaymentData({ ...paymentData, newDueDate: e.target.value })}
                        className="pl-10 border-red-400 focus:border-red-600 font-medium"
                        required
                        min={new Date().toISOString().split('T')[0]} // ไม่ให้เลือกวันที่ในอดีต
                      />
                    </div>
                    
                    <div className="bg-red-100 p-3 rounded border border-red-200">
                      <p className="text-sm text-red-800 font-medium">
                        ⚠️ <strong>สำคัญ:</strong> เนื่องจากคุณจ่ายเฉพาะดอกเบี้ย เงินต้น <strong>{formatCurrency(getRemainingPrincipal(selectedDebt))}</strong> ยังค้างอยู่
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        👆 คุณต้องกำหนดวันครบกำหนดใหม่ เพื่อจ่ายเงินต้น + ดอกเบี้ยรอบถัดไป
                      </p>
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={
                    saving ||
                    (!paymentData.principalPayment && !paymentData.interestPayment) ||
                    ((paymentData.principalPayment === "" || paymentData.principalPayment === "0" || Number.parseFloat(paymentData.principalPayment || "0") === 0) && 
                     (paymentData.interestPayment !== "" && Number.parseFloat(paymentData.interestPayment || "0") > 0) && 
                     !paymentData.newDueDate)
                  }
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <DollarSign className="mr-2 h-4 w-4" />
                      {((paymentData.principalPayment === "" || paymentData.principalPayment === "0" || Number.parseFloat(paymentData.principalPayment || "0") === 0) && 
                        (paymentData.interestPayment !== "" && Number.parseFloat(paymentData.interestPayment || "0") > 0))
                        ? 'บันทึกการจ่ายดอกเบี้ย + กำหนดวันใหม่' 
                        : 'บันทึกการชำระ'}
                    </>
                  )}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Debts List */}
        <div className="space-y-4">
          {filteredDebts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-lg font-semibold mb-2">
                  {debts.length === 0 
                    ? "ยังไม่มีหนี้ในระบบ" 
                    : hidePaidDebts && debts.every(debt => getPaymentStatus(debt) === "paid")
                    ? "หนี้ทั้งหมดจ่ายครบแล้ว"
                    : filter === "all" 
                    ? "ไม่มีหนี้ที่ตรงกับเงื่อนไข" 
                    : "ไม่มีหนี้ในหมวดหมู่นี้"}
                </h3>
                <p className="text-muted-foreground text-center">
                  {debts.length === 0 
                    ? "เริ่มต้นโดยการเพิ่มหนี้แรกของคุณ" 
                    : hidePaidDebts && debts.every(debt => getPaymentStatus(debt) === "paid")
                    ? "🎉 ยินดีด้วย! หนี้ทั้งหมดชำระครบแล้ว คลิกปุ่มด้านบนเพื่อแสดงหนี้ที่จ่ายครบ"
                    : "ลองเปลี่ยน Filter หรือตั้งค่าการแสดงผล"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredDebts.map((debt) => {
              const status = getPaymentStatus(debt)
              const remainingTotal = getRemainingPrincipal(debt) + getRemainingInterest(debt)

              return (
                <Card
                  key={debt.id}
                  className={`transition-all hover:shadow-lg ${
                    isOverdue(debt.dueDate) && remainingTotal > 0 ? "border-red-200 bg-red-50" : ""
                  }`}
                >
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                          <User className="h-4 w-4 sm:h-5 sm:w-5" />
                          {debt.borrowerName}
                          {isOverdue(debt.dueDate) && remainingTotal > 0 && (
                            <Badge variant="destructive">เกินกำหนด</Badge>
                          )}
                          {status === "paid" && <Badge className="bg-green-500">ชำระครบแล้ว</Badge>}
                          {status === "partial" && <Badge variant="secondary">ชำระบางส่วน</Badge>}
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">วันที่ให้ยืม: {formatDate(debt.createdDate)}</CardDescription>
                      </div>
                      <div className="flex gap-1 sm:gap-2 flex-wrap">
                        {remainingTotal > 0 && (
                                                      <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openPaymentDialog(debt)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 text-xs sm:text-sm"
                            >
                              <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              <span className="hidden sm:inline">ชำระ</span>
                              <span className="sm:hidden">จ่าย</span>
                            </Button>
                        )}
                                                  <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDebt(debt.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-100"
                            disabled={saving}
                          >
                            {saving ? (
                              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            )}
                          </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="summary" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="summary">สรุป</TabsTrigger>
                        <TabsTrigger value="details">รายละเอียด</TabsTrigger>
                        <TabsTrigger value="history">ประวัติการจ่าย</TabsTrigger>
                      </TabsList>

                      <TabsContent value="summary" className="space-y-3 sm:space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                          <div className="space-y-1">
                            <p className="text-xs sm:text-sm text-muted-foreground">ยอดรวมทั้งหมด</p>
                            <p className="text-sm sm:text-base lg:text-lg font-bold text-purple-600">{formatCurrency(getTotalAmount(debt))}</p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs sm:text-sm text-muted-foreground">ได้รับคืนแล้ว</p>
                            <p className="text-sm sm:text-base lg:text-lg font-semibold text-green-600">
                              {formatCurrency(debt.paidPrincipal + debt.paidInterest)}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs sm:text-sm text-muted-foreground">คงเหลือ</p>
                            <p className="text-sm sm:text-base lg:text-lg font-bold text-red-600">{formatCurrency(remainingTotal)}</p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs sm:text-sm text-muted-foreground">ครบกำหนด</p>
                            <p
                              className={`text-xs sm:text-sm font-medium ${
                                isOverdue(debt.dueDate) && remainingTotal > 0 ? "text-red-600" : "text-gray-900"
                              }`}
                            >
                              {formatDate(debt.dueDate)}
                            </p>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="details" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <h4 className="font-semibold text-blue-600">เงินต้น</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">ยอดรวม:</span>
                                <span className="font-medium">{formatCurrency(debt.principalAmount)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">คืนแล้ว:</span>
                                <span className="font-medium text-green-600">{formatCurrency(debt.paidPrincipal)}</span>
                              </div>
                              <div className="flex justify-between border-t pt-2">
                                <span className="text-sm font-medium">คงเหลือ:</span>
                                <span className="font-bold text-red-600">
                                  {formatCurrency(getRemainingPrincipal(debt))}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h4 className="font-semibold text-orange-600">ดอกเบี้ย</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">ยอดกำหนด:</span>
                                <span className="font-medium">{formatCurrency(debt.interestAmount)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">คืนแล้ว:</span>
                                <span className="font-medium text-green-600">{formatCurrency(debt.paidInterest)}</span>
                              </div>
                              <div className="flex justify-between border-t pt-2">
                                <span className="text-sm font-medium">คงเหลือ:</span>
                                <span className="font-bold text-red-600">
                                  {formatCurrency(getRemainingInterest(debt))}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="history" className="space-y-4">
                        {debt.payments.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>ยังไม่มีประวัติการจ่าย</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {debt.payments.slice().reverse().map((payment) => (
                              <Card key={payment.id} className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1">
                                    <p className="font-medium">
                                      {formatDate(payment.date)}
                                    </p>
                                    <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                                      <div>
                                        <span className="text-gray-500">เงินต้น: </span>
                                        <span className="font-medium text-blue-600">
                                          {formatCurrency(payment.principalPayment)}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">ดอกเบี้ย: </span>
                                        <span className="font-medium text-orange-600">
                                          {formatCurrency(payment.interestPayment)}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="mt-1">
                                      <span className="text-gray-500 text-sm">รวม: </span>
                                      <span className="font-bold text-purple-600">
                                        {formatCurrency(payment.totalPayment)}
                                      </span>
                                    </div>
                                    {payment.notes && (
                                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                                        <AlertTriangle className="h-4 w-4 inline mr-1 text-yellow-600" />
                                        <span className="text-yellow-800">{payment.notes}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
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
