import GiangVienLayout from "@layouts/giang-vien-layout"
import { useKhaoSatGiangVien } from "@hooks/use-khao-sat-giang-vien"
import { Button, SelectFloat, TreeSelectFloat } from "@workspace/ui"
import { Breadcrumb, Input, Typography } from "antd"
import { RefreshCcw, Search } from "lucide-react"
import { useState } from "react"
import StatCardsKhaoSat from "@components/cong-giang-vien/khao-sat/stat-cards-khao-sat"

const KhaoSatGiangVien = () => {
  const [semesterId, setSemesterId] = useState<string>()
  const { tongSo, thongKe } = useKhaoSatGiangVien(semesterId)

  return (
    <div>
      <div className="flex justify-between items-center">
        <Typography.Title level={2} className="text-cgv-green-dark">
          KHẢO SÁT
        </Typography.Title>
        <Breadcrumb>
          <Breadcrumb.Item href="/" className="text-sm">
            Trang chủ
          </Breadcrumb.Item>
          <Breadcrumb.Item className="text-sm">Khảo sát</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <StatCardsKhaoSat
        thongKe={{
          tongSo,
          dangDienRa: thongKe.dangDienRa,
          sapDienRa: thongKe.sapDienRa,
          daKetThuc: thongKe.daKetThuc,
        }}
      />

      <div className="flex items-center gap-4">
        <Input
          placeholder="Tìm kiếm theo tiêu đề khảo sát..."
          prefix={<Search size="12" />}
          className="text-sm w-[35%] h-10"
          size="small"
        />

        <SelectFloat label="Trạng thái" className="w-40 text-sm" />

        <TreeSelectFloat
          label="Năm học"
          placeholder="Chọn năm học"
          className="w-48  text-sm"
          value={semesterId}
          onChange={(value) => setSemesterId(value as string | undefined)}
        />

        <Button type="primary" className="text-sm">
          <span>
            <RefreshCcw size="16" />
          </span>
          Làm mới
        </Button>
      </div>
    </div>
  )
}

export default KhaoSatGiangVien

KhaoSatGiangVien.getLayout = function getLayout(page: React.ReactElement) {
  return <GiangVienLayout>{page}</GiangVienLayout>
}
