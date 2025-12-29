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
import { NumberInput } from '@/components/ui/number-input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const Route = createFileRoute('/')({
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

// Biểu thuế 2025 (Hiện hành - 7 bậc chuẩn)
const TAX_BRACKETS_2025: Array<TaxBracket> = [
  { min: 0, max: 5_000_000, rate: 0.05 },
  { min: 5_000_000, max: 10_000_000, rate: 0.1 },
  { min: 10_000_000, max: 18_000_000, rate: 0.15 },
  { min: 18_000_000, max: 32_000_000, rate: 0.2 },
  { min: 32_000_000, max: 52_000_000, rate: 0.25 },
  { min: 52_000_000, max: 80_000_000, rate: 0.3 },
  { min: 80_000_000, max: Infinity, rate: 0.35 },
]

// Biểu thuế 2026 (Đề xuất - Giãn cách rộng hơn)
const TAX_BRACKETS_2026: Array<TaxBracket> = [
  { min: 0, max: 10_000_000, rate: 0.05 }, // Đến 10 triệu: 5%
  { min: 10_000_000, max: 20_000_000, rate: 0.1 }, // Trên 10 đến 20 triệu: 10%
  { min: 20_000_000, max: 35_000_000, rate: 0.15 }, // Trên 20 đến 35 triệu: 15%
  { min: 35_000_000, max: 60_000_000, rate: 0.2 }, // Trên 35 đến 60 triệu: 20%
  { min: 60_000_000, max: 90_000_000, rate: 0.25 }, // Trên 60 đến 90 triệu: 25%
  { min: 90_000_000, max: 120_000_000, rate: 0.3 }, // Trên 90 đến 120 triệu: 30%
  { min: 120_000_000, max: Infinity, rate: 0.35 }, // Trên 120 triệu: 35%
]

// Biểu thuế cũ (để so sánh)
// Biểu thuế cũ (để so sánh) - Alias to 2025
const TAX_BRACKETS_OLD = TAX_BRACKETS_2025

// Mức giảm trừ cũ
const GIAM_TRU_BAN_THAN_OLD = 11_000_000 // 11 triệu đồng/tháng
const GIAM_TRU_NGUOI_PHU_THUOC_OLD = 4_400_000 // 4.4 triệu đồng/tháng/người

/**
 * Tính thuế thu nhập cá nhân theo biểu thuế lũy tiến từng phần
 * 
 * Công thức: Thuế = Σ (Phần thu nhập trong bậc × Thuế suất bậc)
 * 
 * Ví dụ với thu nhập 11,450,000:
 * - Bậc 1 (0-10tr, 5%): 10,000,000 × 5% = 500,000
 * - Bậc 2 (10-30tr, 10%): (11,450,000 - 10,000,000) × 10% = 145,000
 * - Tổng thuế: 500,000 + 145,000 = 645,000
 */
function calculateTax(income: number, brackets: Array<TaxBracket>): number {
  if (income <= 0) return 0

  let tax = 0

  for (const bracket of brackets) {
    // Nếu thu nhập nhỏ hơn hoặc bằng mức tối thiểu của bậc, không tính thuế ở bậc này
    if (income <= bracket.min) break

    // Xác định giới hạn trên của bậc (là thu nhập thực tế hoặc giới hạn tối đa của bậc)
    const upperBound = bracket.max === Infinity ? income : Math.min(income, bracket.max)

    // Tính phần thu nhập nằm trong bậc này (từ min đến upperBound)
    const taxableInBracket = upperBound - bracket.min

    // Tính thuế cho phần thu nhập trong bậc này
    if (taxableInBracket > 0) {
      tax += taxableInBracket * bracket.rate
    }
  }

  return Math.round(tax) // Làm tròn để tránh lỗi số thập phân
}

function TinhLuongGrossNetPage() {
  const [salaryType, setSalaryType] = useState<'gross' | 'net'>('gross')
  const [salaryAmount, setSalaryAmount] = useState<string>('')
  const [soNguoiPhuThuoc, setSoNguoiPhuThuoc] = useState<string>('0')
  const [useCustomInsurance, setUseCustomInsurance] = useState<boolean>(false)
  const [customInsuranceAmount, setCustomInsuranceAmount] = useState<string>('')
  const [insuranceOnOfficialSalary, setInsuranceOnOfficialSalary] = useState<boolean>(false)

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
      // Sử dụng số tiền nhập vào hoặc tính tự động
      if (useCustomInsurance) {
        const customAmount = parseFloat(customInsuranceAmount) || 0
        if (insuranceOnOfficialSalary) {
          // Tính bảo hiểm theo % trên lương chính thức (số tiền user nhập)
          bhxh = customAmount * BHXH_RATE
          bhyt = customAmount * BHYT_RATE
          bhtn = customAmount * BHTN_RATE
          totalInsurance = bhxh + bhyt + bhtn
        } else {
          // Số tiền user nhập là cơ sở tính bảo hiểm, tính theo % trực tiếp
          bhxh = customAmount * BHXH_RATE
          bhyt = customAmount * BHYT_RATE
          bhtn = customAmount * BHTN_RATE
          totalInsurance = bhxh + bhyt + bhtn
        }
      } else {
        bhxh = grossSalary * BHXH_RATE
        bhyt = grossSalary * BHYT_RATE
        bhtn = grossSalary * BHTN_RATE
        totalInsurance = bhxh + bhyt + bhtn
      }

      giamTruGiaCanh = GIAM_TRU_BAN_THAN + soNguoiPhuThuocNum * GIAM_TRU_NGUOI_PHU_THUOC
      thuNhapChiuThue = Math.max(0, grossSalary - totalInsurance - giamTruGiaCanh)
      thueTNCN = calculateTax(thuNhapChiuThue, TAX_BRACKETS_2026)
      netSalary = grossSalary - totalInsurance - thueTNCN
    } else {
      // Khi nhập lương Net: số tiền nhập là lương Net cũ
      // Tính Gross từ Net cũ (theo chính sách cũ), sau đó tính Net mới (theo chính sách mới 2026)
      const oldNetSalary = salaryNum

      // Bước 1: Tính Gross từ Net cũ theo chính sách cũ
      let estimatedGross = oldNetSalary / (1 - TOTAL_INSURANCE_RATE - 0.1) // Ước tính ban đầu
      let iterations = 0
      const maxIterations = 100
      const tolerance = 1000 // Độ chính xác 1000 đồng

      while (iterations < maxIterations) {
        // Tính bảo hiểm theo chính sách cũ
        let oldBhxh: number
        let oldBhyt: number
        let oldBhtn: number
        let oldTotalInsurance: number

        if (useCustomInsurance) {
          const customAmount = parseFloat(customInsuranceAmount) || 0
          if (insuranceOnOfficialSalary) {
            oldBhxh = customAmount * BHXH_RATE
            oldBhyt = customAmount * BHYT_RATE
            oldBhtn = customAmount * BHTN_RATE
            oldTotalInsurance = oldBhxh + oldBhyt + oldBhtn
          } else {
            oldBhxh = customAmount * BHXH_RATE
            oldBhyt = customAmount * BHYT_RATE
            oldBhtn = customAmount * BHTN_RATE
            oldTotalInsurance = oldBhxh + oldBhyt + oldBhtn
          }
        } else {
          oldBhxh = estimatedGross * BHXH_RATE
          oldBhyt = estimatedGross * BHYT_RATE
          oldBhtn = estimatedGross * BHTN_RATE
          oldTotalInsurance = oldBhxh + oldBhyt + oldBhtn
        }

        const oldGiamTruGiaCanh =
          GIAM_TRU_BAN_THAN_OLD + soNguoiPhuThuocNum * GIAM_TRU_NGUOI_PHU_THUOC_OLD
        const oldThuNhapChiuThue = Math.max(0, estimatedGross - oldTotalInsurance - oldGiamTruGiaCanh)
        const oldThueTNCN = calculateTax(oldThuNhapChiuThue, TAX_BRACKETS_OLD)

        const calculatedOldNet = estimatedGross - oldTotalInsurance - oldThueTNCN
        const difference = Math.abs(calculatedOldNet - oldNetSalary)

        if (difference < tolerance) {
          break
        }

        // Điều chỉnh ước tính
        const adjustment = (oldNetSalary - calculatedOldNet) / (1 - TOTAL_INSURANCE_RATE)
        estimatedGross += adjustment
        iterations++
      }

      grossSalary = estimatedGross

      // Bước 2: Từ Gross đã tính, tính Net mới theo chính sách mới 2026
      if (useCustomInsurance) {
        const customAmount = parseFloat(customInsuranceAmount) || 0
        if (insuranceOnOfficialSalary) {
          // Tính bảo hiểm theo % trên lương chính thức
          bhxh = customAmount * BHXH_RATE
          bhyt = customAmount * BHYT_RATE
          bhtn = customAmount * BHTN_RATE
          totalInsurance = bhxh + bhyt + bhtn
        } else {
          // Số tiền user nhập là cơ sở tính bảo hiểm, tính theo % trực tiếp
          bhxh = customAmount * BHXH_RATE
          bhyt = customAmount * BHYT_RATE
          bhtn = customAmount * BHTN_RATE
          totalInsurance = bhxh + bhyt + bhtn
        }
      } else {
        bhxh = grossSalary * BHXH_RATE
        bhyt = grossSalary * BHYT_RATE
        bhtn = grossSalary * BHTN_RATE
        totalInsurance = bhxh + bhyt + bhtn
      }
      giamTruGiaCanh = GIAM_TRU_BAN_THAN + soNguoiPhuThuocNum * GIAM_TRU_NGUOI_PHU_THUOC
      thuNhapChiuThue = Math.max(0, grossSalary - totalInsurance - giamTruGiaCanh)
      thueTNCN = calculateTax(thuNhapChiuThue, TAX_BRACKETS_2026)
      netSalary = grossSalary - totalInsurance - thueTNCN
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
  }, [salaryNum, salaryType, soNguoiPhuThuocNum, useCustomInsurance, customInsuranceAmount, insuranceOnOfficialSalary])

  // Tính toán theo chính sách cũ (để so sánh)
  const calculationsOld = useMemo(() => {
    if (!calculations) return null

    const grossSalary = calculations.grossSalary
    // Sử dụng số tiền nhập vào hoặc tính tự động
    let bhxh: number
    let bhyt: number
    let bhtn: number
    let totalInsurance: number
    if (useCustomInsurance) {
      const customAmount = parseFloat(customInsuranceAmount) || 0
      if (insuranceOnOfficialSalary) {
        // Tính bảo hiểm theo % trên lương chính thức
        bhxh = customAmount * BHXH_RATE
        bhyt = customAmount * BHYT_RATE
        bhtn = customAmount * BHTN_RATE
        totalInsurance = bhxh + bhyt + bhtn
      } else {
        // Số tiền user nhập là cơ sở tính bảo hiểm, tính theo % trực tiếp
        bhxh = customAmount * BHXH_RATE
        bhyt = customAmount * BHYT_RATE
        bhtn = customAmount * BHTN_RATE
        totalInsurance = bhxh + bhyt + bhtn
      }
    } else {
      bhxh = grossSalary * BHXH_RATE
      bhyt = grossSalary * BHYT_RATE
      bhtn = grossSalary * BHTN_RATE
      totalInsurance = bhxh + bhyt + bhtn
    }

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
  }, [calculations, soNguoiPhuThuocNum, useCustomInsurance, customInsuranceAmount, insuranceOnOfficialSalary])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(Math.round(amount))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header với styling đẹp hơn */}
        <div className="relative mb-12">
          {/* Background gradient với blur effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-indigo-400/20 rounded-3xl blur-3xl -z-10"></div>

          {/* Header card */}
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 md:p-12">
            <div className="text-center">
              {/* Icon với animation và glow effect */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-300">
                    <Calculator className="w-12 h-12 text-white" />
                  </div>
                </div>
              </div>

              {/* Title với gradient text */}
              <h1 className="text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
                Tính Lương Gross / Net 2026
              </h1>

              {/* Subtitle */}
              <p className="text-xl md:text-2xl text-gray-700 font-medium mb-6 max-w-3xl mx-auto">
                Tính toán lương Gross và Net theo chính sách thuế TNCN mới từ 1/1/2026
              </p>

              {/* Badge tags */}
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                <span className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-sm font-semibold border border-purple-200">
                  Chính sách mới 2026
                </span>
                <span className="px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full text-sm font-semibold border border-blue-200">
                  So sánh cũ & mới
                </span>
                <span className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full text-sm font-semibold border border-green-200">
                  Tính toán chính xác
                </span>
              </div>
            </div>
          </div>
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
                <NumberInput
                  id="salaryAmount"
                  value={salaryAmount}
                  onChange={setSalaryAmount}
                  placeholder="Nhập số tiền"
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

              {/* Tùy chọn nhập số tiền bảo hiểm */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useCustomInsurance"
                    checked={useCustomInsurance}
                    onChange={(e) => setUseCustomInsurance(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="useCustomInsurance" className="text-sm font-medium cursor-pointer">
                    Nhập số tiền bảo hiểm thủ công
                  </Label>
                </div>
                <p className="text-xs text-gray-500">
                  Nếu không chọn, sẽ tính tự động theo tỷ lệ: BHXH 8%, BHYT 1.5%, BHTN 1%
                </p>

                {useCustomInsurance && (
                  <div className="space-y-3 pl-6 border-l-2 border-purple-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <input
                        type="checkbox"
                        id="insuranceOnOfficialSalary"
                        checked={insuranceOnOfficialSalary}
                        onChange={(e) => setInsuranceOnOfficialSalary(e.target.checked)}
                        className="rounded"
                      />
                      <Label
                        htmlFor="insuranceOnOfficialSalary"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Trên lương chính thức
                      </Label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customInsuranceAmount" className="text-sm">
                        {insuranceOnOfficialSalary
                          ? 'Lương chính thức (đồng)'
                          : 'Tổng số tiền đóng bảo hiểm (đồng)'}
                      </Label>
                      <NumberInput
                        id="customInsuranceAmount"
                        value={customInsuranceAmount}
                        onChange={setCustomInsuranceAmount}
                        placeholder={
                          insuranceOnOfficialSalary
                            ? 'Nhập lương chính thức'
                            : 'Nhập tổng số tiền bảo hiểm'
                        }
                      />
                      <p className="text-xs text-gray-500">
                        {insuranceOnOfficialSalary
                          ? `Bảo hiểm sẽ được tính theo % trên lương chính thức: BHXH ${(BHXH_RATE * 100).toFixed(1)}%, BHYT ${(BHYT_RATE * 100).toFixed(1)}%, BHTN ${(BHTN_RATE * 100).toFixed(1)}%`
                          : `Số tiền này là cơ sở tính bảo hiểm. Bảo hiểm = Số tiền × Tỷ lệ: BHXH ${(BHXH_RATE * 100).toFixed(1)}%, BHYT ${(BHYT_RATE * 100).toFixed(1)}%, BHTN ${(BHTN_RATE * 100).toFixed(1)}%`}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={() => {
                  setSalaryAmount('')
                  setSoNguoiPhuThuoc('0')
                  setUseCustomInsurance(false)
                  setCustomInsuranceAmount('')
                  setInsuranceOnOfficialSalary(false)
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
                          <p className="text-sm text-gray-600 mb-1">
                            {salaryType === 'net' && salaryNum > 0
                              ? 'Lương Net (Cũ - Đã nhập)'
                              : 'Lương Net (Cũ - Tính toán)'}
                          </p>
                          <p className="text-2xl font-bold text-gray-700">
                            {formatCurrency(
                              salaryType === 'net' && salaryNum > 0
                                ? salaryNum
                                : calculationsOld.netSalary
                            )}
                          </p>
                        </div>
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <p className="text-sm text-gray-600 mb-1">Chênh lệch</p>
                          <p
                            className={`text-2xl font-bold ${calculations.netSalary -
                              (salaryType === 'net' && salaryNum > 0
                                ? salaryNum
                                : calculationsOld.netSalary) >=
                              0
                              ? 'text-green-600'
                              : 'text-red-600'
                              }`}
                          >
                            {calculations.netSalary -
                              (salaryType === 'net' && salaryNum > 0
                                ? salaryNum
                                : calculationsOld.netSalary) >=
                              0
                              ? '+'
                              : ''}
                            {formatCurrency(
                              calculations.netSalary -
                              (salaryType === 'net' && salaryNum > 0
                                ? salaryNum
                                : calculationsOld.netSalary)
                            )}
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
                                  className={`font-semibold ${calculations.netSalary -
                                    (salaryType === 'net' && salaryNum > 0
                                      ? salaryNum
                                      : calculationsOld.netSalary) >=
                                    0
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                    }`}
                                >
                                  {calculations.netSalary -
                                    (salaryType === 'net' && salaryNum > 0
                                      ? salaryNum
                                      : calculationsOld.netSalary) >=
                                    0
                                    ? '+'
                                    : ''}
                                  {formatCurrency(
                                    calculations.netSalary -
                                    (salaryType === 'net' && salaryNum > 0
                                      ? salaryNum
                                      : calculationsOld.netSalary)
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Thuế TNCN:</span>
                                <span
                                  className={`font-semibold ${calculations.thueTNCN - calculationsOld.thueTNCN <= 0
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

        {/* Thông tin về biểu thuế - Side-by-Side Comparison */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>So sánh Biểu thuế TNCN</CardTitle>
            <CardDescription>
              So sánh mức tính thuế giữa quy định hiện hành (2025) và đề xuất mới (2026)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Bảng 2025 */}
              <div>
                <h3 className="font-semibold text-lg text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                  Biểu thuế 2025 (Hiện hành)
                </h3>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border-b p-2 text-left w-12">Bậc</th>
                        <th className="border-b p-2 text-left">Thu nhập tính thuế/tháng</th>
                        <th className="border-b p-2 text-left w-20">Thuế suất</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TAX_BRACKETS_2025.map((bracket, index) => (
                        <tr key={index} className="hover:bg-gray-50 border-b last:border-0">
                          <td className="p-2 text-center text-gray-500">{index + 1}</td>
                          <td className="p-2">
                            {bracket.min === 0
                              ? `Đến ${formatCurrency(bracket.max)}`
                              : bracket.max === Infinity
                                ? `Trên ${formatCurrency(bracket.min)}`
                                : `Trên ${formatCurrency(bracket.min)} đến ${formatCurrency(bracket.max)}`}
                          </td>
                          <td className="p-2 font-medium">{(bracket.rate * 100).toFixed(0)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bảng 2026 */}
              <div>
                <h3 className="font-semibold text-lg text-green-700 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Biểu thuế 2026 (Đề xuất mới)
                </h3>
                <div className="overflow-x-auto border rounded-lg border-green-200">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-green-50">
                        <th className="border-b border-green-200 p-2 text-left w-12">Bậc</th>
                        <th className="border-b border-green-200 p-2 text-left">Thu nhập tính thuế/tháng</th>
                        <th className="border-b border-green-200 p-2 text-left w-20">Thuế suất</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TAX_BRACKETS_2026.map((bracket, index) => (
                        <tr key={index} className="hover:bg-green-50/50 border-b border-green-100 last:border-0">
                          <td className="p-2 text-center text-gray-500">{index + 1}</td>
                          <td className="p-2">
                            {bracket.min === 0
                              ? `Đến ${formatCurrency(bracket.max)}`
                              : bracket.max === Infinity
                                ? `Trên ${formatCurrency(bracket.min)}`
                                : `Trên ${formatCurrency(bracket.min)} đến ${formatCurrency(bracket.max)}`}
                          </td>
                          <td className="p-2 font-medium text-green-700">{(bracket.rate * 100).toFixed(0)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold mb-2 text-blue-800">Điểm nổi bật của đề xuất mới (2026):</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-900">
                  <li><strong>Nới rộng khoảng cách các bậc thuế:</strong> Giúp giảm số thuế phải đóng cho cùng một mức thu nhập.</li>
                  <li><strong>Mức giảm trừ gia cảnh tăng:</strong> Bản thân {formatCurrency(GIAM_TRU_BAN_THAN)} (so với 11tr), Người phụ thuộc {formatCurrency(GIAM_TRU_NGUOI_PHU_THUOC)} (so với 4.4tr).</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Lưu ý:</strong> Đây là công cụ mô phỏng dựa trên các đề xuất thay đổi luật Thuế TNCN. Các con số chính thức có thể thay đổi khi luật được thông qua.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
