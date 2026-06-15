import type {
  HoSoSinhVien,
  SuKienQuaTrinh,
} from "@components/cong-giang-vien/ho-so-sinh-vien/types"
import { FIXED_CLASS_STUDENT_STATUS } from "@constants/constants"
import { useSession } from "@workspace/auth/react"
import { useFindUniqueFixedClass, useFindUniqueStudent } from "@workspace/db/hooks"
import { getRuntimeEnv } from "@workspace/libs/utils"
import dayjs from "dayjs"
import { useMemo } from "react"

const STUDENT_INCLUDE = {
  userProfile: {
    include: {
      gender: true,
      ethnicity: true,
      religion: true,
      relatives: {
        include: { quanHeThanNhan: true },
        orderBy: { createdAt: "asc" as const },
      },
    },
  },
  fixedClass: {
    include: {
      managementOrganization: { select: { sTen: true } },
      lecturerManagement: {
        include: { userProfile: { select: { fullname: true } } },
      },
      trainingCourse: {
        select: {
          name: true,
          startYear: true,
          endYear: true,
          maxTrainingTime: true,
          admissionStartDate: true,
        },
      },
      curriculumVersion: {
        include: {
          trainingLevel: { select: { name: true } },
          trainingType: { select: { name: true } },
          curriculum: {
            include: {
              trainingMajor: {
                include: { trainingField: { select: { name: true } } },
              },
            },
          },
        },
      },
    },
  },
  curriculumVersion: {
    include: {
      trainingLevel: { select: { name: true } },
      trainingType: { select: { name: true } },
      curriculum: {
        include: {
          trainingMajor: { select: { name: true } },
        },
      },
    },
  },
  priorityObject: { select: { name: true } },
  subjectClassStudent: {
    where: { subjectClassId: { not: null } },
    include: { subjectClass: { include: { subject: { select: { credit: true } } } } },
  },
  studentSemesterResult: {
    include: { rank: { select: { classification: true } } },
    orderBy: { semesterIndexInCourse: "desc" as const },
    take: 1,
  },
  archivedAward: {
    include: { award: { select: { name: true } } },
    orderBy: { date: "desc" as const },
  },
  archivedCertificate: {
    include: { certificate: { select: { name: true } } },
    orderBy: { issuedDate: "desc" as const },
  },
  academicWarning: {
    include: { semester: { select: { name: true } } },
    orderBy: { createdAt: "desc" as const },
  },
  disciplinaryWarning: {
    include: {
      semester: { select: { name: true } },
      reasonDetails: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" as const },
  },
  scholarshipAwards: { select: { id: true }, take: 1 },
} as const

const dinhDangNgay = (value?: Date | string | null) =>
  value ? dayjs(value).format("DD/MM/YYYY") : ""

const layAnhDaiDien = (avatar?: string | null) => {
  if (!avatar) return undefined
  try {
    return new URL(avatar, getRuntimeEnv("NEXT_PUBLIC_MINIO_ENDPOINT")).href
  } catch {
    return undefined
  }
}

const layNhanTrangThai = (status: string) => {
  const meta = FIXED_CLASS_STUDENT_STATUS[status as keyof typeof FIXED_CLASS_STUDENT_STATUS]
  return meta ?? { label: status, color: "default" }
}

const XEP_LOAI_RL: Record<string, string> = {
  EXCELLENT: "Xuất sắc",
  GOOD: "Tốt",
  FAIR: "Khá",
  MEDIUM: "Trung bình khá",
  AVERAGE: "Trung bình",
  POOR: "Yếu",
  VERY_POOR: "Kém",
}

const useHoSoSinhVienGiangVien = (studentId: string, fixedClassId: string) => {
  const { data: me } = useSession()
  const profileId = me?.sDM_NhanVienId ?? ""

  const { data: fixedClass, isLoading: dangTaiLop } = useFindUniqueFixedClass(
    {
      where: { id: fixedClassId },
      select: { lecturerManagement: { select: { userProfileId: true } } },
    },
    { enabled: !!fixedClassId }
  )

  const coQuyenXem = useMemo(
    () => !!fixedClass && fixedClass.lecturerManagement?.userProfileId === profileId,
    [fixedClass, profileId]
  )

  const { data: student, isLoading: dangTaiSinhVien } = useFindUniqueStudent(
    {
      where: { id: studentId },
      include: STUDENT_INCLUDE,
    },
    { enabled: !!studentId && coQuyenXem }
  )

  const hoSo: HoSoSinhVien | null = useMemo(() => {
    if (!student) return null

    const profile = student.userProfile
    const lop = student.fixedClass
    const khoaHoc = lop?.trainingCourse
    const ct = lop?.curriculumVersion ?? student.curriculumVersion
    const ketQuaKy = student.studentSemesterResult?.[0]

    const nienKhoa = [khoaHoc?.startYear, khoaHoc?.endYear].filter(Boolean).join(" - ")

    const tongHocPhan = student.subjectClassStudent?.length ?? 0
    const tongTinChi =
      student.subjectClassStudent?.reduce(
        (sum, item) => sum + (item.subjectClass?.subject?.credit ?? 0),
        0
      ) ?? 0

    const cpaValue = ketQuaKy?.cumulativeGpaBase4
    const cpa = cpaValue != null ? `${Number(cpaValue).toFixed(2).replace(".", ",")} / 4,00` : "—"

    const suKien: SuKienQuaTrinh[] = [
      ...(student.archivedAward ?? []).map((item) => ({
        id: `award-${item.id}`,
        ngay: dinhDangNgay(item.date),
        loai: "khen-thuong" as const,
        tieuDe: "Khen thưởng",
        moTa: item.award?.name ?? "",
      })),
      ...(student.archivedCertificate ?? []).map((item) => ({
        id: `cert-${item.id}`,
        ngay: dinhDangNgay(item.issuedDate),
        loai: "khen-thuong" as const,
        tieuDe: "Chứng chỉ / Khen thưởng",
        moTa: item.certificate?.name ?? "",
      })),
      ...(student.academicWarning ?? []).map((item) => ({
        id: `aw-${item.id}`,
        ngay: dinhDangNgay(item.createdAt),
        loai: "canh-bao" as const,
        tieuDe: "Cảnh báo học tập",
        moTa: `Học kỳ ${item.semester?.name ?? ""} — Mức cảnh báo ${item.level ?? 0}`,
      })),
      ...(student.disciplinaryWarning ?? []).map((item) => ({
        id: `dw-${item.id}`,
        ngay: dinhDangNgay(item.createdAt),
        loai: "ky-luat" as const,
        tieuDe: "Kỷ luật",
        moTa: [
          item.semester?.name ? `Học kỳ ${item.semester.name}` : "",
          `Mức ${item.level ?? 0}`,
          item.reasonDetails?.map((r) => r.name).join(", "),
        ]
          .filter(Boolean)
          .join(" — "),
      })),
    ]
      .filter((item) => item.moTa || item.ngay)
      .sort((a, b) => {
        const da = a.ngay ? dayjs(a.ngay, "DD/MM/YYYY").valueOf() : 0
        const db = b.ngay ? dayjs(b.ngay, "DD/MM/YYYY").valueOf() : 0
        return db - da
      })

    const lienHeKhanCap = (profile?.relatives ?? [])
      .map((item) => {
        const quanHe = item.quanHeThanNhan?.name ?? ""
        const lienHe = [item.information, item.noiOHienTai].filter(Boolean).join(" — ")
        return [item.name, quanHe ? `(${quanHe})` : "", lienHe].filter(Boolean).join(" ")
      })
      .find(Boolean)

    return {
      tomTat: {
        anhDaiDien: layAnhDaiDien(profile?.avatar),
        hoVaTen: profile?.fullname ?? "",
        trangThai: layNhanTrangThai(student.status),
        maSinhVien: student.code ?? profile?.code ?? "",
        lop: lop ? `${lop.code ?? ""}${lop.name ? ` - ${lop.name}` : ""}` : "",
        khoa: khoaHoc?.name ?? "",
        khoaVien:
          lop?.curriculumVersion?.curriculum?.trainingMajor?.trainingField?.name ??
          lop?.managementOrganization?.sTen ??
          "",
      },
      caNhan: {
        hoVaTen: profile?.fullname ?? "",
        ngaySinh: dinhDangNgay(profile?.dateOfBirth),
        gioiTinh: profile?.gender?.sTen ?? "",
        cccd: profile?.idCardNumber ?? "",
        soDienThoai: profile?.phoneNumber ?? "",
        email: profile?.email ?? "",
        queQuan: profile?.homeTown ?? "",
        danToc: profile?.ethnicity?.sTen ?? "",
        tonGiao: profile?.religion?.sTen ?? "",
        doiTuongUuTien: student.priorityObject?.map((p) => p.name).join(", ") ?? "",
      },
      hocTap: {
        heDaoTao: ct?.trainingLevel?.name ?? "",
        chuongTrinhDaoTao: ct?.curriculum?.trainingMajor?.name ?? ct?.name ?? "",
        ngayNhapHoc: dinhDangNgay(khoaHoc?.admissionStartDate),
        coVanHocTap: lop?.lecturerManagement?.userProfile?.fullname ?? "",
        hinhThuc: ct?.trainingType?.name ?? "",
        thoiGianDaoTao: khoaHoc?.maxTrainingTime != null ? `${khoaHoc.maxTrainingTime} năm` : "",
        trangThai: layNhanTrangThai(student.status),
        nienKhoa,
      },
      quaTrinh: suKien,
      lienHe: {
        thuongTru: profile?.permanentAddress ?? "",
        hienTai: profile?.currentAddress ?? "",
        lienHeKhanCap: lienHeKhanCap ?? "",
      },
      khac: {
        ngayVaoDang: dinhDangNgay(profile?.CPVJoinDate),
        ngayVaoDoan: dinhDangNgay(profile?.unionDate),
        hocBong: (student.scholarshipAwards?.length ?? 0) > 0 ? "Có" : "Không",
        uuTien:
          student.priorityReason ?? student.priorityObject?.map((p) => p.name).join(", ") ?? "",
      },
      lichSuHocTap: {
        tongHocPhan,
        tongTinChi,
        cpa,
        xepLoaiHocLuc: ketQuaKy?.rank?.classification ?? null,
        xepLoaiRenLuyen: ketQuaKy?.studentTrainingType
          ? (XEP_LOAI_RL[ketQuaKy.studentTrainingType] ?? ketQuaKy.studentTrainingType)
          : null,
      },
    }
  }, [student])

  const thuocLop = student?.fixedClassId === fixedClassId

  return {
    hoSo,
    coQuyenXem: coQuyenXem && thuocLop,
    dangTai: dangTaiLop || (coQuyenXem && dangTaiSinhVien),
  }
}

export { useHoSoSinhVienGiangVien }
