import { tinhMucCanhBao } from "@components/cong-giang-vien/thong-bao/tinh-muc-canh-bao"
import type {
  BoLocThongBao,
  BoLocMucCanhBao,
  ThongBaoView,
} from "@components/cong-giang-vien/thong-bao/types"
import {
  DANH_SACH_LOAI_THONG_BAO_GV,
  isLoaiThongBaoGv,
  THU_TU_MUC_CANH_BAO,
} from "@components/cong-giang-vien/thong-bao/types"
import { useSession } from "@workspace/auth/react"
import { Prisma } from "@workspace/db/client"
import { useFindFirstLecturer, useFindManyNotification } from "@workspace/db/hooks"
import dayjs from "dayjs"
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react"

const STORAGE_PREFIX = "cgv-thong-bao-da-doc"

const docIdsKey = (profileId: string) => `${STORAGE_PREFIX}-${profileId}`

const loadDaDocIds = (profileId: string): Set<string> => {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(docIdsKey(profileId))
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

const saveDaDocIds = (profileId: string, ids: Set<string>) => {
  if (typeof window === "undefined") return
  localStorage.setItem(docIdsKey(profileId), JSON.stringify([...ids]))
}

const stripHtml = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const mapThongBao = (
  item: {
    id: string
    title: string
    content: string
    type: string
    publishedAt: Date | string
    expiresAt?: Date | string | null
  },
  daDocIds: Set<string>
): ThongBaoView | null => {
  if (!isLoaiThongBaoGv(item.type)) return null

  const mucCanhBao = tinhMucCanhBao(item.type, item.expiresAt)

  return {
    id: item.id,
    tieuDe: item.title,
    tomTat: stripHtml(item.content),
    loai: item.type,
    mucCanhBao,
    thoiGian: dayjs(item.publishedAt).format("HH:mm • DD/MM/YYYY"),
    hanXuLy: item.expiresAt ? dayjs(item.expiresAt).format("DD/MM/YYYY") : undefined,
    daDoc: daDocIds.has(item.id),
  }
}

const sapXepTheoUuTien = (
  a: { view: ThongBaoView; publishedAt: Date | string },
  b: { view: ThongBaoView; publishedAt: Date | string }
) => {
  const chenhMuc = THU_TU_MUC_CANH_BAO[a.view.mucCanhBao] - THU_TU_MUC_CANH_BAO[b.view.mucCanhBao]
  if (chenhMuc !== 0) return chenhMuc
  return dayjs(b.publishedAt).valueOf() - dayjs(a.publishedAt).valueOf()
}

// Lấy thông báo 4 loại cảnh báo của giảng viên từ bảng Notification.
const useThongBaoGiangVien = () => {
  const { data: me } = useSession()
  const profileId = me?.sDM_NhanVienId ?? ""

  const [boLoc, setBoLoc] = useState<BoLocThongBao>({
    tuKhoa: "",
    loai: "tat_ca",
    mucCanhBao: "tat_ca",
  })
  const [trang, setTrang] = useState(1)
  const [soTrang, setSoTrang] = useState(10)
  const [daDocIds, setDaDocIds] = useState<Set<string>>(() =>
    profileId ? loadDaDocIds(profileId) : new Set()
  )
  const tuKhoaTimKiem = useDeferredValue(boLoc.tuKhoa)

  useEffect(() => {
    if (profileId) setDaDocIds(loadDaDocIds(profileId))
  }, [profileId])

  const today = dayjs().endOf("day").toDate()

  const { data: lecturer } = useFindFirstLecturer(
    { where: { userProfileId: profileId }, select: { id: true } },
    { enabled: !!profileId }
  )

  const where = useMemo((): Prisma.NotificationWhereInput => {
    const dieuKienLecturer: Prisma.NotificationWhereInput[] = [{ targetAll: true }]
    if (lecturer?.id) {
      dieuKienLecturer.push({ lecturerId: lecturer.id })
    }

    const dieuKienTimKiem: Prisma.NotificationWhereInput[] = [
      { type: { in: DANH_SACH_LOAI_THONG_BAO_GV } },
    ]
    const tuKhoa = tuKhoaTimKiem.trim()
    if (tuKhoa) {
      dieuKienTimKiem.push({
        OR: [
          { title: { contains: tuKhoa, mode: "insensitive" } },
          { content: { contains: tuKhoa, mode: "insensitive" } },
        ],
      })
    }
    if (boLoc.loai !== "tat_ca") {
      dieuKienTimKiem.push({ type: boLoc.loai })
    }

    return {
      active: true,
      publishedAt: { lte: today },
      AND: [{ OR: dieuKienLecturer }, ...dieuKienTimKiem],
    }
  }, [boLoc.loai, tuKhoaTimKiem, lecturer?.id, today])

  const { data: raw = [], isLoading } = useFindManyNotification(
    {
      where,
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        publishedAt: true,
        expiresAt: true,
      },
    },
    { enabled: !!profileId }
  )

  const locTheoMucCanhBao = useCallback((items: ThongBaoView[], muc: BoLocMucCanhBao) => {
    if (muc === "tat_ca") return items
    return items.filter((item) => item.mucCanhBao === muc)
  }, [])

  const danhSachGoc = useMemo(() => {
    return raw
      .map((item) => {
        const view = mapThongBao(item, daDocIds)
        return view ? { view, publishedAt: item.publishedAt } : null
      })
      .filter((item): item is { view: ThongBaoView; publishedAt: Date } => item !== null)
      .sort(sapXepTheoUuTien)
      .map((item) => item.view)
  }, [raw, daDocIds])

  const danhSachDayDu = useMemo(
    () => locTheoMucCanhBao(danhSachGoc, boLoc.mucCanhBao),
    [danhSachGoc, boLoc.mucCanhBao, locTheoMucCanhBao]
  )

  const tongSo = danhSachDayDu.length

  const danhSach = useMemo(() => {
    const batDau = (trang - 1) * soTrang
    return danhSachDayDu.slice(batDau, batDau + soTrang)
  }, [danhSachDayDu, trang, soTrang])

  const danhSachTomTat = useMemo(() => danhSachDayDu.slice(0, 9), [danhSachDayDu])

  const thongKeMuc = useMemo(
    () => ({
      moi: danhSachGoc.filter((i) => i.mucCanhBao === "moi").length,
      sapHetHan: danhSachGoc.filter((i) => i.mucCanhBao === "sap_het_han").length,
      quaHan: danhSachGoc.filter((i) => i.mucCanhBao === "qua_han").length,
    }),
    [danhSachGoc]
  )

  const capNhatBoLoc = (capNhat: Partial<BoLocThongBao>) => {
    setBoLoc((prev) => ({ ...prev, ...capNhat }))
    setTrang(1)
  }

  const danhDauDaDoc = (id: string) => {
    if (!profileId) return
    setDaDocIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      saveDaDocIds(profileId, next)
      return next
    })
  }

  const danhDauTatCaDaDoc = () => {
    if (!profileId) return
    setDaDocIds((prev) => {
      const next = new Set(prev)
      for (const item of raw) next.add(item.id)
      saveDaDocIds(profileId, next)
      return next
    })
  }

  return {
    boLoc,
    capNhatBoLoc,
    danhSach,
    danhSachTomTat,
    tongSo,
    thongKeMuc,
    trang,
    setTrang,
    soTrang,
    setSoTrang,
    isLoading: !!profileId && isLoading,
    danhDauDaDoc,
    danhDauTatCaDaDoc,
  }
}

export { useThongBaoGiangVien }
