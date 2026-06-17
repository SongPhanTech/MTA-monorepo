import { useBieuDoHocTapLopQuanLy, type KetQuaKyBieuDo } from "@hooks/use-bieu-do-hoc-tap-lop-quan-ly"
import { Card, Skeleton, Tag } from "antd"
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js"
import { BookOpen, Star, Trophy, UserRound } from "lucide-react"
import { useMemo } from "react"
import { Line } from "react-chartjs-2"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

interface TabBieuDoHocTapProps {
  studentId: string
  fixedClassId: string
  ketQuaTheoKy: KetQuaKyBieuDo[]
  enabled?: boolean
}

const dinhDangSo = (value: number | null | undefined, chuSo = 2) =>
  value != null ? value.toFixed(chuSo).replace(".", ",") : "—"

const TheTomTat = ({
  tieuDe,
  giaTri,
  phu,
  icon,
  mau = "blue",
  extra,
}: {
  tieuDe: string
  giaTri: React.ReactNode
  phu?: string
  icon: React.ReactNode
  mau?: "blue" | "green"
  extra?: React.ReactNode
}) => (
  <Card size="small" className="h-full rounded-xl shadow-sm" styles={{ body: { padding: 14 } }}>
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <p className="m-0 text-xs text-gray-500">{tieuDe}</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
          <span
            className={`text-2xl font-bold leading-none ${mau === "green" ? "text-cgv-green-dark" : "text-blue-600"}`}
          >
            {giaTri}
          </span>
          {phu ? <span className="text-sm text-gray-400">{phu}</span> : null}
        </div>
        {extra}
      </div>
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          mau === "green" ? "bg-green-50 text-cgv-green-dark" : "bg-blue-50 text-blue-600"
        }`}
      >
        {icon}
      </div>
    </div>
  </Card>
)

const ThanhSoSanh = ({
  nhan,
  sinhVien,
  lop,
  donVi = "",
}: {
  nhan: string
  sinhVien: number | null
  lop: number | null
  donVi?: string
}) => {
  const max = Math.max(sinhVien ?? 0, lop ?? 0, 1)
  const pctSv = sinhVien != null ? (sinhVien / max) * 100 : 0
  const pctLop = lop != null ? (lop / max) * 100 : 0

  return (
    <div className="space-y-2">
      <p className="m-0 text-sm font-medium text-gray-700">{nhan}</p>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-cgv-green-dark"
              style={{ width: `${pctSv}%` }}
            />
          </div>
          <span className="w-14 shrink-0 text-right text-sm font-semibold text-cgv-green-dark">
            {dinhDangSo(sinhVien, donVi === "%" ? 0 : 2)}
            {donVi}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-gray-300" style={{ width: `${pctLop}%` }} />
          </div>
          <span className="w-14 shrink-0 text-right text-sm text-gray-500">
            {dinhDangSo(lop, donVi === "%" ? 0 : 2)}
            {donVi}
          </span>
        </div>
      </div>
    </div>
  )
}

const TabBieuDoHocTap = ({
  studentId,
  fixedClassId,
  ketQuaTheoKy,
  enabled = true,
}: TabBieuDoHocTapProps) => {
  const { thongKe, dangTai } = useBieuDoHocTapLopQuanLy(
    studentId,
    fixedClassId,
    ketQuaTheoKy,
    enabled
  )

  const chartData = useMemo(
    () => ({
      labels: thongKe.duLieuGpaTheoKy.map((item) => item.nhan),
      datasets: [
        {
          label: "GPA của sinh viên",
          data: thongKe.duLieuGpaTheoKy.map((item) => item.gpaSinhVien),
          borderColor: "#1a7f5a",
          backgroundColor: "#1a7f5a",
          pointRadius: 4,
          tension: 0.3,
        },
        {
          label: "GPA trung bình lớp",
          data: thongKe.duLieuGpaTheoKy.map((item) => item.gpaLop),
          borderColor: "#9ca3af",
          backgroundColor: "#9ca3af",
          borderDash: [6, 4],
          pointRadius: 4,
          tension: 0.3,
        },
      ],
    }),
    [thongKe.duLieuGpaTheoKy]
  )

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom" as const,
          labels: { boxWidth: 12, usePointStyle: true },
        },
      },
      scales: {
        y: {
          min: 0,
          max: 4,
          ticks: { stepSize: 0.5 },
        },
        x: {
          ticks: { maxRotation: 0, autoSkip: false, font: { size: 10 } },
        },
      },
    }),
    []
  )

  if (dangTai) {
    return <Skeleton active paragraph={{ rows: 10 }} className="px-4 py-6" />
  }

  return (
    <div className="space-y-4 px-4 py-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <TheTomTat
          tieuDe="GPA hiện tại"
          giaTri={dinhDangSo(thongKe.gpaHienTai)}
          phu="/ 4,00"
          icon={<UserRound size={20} />}
          extra={
            thongKe.chenhGpa != null ? (
              <p className="m-0 mt-1 text-xs text-green-600">
                +{dinhDangSo(thongKe.chenhGpa)} so với học kỳ trước
              </p>
            ) : null
          }
        />
        <TheTomTat
          tieuDe="Xếp hạng trong lớp"
          giaTri={
            thongKe.thuHang != null ? (
              <>
                #{thongKe.thuHang}
                <span className="text-base font-medium text-gray-500">
                  {" "}
                  / {thongKe.tongSinhVien} sinh viên
                </span>
              </>
            ) : (
              "—"
            )
          }
          icon={<Trophy size={20} />}
          mau="green"
          extra={
            thongKe.topPhanTram != null ? (
              <Tag color="success" className="mt-1 rounded-full border-0">
                Top {thongKe.topPhanTram}%
              </Tag>
            ) : null
          }
        />
        <TheTomTat
          tieuDe="Tín chỉ tích lũy"
          giaTri={thongKe.tinChiTichLuy ?? "—"}
          phu={`/ ${thongKe.tinChiTong ?? "—"}`}
          icon={<BookOpen size={20} />}
        />
        <TheTomTat
          tieuDe="Xếp loại học lực"
          giaTri={thongKe.xepLoaiHocLuc}
          icon={<Star size={20} />}
          mau="green"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card
          size="small"
          className="rounded-xl shadow-sm"
          title={
            <span className="text-sm font-semibold text-cgv-green-dark">
              1. BIỂU ĐỒ GPA THEO HỌC KỲ (TÍNH TỚI HIỆN TẠI)
            </span>
          }
        >
          <div className="h-[260px]">
            {thongKe.duLieuGpaTheoKy.length > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                Chưa có dữ liệu GPA theo học kỳ
              </div>
            )}
          </div>
          {thongKe.duLieuGpaTheoKy.length > 0 ? (
            <div className="mt-3 overflow-x-auto border-t border-gray-100 pt-3">
              <table className="w-full min-w-[360px] text-center text-xs">
                <thead>
                  <tr className="text-gray-500">
                    <th className="pb-2 font-medium">GPA từng học kỳ</th>
                    {thongKe.duLieuGpaTheoKy.map((item) => (
                      <th key={item.semesterId} className="px-1 pb-2 font-medium">
                        {item.nhan.replace(" (Hiện tại)", "")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-1 text-left text-gray-500">Sinh viên</td>
                    {thongKe.duLieuGpaTheoKy.map((item) => (
                      <td key={item.semesterId} className="px-1 py-1 font-semibold text-cgv-green-dark">
                        {dinhDangSo(item.gpaSinhVien)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : null}
        </Card>

        <Card
          size="small"
          className="rounded-xl shadow-sm"
          title={
            <span className="text-sm font-semibold text-cgv-green-dark">
              2. BIỂU ĐỒ XẾP HẠNG TRONG LỚP (THEO GPA)
            </span>
          }
        >
          <div className="space-y-2">
            <div className="grid grid-cols-[56px_1fr_72px] gap-2 text-xs font-medium text-gray-500">
              <span>Xếp hạng</span>
              <span>Sinh viên</span>
              <span className="text-right">GPA</span>
            </div>
            {thongKe.bangXepHang.map((item, index) => {
              if (item.loai === "ellipsis") {
                return (
                  <div key={`ellipsis-${index}`} className="px-2 py-1 text-center text-sm text-gray-400">
                    ...
                  </div>
                )
              }

              const maxGpa = Math.max(
                ...thongKe.bangXepHang
                  .filter((row) => row.loai === "dong")
                  .map((row) => row.gpa),
                1
              )

              return (
                <div
                  key={`${item.thuHang}-${item.hoTen}`}
                  className={`grid grid-cols-[56px_1fr_72px] items-center gap-2 rounded-lg px-2 py-2 ${
                    item.laBan ? "bg-green-50" : ""
                  }`}
                >
                  <span className={`text-sm ${item.laBan ? "font-bold text-cgv-green-dark" : ""}`}>
                    {item.thuHang}
                  </span>
                  <div className="min-w-0">
                    <p className={`m-0 truncate text-sm ${item.laBan ? "font-semibold text-cgv-green-dark" : ""}`}>
                      {item.hoTen}
                      {item.laBan ? " (Bạn)" : ""}
                    </p>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full ${item.laBan ? "bg-cgv-green-dark" : "bg-green-200"}`}
                        style={{ width: `${(item.gpa / maxGpa) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className={`text-right text-sm ${item.laBan ? "font-bold text-cgv-green-dark" : ""}`}>
                    {dinhDangSo(item.gpa)}
                  </span>
                </div>
              )
            })}
          </div>
          {thongKe.thuHang != null ? (
            <div className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-cgv-green-dark">
              Bạn đang xếp hạng <b>#{thongKe.thuHang}</b> / {thongKe.tongSinhVien} sinh viên
              {thongKe.topPhanTram != null ? ` (Top ${thongKe.topPhanTram}%)` : ""}
            </div>
          ) : null}
        </Card>

        <Card
          size="small"
          className="rounded-xl shadow-sm"
          title={
            <span className="text-sm font-semibold text-cgv-green-dark">
              3. SO SÁNH VỚI TRUNG BÌNH LỚP
            </span>
          }
        >
          <div className="mb-4 flex items-center gap-4 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-cgv-green-dark" />
              Sinh viên
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-gray-300" />
              Trung bình lớp
            </span>
          </div>
          <div className="space-y-4">
            {thongKe.soSanhLop.map((item) => (
              <ThanhSoSanh
                key={item.nhan}
                nhan={item.nhan}
                sinhVien={item.sinhVien}
                lop={item.lop}
                donVi={item.donVi}
              />
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default TabBieuDoHocTap
