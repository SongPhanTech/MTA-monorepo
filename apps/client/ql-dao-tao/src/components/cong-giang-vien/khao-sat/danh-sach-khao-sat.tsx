import type { KhaoSatItem } from "@hooks/use-khao-sat-giang-vien"
import CardKhaoSat from "@components/cong-giang-vien/khao-sat/card-khao-sat"
import { Empty, Skeleton } from "antd"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

interface NhomKhaoSat {
  dangDienRa: KhaoSatItem[]
  sapDienRa: KhaoSatItem[]
  daKetThuc: KhaoSatItem[]
}

interface DanhSachKhaoSatProps {
  nhomTheoTrangThai: NhomKhaoSat
  isLoading?: boolean
}

interface CauHinhNhom {
  key: keyof NhomKhaoSat
  tieuDe: string
  mauTieuDe: string
}

const CAC_NHOM: CauHinhNhom[] = [
  { key: "dangDienRa", tieuDe: "KHẢO SÁT ĐANG DIỄN RA", mauTieuDe: "text-cgv-green-dark" },
  { key: "sapDienRa", tieuDe: "KHẢO SÁT SẮP DIỄN RA", mauTieuDe: "text-orange-500" },
  { key: "daKetThuc", tieuDe: "KHẢO SÁT ĐÃ KẾT THÚC", mauTieuDe: "text-purple-600" },
]

const DanhSachKhaoSat = ({ nhomTheoTrangThai, isLoading }: DanhSachKhaoSatProps) => {
  const [nhomMo, setNhomMo] = useState<Record<keyof NhomKhaoSat, boolean>>({
    dangDienRa: true,
    sapDienRa: true,
    daKetThuc: true,
  })

  const toggleNhom = (key: keyof NhomKhaoSat) => {
    setNhomMo((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  if (isLoading) {
    return <Skeleton active className="mt-4" paragraph={{ rows: 6 }} />
  }

  const tongSo =
    nhomTheoTrangThai.dangDienRa.length +
    nhomTheoTrangThai.sapDienRa.length +
    nhomTheoTrangThai.daKetThuc.length

  if (tongSo === 0) {
    return <Empty className="mt-8" description="Không có khảo sát nào" />
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      {CAC_NHOM.map((nhom) => {
        const danhSach = nhomTheoTrangThai[nhom.key]
        if (danhSach.length === 0) return null

        return (
          <div key={nhom.key}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className={`text-base font-bold ${nhom.mauTieuDe}`}>{nhom.tieuDe}</h3>
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded text-gray-500 hover:bg-gray-100"
                onClick={() => toggleNhom(nhom.key)}
                aria-label={nhomMo[nhom.key] ? "Ẩn nhóm khảo sát" : "Hiện nhóm khảo sát"}
              >
                {nhomMo[nhom.key] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>
            {nhomMo[nhom.key] &&
              danhSach.map((ks) => (
                <CardKhaoSat key={ks.id} khaoSat={ks} />
              ))}
          </div>
        )
      })}
    </div>
  )
}

export default DanhSachKhaoSat
