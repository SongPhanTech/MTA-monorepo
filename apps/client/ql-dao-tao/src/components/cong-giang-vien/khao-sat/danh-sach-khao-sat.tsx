import type { KhaoSatItem } from "@hooks/use-khao-sat-giang-vien"
import CardKhaoSat from "@components/cong-giang-vien/khao-sat/card-khao-sat"
import { Empty, Skeleton } from "antd"

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
            <h3 className={`mb-2 text-base font-bold ${nhom.mauTieuDe}`}>{nhom.tieuDe}</h3>
            {danhSach.map((ks) => (
              <CardKhaoSat key={ks.id} khaoSat={ks} />
            ))}
          </div>
        )
      })}
    </div>
  )
}

export default DanhSachKhaoSat
