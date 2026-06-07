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

// Hook lấy hồ sơ cá nhân của giảng viên đang đăng nhập và map về các interface view.
// Những trường schema chưa có sẽ để trống/0 kèm comment TODO để bổ sung sau.
const useHoSoCaNhan = () => {
  const { data: session } = useSession()
  const profileId = session?.sDM_NhanVienId

  const { data, isLoading } = useFindUniqueUserProfile(
    {
      where: { id: profileId ?? "" },
      include: {
        gender: true, // gioiTinh
        level: true, // chucDanh (DM_ChucDanh)
        academicRankType: true, // hocHam (DM_HocHam)
        academicDegreeType: true, // trinhDo (DM_HocVi)
        chucVuChinhQuyen: true, // chucVu (DM_ChucVu)
        trangThaiLamViec: true, // tinhTrang (DM_TrangThaiLamViec)
        lecturer: { include: { organization: true } }, // maGiangVien + donViCongTac
        hocVi: { include: { truong: true } }, // namCapBang / chuyenNganh / noiDaoTao
        quaTrinhCongTac: { include: { chucVu: true } }, // bảng khối 3
      },
    },
    { enabled: !!profileId }
  )

  // Bản ghi học vị mới nhất (theo năm) để lấy trình độ đào tạo cao nhất.
  const hocViMoiNhat = useMemo(() => {
    if (!data?.hocVi?.length) return undefined
    return [...data.hocVi].sort((a, b) => (b.year ?? 0) - (a.year ?? 0))[0]
  }, [data?.hocVi])

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
      hocHam: data?.academicRankType?.sTen ?? "",
      ngayVaoTruong: "", // TODO: schema chưa có trường "ngày vào trường" (gần nhất: recruitmentDate / tenureDate)
      tinhTrang: data?.trangThaiLamViec?.name ?? "",
      anhDaiDien: data?.avatar ?? undefined,
    }),
    [data, hocViMoiNhat]
  )

  const thongKe: ThongKeHoSo = useMemo(
    () => ({
      soNamCongTac: "", // TODO: tính từ recruitmentDate / quaTrinhCongTac
      soMonHocPhuTrach: 0, // TODO: đếm từ lecturer.mainSubjectClasses
      soLopGiangDay: 0, // TODO: đếm số lớp giảng dạy của lecturer
      soSinhVienHuongDan: 0, // TODO: đếm SV hướng dẫn (researchProjects / thesisProject)
    }),
    []
  )

  const lienHe: ThongTinLienHe = useMemo(
    () => ({
      diaChiLienHe: data?.contactAddress ?? "",
      diaChiThuongTru: data?.permanentAddress ?? "",
      emailCaNhan: data?.email ?? "", // TODO: schema chỉ có 1 trường email chung, chưa tách email cá nhân
      dienThoaiDiDong: data?.phoneNumber ?? "", // TODO: schema chỉ có 1 trường phone chung
      dienThoaiCoQuan: "", // TODO: schema chưa có trường điện thoại cơ quan
    }),
    [data]
  )

  const daoTao: TrinhDoDaoTao = useMemo(
    () => ({
      trinhDo: data?.academicDegreeType?.sTen ?? "",
      namCapBang: data?.academicDegreeDate
        ? dayjs(data.academicDegreeDate).format("YYYY")
        : (hocViMoiNhat?.year?.toString() ?? ""),
      chuyenNganh: hocViMoiNhat?.linhVuc ?? "",
      noiDaoTao: hocViMoiNhat?.truong?.name ?? "",
      tenLuanAn: "", // TODO: schema chưa có trường tên luận án/đề tài
    }),
    [data, hocViMoiNhat]
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
        ghiChu: "", // TODO: model QuaTrinhCongTac chưa có trường ghi chú riêng
      })),
    [data?.quaTrinhCongTac]
  )

  return { thongTin, thongKe, lienHe, daoTao, quaTrinhCongTac, isLoading }
}

export { useHoSoCaNhan }
