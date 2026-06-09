import CauHinhQuetHanGiangVien from "@pages/cau-hinh-thong-bao-giang-vien/CauHinhQuetHanGiangVien"
import DefaultLayout from "@layouts/default-layout"
import { Card, Typography } from "antd"
import type React from "react"

export default function CauHinhThongBaoGiangVienPage() {
  return (
    <Card>
      <Typography.Title level={4} className="!mt-0 !mb-4">
        Cấu hình quét hạn thông báo giảng viên
      </Typography.Title>
      <CauHinhQuetHanGiangVien />
    </Card>
  )
}

CauHinhThongBaoGiangVienPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
