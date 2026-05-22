export default function ForbiddenPage() {
  return (
    <div className="h-[calc(100vh-160px)] flex flex-col items-center justify-center">
      <div className="text-2xl font-bold mb-4">Bạn không có quyền truy cập</div>
      <div className="text-gray-500">Vui lòng liên hệ quản trị viên để được cấp quyền.</div>
    </div>
  )
}
