import type { LichSuHocTapSinhVien } from "@components/cong-giang-vien/ho-so-sinh-vien/types"
import { mauXepLoaiHocLuc } from "@lib/tong-ket-hoc-ky"
import { Card, Tag } from "antd"

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
        <div className="rounded-lg bg-gray-50 p-3 text-center">
          <p className="m-0 text-xs text-gray-500">Tổng học phần</p>
          <p className="m-0 mt-1 text-xl font-bold text-gray-800">{data.tongHocPhan}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3 text-center">
          <p className="m-0 text-xs text-gray-500">Tổng tín chỉ</p>
          <p className="m-0 mt-1 text-xl font-bold text-gray-800">{data.tongTinChi}</p>
        </div>
        <div className="col-span-2 rounded-lg bg-blue-50 p-3 text-center">
          <p className="m-0 text-xs text-gray-500">GPA hiện tại</p>
          <p className="m-0 mt-1 text-xl font-bold text-blue-700">{data.gpa}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3 text-center">
          <p className="m-0 text-xs text-gray-500">Xếp loại học lực</p>
          <div className="mt-2">
            {data.xepLoaiHocLuc ? (
              <Tag color={mauXepLoaiHocLuc(data.xepLoaiHocLuc)}>{data.xepLoaiHocLuc}</Tag>
            ) : (
              <span className="text-sm text-gray-400">—</span>
            )}
          </div>
        </div>
        <div className="rounded-lg bg-gray-50 p-3 text-center">
          <p className="m-0 text-xs text-gray-500">Xếp loại rèn luyện</p>
          <div className="mt-2">
            {data.xepLoaiRenLuyen ? (
              <Tag color="green">{data.xepLoaiRenLuyen}</Tag>
            ) : (
              <span className="text-sm text-gray-400">—</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default TheLichSuHocTap
