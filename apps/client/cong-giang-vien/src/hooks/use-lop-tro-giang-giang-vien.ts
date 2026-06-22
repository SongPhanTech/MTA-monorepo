import type {
  BoLocLopTroGiang,
  LopTroGiangRow,
} from "@components/cong-giang-vien/lop-tro-giang/types"
import {
  formatThoiKhoaBieu,
  tinhTrangThaiTroGiang,
} from "@components/cong-giang-vien/lop-tro-giang/types"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { useSession } from "@workspace/auth/react"
import { useCountSubjectClass, useFindManySubjectClass } from "@workspace/db/hooks"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { useMemo, useState } from "react"

// Điều kiện ngày ứng với trạng thái hiển thị (giảng viên 2 = trợ giảng).
const dieuKienTrangThai = (trangThai: BoLocLopTroGiang["trangThai"]) => {
  const now = new Date()
  switch (trangThai) {
    case "chua_bat_dau":
      return { startDate: null }
    case "sap_bat_dau":
      return { startDate: { gt: now } }
    case "dang_dien_ra":
      return {
        AND: [{ startDate: { lte: now } }, { OR: [{ endDate: null }, { endDate: { gte: now } }] }],
      }
    default:
      return {}
  }
}

const useLopTroGiangGiangVien = () => {
  const { data: me } = useSession()
  const profileId = me?.sDM_NhanVienId ?? ""
  const { id: semesterId } = useSemesterStore()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const [boLocNhap, setBoLocNhap] = useState<BoLocLopTroGiang>({
    tuKhoa: "",
    trangThai: "tat_ca",
  })
  const [boLocApDung, setBoLocApDung] = useState<BoLocLopTroGiang>({
    tuKhoa: "",
    trangThai: "tat_ca",
  })
  const [trang, setTrang] = useState(1)
  const [soTrang, setSoTrang] = useState(DEFAULT_PAGINATE_SIZE)

  const where = useMemo(
    () => ({
      cancelled: false,
      extraLecturer: { userProfileId: profileId },
      semesterId,
      trainingObjectTypeId,
      ...dieuKienTrangThai(boLocApDung.trangThai),
      ...(boLocApDung.tuKhoa
        ? {
            OR: [
              { code: { contains: boLocApDung.tuKhoa, mode: "insensitive" as const } },
              {
                subject: {
                  is: { code: { contains: boLocApDung.tuKhoa, mode: "insensitive" as const } },
                },
              },
              {
                subject: {
                  is: { name: { contains: boLocApDung.tuKhoa, mode: "insensitive" as const } },
                },
              },
              {
                mainLecturer: {
                  is: {
                    userProfile: {
                      is: {
                        fullname: { contains: boLocApDung.tuKhoa, mode: "insensitive" as const },
                      },
                    },
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

  const { data = [], isLoading } = useFindManySubjectClass(
    {
      where,
      include: {
        subject: { select: { code: true, name: true, schedulePeriod: true } },
        mainLecturer: { select: { userProfile: { select: { fullname: true } } } },
        subjectClassTimes: true,
        _count: { select: { subjectClassStudent: true } },
      },
      orderBy: [{ code: "asc" }, { name: "asc" }],
      take: soTrang,
      skip: (trang - 1) * soTrang,
    },
    { enabled: queryEnabled }
  )

  const { data: tongSo = 0 } = useCountSubjectClass({ where }, { enabled: queryEnabled })

  const danhSach: LopTroGiangRow[] = useMemo(
    () =>
      data.map((item) => ({
        id: item.id,
        subjectVersionId: item.subjectId ?? "",
        maHocPhan: item.subject?.code ?? "",
        tenHocPhan: item.subject?.name ?? "",
        giangVienPhuTrach: item.mainLecturer?.userProfile?.fullname ?? "",
        soSinhVien: item._count?.subjectClassStudent ?? 0,
        soTietTKB: item.subject?.schedulePeriod ?? null,
        thoiKhoaBieu: formatThoiKhoaBieu(item.subjectClassTimes ?? []),
        trangThai: tinhTrangThaiTroGiang(item.startDate, item.endDate),
      })),
    [data]
  )

  const capNhatBoLoc = (capNhat: Partial<BoLocLopTroGiang>) => {
    setBoLocNhap((prev) => ({ ...prev, ...capNhat }))
  }

  const timKiem = () => {
    setBoLocApDung(boLocNhap)
    setTrang(1)
  }

  const doiTrangThai = (trangThai: BoLocLopTroGiang["trangThai"]) => {
    const capNhat = { ...boLocNhap, trangThai }
    setBoLocNhap(capNhat)
    setBoLocApDung(capNhat)
    setTrang(1)
  }

  return {
    boLoc: boLocNhap,
    capNhatBoLoc,
    timKiem,
    doiTrangThai,
    danhSach,
    tongSo,
    trang,
    setTrang,
    soTrang,
    setSoTrang,
    isLoading: queryEnabled && isLoading,
  }
}

export { useLopTroGiangGiangVien }
