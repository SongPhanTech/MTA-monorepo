import type {
  HoSoSinhVien,
  SuKienQuaTrinh,
} from "@components/cong-giang-vien/ho-so-sinh-vien/types"
import { mapDieuKienTotNghiep } from "@components/cong-giang-vien/ho-so-sinh-vien/map-dieu-kien-tot-nghiep"
import { mapGiaiThuong } from "@components/cong-giang-vien/ho-so-sinh-vien/map-giai-thuong"
import { mapQuyetDinhTotNghiep } from "@components/cong-giang-vien/ho-so-sinh-vien/map-quyet-dinh-tot-nghiep"
import { mapTinhTrangHocTap } from "@components/cong-giang-vien/ho-so-sinh-vien/map-tinh-trang-hoc-tap"
import { FIXED_CLASS_STUDENT_STATUS } from "@constants/constants"
import { useSession } from "@workspace/auth/react"
import { useFindUniqueFixedClass, useFindUniqueStudent } from "@workspace/db/hooks"
import { getRuntimeEnv } from "@workspace/libs/utils"
import dayjs from "dayjs"
import { useMemo } from "react"

const CHUAN_DAU_RA_CT_INCLUDE = {
  outputStandardOnCurriculum: {
    where: { isRequired: true },
    include: {
      outputStandard: {
        include: {
          certificates: { select: { id: true, name: true } },
        },
      },
    },
  },
} as const

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
          academicYear: true,
          maxTrainingTime: true,
          admissionStartDate: true,
          academicRankingConvert: {
            select: {
              classification: true,
              baseScore: true,
              base4Min: true,
              base4Max: true,
              base10Min: true,
              base10Max: true,
              graduated: true,
              rankOrder: true,
              context: true,
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
              trainingMajor: {
                include: { trainingField: { select: { name: true } } },
              },
            },
          },
          ...CHUAN_DAU_RA_CT_INCLUDE,
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
      ...CHUAN_DAU_RA_CT_INCLUDE,
    },
  },
  priorityObject: { select: { name: true } },
  subjectClassStudent: {
    where: { subjectClassId: { not: null } },
    include: {
      subjectClass: {
        include: {
          subject: { select: { credit: true, name: true, code: true } },
          semester: {
            select: {
              name: true,
              schoolYear: { select: { name: true } },
            },
          },
        },
      },
    },
  },
  studentSemesterResult: {
    include: { rank: { select: { classification: true } } },
    orderBy: { semesterIndexInCourse: "desc" as const },
    take: 1,
  },
  archivedAward: {
    select: {
      id: true,
      code: true,
      bonusScore: true,
      date: true,
      status: true,
      description: true,
      award: { select: { name: true } },
    },
    orderBy: { date: "desc" as const },
  },
  archivedCertificate: {
    include: {
      certificate: {
        select: {
          id: true,
          name: true,
          outputStandard: { select: { id: true, name: true } },
        },
      },
    },
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
  scholarshipAwards: {
    include: {
      scholarship: { select: { name: true, rankOrder: true } },
      semester: {
        select: {
          name: true,
          schoolYear: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" as const },
  },
  studentAcademicDecision: {
    include: {
      appliedConfig: { select: { name: true, actionType: true } },
      semester: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" as const },
  },
  graduationDecision: {
    include: {
      finalRanking: { select: { classification: true } },
      application: {
        include: {
          session: {
            select: {
              name: true,
              sessionDate: true,
              graduationDecisionNumber: true,
              graduationDecisionDate: true,
              graduationDecisionSigner: true,
            },
          },
          rank: { select: { classification: true } },
        },
      },
    },
  },
  graduationApplications: {
    include: {
      session: {
        select: {
          name: true,
          sessionDate: true,
          graduationDecisionNumber: true,
          graduationDecisionDate: true,
          graduationDecisionSigner: true,
        },
      },
      rank: { select: { classification: true } },
      decision: {
        include: {
          finalRanking: { select: { classification: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" as const },
  },
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

    const nienKhoa = khoaHoc?.academicYear ?? ""

    const tongHocPhan = student.subjectClassStudent?.length ?? 0
    const tongTinChi =
      student.subjectClassStudent?.reduce(
        (sum, item) => sum + (item.subjectClass?.subject?.credit ?? 0),
        0
      ) ?? 0

    const gpaValue = ketQuaKy?.cumulativeGpaBase4
    const gpa = gpaValue != null ? `${Number(gpaValue).toFixed(2).replace(".", ",")} / 4,00` : "—"

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

    const dieuKienTotNghiep = mapDieuKienTotNghiep({
      foreignLangPass: student.foreignLangPass ?? false,
      ITCertificationPass: student.ITCertificationPass ?? false,
      militaryTrainingPass: student.militaryTrainingPass ?? false,
      strengthTrainingPass: student.strengthTrainingPass ?? false,
      archivedCertificate: student.archivedCertificate,
      outputStandardOnCurriculum: ct?.outputStandardOnCurriculum,
      subjectClassStudent: student.subjectClassStudent,
    })

    const tinhTrangHocTap = mapTinhTrangHocTap({
      scholarshipAwards: student.scholarshipAwards,
      academicWarning: student.academicWarning,
      disciplinaryWarning: student.disciplinaryWarning,
      studentAcademicDecision: student.studentAcademicDecision,
    })

    const giaiThuong = mapGiaiThuong(student.archivedAward)
    const quyetDinhTotNghiep = mapQuyetDinhTotNghiep({
      graduationDecision: student.graduationDecision,
      graduationApplications: student.graduationApplications,
    })

    return {
      tomTat: {
        anhDaiDien: layAnhDaiDien(profile?.avatar),
        hoVaTen: profile?.fullname ?? "",
        trangThai: layNhanTrangThai(student.status),
        maSinhVien: student.code ?? profile?.code ?? "",
        ngaySinh: dinhDangNgay(profile?.dateOfBirth),
        gioiTinh: profile?.gender?.sTen ?? "",
        lop: lop ? `${lop.code ?? ""}${lop.name ? ` - ${lop.name}` : ""}` : "",
        khoa: khoaHoc?.name ?? "",
        donViQuanLy: lop?.managementOrganization?.sTen ?? "",
        heDaoTao: ct?.trainingLevel?.name ?? "",
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
      dieuKienTotNghiep,
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
        gpa,
        xepLoaiHocLuc: ketQuaKy?.rank?.classification ?? null,
        diemRenLuyen: ketQuaKy?.conductScore != null ? `${ketQuaKy.conductScore} / 100` : null,
      },
      tinhTrangHocTap,
      giaiThuong,
      quyetDinhTotNghiep,
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
