import OChiSoThongKe from "@components/cong-giang-vien/o-chi-so-thong-ke"
import type { LichSuHocTapSinhVien } from "@components/cong-giang-vien/ho-so-sinh-vien/types"
import { mauXepLoaiHocLuc } from "@lib/tong-ket-hoc-ky"
import { Card, Tag } from "antd"
import { Award, BookOpen, GraduationCap, Shield, Star } from "lucide-react"

interface TheLichSuHocTapProps {
  data: LichSuHocTapSinhVien
}

const TheLichSuHocTap = ({ data }: TheLichSuHocTapProps) => {
  return (
    <Card
      size="small"
      title={<span className="text-sm font-semibold text-cgv-green-dark">Lịch sử học tập</span>}
      className="h-full shadow-sm"
      styles={{ body: { padding: "12px 16px" } }}
    >
      <div className="grid grid-cols-2 gap-3">
        <OChiSoThongKe
          label="Tổng học phần"
          value={data.tongHocPhan}
          icon={<BookOpen size={18} />}
        />
        <OChiSoThongKe
          label="Tổng tín chỉ"
          value={data.tongTinChi}
          icon={<GraduationCap size={18} />}
        />
        <div className="col-span-2">
          <OChiSoThongKe
            label="GPA hiện tại"
            value={data.gpa}
            icon={<Award size={18} />}
            variant="blue"
            valueClassName="text-blue-700"
          />
        </div>
        <OChiSoThongKe
          label="Xếp loại học lực"
          value={
            data.xepLoaiHocLuc ? (
              <Tag color={mauXepLoaiHocLuc(data.xepLoaiHocLuc)} className="m-0 text-sm">
                {data.xepLoaiHocLuc}
              </Tag>
            ) : (
              "—"
            )
          }
          icon={<Star size={18} />}
          valueClassName="text-base font-semibold"
        />
        <OChiSoThongKe
          label="Điểm rèn luyện"
          value={data.diemRenLuyen ?? "—"}
          icon={<Shield size={18} />}
        />
      </div>
    </Card>
  )
}

export default TheLichSuHocTap
