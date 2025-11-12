import DefaultLayout from '@layouts/default-layout'
import { DanhSachThongBao, ThongKeDonVi, LichCongTac, ThongKeTotNghiep } from '@workspace/ui'
import { Col, Row, Typography } from 'antd'

const { Title } = Typography

function Page() {
    return (
        <div>
            <Row gutter={[8, 8]}>
                <Col span={18}>
                    <div className="bg-white rounded shadow h-full flex flex-col">
                        <div className="p-4">
                            <Title level={4}>Thời khoá biểu</Title>
                        </div>
                        <div className="flex-1 p-2">
                            <LichCongTac />
                        </div>
                    </div>
                </Col>
                <Col span={6}>
                    <div className="bg-white rounded shadow h-full flex flex-col">
                        <div className="p-4">
                            <Title level={4}>Thông báo</Title>
                        </div>
                        <div className="flex-1 overflow-y-auto mb-2 p-2">
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
        </div>
    )
}

export default Page

Page.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
