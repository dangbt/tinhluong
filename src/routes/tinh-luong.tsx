import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Calculator, DollarSign, TrendingDown, TrendingUp } from 'lucide-react'
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

export const Route = createFileRoute('/tinh-luong')({
  component: TinhLuongPage,
})

// Mức lương tối thiểu cũ (Nghị định 74/2024/NĐ-CP)
const LUONG_TOI_THIEU_CU = {
  vung1: 4960000,
  vung2: 4410000,
  vung3: 3860000,
  vung4: 3450000,
}

// Mức lương tối thiểu mới (Nghị định 293/2025/NĐ-CP - từ 1/1/2026)
const LUONG_TOI_THIEU_MOI = {
  vung1: 5310000,
  vung2: 4730000,
  vung3: 4140000,
  vung4: 3700000,
}

const VUNG_OPTIONS = [
  { value: 'vung1', label: 'Vùng I' },
  { value: 'vung2', label: 'Vùng II' },
  { value: 'vung3', label: 'Vùng III' },
  { value: 'vung4', label: 'Vùng IV' },
]

type VungType = 'vung1' | 'vung2' | 'vung3' | 'vung4'

function TinhLuongPage() {
  const [vung, setVung] = useState<VungType>('vung1')
  const [luongHienTai, setLuongHienTai] = useState<string>('')
  const [heSoLuong, setHeSoLuong] = useState<string>('1.0')

  const luongToiThieuCu = LUONG_TOI_THIEU_CU[vung]
  const luongToiThieuMoi = LUONG_TOI_THIEU_MOI[vung]
  const tangLuongToiThieu = luongToiThieuMoi - luongToiThieuCu

  // Tính lương theo công thức: Lương = Lương tối thiểu × Hệ số lương
  const luongCu = luongHienTai
    ? parseFloat(luongHienTai)
    : luongToiThieuCu * parseFloat(heSoLuong || '1.0')
  const luongMoi = luongToiThieuMoi * parseFloat(heSoLuong || '1.0')
  const chenhLech = luongMoi - luongCu
  const phanTramTang = luongCu > 0 ? ((chenhLech / luongCu) * 100).toFixed(2) : '0'

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <Calculator className="w-10 h-10 text-indigo-600" />
            Tính Lương Theo Chính Sách Mới 2026
          </h1>
          <p className="text-gray-600 text-lg">
            So sánh lương theo Nghị định 74/2024/NĐ-CP (cũ) và Nghị định 293/2025/NĐ-CP (mới từ
            1/1/2026)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Form nhập liệu */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin tính lương</CardTitle>
              <CardDescription>
                Nhập thông tin để tính lương theo công thức cũ và mới
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="vung">Vùng làm việc</Label>
                <Select value={vung} onValueChange={(value) => setVung(value as VungType)}>
                  <SelectTrigger id="vung">
                    <SelectValue placeholder="Chọn vùng" />
                  </SelectTrigger>
                  <SelectContent>
                    {VUNG_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="heSoLuong">Hệ số lương</Label>
                <Input
                  id="heSoLuong"
                  type="number"
                  step="0.1"
                  min="1.0"
                  value={heSoLuong}
                  onChange={(e) => setHeSoLuong(e.target.value)}
                  placeholder="Ví dụ: 1.5, 2.0, 3.5..."
                />
                <p className="text-sm text-gray-500">
                  Hệ số nhân với mức lương tối thiểu để tính lương thực tế
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="luongHienTai">Lương hiện tại (tùy chọn)</Label>
                <Input
                  id="luongHienTai"
                  type="number"
                  value={luongHienTai}
                  onChange={(e) => setLuongHienTai(e.target.value)}
                  placeholder="Nhập lương hiện tại để so sánh"
                />
                <p className="text-sm text-gray-500">
                  Nếu để trống, sẽ tính dựa trên mức lương tối thiểu × hệ số
                </p>
              </div>

              <Button
                onClick={() => {
                  setLuongHienTai('')
                  setHeSoLuong('1.0')
                }}
                variant="outline"
                className="w-full"
              >
                Đặt lại
              </Button>
            </CardContent>
          </Card>

          {/* Thông tin mức lương tối thiểu */}
          <Card>
            <CardHeader>
              <CardTitle>Mức lương tối thiểu theo vùng</CardTitle>
              <CardDescription>So sánh mức lương tối thiểu cũ và mới</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-gray-600 mb-1">Mức lương tối thiểu cũ</p>
                  <p className="text-2xl font-bold text-red-700">
                    {formatCurrency(luongToiThieuCu)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Nghị định 74/2024/NĐ-CP</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600 mb-1">Mức lương tối thiểu mới</p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(luongToiThieuMoi)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Nghị định 293/2025/NĐ-CP (từ 1/1/2026)
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <p className="text-sm font-semibold text-gray-700">Mức tăng</p>
                </div>
                <p className="text-2xl font-bold text-blue-700">{formatCurrency(tangLuongToiThieu)}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Tăng{' '}
                  {((tangLuongToiThieu / luongToiThieuCu) * 100).toFixed(2)}% so với mức cũ
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kết quả so sánh */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-6 h-6" />
              Kết quả so sánh lương
            </CardTitle>
            <CardDescription>
              Lương được tính theo công thức: Lương = Mức lương tối thiểu × Hệ số lương
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-red-50 rounded-lg border-2 border-red-300">
                <p className="text-sm text-gray-600 mb-2">Lương theo chính sách cũ</p>
                <p className="text-3xl font-bold text-red-700 mb-2">{formatCurrency(luongCu)}</p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Mức tối thiểu: {formatCurrency(luongToiThieuCu)}</p>
                  <p>Hệ số: {heSoLuong || '1.0'}</p>
                </div>
              </div>

              <div className="p-6 bg-green-50 rounded-lg border-2 border-green-300">
                <p className="text-sm text-gray-600 mb-2">Lương theo chính sách mới</p>
                <p className="text-3xl font-bold text-green-700 mb-2">{formatCurrency(luongMoi)}</p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Mức tối thiểu: {formatCurrency(luongToiThieuMoi)}</p>
                  <p>Hệ số: {heSoLuong || '1.0'}</p>
                </div>
              </div>

              <div
                className={`p-6 rounded-lg border-2 ${
                  chenhLech >= 0
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-orange-50 border-orange-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {chenhLech >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-orange-600" />
                  )}
                  <p className="text-sm text-gray-600">Chênh lệch</p>
                </div>
                <p
                  className={`text-3xl font-bold mb-2 ${
                    chenhLech >= 0 ? 'text-blue-700' : 'text-orange-700'
                  }`}
                >
                  {chenhLech >= 0 ? '+' : ''}
                  {formatCurrency(chenhLech)}
                </p>
                <p className="text-sm text-gray-600">
                  {chenhLech >= 0 ? 'Tăng' : 'Giảm'} {Math.abs(parseFloat(phanTramTang))}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thông tin bổ sung */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin bổ sung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <h3 className="text-lg font-semibold mb-2">Về các vùng lương tối thiểu:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>
                  <strong>Vùng I:</strong> Các quận nội thành Hà Nội, TP. Hồ Chí Minh
                </li>
                <li>
                  <strong>Vùng II:</strong> Các huyện ngoại thành Hà Nội, TP. Hồ Chí Minh; các
                  thành phố trực thuộc Trung ương
                </li>
                <li>
                  <strong>Vùng III:</strong> Các tỉnh, thành phố trực thuộc tỉnh
                </li>
                <li>
                  <strong>Vùng IV:</strong> Các vùng còn lại
                </li>
              </ul>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Lưu ý:</strong> Công thức tính lương trên chỉ mang tính chất tham khảo.
                Lương thực tế có thể bao gồm các khoản phụ cấp, thưởng và các khoản khác theo
                thỏa thuận giữa người lao động và người sử dụng lao động.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

