import HangNhanNgang from "@components/cong-giang-vien/ho-so-sinh-vien/hang-nhan-ngang"
import type { DieuKienTotNghiepItem } from "@components/cong-giang-vien/ho-so-sinh-vien/types"
import { Button } from "antd"
import type { ReactNode } from "react"

export type KieuDieuKienCard = "chung-chi" | "hoc-phan" | "tieu-chuan"

interface TheDieuKienCardProps {
  icon: ReactNode
  tieuDe: string
  dieuKien: DieuKienTotNghiepItem
  kieu: KieuDieuKienCard
}

const NhanKetQua = ({ dat }: { dat: boolean }) => (
  <span
    className={
      dat
        ? "shrink-0 rounded-full bg-cgv-green/20 px-2.5 py-0.5 text-xs font-medium text-cgv-green-dark"
        : "shrink-0 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600"
    }
  >
    {dat ? "Đạt" : "Chưa đạt"}
  </span>
)

const TheDieuKienCard = ({ icon, tieuDe, dieuKien, kieu }: TheDieuKienCardProps) => {
  const { dat, trinhDoYeuCau, chungChi, chiTietMonHoc } = dieuKien
  const coChiTiet = !!(chungChi || chiTietMonHoc || trinhDoYeuCau)

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-cgv-green-dark">{icon}</span>
          <h3 className="m-0 truncate text-sm font-semibold text-cgv-green-dark">{tieuDe}</h3>
        </div>
        <NhanKetQua dat={dat} />
      </div>

      <div className="flex flex-1 flex-col px-4 py-2">
        {!coChiTiet ? (
          <p className="m-0 flex-1 text-xs text-gray-400">
            {dat ? "Đã đáp ứng điều kiện." : "Chưa đáp ứng điều kiện."}
          </p>
        ) : (
          <div className="flex-1">
            {kieu === "chung-chi" && chungChi ? (
              <>
                <HangNhanNgang label="Loại chứng chỉ" value={chungChi.tenChungChi} />
                <HangNhanNgang
                  label="Trình độ yêu cầu"
                  value={trinhDoYeuCau || chungChi.trinhDoYeuCau}
                />
                <HangNhanNgang label="Kết quả" value={chungChi.ketQua} />
                <HangNhanNgang label="Ngày cấp" value={chungChi.ngayCap} />
                <HangNhanNgang label="Đơn vị cấp" value={chungChi.donViCap} />
              </>
            ) : null}

            {kieu === "hoc-phan" && chiTietMonHoc ? (
              <>
                <HangNhanNgang label="Học phần" value={chiTietMonHoc.tenMon} />
                <HangNhanNgang label="Kết quả" value={chiTietMonHoc.ketQua} />
                <HangNhanNgang label="Điểm" value={chiTietMonHoc.diem ?? ""} />
                <HangNhanNgang label="Năm học" value={chiTietMonHoc.namHoc} />
                <HangNhanNgang label="Ghi chú" value={chiTietMonHoc.ghiChu ?? ""} />
              </>
            ) : null}

            {kieu === "tieu-chuan" ? (
              <>
                <HangNhanNgang label="Tiêu chuẩn" value={trinhDoYeuCau ?? ""} />
                <HangNhanNgang label="Kết quả" value={dat ? "Đạt" : "Chưa đạt"} />
                {chiTietMonHoc ? (
                  <>
                    <HangNhanNgang label="Năm đánh giá gần nhất" value={chiTietMonHoc.namHoc} />
                    <HangNhanNgang label="Ghi chú" value={chiTietMonHoc.ghiChu ?? ""} />
                  </>
                ) : (
                  <HangNhanNgang
                    label="Ghi chú"
                    value={dat ? "Đáp ứng tiêu chuẩn rèn luyện sức khỏe theo quy định" : ""}
                  />
                )}
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

export default TheDieuKienCard
