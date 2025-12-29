import { Link } from '@tanstack/react-router'

import { useState } from 'react'
import { Calculator, Coffee, DollarSign, FileText, Home, Menu, X } from 'lucide-react'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const BUY_ME_COFFEE_URL = 'https://buymeacoffee.com/dangbt' // Thay bằng URL BuyMeACoffee của bạn

  return (
    <>
      {/* Header với gradient đẹp */}
      <header className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white shadow-2xl border-b border-white/20">
        {/* Background pattern overlay */}
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
        
        <div className="relative p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsOpen(true)}
              className="p-2.5 hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 backdrop-blur-sm border border-white/20"
              aria-label="Open menu"
            >
              <Menu size={24} className="text-white" />
            </button>
            
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img src="/favicon.png" alt="Tính Lương 2026" className="w-auto h-12" />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">
                  Tính Lương 2026
                </h1>
                <p className="text-xs text-white/80 font-medium">Công cụ tính lương Gross/Net</p>
              </div>
            </Link>
          </div>
          
          {/* Right side - có thể thêm user menu hoặc actions */}
          <div className="flex items-center gap-2">
            <a
              href={BUY_ME_COFFEE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 backdrop-blur-sm rounded-lg border border-amber-400/30 hover:from-amber-600 hover:to-orange-600 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Coffee className="w-4 h-4" />
              <span className="text-sm font-semibold">Buy me a coffee</span>
            </a>
            <a
              href="https://xaydungchinhsach.chinhphu.vn/chinh-sach-noi-bat-ve-tien-luong-giam-thue-bang-gia-dat-co-hieu-luc-tu-1-1-2026-11925122411395028.htm"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-200 hover:scale-105"
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm font-semibold">Chính sách mới</span>
            </a>
          </div>
        </div>
      </header>

      {/* Sidebar với gradient và styling đẹp */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-gradient-to-br from-gray-900 via-purple-900/50 to-indigo-900/50 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col backdrop-blur-xl border-r border-white/10 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-lg">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              Menu
            </h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="Close menu"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto space-y-2">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/10 transition-all duration-200 group border border-transparent hover:border-white/20"
            activeProps={{
              className:
                'flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg border border-white/20',
            }}
          >
            <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
              <Home size={20} className="text-white" />
            </div>
            <span className="font-semibold text-white">Trang chủ</span>
          </Link>


          <Link
            to="/tinh-luong-gross-net"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/10 transition-all duration-200 group border border-transparent hover:border-white/20"
            activeProps={{
              className:
                'flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg border border-white/20',
            }}
          >
            <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
              <DollarSign size={20} className="text-white" />
            </div>
            <span className="font-semibold text-white">Tính lương Gross/Net</span>
          </Link>

          <div className="pt-4 mt-4 border-t border-white/10 space-y-2">
            <a
              href={BUY_ME_COFFEE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 transition-all duration-200 group border border-amber-400/30 hover:border-amber-400/50"
            >
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg group-hover:from-amber-600 group-hover:to-orange-600 transition-colors shadow-lg">
                <Coffee size={20} className="text-white" />
              </div>
              <span className="font-semibold text-white">Buy me a coffee</span>
            </a>
            <a
              href="https://xaydungchinhsach.chinhphu.vn/chinh-sach-noi-bat-ve-tien-luong-giam-thue-bang-gia-dat-co-hieu-luc-tu-1-1-2026-11925122411395028.htm"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/10 transition-all duration-200 group border border-transparent hover:border-white/20"
            >
              <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                <FileText size={20} className="text-white" />
              </div>
              <span className="font-semibold text-white">Chính sách mới</span>
            </a>
          </div>
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="text-xs text-white/60 text-center">
            <p className="font-medium">Tính Lương 2026</p>
            <p className="mt-1">Chính sách thuế TNCN mới</p>
          </div>
        </div>
      </aside>

      {/* Overlay khi sidebar mở */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  )
}
