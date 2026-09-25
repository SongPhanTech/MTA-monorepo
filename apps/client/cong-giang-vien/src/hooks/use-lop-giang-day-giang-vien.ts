import type {
  BoLocLopGiangDay,
  LopGiangDayRow,
} from "@components/cong-giang-vien/lop-giang-day/types"
import {
  dieuKienTrangThaiNhapDiem,
  layHanConLai,
  layTrangThaiNhapDiem,
} from "@components/cong-giang-vien/lop-giang-day/types"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { useExamTypeOptions } from "@hooks/examType"
import { useSession } from "@workspace/auth/react"
import { $Enums } from "@workspace/db/client"
import { useCountSubjectClass, useFindManySubjectClass } from "@workspace/db/hooks"
import { formatLecturerName } from "@workspace/libs"
import { formatDateVn } from "@workspace/libs/timezone"
import { useSemesterStore } from "@workspace/ui"
import dayjs from "dayjs"
import { useMemo, useState } from "react"

const useLopGiangDayGiangVien = () => {
  const { data: me } = useSession()
  const profileId = me?.sDM_NhanVienId ?? ""
  const { id: semesterId } = useSemesterStore()

  const { getExamTypeLabel } = useExamTypeOptions()

  const [boLocNhap, setBoLocNhap] = useState<BoLocLopGiangDay>({
    tuKhoa: "",
    trangThaiNhapDiem: "tat_ca",
  })
  const [boLocApDung, setBoLocApDung] = useState(boLocNhap)
  const [trang, setTrang] = useState(1)
  const [soTrang, setSoTrang] = useState(DEFAULT_PAGINATE_SIZE)

  const where = useMemo(
    () => ({
      cancelled: false,
      deletedAt: null,
      active: true,
      status: $Enums.SubjectClassStatus.OFFICIAL,
      AND: [
        {
          OR: [
            { mainLecturer: { userProfileId: profileId } },
            { extraLecturer: { userProfileId: profileId } },
            { enterGradeLecturer: { userProfileId: profileId } },
          ],
        },
        ...(Object.keys(dieuKienTrangThaiNhapDiem(boLocApDung.trangThaiNhapDiem)).length > 0
          ? [dieuKienTrangThaiNhapDiem(boLocApDung.trangThaiNhapDiem)]
          : []),
        ...(boLocApDung.tuKhoa
          ? [
              {
                OR: [
                  { code: { contains: boLocApDung.tuKhoa, mode: "insensitive" as const } },
                  {
                    subject: {
                      is: { name: { contains: boLocApDung.tuKhoa, mode: "insensitive" as const } },
                    },
                  },
                  {
                    subject: {
                      is: { code: { contains: boLocApDung.tuKhoa, mode: "insensitive" as const } },
                    },
                  },
                  {
                    fixedClasses: {
                      some: {
                        OR: [
                          { code: { contains: boLocApDung.tuKhoa, mode: "insensitive" as const } },
                          { name: { contains: boLocApDung.tuKhoa, mode: "insensitive" as const } },
                        ],
                      },
                    },
                  },
                ],
              },
            ]
          : []),
      ],
      semesterId,
    }),
    [profileId, semesterId, boLocApDung]
  )

  const queryEnabled = !!profileId && !!semesterId

  const include = {
    subject: {
      select: {
        name: true,
        credit: true,
        onePoint: true,
        managementOrganization: { select: { sMa: true } },
      },
    },
    _count: {
      select: {
        subjectClassStudent: true,
      },
    },
    mainLecturer: {
      select: {
        userProfile: {
          select: {
            code: true,
            fullname: true,
            academicRankType: { select: { sMa: true } },
            academicDegreeType: { select: { sMa: true } },
          },
        },
      },
    },
    extraLecturer: {
      select: {
        userProfile: {
          select: {
            code: true,
            fullname: true,
            academicRankType: { select: { sMa: true } },
            academicDegreeType: { select: { sMa: true } },
          },
        },
      },
    },
    exam: {
      select: {
        id: true,
        examRooms: {
          select: {
            examList: {
              select: { id: true },
            },
          },
        },
      },
    },
  } as const

  const { data = [], isLoading } = useFindManySubjectClass(
    {
      where,
      include,
      orderBy: [{ examDate: "asc" }, { code: "asc" }],
      take: soTrang,
      skip: (trang - 1) * soTrang,
    },
    { enabled: queryEnabled }
  )

  const { data: tongSo = 0 } = useCountSubjectClass({ where }, { enabled: queryEnabled })

  const danhSach: LopGiangDayRow[] = useMemo(
    () =>
      data.map((item) => {
        const trangThai = layTrangThaiNhapDiem(item)
        return {
          id: item.id,
          subjectVersionId: item.subjectId ?? "",
          maLop: item.code ?? "",
          tenMonHoc: item.subject?.name ?? "",
          soTinChi: item.subject?.credit ?? null,
          loaiLop: item.type ?? null,
          soSinhVien: item._count?.subjectClassStudent ?? 0,
          hinhThucThi: item.examType ? getExamTypeLabel(item.examType) : "",
          trangThaiNhapDiem: trangThai.label,
          trangThaiNhapDiemColor: trangThai.color,
          monMotDauDiem: item.subject?.onePoint ?? false,
          ngayNdqt: item.scoreDeadLineStart ? formatDateVn(item.scoreDeadLineStart) : "",
          hanNdqt: item.scoreDeadline ? formatDateVn(item.scoreDeadline) : "",
          hanDqt: layHanConLai(item.scoreDeadline, item.isLockScore),
          ngayThi: item.examDate ? dayjs(item.examDate).toISOString() : null,
          hanNdt: item.examScoreDeadline ? formatDateVn(item.examScoreDeadline) : "",
          hanDt: layHanConLai(item.examScoreDeadline, item.isLockExamScore),
          giangVien1: formatLecturerName(item.mainLecturer),
          giangVien2: formatLecturerName(item.extraLecturer),
          donViPhuTrach: item.subject?.managementOrganization?.sMa ?? "",
          examId: item.exam?.id ?? null,
          canXuatDanhSachThi:
            !!item.exam?.id &&
            (item.exam.examRooms?.some((room) => (room.examList?.length ?? 0) > 0) ?? false),
        }
      }),
    [data, getExamTypeLabel]
  )

  const capNhatBoLoc = (capNhat: Partial<BoLocLopGiangDay>) => {
    setBoLocNhap((prev) => ({ ...prev, ...capNhat }))
  }

  const timKiem = () => {
    setBoLocApDung(boLocNhap)
    setTrang(1)
  }

  const doiTrangThaiNhapDiem = (trangThai: BoLocLopGiangDay["trangThaiNhapDiem"]) => {
    const capNhat = { ...boLocNhap, trangThaiNhapDiem: trangThai }
    setBoLocNhap(capNhat)
    setBoLocApDung(capNhat)
    setTrang(1)
  }

  return {
    boLoc: boLocNhap,
    capNhatBoLoc,
    timKiem,
    doiTrangThaiNhapDiem,
    danhSach,
    tongSo,
    trang,
    setTrang,
    soTrang,
    setSoTrang,
    isLoading: queryEnabled && isLoading,
  }
}

export { useLopGiangDayGiangVien }
