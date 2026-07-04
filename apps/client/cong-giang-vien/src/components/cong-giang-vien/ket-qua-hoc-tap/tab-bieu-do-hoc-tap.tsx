import OChiSoThongKe from "@components/cong-giang-vien/o-chi-so-thong-ke"
import {
  useBieuDoHocTapLopQuanLy,
  type KetQuaKyBieuDo,
} from "@hooks/use-bieu-do-hoc-tap-lop-quan-ly"
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
import { useEffect, useMemo, useRef } from "react"
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

const layNhanHocKyNgan = (nhan: string) =>
  nhan
    .replace(" (Hiện tại)", "")
    .replace(/^\d{4}\s*-\s*\d{4}\s*/i, "")
    .replace(/^Năm học\s*\d{4}\s*-\s*\d{4}\s*/i, "")
    .trim()

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
  <Card
    size="small"
    className="h-[112px] w-full min-w-0 rounded-lg shadow-sm"
    styles={{ body: { padding: 8, height: "100%" } }}
  >
    <OChiSoThongKe
      label={tieuDe}
      icon={icon}
      variant={mau === "green" ? "green" : "blue"}
      compact
      value={
        <>
          {giaTri}
          {phu ? <span className="text-[11px] font-normal text-gray-400"> {phu}</span> : null}
        </>
      }
      valueClassName={mau === "green" ? "text-cgv-green-dark" : "text-blue-600"}
      extra={extra ? <div className="mt-0.5 w-full">{extra}</div> : null}
    />
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
    <div className="space-y-1.5">
      <p className="m-0 text-xs font-medium text-gray-700">{nhan}</p>
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-cgv-green-dark" style={{ width: `${pctSv}%` }} />
          </div>
          <span className="w-12 shrink-0 text-right text-xs font-semibold text-cgv-green-dark">
            {dinhDangSo(sinhVien, donVi === "%" ? 0 : 2)}
            {donVi}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-gray-300" style={{ width: `${pctLop}%` }} />
          </div>
          <span className="w-12 shrink-0 text-right text-xs text-gray-500">
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

  const vungXepHangRef = useRef<HTMLDivElement>(null)
  const dongSinhVienRef = useRef<HTMLDivElement>(null)

  const maxGpaXepHang = useMemo(
    () => Math.max(...thongKe.bangXepHang.map((row) => row.gpa), 1),
    [thongKe.bangXepHang]
  )

  useEffect(() => {
    if (dangTai) return

    const container = vungXepHangRef.current
    const row = dongSinhVienRef.current
    if (!container || !row) return

    const scrollToCenter = () => {
      const scrollTop = row.offsetTop - container.clientHeight / 2 + row.clientHeight / 2
      container.scrollTop = Math.max(0, scrollTop)
    }

    const raf = requestAnimationFrame(() => {
      scrollToCenter()
      requestAnimationFrame(scrollToCenter)
    })

    const observer = new ResizeObserver(scrollToCenter)
    observer.observe(container)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [thongKe.bangXepHang, dangTai])

  const chartData = useMemo(
    () => ({
      labels: thongKe.duLieuGpaTheoKy.map((item) => layNhanHocKyNgan(item.nhan)),
      datasets: [
        {
          label: "GPA của sinh viên",
          data: thongKe.duLieuGpaTheoKy.map((item) => item.gpaSinhVien),
          borderColor: "#1a7f5a",
          backgroundColor: "#1a7f5a",
          pointRadius: 3,
          tension: 0.3,
        },
        {
          label: "GPA trung bình lớp",
          data: thongKe.duLieuGpaTheoKy.map((item) => item.gpaLop),
          borderColor: "#9ca3af",
          backgroundColor: "#9ca3af",
          borderDash: [6, 4],
          pointRadius: 3,
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
          labels: { boxWidth: 8, usePointStyle: true, font: { size: 10 }, padding: 8 },
        },
      },
      scales: {
        y: {
          min: 0,
          max: 4,
          ticks: { stepSize: 0.5, font: { size: 10 } },
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 0,
            autoSkip: true,
            maxTicksLimit: 12,
            font: { size: 9 },
          },
        },
      },
    }),
    []
  )

  if (dangTai) {
    return (
      <div className="h-full px-4 py-6">
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    )
  }

  const tieuDeCard = (text: string) => (
    <span className="text-xs font-semibold leading-tight text-cgv-green-dark">{text}</span>
  )

  const lopCard =
    "flex h-full min-h-0 flex-col overflow-hidden rounded-lg shadow-sm [&_.ant-card-body]:flex [&_.ant-card-body]:min-h-0 [&_.ant-card-body]:flex-1 [&_.ant-card-body]:flex-col [&_.ant-card-body]:overflow-hidden [&_.ant-card-body]:p-2 [&_.ant-card-head]:min-h-0 [&_.ant-card-head]:shrink-0 [&_.ant-card-head]:px-3 [&_.ant-card-head]:py-2"

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden px-3 py-3">
      <div className="grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <TheTomTat
          tieuDe="GPA hiện tại"
          giaTri={dinhDangSo(thongKe.gpaHienTai)}
          phu="/ 4,00"
          icon={<UserRound size={16} />}
          extra={
            thongKe.chenhGpa != null ? (
              <p className="m-0 text-[10px] text-green-600">
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
                <span className="text-xs font-medium text-gray-500">
                  {" "}
                  / {thongKe.tongSinhVien} sinh viên
                </span>
              </>
            ) : (
              "—"
            )
          }
          icon={<Trophy size={16} />}
          mau="green"
          extra={
            thongKe.topPhanTram != null ? (
              <Tag color="success" className="mt-0.5 rounded-full border-0 text-[10px] leading-4">
                Top {thongKe.topPhanTram}%
              </Tag>
            ) : null
          }
        />
        <TheTomTat
          tieuDe="Tín chỉ tích lũy"
          giaTri={thongKe.tinChiTichLuy ?? "—"}
          phu={`/ ${thongKe.tinChiTong ?? "—"}`}
          icon={<BookOpen size={16} />}
        />
        <TheTomTat
          tieuDe="Xếp loại học lực"
          giaTri={thongKe.xepLoaiHocLuc}
          icon={<Star size={16} />}
          mau="green"
        />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-2 gap-2 overflow-hidden xl:grid-cols-2 xl:grid-rows-1">
        <Card
          size="small"
          className={lopCard}
          title={tieuDeCard("1. BIỂU ĐỒ GPA THEO HỌC KỲ (TÍNH TỚI HIỆN TẠI)")}
        >
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto">
            <div className="h-[180px] min-w-[280px]">
              {thongKe.duLieuGpaTheoKy.length > 0 ? (
                <Line data={chartData} options={chartOptions} />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                  Chưa có dữ liệu GPA theo học kỳ
                </div>
              )}
            </div>
            {thongKe.duLieuGpaTheoKy.length > 0 ? (
              <div className="mt-2 border-t border-gray-100 pt-2">
                <table className="w-full min-w-[320px] text-center text-[10px]">
                  <thead>
                    <tr className="text-gray-500">
                      <th className="pb-1 font-medium">GPA từng học kỳ</th>
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
                        <td
                          key={item.semesterId}
                          className="px-1 py-1 font-semibold text-cgv-green-dark"
                        >
                          {dinhDangSo(item.gpaSinhVien)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </Card>

        <Card
          size="small"
          className={lopCard}
          title={tieuDeCard("2. BIỂU ĐỒ XẾP HẠNG TRONG LỚP (THEO GPA)")}
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="grid shrink-0 grid-cols-[36px_1fr_52px] gap-1.5 px-1 pb-1 text-[10px] font-medium text-gray-500">
              <span>Xếp hạng</span>
              <span>Sinh viên</span>
              <span className="text-right">GPA</span>
            </div>
            <div ref={vungXepHangRef} className="min-h-0 flex-1 overflow-y-auto px-1">
              <div className="space-y-0.5">
                {thongKe.bangXepHang.map((item) => (
                  <div
                    key={`${item.thuHang}-${item.hoTen}`}
                    ref={item.laBan ? dongSinhVienRef : undefined}
                    className={`grid grid-cols-[36px_1fr_52px] items-center gap-1.5 rounded px-1 py-1 ${
                      item.laBan ? "bg-green-50" : ""
                    }`}
                  >
                    <span
                      className={`text-xs ${item.laBan ? "font-bold text-cgv-green-dark" : "text-gray-700"}`}
                    >
                      {item.thuHang}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`m-0 truncate text-xs leading-tight ${
                          item.laBan ? "font-semibold text-cgv-green-dark" : "text-gray-800"
                        }`}
                      >
                        {item.hoTen}
                        {item.laBan ? " (Bạn)" : ""}
                      </p>
                      <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full ${item.laBan ? "bg-cgv-green-dark" : "bg-green-200"}`}
                          style={{ width: `${(item.gpa / maxGpaXepHang) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span
                      className={`text-right text-xs ${item.laBan ? "font-bold text-cgv-green-dark" : "text-gray-700"}`}
                    >
                      {dinhDangSo(item.gpa)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {thongKe.thuHang != null ? (
              <div className="mt-1 shrink-0 rounded bg-green-50 px-2 py-1.5 text-[11px] text-cgv-green-dark">
                Bạn đang xếp hạng <b>#{thongKe.thuHang}</b> / {thongKe.tongSinhVien} sinh viên
                {thongKe.topPhanTram != null ? ` (Top ${thongKe.topPhanTram}%)` : ""}
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default TabBieuDoHocTap
