import { tinhMucCanhBao } from "@components/cong-giang-vien/thong-bao/tinh-muc-canh-bao"
import type {
  BoLocThongBao,
  BoLocMucCanhBao,
  ThongBaoView,
  TrangThaiDoc,
} from "@components/cong-giang-vien/thong-bao/types"
import {
  DANH_SACH_LOAI_THONG_BAO_GV,
  isLoaiThongBaoGv,
  laySubjectClassIdTuMaThongBao,
  THU_TU_MUC_CANH_BAO,
} from "@components/cong-giang-vien/thong-bao/types"
import { loadDaDocIds, saveDaDocIds, THONG_BAO_DA_DOC_UPDATED_EVENT } from "@lib/thong-bao-da-doc"
import { useSession } from "@workspace/auth/react"
import { Prisma } from "@workspace/db/client"
import { useFindFirstLecturer, useFindManyNotification } from "@workspace/db/hooks"
import dayjs from "dayjs"
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react"

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
    code?: string | null
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
    subjectClassId: laySubjectClassIdTuMaThongBao(item.code),
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
    trangThaiDoc: "tat_ca",
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

  useEffect(() => {
    if (!profileId) return

    const dongBoDaDoc = (event: Event) => {
      const { profileId: profileIdCapNhat } =
        (event as CustomEvent<{ profileId?: string }>).detail ?? {}
      if (profileIdCapNhat && profileIdCapNhat !== profileId) return
      setDaDocIds(loadDaDocIds(profileId))
    }

    window.addEventListener(THONG_BAO_DA_DOC_UPDATED_EVENT, dongBoDaDoc)
    return () => window.removeEventListener(THONG_BAO_DA_DOC_UPDATED_EVENT, dongBoDaDoc)
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
        code: true,
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

  const locTheoTrangThaiDoc = useCallback((items: ThongBaoView[], trangThai: TrangThaiDoc) => {
    if (trangThai === "chua_doc") return items.filter((item) => !item.daDoc)
    if (trangThai === "da_doc") return items.filter((item) => item.daDoc)
    return items
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

  const danhSachDayDu = useMemo(() => {
    const theoMuc = locTheoMucCanhBao(danhSachGoc, boLoc.mucCanhBao)
    return locTheoTrangThaiDoc(theoMuc, boLoc.trangThaiDoc)
  }, [danhSachGoc, boLoc.mucCanhBao, boLoc.trangThaiDoc, locTheoMucCanhBao, locTheoTrangThaiDoc])

  const soChuaDoc = useMemo(() => danhSachGoc.filter((item) => !item.daDoc).length, [danhSachGoc])

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

  const danhDauDaDoc = useCallback(
    (id: string) => {
      if (!profileId || daDocIds.has(id)) return false
      setDaDocIds((prev) => {
        const next = new Set(prev)
        next.add(id)
        saveDaDocIds(profileId, next)
        return next
      })
      return true
    },
    [profileId, daDocIds]
  )

  const danhDauTatCaDaDoc = useCallback(() => {
    if (!profileId) return 0
    const idsChuaDoc = danhSachGoc.filter((item) => !item.daDoc).map((item) => item.id)
    if (!idsChuaDoc.length) return 0

    setDaDocIds((prev) => {
      const next = new Set(prev)
      for (const id of idsChuaDoc) next.add(id)
      saveDaDocIds(profileId, next)
      return next
    })
    return idsChuaDoc.length
  }, [profileId, danhSachGoc])

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
    soChuaDoc,
    danhDauDaDoc,
    danhDauTatCaDaDoc,
  }
}

export { useThongBaoGiangVien }
