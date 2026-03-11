import DanhSachLopGiangVien from '@components/sub-pages/danh-sach-lop-giang-vien'
import DefaultLayout from '@layouts/default-layout'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION } from '@workspace/router'
import { DanhSachThongBao, LichCongTac, ThongKeDonVi, ThongKeTotNghiep } from '@workspace/ui'
import { Col, Row, Typography } from 'antd'

const { Title } = Typography

function Page() {
    const { can } = useAbility()

    return (
        <div>
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
                                onlyMySchedule={can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_LICH_TUAN_THANG,
                                    'XEM'
                                )}
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
        </div>
    )
}

export default Page

Page.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
