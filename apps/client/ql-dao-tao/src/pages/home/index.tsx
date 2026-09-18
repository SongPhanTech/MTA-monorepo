import QuyTrinhDashboard, { type QuyTrinhView } from "@components/dashboard/quy-trinh"
import DanhSachLopGiangVien from "@components/sub-pages/danh-sach-lop-giang-vien"
import DefaultLayout from "@layouts/default-layout"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION, ROUTER_PATH } from "@workspace/router"
import { DanhSachThongBao, LichCongTac, ThongKeDonVi, ThongKeTotNghiep } from "@workspace/ui"
import { Col, Dropdown, type MenuProps, Row, Typography } from "antd"
import { useRouter } from "next/router"
import { useState } from "react"

const { Title } = Typography

type QuyTrinhStep = {
  key: string
  label: string
  view?: QuyTrinhView
  path?: string
}

const quyTrinhSteps: QuyTrinhStep[] = [
  { key: "main", label: "Sơ đồ quy trình chung", view: "main" },
  { key: "len-ke-hoach", label: "1. Lên kế hoạch & tổ chức giảng dạy", view: "len-ke-hoach" },
  {
    key: "dang-ky-hoc",
    label: "2. Đăng ký học",
    path: ROUTER_PATH.QL_DAO_TAO.DANG_KY_HOC_DOT_DANG_KY_HOC_ONLINE,
  },
  { key: "to-chuc-thi", label: "3. Tổ chức thi", view: "to-chuc-thi" },
  { key: "quan-ly-diem", label: "4. Quản lý điểm", view: "quan-ly-diem" },
  {
    key: "hoc-bong",
    label: "5. Học bổng / Cảnh báo",
    path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_TONG_KET_KY_HOC,
  },
  {
    key: "quan-ly-khoa-luan",
    label: "6. Quản lý khóa luận / luận văn / luận án",
    view: "quan-ly-khoa-luan",
  },
  { key: "xet-tot-nghiep", label: "7. Xét tốt nghiệp", view: "xet-tot-nghiep" },
  {
    key: "quan-ly-van-bang",
    label: "8. Quản lý văn bằng",
    path: ROUTER_PATH.QL_DAO_TAO.QL_VAN_BANG_DANH_MUC_VAN_BANG,
  },
]

const [firstStep, ...numberedSteps] = quyTrinhSteps
const menuItems: MenuProps["items"] = [
  { key: firstStep.key, label: firstStep.label },
  { type: "divider" },
  ...numberedSteps.map(({ key, label }) => ({ key, label })),
]

function TongQuan() {
  const { can } = useAbility()

  return (
    <Row gutter={[8, 8]}>
      <Col span={24}>
        <DanhSachLopGiangVien />
      </Col>

      <Col span={18}>
        <div className="bg-white rounded shadow h-full flex flex-col">
          <div className="px-4">
            <Title level={4}>Thời khoá biểu</Title>
          </div>
          <div className="flex-1 px-2">
            <LichCongTac
              onlyMySchedule={can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_LICH_TUAN_THANG, "XEM")}
            />
          </div>
        </div>
      </Col>
      <Col span={6}>
        <div className="bg-white rounded shadow h-full flex flex-col">
          <div className="px-4">
            <Title level={4}>Thông báo</Title>
          </div>
          <div className="flex-1 overflow-y-auto mb-2 px-2">
            <DanhSachThongBao />
          </div>
        </div>
      </Col>
      <Col span={24}>
        <Title level={4}>Thống kê số lượng học viên tốt nghiệp</Title>
        <ThongKeTotNghiep />
      </Col>
      <Col span={24}>
        <Title level={4}>Thống kê cơ cấu tổ chức đào tạo</Title>
        <ThongKeDonVi />
      </Col>
    </Row>
  )
}

function Page() {
  const router = useRouter()
  const [tab, setTab] = useState("tong-quan")
  const [quyTrinhView, setQuyTrinhView] = useState<QuyTrinhView>("main")
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleMenuClick = ({ key }: { key: string }) => {
    setDropdownOpen(false)
    setTab("quy-trinh")
    const step = quyTrinhSteps.find((s) => s.key === key)
    if (!step) return
    if (step.view) {
      setQuyTrinhView(step.view)
    } else if (step.path) {
      router.push(step.path)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setDropdownOpen(open)
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="mb-2 flex flex-col items-center gap-2 sm:relative sm:flex-row sm:justify-center shrink-0">
        <div className="inline-flex rounded-full border border-[#d9dee5] bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => {
              setTab("tong-quan")
              setDropdownOpen(false)
            }}
            className={`rounded-full px-5 py-1 text-sm font-medium transition ${
              tab === "tong-quan"
                ? "bg-[#0f8a4b] text-white shadow-sm"
                : "bg-transparent text-[#374151] hover:bg-[#f3f4f6]"
            }`}
          >
            Tổng quan
          </button>
          <Dropdown
            menu={{
              items: menuItems,
              onClick: handleMenuClick,
            }}
            trigger={tab === "quy-trinh" ? ["hover"] : []}
            placement="bottomLeft"
            open={dropdownOpen}
            onOpenChange={handleOpenChange}
          >
            <button
              type="button"
              onClick={() => {
                if (tab !== "quy-trinh") {
                  setTab("quy-trinh")
                }
              }}
              className={`rounded-full px-5 py-1 text-sm font-medium transition inline-flex items-center gap-1.5 ${
                tab === "quy-trinh"
                  ? "bg-[#0f8a4b] text-white shadow-sm"
                  : "bg-transparent text-[#374151] hover:bg-[#f3f4f6]"
              }`}
            >
              Quy trình quản lý đào tạo
            </button>
          </Dropdown>
        </div>
      </div>

      {tab === "tong-quan" ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <TongQuan />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-[#e8eaed] bg-[#f5f6f8] p-3 overflow-y-auto">
          <QuyTrinhDashboard view={quyTrinhView} onViewChange={setQuyTrinhView} />
        </div>
      )}
    </div>
  )
}

export default Page

Page.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
