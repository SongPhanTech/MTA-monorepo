import BangDiemHocKy from "@components/cong-giang-vien/ket-qua-hoc-tap/bang-diem-hoc-ky"
import TheHeaderKetQuaHocTap, {
  layNhanTrangThaiSinhVien,
} from "@components/cong-giang-vien/ket-qua-hoc-tap/the-header-ket-qua-hoc-tap"
import { chiTietLopQuanLyPath } from "@/utils/cong-giang-vien-path-helper"
import { useScoreConverter } from "@hooks/scoreConverter"
import {
  useFindManyStudentSubjectScore,
  useFindManyTrainingBlockSubject,
  useFindUniqueStudent,
} from "@workspace/db/hooks"
import { baoLuuScoreDescriptionWhere, isBaoLuuScoreDescription } from "@workspace/libs/bao-luu-diem"
import { courseScoreConfigFrom } from "@workspace/libs/utils"
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
  baoLuu?: boolean
}

const dinhDangNgay = (value?: string | Date | null) =>
  value ? dayjs(value).format("DD/MM/YYYY") : "—"

const dinhDangSo = (value: unknown, soChuSo = 2) =>
  value != null ? Number(value).toFixed(soChuSo).replace(".", ",") : "—"

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
            id: true,
            code: true,
            fullname: true,
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
                scoreToTakeExam: true,
                examScoreToPass: true,
                scoreToPass: true,
                scoreToPassGraduation: true,
                scoreToPassConditional: true,
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

  const curriculumVersionId =
    student?.curriculumVersionId || student?.fixedClass?.curriculumVersionId
  const { data: plannedSubjects = [] } = useFindManyTrainingBlockSubject(
    {
      where: {
        trainingBlockOnCurriculumVersion: { curriculumVersionId: curriculumVersionId || "" },
        deletedAt: null,
        active: true,
      },
      select: { subjectId: true, semester: true },
    },
    { enabled: !!curriculumVersionId }
  )
  const { data: baoLuuScores = [] } = useFindManyStudentSubjectScore(
    {
      where: {
        studentId,
        subjectClassId: null,
        deletedAt: null,
        ...baoLuuScoreDescriptionWhere(),
      },
      include: { subjectVersion: true },
    },
    { enabled: !!studentId }
  )

  const rows: RowData[] = useMemo(() => {
    const classRows = diemMonHoc.map((item) => {
      const diemHp =
        item.manualFinalScore != null ? Number(item.manualFinalScore) : Number(item.finalScore ?? 0)
      const quyDoi = convertScore(
        diemHp,
        courseScoreConfigFrom(student?.fixedClass?.trainingCourse, item)
      )
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
    })

    const plannedBySubject = new Map<string, number | null>()
    for (const block of plannedSubjects) {
      if (!plannedBySubject.has(block.subjectId) || plannedBySubject.get(block.subjectId) == null) {
        plannedBySubject.set(block.subjectId, block.semester ?? null)
      }
    }
    const indexBySemester = new Map(
      (student?.studentSemesterResult ?? []).map((item) => [
        item.semesterId,
        item.semesterIndexInCourse,
      ])
    )
    const currentIndex = semesterId ? indexBySemester.get(semesterId) : undefined
    const existingIds = new Set(diemMonHoc.map((item) => item.subjectVersionId))

    const baoLuuRows = baoLuuScores.flatMap((score) => {
      if (!isBaoLuuScoreDescription(score.description) || existingIds.has(score.subjectVersionId)) {
        return []
      }
      const planned = plannedBySubject.get(score.subjectVersionId)
      if (currentIndex == null || planned !== currentIndex) return []
      const diemHp = Number(score.manualFinalScore ?? score.finalScore ?? 0)
      const quyDoi = convertScore(
        diemHp,
        courseScoreConfigFrom(student?.fixedClass?.trainingCourse, score)
      )
      return [
        {
          id: score.id,
          maHocPhan: score.subjectVersion?.code ?? "",
          tenHocPhan: score.subjectVersion?.name ?? "",
          tinChi: score.subjectVersion?.credit ?? 0,
          cc: null,
          dk: null,
          diemThi: null,
          diemHp: diemHp || null,
          diemChu: quyDoi?.letter ?? "—",
          ketQuaDat: quyDoi?.pass ?? null,
          baoLuu: true,
        },
      ]
    })

    return [...classRows, ...baoLuuRows]
  }, [
    diemMonHoc,
    convertScore,
    student?.fixedClass?.trainingCourse,
    student?.studentSemesterResult,
    plannedSubjects,
    baoLuuScores,
    semesterId,
  ])

  const tongTinChi = useMemo(() => rows.reduce((acc, item) => acc + item.tinChi, 0), [rows])

  const khongThuocLop = !!student?.fixedClassId && student.fixedClassId !== fixedClassId

  const headerData = student
    ? {
        userProfileId: student.userProfile?.id,
        hoVaTen: student.userProfile?.fullname ?? "—",
        maSinhVien: student.userProfile?.code ?? "—",
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
