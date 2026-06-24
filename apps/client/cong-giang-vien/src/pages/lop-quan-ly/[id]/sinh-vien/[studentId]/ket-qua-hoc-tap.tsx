import BangDiemHocKy from "@components/cong-giang-vien/ket-qua-hoc-tap/bang-diem-hoc-ky"
import TheHeaderKetQuaHocTap, {
  layNhanTrangThaiSinhVien,
} from "@components/cong-giang-vien/ket-qua-hoc-tap/the-header-ket-qua-hoc-tap"
import { chiTietLopQuanLyPath } from "@/utils/cong-giang-vien-path-helper"
import { useScoreConverter } from "@hooks/scoreConverter"
import { useFindManyStudentSubjectScore, useFindUniqueStudent } from "@workspace/db/hooks"
import { getRuntimeEnv } from "@workspace/libs/utils"
import { Alert, Button, Skeleton } from "antd"
import dayjs from "dayjs"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/router"
import { useEffect, useMemo, useState } from "react"

type RowData = {
  id: string
  maHocPhan: string
  tenHocPhan: string
  tinChi: number
  cc: number | null
  dk: number | null
  diemThi: number | null
  diemHp: number | null
  diemChu: string
  ketQuaDat: boolean | null
}

const dinhDangNgay = (value?: string | Date | null) =>
  value ? dayjs(value).format("DD/MM/YYYY") : "—"

const dinhDangSo = (value: unknown, soChuSo = 2) =>
  value != null ? Number(value).toFixed(soChuSo).replace(".", ",") : "—"

const layAnhDaiDien = (avatar?: string | null) => {
  if (!avatar) return undefined
  try {
    return new URL(avatar, getRuntimeEnv("NEXT_PUBLIC_MINIO_ENDPOINT")).href
  } catch {
    return undefined
  }
}

export default function KetQuaHocTapSinhVienPage() {
  const router = useRouter()
  const fixedClassId = router.query.id as string
  const studentId = router.query.studentId as string

  const { data: student, isLoading: dangTaiSinhVien } = useFindUniqueStudent(
    {
      where: { id: studentId },
      include: {
        userProfile: {
          select: {
            fullname: true,
            avatar: true,
            dateOfBirth: true,
            email: true,
            phoneNumber: true,
            gender: { select: { sTen: true } },
          },
        },
        fixedClass: {
          include: {
            managementOrganization: { select: { sTen: true } },
            curriculumVersion: {
              include: {
                curriculum: {
                  include: {
                    trainingMajor: {
                      select: {
                        organization: { select: { sTen: true } },
                      },
                    },
                  },
                },
              },
            },
            trainingCourse: {
              select: {
                name: true,
                code: true,
                admissionStartDate: true,
                scoreConverts: true,
              },
            },
          },
        },
        curriculumVersion: {
          select: {
            name: true,
            curriculum: {
              select: {
                trainingMajor: { select: { name: true } },
              },
            },
          },
        },
        studentSemesterResult: {
          where: { deletedAt: null, active: true },
          include: {
            semester: {
              select: { id: true, name: true, startDate: true, schoolYear: true },
            },
            rank: { select: { classification: true } },
          },
          orderBy: [{ semester: { startDate: "desc" } }],
        },
      },
    },
    { enabled: !!studentId }
  )

  const { convertScore } = useScoreConverter(
    student?.fixedClass?.trainingCourse?.scoreConverts ?? []
  )

  const ketQuaTheoKy = student?.studentSemesterResult ?? []
  const ketQuaMoiNhat = ketQuaTheoKy[0]

  const [semesterId, setSemesterId] = useState<string>()

  useEffect(() => {
    if (!semesterId && ketQuaTheoKy.length > 0) {
      setSemesterId(ketQuaTheoKy[0].semesterId)
    }
  }, [semesterId, ketQuaTheoKy])

  const ketQuaKyDangChon = useMemo(
    () => ketQuaTheoKy.find((item) => item.semesterId === semesterId),
    [ketQuaTheoKy, semesterId]
  )

  const hocKyOptions = useMemo(
    () =>
      ketQuaTheoKy.map((item) => ({
        semesterId: item.semesterId,
        schoolYearId: item.semester?.schoolYear?.id ?? "",
        schoolYearName: item.semester?.schoolYear?.name ?? "",
        semesterName: item.semester?.name ?? "",
      })),
    [ketQuaTheoKy]
  )

  const { data: diemMonHoc = [], isLoading: dangTaiDiem } = useFindManyStudentSubjectScore(
    {
      where: {
        studentId,
        subjectClass: {
          semesterId,
          cancelled: false,
        },
      },
      include: {
        subjectClass: {
          select: {
            id: true,
            subject: { select: { code: true, name: true, credit: true } },
          },
        },
      },
      orderBy: [{ subjectClass: { subject: { code: "asc" } } }],
    },
    { enabled: !!studentId && !!semesterId }
  )

  const rows: RowData[] = useMemo(
    () =>
      diemMonHoc.map((item) => {
        const diemHp =
          item.manualFinalScore != null
            ? Number(item.manualFinalScore)
            : Number(item.finalScore ?? 0)
        const quyDoi = convertScore(diemHp)
        return {
          id: item.id,
          maHocPhan: item.subjectClass?.subject?.code ?? "",
          tenHocPhan: item.subjectClass?.subject?.name ?? "",
          tinChi: item.subjectClass?.subject?.credit ?? 0,
          cc: item.attendanceScore ?? null,
          dk: item.midtermScore ?? null,
          diemThi: item.examScore ?? null,
          diemHp: diemHp || null,
          diemChu: quyDoi?.letter ?? "—",
          ketQuaDat: quyDoi?.pass ?? null,
        }
      }),
    [diemMonHoc, convertScore]
  )

  const tongTinChi = useMemo(() => rows.reduce((acc, item) => acc + item.tinChi, 0), [rows])

  const khongThuocLop = !!student?.fixedClassId && student.fixedClassId !== fixedClassId

  const headerData = student
    ? {
        anhDaiDien: layAnhDaiDien(student.userProfile?.avatar),
        hoVaTen: student.userProfile?.fullname ?? "—",
        maSinhVien: student.code ?? "—",
        gioiTinh: student.userProfile?.gender?.sTen ?? "—",
        lop:
          [student.fixedClass?.code, student.fixedClass?.name].filter(Boolean).join(" - ") || "—",
        trangThai: layNhanTrangThaiSinhVien(student.status),
        ngaySinh: dinhDangNgay(student.userProfile?.dateOfBirth),
        email: student.userProfile?.email ?? "—",
        sdt: student.userProfile?.phoneNumber ?? "—",
        khoaHoc: student.fixedClass?.trainingCourse?.code ?? "—",
        khoa:
          student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.organization?.sTen ??
          student.fixedClass?.managementOrganization?.sTen ??
          "—",
        chuongTrinhDaoTao:
          student.curriculumVersion?.curriculum?.trainingMajor?.name ??
          student.curriculumVersion?.name ??
          "—",
        ngayVaoTruong: dinhDangNgay(student.fixedClass?.trainingCourse?.admissionStartDate),
        gpaHienTai: dinhDangSo(ketQuaMoiNhat?.cumulativeGpaBase4),
        tinChiTichLuy:
          ketQuaMoiNhat?.accumulatedCredits != null
            ? String(ketQuaMoiNhat.accumulatedCredits)
            : "—",
        tinChiTong:
          ketQuaMoiNhat?.totalCreditsByCurriculum != null
            ? String(ketQuaMoiNhat.totalCreditsByCurriculum)
            : "—",
        diemRenLuyenTb:
          ketQuaMoiNhat?.conductScore != null ? String(ketQuaMoiNhat.conductScore) : "—",
        xepLoaiHocLuc: ketQuaMoiNhat?.rank?.classification ?? "—",
      }
    : null

  return (
    <div className="flex h-[calc(100vh-112px)] flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 items-center gap-3">
        <Button
          type="text"
          icon={<ArrowLeft size={18} />}
          onClick={() => router.push(chiTietLopQuanLyPath(fixedClassId))}
          className="flex h-9 w-9 items-center justify-center text-cgv-green-dark"
        />
        <h1 className="m-0 text-2xl font-bold uppercase tracking-wide text-cgv-green-dark">
          Kết quả học tập của sinh viên
        </h1>
      </div>

      {dangTaiSinhVien ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : !student ? (
        <Alert type="info" showIcon message="Không tìm thấy sinh viên." />
      ) : khongThuocLop ? (
        <Alert type="warning" showIcon message="Sinh viên không thuộc lớp quản lý hiện tại." />
      ) : (
        <>
          {headerData ? (
            <div className="shrink-0">
              <TheHeaderKetQuaHocTap data={headerData} />
            </div>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <BangDiemHocKy
              studentId={studentId}
              fixedClassId={fixedClassId}
              ketQuaTheoKy={ketQuaTheoKy}
              hocKyOptions={hocKyOptions}
              semesterId={semesterId}
              onDoiHocKy={setSemesterId}
              rows={rows}
              loading={dangTaiDiem}
              tongHocPhan={rows.length}
              tongTinChi={tongTinChi}
              gpaHocKy={`${dinhDangSo(ketQuaKyDangChon?.gpaBase4)} / 4,00`}
              xepLoaiHocLuc={ketQuaKyDangChon?.rank?.classification ?? "—"}
            />
          </div>
        </>
      )}
    </div>
  )
}
