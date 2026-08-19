import type {
  LopMonHocRow,
  LopQuanLyRow,
  TrangThaiLop,
} from "@components/cong-giang-vien/giang-vien/types"
import { useSession } from "@workspace/auth/react"
import { $Enums } from "@workspace/db/client"
import { useFindFirstLecturer } from "@workspace/db/hooks"
import { useSemesterStore } from "@workspace/ui"
import dayjs from "dayjs"
import { useMemo } from "react"

const tinhTrangThaiLop = (
  start?: Date | string | null,
  end?: Date | string | null
): TrangThaiLop => {
  const now = dayjs()
  if (start && now.isBefore(dayjs(start))) return "sap_dien_ra"
  if (end && now.isAfter(dayjs(end))) return "da_ket_thuc"
  return "dang_hoc"
}

// Lấy danh sách lớp (giảng dạy / trợ giảng / quản lý) của giảng viên đang đăng nhập,
// lọc theo học kỳ và đối tượng đào tạo đang chọn ở store dùng chung.
const useTrangChuGiangVien = () => {
  const { data: me } = useSession()
  const profileId = me?.sDM_NhanVienId
  const { id: semesterId } = useSemesterStore()

  const subjectClassWhere = {
    semesterId,
    cancelled: false,
    deletedAt: null,
    active: true,
    status: $Enums.SubjectClassStatus.OFFICIAL,
  }

  const { data: lecturer, isLoading } = useFindFirstLecturer(
    {
      where: { userProfileId: profileId ?? "" },
      include: {
        mainSubjectClasses: {
          where: subjectClassWhere,
          include: {
            subject: true,
            _count: { select: { subjectClassStudent: true } },
          },
        },
        extraSubjectClasses: {
          where: subjectClassWhere,
          include: {
            subject: true,
            _count: { select: { subjectClassStudent: true } },
          },
        },
        manageFixedClass: {
          where: {
            deletedAt: null,
            active: true,
            ...(semesterId ? { trainingCourse: { semesterStartId: semesterId } } : {}),
          },
          include: {
            _count: { select: { students: true } },
          },
        },
      },
    },
    { enabled: !!profileId }
  )

  const lopGiangDay: LopMonHocRow[] = useMemo(
    () =>
      (lecturer?.mainSubjectClasses ?? []).map((item) => ({
        id: item.id,
        maLop: item.code ?? "",
        monHoc: item.subject?.name ?? "",
        siSo: item._count?.subjectClassStudent ?? 0,
        trangThai: tinhTrangThaiLop(item.startDate, item.endDate),
      })),
    [lecturer?.mainSubjectClasses]
  )

  const lopTroGiang: LopMonHocRow[] = useMemo(
    () =>
      (lecturer?.extraSubjectClasses ?? []).map((item) => ({
        id: item.id,
        maLop: item.code ?? "",
        monHoc: item.subject?.name ?? "",
        siSo: item._count?.subjectClassStudent ?? 0,
        trangThai: tinhTrangThaiLop(item.startDate, item.endDate),
      })),
    [lecturer?.extraSubjectClasses]
  )

  const lopQuanLy: LopQuanLyRow[] = useMemo(
    () =>
      (lecturer?.manageFixedClass ?? []).map((item) => ({
        id: item.id,
        maLop: item.code ?? "",
        tenLop: item.name ?? "",
        siSo: item._count?.students ?? 0,
        classType: item.classType,
      })),
    [lecturer?.manageFixedClass]
  )

  return {
    lopGiangDay,
    lopTroGiang,
    lopQuanLy,
    soLopGiangDay: lopGiangDay.length,
    soLopTroGiang: lopTroGiang.length,
    soLopQuanLy: lopQuanLy.length,
    isLoading: !!profileId && isLoading,
  }
}

export { useTrangChuGiangVien }
