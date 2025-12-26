import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import {
  Calculator,
  DollarSign,
  FileText,
  Receipt,
  Shield,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const Route = createFileRoute('/tinh-luong-gross-net')({
  component: TinhLuongGrossNetPage,
})

// Tỷ lệ bảo hiểm (theo quy định hiện hành)
const BHXH_RATE = 0.08 // 8%
const BHYT_RATE = 0.015 // 1.5%
const BHTN_RATE = 0.01 // 1%
const TOTAL_INSURANCE_RATE = BHXH_RATE + BHYT_RATE + BHTN_RATE // 10.5%

// Mức giảm trừ gia cảnh mới từ 1/1/2026
const GIAM_TRU_BAN_THAN = 15_500_000 // 15.5 triệu đồng/tháng
const GIAM_TRU_NGUOI_PHU_THUOC = 6_200_000 // 6.2 triệu đồng/tháng/người

// Biểu thuế lũy tiến từng phần mới từ 1/1/2026
interface TaxBracket {
  min: number
  max: number
  rate: number
}

const TAX_BRACKETS_2026: Array<TaxBracket> = [
  { min: 0, max: 10_000_000, rate: 0.05 }, // Đến 10 triệu: 5%
  { min: 10_000_000, max: 30_000_000, rate: 0.1 }, // Trên 10 đến 30 triệu: 10%
  { min: 30_000_000, max: 60_000_000, rate: 0.2 }, // Trên 30 đến 60 triệu: 20%
  { min: 60_000_000, max: 100_000_000, rate: 0.3 }, // Trên 60 đến 100 triệu: 30%
  { min: 100_000_000, max: Infinity, rate: 0.35 }, // Trên 100 triệu: 35%
]

// Biểu thuế cũ (để so sánh)
const TAX_BRACKETS_OLD: Array<TaxBracket> = [
  { min: 0, max: 5_000_000, rate: 0.05 },
  { min: 5_000_000, max: 10_000_000, rate: 0.1 },
  { min: 10_000_000, max: 18_000_000, rate: 0.15 },
  { min: 18_000_000, max: 32_000_000, rate: 0.2 },
  { min: 32_000_000, max: 52_000_000, rate: 0.25 },
  { min: 52_000_000, max: 80_000_000, rate: 0.3 },
  { min: 80_000_000, max: Infinity, rate: 0.35 },
]

// Mức giảm trừ cũ
const GIAM_TRU_BAN_THAN_OLD = 11_000_000 // 11 triệu đồng/tháng
const GIAM_TRU_NGUOI_PHU_THUOC_OLD = 4_400_000 // 4.4 triệu đồng/tháng/người

function calculateTax(income: number, brackets: Array<TaxBracket>): number {
  let tax = 0
  let remainingIncome = income

  for (const bracket of brackets) {
    if (remainingIncome <= 0) break

    const taxableInBracket = Math.min(
      remainingIncome,
      bracket.max === Infinity ? remainingIncome : bracket.max - bracket.min
    )

    if (taxableInBracket > 0) {
      tax += taxableInBracket * bracket.rate
      remainingIncome -= taxableInBracket
    }
  }

  return tax
}

function TinhLuongGrossNetPage() {
  const [salaryType, setSalaryType] = useState<'gross' | 'net'>('gross')
  const [salaryAmount, setSalaryAmount] = useState<string>('')
  const [soNguoiPhuThuoc, setSoNguoiPhuThuoc] = useState<string>('0')

  const soNguoiPhuThuocNum = parseInt(soNguoiPhuThuoc) || 0
  const salaryNum = parseFloat(salaryAmount) || 0

  // Tính toán theo chính sách mới (2026)
  const calculations = useMemo(() => {
    if (salaryNum <= 0) {
      return null
    }

    let grossSalary: number
    let netSalary: number
    let bhxh: number
    let bhyt: number
    let bhtn: number
    let totalInsurance: number
    let giamTruGiaCanh: number
    let thuNhapChiuThue: number
    let thueTNCN: number

    if (salaryType === 'gross') {
      grossSalary = salaryNum
      bhxh = grossSalary * BHXH_RATE
      bhyt = grossSalary * BHYT_RATE
      bhtn = grossSalary * BHTN_RATE
      totalInsurance = bhxh + bhyt + bhtn

      giamTruGiaCanh = GIAM_TRU_BAN_THAN + soNguoiPhuThuocNum * GIAM_TRU_NGUOI_PHU_THUOC
      thuNhapChiuThue = Math.max(0, grossSalary - totalInsurance - giamTruGiaCanh)
      thueTNCN = calculateTax(thuNhapChiuThue, TAX_BRACKETS_2026)
      netSalary = grossSalary - totalInsurance - thueTNCN
    } else {
      // Tính ngược từ Net sang Gross (phức tạp hơn vì thuế phụ thuộc vào gross)
      // Sử dụng phương pháp lặp để tìm gross
      netSalary = salaryNum
      let estimatedGross = netSalary / (1 - TOTAL_INSURANCE_RATE - 0.1) // Ước tính ban đầu
      let iterations = 0
      const maxIterations = 100
      const tolerance = 1000 // Độ chính xác 1000 đồng

      while (iterations < maxIterations) {
        bhxh = estimatedGross * BHXH_RATE
        bhyt = estimatedGross * BHYT_RATE
        bhtn = estimatedGross * BHTN_RATE
        totalInsurance = bhxh + bhyt + bhtn

        giamTruGiaCanh = GIAM_TRU_BAN_THAN + soNguoiPhuThuocNum * GIAM_TRU_NGUOI_PHU_THUOC
        thuNhapChiuThue = Math.max(0, estimatedGross - totalInsurance - giamTruGiaCanh)
        thueTNCN = calculateTax(thuNhapChiuThue, TAX_BRACKETS_2026)

        const calculatedNet = estimatedGross - totalInsurance - thueTNCN
        const difference = Math.abs(calculatedNet - netSalary)

        if (difference < tolerance) {
          break
        }

        // Điều chỉnh ước tính
        const adjustment = (netSalary - calculatedNet) / (1 - TOTAL_INSURANCE_RATE)
        estimatedGross += adjustment
        iterations++
      }

      grossSalary = estimatedGross
      bhxh = grossSalary * BHXH_RATE
      bhyt = grossSalary * BHYT_RATE
      bhtn = grossSalary * BHTN_RATE
      totalInsurance = bhxh + bhyt + bhtn
      giamTruGiaCanh = GIAM_TRU_BAN_THAN + soNguoiPhuThuocNum * GIAM_TRU_NGUOI_PHU_THUOC
      thuNhapChiuThue = Math.max(0, grossSalary - totalInsurance - giamTruGiaCanh)
      thueTNCN = calculateTax(thuNhapChiuThue, TAX_BRACKETS_2026)
    }

    return {
      grossSalary,
      netSalary,
      bhxh,
      bhyt,
      bhtn,
      totalInsurance,
      giamTruGiaCanh,
      thuNhapChiuThue,
      thueTNCN,
    }
  }, [salaryNum, salaryType, soNguoiPhuThuocNum])

  // Tính toán theo chính sách cũ (để so sánh)
  const calculationsOld = useMemo(() => {
    if (!calculations) return null

    const grossSalary = calculations.grossSalary
    const bhxh = grossSalary * BHXH_RATE
    const bhyt = grossSalary * BHYT_RATE
    const bhtn = grossSalary * BHTN_RATE
    const totalInsurance = bhxh + bhyt + bhtn

    const giamTruGiaCanh =
      GIAM_TRU_BAN_THAN_OLD + soNguoiPhuThuocNum * GIAM_TRU_NGUOI_PHU_THUOC_OLD
    const thuNhapChiuThue = Math.max(0, grossSalary - totalInsurance - giamTruGiaCanh)
    const thueTNCN = calculateTax(thuNhapChiuThue, TAX_BRACKETS_OLD)
    const netSalary = grossSalary - totalInsurance - thueTNCN

    return {
      grossSalary,
      netSalary,
      bhxh,
      bhyt,
      bhtn,
      totalInsurance,
      giamTruGiaCanh,
      thuNhapChiuThue,
      thueTNCN,
    }
  }, [calculations, soNguoiPhuThuocNum])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(Math.round(amount))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <Calculator className="w-10 h-10 text-purple-600" />
            Tính Lương Gross / Net 2026
          </h1>
          <p className="text-gray-600 text-lg">
            Tính toán lương Gross và Net theo chính sách thuế TNCN mới từ 1/1/2026
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Form nhập liệu */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Thông tin nhập liệu</CardTitle>
              <CardDescription>Nhập thông tin để tính lương</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="salaryType">Loại lương</Label>
                <Select value={salaryType} onValueChange={(v) => setSalaryType(v as 'gross' | 'net')}>
                  <SelectTrigger id="salaryType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gross">Lương Gross (Trước thuế)</SelectItem>
                    <SelectItem value="net">Lương Net (Sau thuế)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salaryAmount">
                  {salaryType === 'gross' ? 'Lương Gross' : 'Lương Net'} (đồng)
                </Label>
                <Input
                  id="salaryAmount"
                  type="number"
                  value={salaryAmount}
                  onChange={(e) => setSalaryAmount(e.target.value)}
                  placeholder="Nhập số tiền"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="soNguoiPhuThuoc">Số người phụ thuộc</Label>
                <Input
                  id="soNguoiPhuThuoc"
                  type="number"
                  value={soNguoiPhuThuoc}
                  onChange={(e) => setSoNguoiPhuThuoc(e.target.value)}
                  placeholder="0"
                  min="0"
                />
                <p className="text-xs text-gray-500">
                  Mỗi người phụ thuộc được giảm trừ {formatCurrency(GIAM_TRU_NGUOI_PHU_THUOC)}/tháng
                </p>
              </div>

              <Button
                onClick={() => {
                  setSalaryAmount('')
                  setSoNguoiPhuThuoc('0')
                }}
                variant="outline"
                className="w-full"
              >
                Đặt lại
              </Button>
            </CardContent>
          </Card>

          {/* Kết quả tính toán */}
          <div className="lg:col-span-2 space-y-6">
            {calculations ? (
              <>
                {/* Tổng quan - So sánh */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-6 h-6" />
                      Tổng quan - So sánh
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-gray-600 mb-1">Lương Gross</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {formatCurrency(calculations.grossSalary)}
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-gray-600 mb-1">Lương Net (Mới 2026)</p>
                        <p className="text-2xl font-bold text-green-700">
                          {formatCurrency(calculations.netSalary)}
                        </p>
                      </div>
                    </div>
                    {calculationsOld && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-600 mb-1">Lương Net (Cũ)</p>
                          <p className="text-2xl font-bold text-gray-700">
                            {formatCurrency(calculationsOld.netSalary)}
                          </p>
                        </div>
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <p className="text-sm text-gray-600 mb-1">Chênh lệch</p>
                          <p
                            className={`text-2xl font-bold ${
                              calculations.netSalary - calculationsOld.netSalary >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {calculations.netSalary - calculationsOld.netSalary >= 0 ? '+' : ''}
                            {formatCurrency(calculations.netSalary - calculationsOld.netSalary)}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Chi tiết - Chính sách mới và cũ cạnh nhau */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Chính sách mới */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-700">
                        <Receipt className="w-5 h-5" />
                        Chính sách mới (2026)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-gray-600" />
                            <span className="text-sm font-medium">Bảo hiểm xã hội (8%)</span>
                          </div>
                          <span className="font-semibold">{formatCurrency(calculations.bhxh)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-gray-600" />
                            <span className="text-sm font-medium">Bảo hiểm y tế (1.5%)</span>
                          </div>
                          <span className="font-semibold">{formatCurrency(calculations.bhyt)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-gray-600" />
                            <span className="text-sm font-medium">Bảo hiểm thất nghiệp (1%)</span>
                          </div>
                          <span className="font-semibold">{formatCurrency(calculations.bhtn)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <span className="text-sm font-semibold">Tổng bảo hiểm</span>
                          <span className="font-bold text-orange-700">
                            {formatCurrency(calculations.totalInsurance)}
                          </span>
                        </div>
                      </div>

                      <div className="border-t pt-4 space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-600" />
                            <span className="text-sm font-medium">Giảm trừ gia cảnh</span>
                          </div>
                          <span className="font-semibold">
                            {formatCurrency(calculations.giamTruGiaCanh)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 pl-6">
                          Bản thân: {formatCurrency(GIAM_TRU_BAN_THAN)} + {soNguoiPhuThuocNum} người
                          phụ thuộc × {formatCurrency(GIAM_TRU_NGUOI_PHU_THUOC)}
                        </div>
                      </div>

                      <div className="border-t pt-4 space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium">Thu nhập chịu thuế</span>
                          <span className="font-semibold">
                            {formatCurrency(calculations.thuNhapChiuThue)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-semibold">Thuế TNCN</span>
                          </div>
                          <span className="font-bold text-red-700">
                            {formatCurrency(calculations.thueTNCN)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Chính sách cũ */}
                  {calculationsOld && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-700">
                          <TrendingUp className="w-5 h-5" />
                          Chính sách cũ (So sánh)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-gray-600" />
                              <span className="text-sm font-medium">Bảo hiểm xã hội (8%)</span>
                            </div>
                            <span className="font-semibold">
                              {formatCurrency(calculationsOld.bhxh)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-gray-600" />
                              <span className="text-sm font-medium">Bảo hiểm y tế (1.5%)</span>
                            </div>
                            <span className="font-semibold">
                              {formatCurrency(calculationsOld.bhyt)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-gray-600" />
                              <span className="text-sm font-medium">Bảo hiểm thất nghiệp (1%)</span>
                            </div>
                            <span className="font-semibold">
                              {formatCurrency(calculationsOld.bhtn)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <span className="text-sm font-semibold">Tổng bảo hiểm</span>
                            <span className="font-bold text-orange-700">
                              {formatCurrency(calculationsOld.totalInsurance)}
                            </span>
                          </div>
                        </div>

                        <div className="border-t pt-4 space-y-3">
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-600" />
                              <span className="text-sm font-medium">Giảm trừ gia cảnh</span>
                            </div>
                            <span className="font-semibold">
                              {formatCurrency(calculationsOld.giamTruGiaCanh)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 pl-6">
                            Bản thân: {formatCurrency(GIAM_TRU_BAN_THAN_OLD)} + {soNguoiPhuThuocNum}{' '}
                            người phụ thuộc × {formatCurrency(GIAM_TRU_NGUOI_PHU_THUOC_OLD)}
                          </div>
                        </div>

                        <div className="border-t pt-4 space-y-3">
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium">Thu nhập chịu thuế</span>
                            <span className="font-semibold">
                              {formatCurrency(calculationsOld.thuNhapChiuThue)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-red-600" />
                              <span className="text-sm font-semibold">Thuế TNCN</span>
                            </div>
                            <span className="font-bold text-red-700">
                              {formatCurrency(calculationsOld.thueTNCN)}
                            </span>
                          </div>
                        </div>

                        {/* Chênh lệch */}
                        <div className="border-t pt-4">
                          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-sm font-semibold mb-3">Chênh lệch</p>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm">Lương Net:</span>
                                <span
                                  className={`font-semibold ${
                                    calculations.netSalary - calculationsOld.netSalary >= 0
                                      ? 'text-green-600'
                                      : 'text-red-600'
                                  }`}
                                >
                                  {calculations.netSalary - calculationsOld.netSalary >= 0 ? '+' : ''}
                                  {formatCurrency(
                                    calculations.netSalary - calculationsOld.netSalary
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Thuế TNCN:</span>
                                <span
                                  className={`font-semibold ${
                                    calculations.thueTNCN - calculationsOld.thueTNCN <= 0
                                      ? 'text-green-600'
                                      : 'text-red-600'
                                  }`}
                                >
                                  {calculations.thueTNCN - calculationsOld.thueTNCN <= 0 ? '' : '+'}
                                  {formatCurrency(
                                    calculations.thueTNCN - calculationsOld.thueTNCN
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">Nhập thông tin để xem kết quả tính toán</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Thông tin về biểu thuế */}
        <Card>
          <CardHeader>
            <CardTitle>Biểu thuế TNCN mới từ 1/1/2026</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-3 text-left">Bậc</th>
                    <th className="border p-3 text-left">Thu nhập tính thuế/tháng</th>
                    <th className="border p-3 text-left">Thuế suất</th>
                  </tr>
                </thead>
                <tbody>
                  {TAX_BRACKETS_2026.map((bracket, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border p-3 font-medium">{index + 1}</td>
                      <td className="border p-3">
                        {bracket.min === 0
                          ? `Đến ${formatCurrency(bracket.max)}`
                          : bracket.max === Infinity
                            ? `Trên ${formatCurrency(bracket.min)}`
                            : `Trên ${formatCurrency(bracket.min)} đến ${formatCurrency(bracket.max)}`}
                      </td>
                      <td className="border p-3 font-semibold">{(bracket.rate * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Mức giảm trừ gia cảnh mới (từ 1/1/2026):</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Giảm trừ cho bản thân: {formatCurrency(GIAM_TRU_BAN_THAN)}/tháng</li>
                  <li>
                    Giảm trừ cho mỗi người phụ thuộc: {formatCurrency(GIAM_TRU_NGUOI_PHU_THUOC)}
                    /tháng
                  </li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Lưu ý:</strong> Công thức tính trên chỉ mang tính chất tham khảo. Kết quả
                  thực tế có thể khác do các khoản phụ cấp, thưởng và các quy định cụ thể khác. Vui
                  lòng tham khảo ý kiến chuyên gia hoặc cơ quan thuế để có thông tin chính xác nhất.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

