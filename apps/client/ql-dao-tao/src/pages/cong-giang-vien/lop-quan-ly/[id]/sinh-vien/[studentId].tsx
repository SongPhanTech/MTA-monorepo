import TrangHoSoSinhVien from "@components/cong-giang-vien/ho-so-sinh-vien/trang-ho-so-sinh-vien"
import {
  chiTietLopQuanLyPath,
  CONG_GIANG_VIEN_LOP_QUAN_LY_PATH,
} from "@constants/cong-giang-vien-path"
import { useHoSoSinhVienGiangVien } from "@hooks/use-ho-so-sinh-vien-giang-vien"
import { Alert, Button, Skeleton } from "antd"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/router"

function TrangHoSoSinhVienLopQuanLy() {
  const router = useRouter()
  const fixedClassId = router.query.id as string
  const studentId = router.query.studentId as string

  const { hoSo, coQuyenXem, dangTai } = useHoSoSinhVienGiangVien(studentId, fixedClassId)

  const daTaiXong = !dangTai && !!studentId && !!fixedClassId

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="flex shrink-0 items-center gap-3 print:hidden">
        <Button
          type="text"
          icon={<ArrowLeft size={18} />}
          onClick={() => router.push(chiTietLopQuanLyPath(fixedClassId))}
          className="flex h-9 w-9 items-center justify-center text-cgv-green-dark"
        />
        <h1 className="m-0 text-xl font-bold uppercase tracking-wide text-cgv-green-dark">
          Hồ sơ sinh viên
        </h1>
      </div>

      {dangTai ? (
        <Skeleton active paragraph={{ rows: 12 }} />
      ) : daTaiXong && !coQuyenXem ? (
        <Alert
          type="warning"
          showIcon
          message="Bạn không có quyền xem hồ sơ sinh viên này."
          description={
            <Link href={CONG_GIANG_VIEN_LOP_QUAN_LY_PATH} className="text-cgv-green-dark">
              Quay lại danh sách lớp quản lý
            </Link>
          }
        />
      ) : hoSo ? (
        <TrangHoSoSinhVien hoSo={hoSo} />
      ) : (
        <Alert type="info" showIcon message="Không tìm thấy hồ sơ sinh viên." />
      )}
    </div>
  )
}

export default TrangHoSoSinhVienLopQuanLy
