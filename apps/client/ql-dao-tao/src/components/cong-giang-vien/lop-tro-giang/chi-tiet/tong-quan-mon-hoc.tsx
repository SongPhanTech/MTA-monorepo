// Tab "Tổng quan" của màn chi tiết môn học (chỉ-đọc).
import NoiDungRichText from "@components/cong-giang-vien/lop-tro-giang/chi-tiet/noi-dung-rich-text"
import { Descriptions } from "antd"
import { BookOpen } from "lucide-react"

interface TongQuanMonHocProps {
  tenHocPhan: string
  maMonHoc: string
  soTinChi?: number | null
  soTiet?: number | null
  hinhThucThi: string
  khoaBoMon: string
  doiTuongDaoTao: string
  trinhDoDaoTao: string
  hinhThucDaoTao: string
  ngonNguGiangDay: string
  dieuKienTienQuyet: string
  moTa?: string | null
  mucTieu?: string | null
  heSoThuongXuyen?: number | null
  heSoDinhKy?: number | null
  heSoThi?: number | null
}

const formatHeSo = (giaTri?: number | null) =>
  giaTri != null ? String(giaTri).replace(".", ",") : "-"

const ChiSo = ({ nhan, giaTri }: { nhan: string; giaTri: string }) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-1 px-4 py-3 text-center">
    <span className="text-xs uppercase tracking-wide text-gray-500">{nhan}</span>
    <span className="text-base font-semibold text-cgv-green-dark">{giaTri || "-"}</span>
  </div>
)

const Khoi = ({ tieuDe, children }: { tieuDe: string; children: React.ReactNode }) => (
  <div className="rounded-lg border border-gray-100 bg-white p-4">
    <h3 className="mb-3 text-base font-semibold text-cgv-green-dark">{tieuDe}</h3>
    {children}
  </div>
)

const TongQuanMonHoc = ({
  tenHocPhan,
  maMonHoc,
  soTinChi,
  soTiet,
  hinhThucThi,
  khoaBoMon,
  doiTuongDaoTao,
  trinhDoDaoTao,
  hinhThucDaoTao,
  ngonNguGiangDay,
  dieuKienTienQuyet,
  moTa,
  mucTieu,
  heSoThuongXuyen,
  heSoDinhKy,
  heSoThi,
}: TongQuanMonHocProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-gray-100 bg-white p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cgv-green-dark/10 text-cgv-green-dark">
            <BookOpen size={24} />
          </div>
          <h2 className="m-0 text-lg font-bold text-cgv-green-dark">{tenHocPhan}</h2>
        </div>
        <div className="flex flex-wrap divide-x divide-gray-100 rounded-lg border border-gray-100">
          <ChiSo nhan="Mã môn học" giaTri={maMonHoc} />
          <ChiSo nhan="Số tín chỉ" giaTri={soTinChi != null ? String(soTinChi) : ""} />
          <ChiSo nhan="Số tiết" giaTri={soTiet != null ? String(soTiet) : ""} />
          <ChiSo nhan="Hình thức thi" giaTri={hinhThucThi} />
        </div>
      </div>

      <Khoi tieuDe="Thông tin chung">
        <Descriptions column={{ xs: 1, md: 2 }} size="small">
          <Descriptions.Item label="Khoa/Bộ môn">{khoaBoMon || "-"}</Descriptions.Item>
          <Descriptions.Item label="Ngôn ngữ giảng dạy">{ngonNguGiangDay || "-"}</Descriptions.Item>
          <Descriptions.Item label="Trình độ đào tạo">{trinhDoDaoTao || "-"}</Descriptions.Item>
          <Descriptions.Item label="Hình thức đào tạo">{hinhThucDaoTao || "-"}</Descriptions.Item>
          <Descriptions.Item label="Đối tượng đào tạo">{doiTuongDaoTao || "-"}</Descriptions.Item>
          <Descriptions.Item label="Điều kiện tiên quyết">
            {dieuKienTienQuyet || "Không"}
          </Descriptions.Item>
          <Descriptions.Item label="Hệ số điểm thường xuyên">
            {formatHeSo(heSoThuongXuyen)}
          </Descriptions.Item>
          <Descriptions.Item label="Hệ số điểm định kỳ">
            {formatHeSo(heSoDinhKy)}
          </Descriptions.Item>
          <Descriptions.Item label="Hệ số điểm thi">{formatHeSo(heSoThi)}</Descriptions.Item>
        </Descriptions>
      </Khoi>

      <Khoi tieuDe="Mô tả học phần">
        <p className="m-0 whitespace-pre-line text-sm leading-relaxed text-gray-700">
          {moTa || "Chưa có dữ liệu"}
        </p>
      </Khoi>

      <Khoi tieuDe="Mục tiêu">
        <NoiDungRichText value={mucTieu} />
      </Khoi>
    </div>
  )
}

export default TongQuanMonHoc
