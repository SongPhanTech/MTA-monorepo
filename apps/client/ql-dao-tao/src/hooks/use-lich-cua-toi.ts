import type { CheDoLich, SuKienLich } from "@components/cong-giang-vien/giang-vien/types"
import { useSession } from "@workspace/auth/react"
import type { Prisma } from "@workspace/db"
import { useFindFirstLecturer, useFindManyClassSchedule } from "@workspace/db/hooks"
import { PERIOD } from "@workspace/ui"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import dayjs from "dayjs"
import isoWeek from "dayjs/plugin/isoWeek"
import { useMemo, useState } from "react"

dayjs.extend(isoWeek)

type LichRaw = Prisma.ClassScheduleGetPayload<{
  include: {
    subjectClass: {
      select: {
        code: true
        name: true
        subject: { select: { name: true } }
        room: { select: { name: true } }
      }
    }
    room: { select: { name: true } }
  }
}>

const mapSuKien = (event: LichRaw): SuKienLich => {
  const startPeriod = PERIOD[event.startPeriod as keyof typeof PERIOD]
  const endPeriod = PERIOD[event.endPeriod as keyof typeof PERIOD]
  const start = event.startTime
    ? dayjs(event.startTime)
    : dayjs(event.classDate)
        .hour(dayjs(startPeriod?.startTime).hour())
        .minute(dayjs(startPeriod?.startTime).minute())
  const end = event.endTime
    ? dayjs(event.endTime)
    : dayjs(event.classDate)
        .hour(dayjs(endPeriod?.endTime).hour())
        .minute(dayjs(endPeriod?.endTime).minute())

  const maLop = event.subjectClass?.code ?? ""
  const tenMon = event.subjectClass?.subject?.name ?? event.subjectClass?.name ?? event.notes ?? ""
  const tieuDe = maLop && tenMon ? `${maLop} - ${tenMon}` : tenMon || maLop || "Sự kiện"

  return {
    id: event.id,
    ngay: dayjs(event.classDate).format("YYYY-MM-DD"),
    tieuDe,
    tiet: `${event.startPeriod} - ${event.endPeriod}`,
    thoiGian: `${start.format("HH:mm")} - ${end.format("HH:mm")}`,
    thoiGianBatDau: start.toISOString(),
    thoiGianKetThuc: end.toISOString(),
    loaiLich: event.periodType,
    diaDiem: event.location ?? event.room?.name ?? event.subjectClass?.room?.name ?? "",
    ghiChu: event.notes ?? undefined,
  }
}

const useLichCuaToi = (macDinhCheDo: CheDoLich = "ngay") => {
  const { data: me } = useSession()
  const profileId = me?.sDM_NhanVienId
  const { id: semesterId } = useSemesterStore()
  const { id: trainingObjectId } = useTrainingObjectTypeStore()

  const [cheDo, setCheDo] = useState<CheDoLich>(macDinhCheDo)
  const [offset, setOffset] = useState(0)

  const ngayThamChieu = useMemo(() => {
    const homNay = dayjs().startOf("day")
    if (cheDo === "ngay") return homNay.add(offset, "day")
    return homNay.add(offset, "week").startOf("isoWeek")
  }, [cheDo, offset])

  const khoangNgay = useMemo(() => {
    if (cheDo === "ngay") {
      return { tu: ngayThamChieu.startOf("day"), den: ngayThamChieu.endOf("day") }
    }
    return {
      tu: ngayThamChieu.startOf("isoWeek"),
      den: ngayThamChieu.endOf("isoWeek"),
    }
  }, [cheDo, ngayThamChieu])

  const { data: lecturer } = useFindFirstLecturer(
    { where: { userProfileId: profileId ?? "" }, select: { id: true } },
    { enabled: !!profileId }
  )

  const { data: lichRaw = [], isLoading } = useFindManyClassSchedule(
    {
      where: {
        classDate: {
          gte: khoangNgay.tu.toDate(),
          lte: khoangNgay.den.toDate(),
        },
        OR: [
          { lecturerId: lecturer?.id },
          { extraLecturerId: lecturer?.id },
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
        ],
      },
      include: {
        subjectClass: {
          select: {
            code: true,
            name: true,
            subject: { select: { name: true } },
            room: { select: { name: true } },
          },
        },
        room: { select: { name: true } },
      },
      orderBy: [{ classDate: "asc" }, { startPeriod: "asc" }],
    },
    { enabled: !!profileId && !!semesterId && !!trainingObjectId }
  )

  const suKien = useMemo(() => lichRaw.map(mapSuKien), [lichRaw])

  const suKienNgay = useMemo(
    () => suKien.filter((item) => dayjs(item.ngay).isSame(ngayThamChieu, "day")),
    [suKien, ngayThamChieu]
  )

  const nhanThoiGian = useMemo(() => {
    if (cheDo === "ngay") {
      const thu = ngayThamChieu.format("dddd")
      return `${thu.charAt(0).toUpperCase()}${thu.slice(1)}, ${ngayThamChieu.format("DD/MM/YYYY")}`
    }
    const dauTuan = ngayThamChieu.startOf("isoWeek")
    const cuoiTuan = ngayThamChieu.endOf("isoWeek")
    return `${dauTuan.format("DD/MM/YYYY")} - ${cuoiTuan.format("DD/MM/YYYY")}`
  }, [cheDo, ngayThamChieu])

  const lui = () => setOffset((prev) => prev - 1)
  const tien = () => setOffset((prev) => prev + 1)
  const veHomNay = () => setOffset(0)

  return {
    cheDo,
    setCheDo,
    nhanThoiGian,
    suKienNgay,
    suKienTuan: suKien,
    lui,
    tien,
    veHomNay,
    isLoading: !!profileId && isLoading,
  }
}

export { useLichCuaToi }
