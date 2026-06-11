import {
  khoangNgayQuery as khoangNgayCaNhan,
  khoangTuanQuery as khoangTuanCaNhan,
  mapLichSangDong,
} from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/utils"
import {
  khoangNgayQuery as khoangNgayGiangDay,
  khoangTuanQuery as khoangTuanGiangDay,
  layKhoangTuan,
  mapLichGiangDaySangDong,
} from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/utils"
import type { DongTatCaLich } from "@components/cong-giang-vien/lich-cua-toi/tat-ca-lich/types"
import { gopVaSapXepLich } from "@components/cong-giang-vien/lich-cua-toi/tat-ca-lich/utils"
import type { CheDoLich, SuKienLich } from "@components/cong-giang-vien/giang-vien/types"
import { useLecturerHienTai } from "@hooks/use-lecturer-hien-tai"
import { useSession } from "@workspace/auth/react"
import { useFindManyClassSchedule, useFindManyIndividualSchedule } from "@workspace/db/hooks"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import dayjs from "dayjs"
import isoWeek from "dayjs/plugin/isoWeek"
import { useMemo, useState } from "react"

dayjs.extend(isoWeek)

const dieuKienLichGiangVien = (
  lecturerId: string | undefined,
  profileId: string | undefined,
  semesterId: string | undefined,
  trainingObjectId: string | undefined
) => ({
  OR: [
    ...(lecturerId ? [{ lecturerId }, { extraLecturerId: lecturerId }] : []),
    ...(profileId && semesterId && trainingObjectId
      ? [
          {
            subjectClass: {
              mainLecturer: { userProfileId: profileId },
              semesterId,
              trainingObjectTypeId: trainingObjectId,
              cancelled: false,
            },
          },
          {
            subjectClass: {
              extraLecturer: { userProfileId: profileId },
              semesterId,
              trainingObjectTypeId: trainingObjectId,
              cancelled: false,
            },
          },
        ]
      : []),
  ],
})

const mapDongTatCaSangSuKien = (item: DongTatCaLich): SuKienLich => {
  const tietMatch = item.nguon === "giang-day" ? item.noiDung.match(/^Tiết (.+?):/) : null

  return {
    id: item.id,
    ngay: item.ngayKey,
    tieuDe: item.tieuDeHienThi,
    tiet: tietMatch?.[1],
    thoiGian: item.thoiGian,
    thoiGianBatDau: item.batDauIso,
    thoiGianKetThuc: item.ketThucIso,
    caNgay: item.caNgay,
    tenLoai: item.tenLoai,
    mauLoai: item.mauLoai,
    diaDiem: item.diaDiem !== "—" ? item.diaDiem : "",
    ghiChu: item.ghiChu !== "—" ? item.ghiChu : undefined,
  }
}

const useLichCuaToi = (macDinhCheDo: CheDoLich = "ngay") => {
  const { data: me } = useSession()
  const profileId = me?.sDM_NhanVienId
  const { lecturerId, isLoading: dangTaiLecturer } = useLecturerHienTai()
  const { id: semesterId } = useSemesterStore()
  const { id: trainingObjectId } = useTrainingObjectTypeStore()

  const [cheDo, setCheDo] = useState<CheDoLich>(macDinhCheDo)
  const [offset, setOffset] = useState(0)

  const ngayThamChieu = useMemo(() => {
    const homNay = dayjs().startOf("day")
    if (cheDo === "ngay") return homNay.add(offset, "day")
    return homNay.add(offset, "week").startOf("isoWeek")
  }, [cheDo, offset])

  const { dauTuan, cuoiTuan } = useMemo(
    () => (cheDo === "tuan" ? layKhoangTuan(ngayThamChieu) : { dauTuan: ngayThamChieu, cuoiTuan: ngayThamChieu }),
    [cheDo, ngayThamChieu]
  )

  const khoangGiangDay = useMemo(
    () =>
      cheDo === "tuan"
        ? khoangTuanGiangDay(dauTuan, cuoiTuan)
        : khoangNgayGiangDay(ngayThamChieu),
    [cheDo, dauTuan, cuoiTuan, ngayThamChieu]
  )

  const khoangCaNhan = useMemo(
    () =>
      cheDo === "tuan"
        ? khoangTuanCaNhan(dauTuan, cuoiTuan)
        : khoangNgayCaNhan(ngayThamChieu),
    [cheDo, dauTuan, cuoiTuan, ngayThamChieu]
  )

  const duDieuKienGiangDay = !!profileId && !!semesterId && !!trainingObjectId
  const duDieuKienCaNhan = !!lecturerId

  const { data: lichGiangRaw = [], isLoading: dangTaiGiangDay } = useFindManyClassSchedule(
    {
      where: {
        ...khoangGiangDay,
        ...dieuKienLichGiangVien(lecturerId, profileId, semesterId, trainingObjectId),
      },
      include: {
        subjectClass: {
          select: {
            id: true,
            code: true,
            name: true,
            subject: { select: { name: true, code: true } },
            trainingLocation: { select: { name: true } },
            room: { select: { name: true } },
          },
        },
        room: {
          select: {
            name: true,
            building: { select: { trainingLocation: { select: { name: true } } } },
          },
        },
      },
      orderBy: [{ classDate: "asc" }, { startPeriod: "asc" }],
    },
    { enabled: duDieuKienGiangDay }
  )

  const { data: lichCaNhanRaw = [], isLoading: dangTaiCaNhan } = useFindManyIndividualSchedule(
    {
      where: {
        lecturerId: lecturerId ?? "",
        ...khoangCaNhan,
      },
      include: { tags: { select: { id: true, name: true, color: true } } },
      orderBy: [{ startTime: "asc" }],
    },
    { enabled: duDieuKienCaNhan }
  )

  const suKien = useMemo(() => {
    const giangDay = lichGiangRaw.map(mapLichGiangDaySangDong)
    const caNhan = lichCaNhanRaw.map(mapLichSangDong)
    return gopVaSapXepLich(giangDay, caNhan).map(mapDongTatCaSangSuKien)
  }, [lichGiangRaw, lichCaNhanRaw])

  const suKienNgay = useMemo(
    () => suKien.filter((item) => dayjs(item.ngay).isSame(ngayThamChieu, "day")),
    [suKien, ngayThamChieu]
  )

  const nhanThoiGian = useMemo(() => {
    if (cheDo === "ngay") {
      const thu = ngayThamChieu.format("dddd")
      return `${thu.charAt(0).toUpperCase()}${thu.slice(1)}, ${ngayThamChieu.format("DD/MM/YYYY")}`
    }
    const dauTuanLabel = ngayThamChieu.startOf("isoWeek")
    const cuoiTuanLabel = ngayThamChieu.endOf("isoWeek")

    const dinhDangDau = dauTuanLabel.isSame(cuoiTuanLabel, "year") ? "DD/MM" : "DD/MM/YYYY"
    return `${dauTuanLabel.format(dinhDangDau)} - ${cuoiTuanLabel.format("DD/MM/YYYY")}`
  }, [cheDo, ngayThamChieu])

  const lui = () => setOffset((prev) => prev - 1)
  const tien = () => setOffset((prev) => prev + 1)
  const veHomNay = () => setOffset(0)

  const dichDenNgay = (ngay: dayjs.Dayjs) => {
    const homNay = dayjs().startOf("day")
    if (cheDo === "ngay") {
      setOffset(ngay.startOf("day").diff(homNay, "day"))
    } else {
      setOffset(ngay.startOf("isoWeek").diff(homNay.startOf("isoWeek"), "week"))
    }
  }

  return {
    cheDo,
    setCheDo,
    nhanThoiGian,
    ngayThamChieu,
    suKienNgay,
    suKienTuan: suKien,
    lui,
    tien,
    veHomNay,
    dichDenNgay,
    isLoading: dangTaiLecturer || dangTaiGiangDay || dangTaiCaNhan,
  }
}

export { useLichCuaToi }
