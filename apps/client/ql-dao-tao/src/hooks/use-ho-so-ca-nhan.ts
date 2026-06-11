import type {
  QuaTrinhCongTac as QuaTrinhCongTacView,
  ThongKeHoSo,
  ThongTinCaNhan,
  ThongTinLienHe,
  TrinhDoDaoTao,
} from "@components/cong-giang-vien/ho-so-ca-nhan/types"
import { useSession } from "@workspace/auth/react"
import { useFindUniqueUserProfile } from "@workspace/db/hooks"
import dayjs from "dayjs"
import { useMemo } from "react"

const formatNgay = (value?: Date | string | null) =>
  value ? dayjs(value).format("DD/MM/YYYY") : ""

const useHoSoCaNhan = () => {
  const { data: session } = useSession()
  const profileId = session?.sDM_NhanVienId

  const { data, isLoading } = useFindUniqueUserProfile(
    {
      where: { id: profileId ?? "" },
      include: {
        gender: true,
        level: true, // chucDanh (DM_ChucDanh)
        academicRankType: true, // hocHam (DM_HocHam)
        academicDegreeType: true, // trinhDo (DM_HocVi)
        chucVuChinhQuyen: true, // chucVu (DM_ChucVu)
        trangThaiLamViec: true, // tinhTrang (DM_TrangThaiLamViec)
        lecturer: {
          include: {
            organization: true,
            mainSubjectClasses: { select: { subject: { select: { subjectId: true } } } },
            _count: { select: { primarySupervisorThesisProject: true } },
          },
        },
        hocVi: { include: { truong: true, academicDegreeType: true } }, // namCapBang / chuyenNganh / noiDaoTao / trình độ (học vị)
        hocHam: { include: { academicRankType: true } }, // trình độ (học hàm)
        quaTrinhCongTac: { include: { chucVu: true } }, // bảng khối 3
      },
    },
    { enabled: !!profileId }
  )

  const hocViMoiNhat = useMemo(() => {
    if (!data?.hocVi?.length) return undefined
    return [...data.hocVi].sort((a, b) => (b.year ?? 0) - (a.year ?? 0))[0]
  }, [data?.hocVi])

  const hocHamMoiNhat = useMemo(() => {
    if (!data?.hocHam?.length) return undefined
    return [...data.hocHam].sort((a, b) => (b.year ?? 0) - (a.year ?? 0))[0]
  }, [data?.hocHam])

  const thongTin: ThongTinCaNhan = useMemo(
    () => ({
      hoVaTen: data?.fullname ?? "",
      gioiTinh: data?.gender?.sTen ?? "",
      ngaySinh: formatNgay(data?.dateOfBirth),
      email: data?.email ?? "",
      soDienThoai: data?.phoneNumber ?? "",
      cmndCccd: data?.idCardNumber ?? "",
      maGiangVien: data?.lecturer?.lectureID ?? data?.code ?? "",
      donViCongTac: data?.lecturer?.organization?.sTen ?? "",
      chucVu: data?.chucVuChinhQuyen?.sTen ?? "",
      chucDanh: data?.level?.sTen ?? "",
      hocHam: hocHamMoiNhat?.academicRankType?.sTen ?? "",
      ngayVaoTruong: formatNgay(data?.recruitmentDate),
      tinhTrang: data?.trangThaiLamViec?.name ?? "",
      anhDaiDien: data?.avatar ?? undefined,
    }),
    [data, hocHamMoiNhat]
  )

  const thongKe: ThongKeHoSo = useMemo(() => {
    const lecturer = data?.lecturer
    const lopGiangDay = lecturer?.mainSubjectClasses ?? []
    const soNam = data?.recruitmentDate ? dayjs().diff(dayjs(data.recruitmentDate), "year") : 0
    const monHocDistinct = new Set(lopGiangDay.map((lop) => lop.subject?.subjectId).filter(Boolean))
    return {
      soNamCongTac: data?.recruitmentDate ? `${soNam} năm` : "",
      soMonHocPhuTrach: monHocDistinct.size,
      soLopGiangDay: lopGiangDay.length,
      soSinhVienHuongDan: lecturer?._count?.primarySupervisorThesisProject ?? 0,
    }
  }, [data])

  const lienHe: ThongTinLienHe = useMemo(
    () => ({
      diaChiLienHe: data?.contactAddress ?? "",
      diaChiThuongTru: data?.permanentAddress ?? "",
      emailCaNhan: data?.email ?? "",
      dienThoaiDiDong: data?.phoneNumber ?? "",
      dienThoaiCoQuan: data?.officePhone ?? "",
    }),
    [data]
  )

  const daoTao: TrinhDoDaoTao = useMemo(
    () => ({
      trinhDo:
        hocHamMoiNhat?.academicRankType?.sTen ?? hocViMoiNhat?.academicDegreeType?.sTen ?? "",
      namCapBang: data?.academicDegreeDate
        ? dayjs(data.academicDegreeDate).format("YYYY")
        : (hocViMoiNhat?.year?.toString() ?? ""),
      chuyenNganh: hocViMoiNhat?.linhVuc ?? "",
      noiDaoTao: hocViMoiNhat?.truong?.name ?? "",
      tenLuanAn: hocViMoiNhat?.tenLuanAn ?? "",
    }),
    [data, hocViMoiNhat, hocHamMoiNhat]
  )

  const quaTrinhCongTac: QuaTrinhCongTacView[] = useMemo(
    () =>
      (data?.quaTrinhCongTac ?? []).map((item) => ({
        id: item.id,
        thoiGian: `${formatNgay(item.tuThangNam)} - ${
          item.denThangNam ? formatNgay(item.denThangNam) : "nay"
        }`,
        donViCongTac: item.donVi ?? "",
        viTriCongTac: item.chucDanh ?? item.chucVu?.sTen ?? "",
        ghiChu: item.description ?? "",
      })),
    [data?.quaTrinhCongTac]
  )

  return { thongTin, thongKe, lienHe, daoTao, quaTrinhCongTac, isLoading }
}

export { useHoSoCaNhan }
