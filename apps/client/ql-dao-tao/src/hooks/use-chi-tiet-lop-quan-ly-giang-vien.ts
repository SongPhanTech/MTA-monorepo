import type {
  BoLocSinhVienLopQuanLy,
  SinhVienLopQuanLyRow,
  ThongTinLopQuanLyTomTat,
} from "@components/cong-giang-vien/lop-quan-ly/types"
import { DEFAULT_PAGINATE_SIZE, FIXED_CLASS_STUDENT_STATUS } from "@constants/constants"
import { useSession } from "@workspace/auth/react"
import {
  useCountStudent,
  useFindManyStudent,
  useFindUniqueFixedClass,
} from "@workspace/db/hooks"
import dayjs from "dayjs"
import { useMemo, useState } from "react"

const FIXED_CLASS_INCLUDE = {
  _count: {
    select: {
      students: {
        where: { deletedAt: null, active: true },
      },
    },
  },
  managementOrganization: { select: { sTen: true } },
  trainingCourse: {
    include: {
      trainingObjectType: { select: { name: true } },
    },
  },
  curriculumVersion: {
    include: {
      curriculum: {
        include: {
          trainingMajor: { select: { name: true } },
        },
      },
      trainingLevel: { select: { name: true } },
    },
  },
  lecturerManagement: {
    select: { userProfileId: true },
  },
} as const

const useChiTietLopQuanLyGiangVien = (fixedClassId: string) => {
  const { data: me } = useSession()
  const profileId = me?.sDM_NhanVienId ?? ""

  const [boLocNhap, setBoLocNhap] = useState<BoLocSinhVienLopQuanLy>({
    tuKhoa: "",
    trangThai: "tat_ca",
    gioiTinhId: "tat_ca",
  })
  const [boLocApDung, setBoLocApDung] = useState(boLocNhap)
  const [trang, setTrang] = useState(1)
  const [soTrang, setSoTrang] = useState(DEFAULT_PAGINATE_SIZE)

  const { data: fixedClass, isLoading: dangTaiLop } = useFindUniqueFixedClass(
    {
      where: { id: fixedClassId },
      include: FIXED_CLASS_INCLUDE,
    },
    { enabled: !!fixedClassId }
  )

  const coQuyenXem = useMemo(
    () => !!fixedClass && fixedClass.lecturerManagement?.userProfileId === profileId,
    [fixedClass, profileId]
  )

  const thongTinLop: ThongTinLopQuanLyTomTat | null = useMemo(() => {
    if (!fixedClass) return null

    const trangThaiLop = fixedClass.graduated
      ? { label: "Đã tốt nghiệp", color: "blue" }
      : fixedClass.active
        ? { label: "Đang học", color: "success" }
        : { label: "Không hoạt động", color: "default" }

    const khoaHoc = fixedClass.trainingCourse
    const namBatDau = khoaHoc?.startYear
    const namKetThuc = khoaHoc?.endYear
    const khoaLabel = [
      khoaHoc?.name,
      namBatDau && namKetThuc ? `(${namBatDau} - ${namKetThuc})` : null,
    ]
      .filter(Boolean)
      .join(" ")

    return {
      id: fixedClass.id,
      maLop: fixedClass.code ?? "",
      tenLop: fixedClass.name ?? "",
      trangThaiLop,
      siSo: fixedClass._count?.students ?? 0,
      donViQuanLy: fixedClass.managementOrganization?.sTen ?? "",
      chuyenNganh: fixedClass.curriculumVersion?.curriculum?.trainingMajor?.name ?? "",
      khoa: khoaLabel,
      bacDaoTao: fixedClass.curriculumVersion?.trainingLevel?.name ?? "",
      chuongTrinhDaoTao: fixedClass.curriculumVersion?.name ?? "",
      doiTuongDaoTao: khoaHoc?.trainingObjectType?.name ?? "",
    }
  }, [fixedClass])

  const whereSinhVien = useMemo(() => {
    const userProfileFilter = {
      ...(boLocApDung.gioiTinhId !== "tat_ca" ? { genderId: boLocApDung.gioiTinhId } : {}),
      ...(boLocApDung.tuKhoa
        ? { fullname: { contains: boLocApDung.tuKhoa, mode: "insensitive" as const } }
        : {}),
    }

    return {
      fixedClassId,
      deletedAt: null,
      active: true,
      ...(boLocApDung.trangThai !== "tat_ca" ? { status: boLocApDung.trangThai } : {}),
      ...(boLocApDung.tuKhoa
        ? {
            OR: [
              { code: { contains: boLocApDung.tuKhoa, mode: "insensitive" as const } },
              { userProfile: userProfileFilter },
            ],
          }
        : Object.keys(userProfileFilter).length > 0
          ? { userProfile: userProfileFilter }
          : {}),
    }
  }, [fixedClassId, boLocApDung])

  const querySinhVienEnabled = !!fixedClassId && coQuyenXem

  const { data: sinhVienData = [], isLoading: dangTaiSinhVien } = useFindManyStudent(
    {
      where: whereSinhVien,
      include: {
        userProfile: {
          include: { gender: true },
        },
      },
      orderBy: [{ userProfile: { code: "asc" } }, { userProfile: { firstName: "asc" } }],
      take: soTrang,
      skip: (trang - 1) * soTrang,
    },
    { enabled: querySinhVienEnabled }
  )

  const { data: tongSinhVien = 0 } = useCountStudent(
    { where: whereSinhVien },
    { enabled: querySinhVienEnabled }
  )

  const danhSachSinhVien: SinhVienLopQuanLyRow[] = useMemo(
    () =>
      sinhVienData.map((sv) => ({
        id: sv.id,
        maSinhVien: sv.userProfile?.code ?? sv.code ?? "",
        hoVaTen: sv.userProfile?.fullname ?? "",
        gioiTinh: sv.userProfile?.gender?.sTen ?? "",
        ngaySinh: sv.userProfile?.dateOfBirth
          ? dayjs(sv.userProfile.dateOfBirth).format("DD/MM/YYYY")
          : "",
        lienHe: sv.userProfile?.email ?? sv.userProfile?.phoneNumber ?? "",
        trangThai: sv.status,
      })),
    [sinhVienData]
  )

  const capNhatBoLoc = (capNhat: Partial<BoLocSinhVienLopQuanLy>) => {
    setBoLocNhap((prev) => ({ ...prev, ...capNhat }))
  }

  const timKiem = () => {
    setBoLocApDung(boLocNhap)
    setTrang(1)
  }

  const doiBoLocNgay = (capNhat: Partial<BoLocSinhVienLopQuanLy>) => {
    const next = { ...boLocNhap, ...capNhat }
    setBoLocNhap(next)
    setBoLocApDung(next)
    setTrang(1)
  }

  const layNhanTrangThai = (status: SinhVienLopQuanLyRow["trangThai"]) => {
    const meta = FIXED_CLASS_STUDENT_STATUS[status as keyof typeof FIXED_CLASS_STUDENT_STATUS]
    return meta ?? { label: status, color: "default" }
  }

  return {
    thongTinLop,
    coQuyenXem,
    dangTaiLop,
    boLoc: boLocNhap,
    capNhatBoLoc,
    timKiem,
    doiBoLocNgay,
    danhSachSinhVien,
    tongSinhVien,
    trang,
    setTrang,
    soTrang,
    setSoTrang,
    dangTaiSinhVien: querySinhVienEnabled && dangTaiSinhVien,
    layNhanTrangThai,
  }
}

export { useChiTietLopQuanLyGiangVien }
