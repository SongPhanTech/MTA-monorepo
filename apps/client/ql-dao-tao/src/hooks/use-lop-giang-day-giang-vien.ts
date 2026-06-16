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
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import dayjs from "dayjs"
import { useMemo, useState } from "react"

const useLopGiangDayGiangVien = () => {
  const { data: me } = useSession()
  const profileId = me?.sDM_NhanVienId ?? ""
  const { id: semesterId } = useSemesterStore()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
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
      mainLecturer: { userProfileId: profileId },
      semesterId,
      trainingObjectTypeId,
      ...dieuKienTrangThaiNhapDiem(boLocApDung.trangThaiNhapDiem),
      ...(boLocApDung.tuKhoa
        ? {
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
          }
        : {}),
    }),
    [profileId, semesterId, trainingObjectTypeId, boLocApDung]
  )

  const queryEnabled = !!profileId && !!semesterId && !!trainingObjectTypeId

  const include = {
    subject: {
      select: {
        name: true,
        credit: true,
        onePoint: true,
        managementOrganization: { select: { sMa: true } },
      },
    },
    mainLecturer: {
      select: {
        code: true,
        userProfile: {
          select: {
            fullname: true,
            academicRankType: { select: { sMa: true } },
            academicDegreeType: { select: { sMa: true } },
          },
        },
      },
    },
    extraLecturer: {
      select: {
        code: true,
        userProfile: {
          select: {
            fullname: true,
            academicRankType: { select: { sMa: true } },
            academicDegreeType: { select: { sMa: true } },
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
          maLop: item.code ?? "",
          tenMonHoc: item.subject?.name ?? "",
          soTinChi: item.subject?.credit ?? null,
          loaiLop: item.type ?? null,
          hinhThucThi: item.examType ? getExamTypeLabel(item.examType) : "",
          trangThaiNhapDiem: trangThai.label,
          trangThaiNhapDiemColor: trangThai.color,
          monMotDauDiem: item.subject?.onePoint ?? false,
          ngayNdqt: item.scoreDeadLineStart
            ? dayjs(item.scoreDeadLineStart).format("DD/MM/YYYY")
            : "",
          hanNdqt: item.scoreDeadline ? dayjs(item.scoreDeadline).format("DD/MM/YYYY") : "",
          hanDqt: layHanConLai(item.scoreDeadline, item.isLockScore),
          ngayThi: item.examDate ? dayjs(item.examDate).toISOString() : null,
          hanNdt: item.examScoreDeadline ? dayjs(item.examScoreDeadline).format("DD/MM/YYYY") : "",
          hanDt: layHanConLai(item.examScoreDeadline, item.isLockExamScore),
          giangVien1: formatLecturerName(item.mainLecturer),
          giangVien2: formatLecturerName(item.extraLecturer),
          donViPhuTrach: item.subject?.managementOrganization?.sMa ?? "",
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
