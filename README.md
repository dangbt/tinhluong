# Tính Lương 2026 💰

Công cụ tính lương Gross/Net theo chính sách thuế TNCN mới từ 1/1/2026

[![Sponsor](https://img.shields.io/badge/sponsor-30363D?style=for-the-badge&logo=GitHub-Sponsors&logoColor=#EA4AAA)](https://github.com/sponsors/tinhluong)

## Tính năng

- ✅ Tính lương Gross → Net và Net → Gross
- ✅ So sánh lương theo chính sách thuế hiện hành (2025) và đề xuất mới (2026)
- ✅ Tính thuế TNCN theo biểu thuế lũy tiến từng phần
- ✅ Tính bảo hiểm (BHXH, BHYT, BHTN) với tùy chọn nhập tùy chỉnh
- ✅ Hỗ trợ giảm trừ gia cảnh (bản thân và người phụ thuộc)
- ✅ Giao diện đẹp, responsive, dễ sử dụng

## Cài đặt và Chạy thử

Yêu cầu: `node` và `pnpm` đã được cài đặt.

1. Cài đặt dependencies:

```bash
pnpm install
```

2. Chạy ứng dụng (môi trường dev):

```bash
pnpm dev
```

Truy cập `http://localhost:5173` để xem ứng dụng.

## Build cho Production

```bash
pnpm build
pnpm start
```

## Công nghệ sử dụng

- [TanStack Router](https://tanstack.com/router) - Routing
- [React](https://react.dev/) - UI Library
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Shadcn UI](https://ui.shadcn.com/) - Components
- [Vite](https://vitejs.dev/) - Build tool
