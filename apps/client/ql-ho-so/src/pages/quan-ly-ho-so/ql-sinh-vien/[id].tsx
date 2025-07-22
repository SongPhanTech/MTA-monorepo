import { ArrowLeftOutlined } from '@ant-design/icons'
import KeKhaiTaiSanTab from '@components/modal/quan-ly-ho-so/tabs/ke-khai-tai-san'
import KhenThuongKyLuatTab from '@components/modal/quan-ly-ho-so/tabs/khen-thuong-ky-luat'
import ThanNhanTab from '@components/modal/quan-ly-ho-so/tabs/tab-danh-sach-than-nhan'
import DoiTuongChinhSachTab from '@components/modal/quan-ly-ho-so/tabs/tab-doi-tuong-chinh-sach'
import HocHamHocViTab from '@components/modal/quan-ly-ho-so/tabs/tab-hoc-ham-hoc-vi'
import QuaTrinhCongTacTab from '@components/modal/quan-ly-ho-so/tabs/tab-qua-trinh-cong-tac'
import QuaTrinhDaoTaoTab from '@components/modal/quan-ly-ho-so/tabs/tab-qua-trinh-dao-tao'
import ThongTinCaNhanTab from '@components/modal/quan-ly-ho-so/tabs/tab-thong-tin-ca-nhan'
import TrinhDoChungChiTab from '@components/modal/quan-ly-ho-so/tabs/tab-trinh-do-chung-chi'
import DefaultLayout from '@layouts/default-layout'
import { ROUTER_PATH } from '@workspace/router'
import { Button, Collapse, type UploadFile } from 'antd'
import { useRouter } from 'next/router'
import { useState } from 'react'

const { Panel } = Collapse

export default function StudentDetailPage() {
    const router = useRouter()
    const studentId = router.query.id as string
    const [avatar, setAvatar] = useState<UploadFile[]>([])
    const [activeCollapse, setActiveCollapse] = useState<string[]>(['thong-tin-chung'])

    const handleCollapseChange = (key: string | string[]) => {
        setActiveCollapse(Array.isArray(key) ? key : [key])
    }

    return (
        <div>
            {/* Header với breadcrumb và nút quay lại */}
            <div className="mb-6">
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => router.back()}
                    className="mb-4"
                    size="large"
                >
                    Quay lại danh sách
                </Button>
            </div>

            {/* Các collapse chứa thông tin chi tiết */}
            <Collapse activeKey={activeCollapse} onChange={handleCollapseChange} ghost>
                <Panel
                    header={
                        <div className="text-lg font-semibold text-blue-600">Thông tin chung</div>
                    }
                    key="thong-tin-chung"
                    className="border-none"
                >
                    <div className="p-4">
                        <ThongTinCaNhanTab
                            type={'CIVILIAN_STUDENT'}
                            id={studentId}
                            avatar={avatar}
                            setAvatar={setAvatar}
                        />
                    </div>
                </Panel>

                <Panel
                    header={
                        <div className="text-lg font-semibold text-green-600">Học hàm, học vị</div>
                    }
                    key="hoc-ham-hoc-vi"
                    className="border-none"
                >
                    <div className="p-4">
                        <HocHamHocViTab />
                    </div>
                </Panel>

                <Panel
                    header={
                        <div className="text-lg font-semibold text-purple-600">
                            Trình độ, chứng chỉ
                        </div>
                    }
                    key="trinh-do-chung-chi"
                    className="border-none border-gray-200"
                >
                    <div className="p-4">
                        <TrinhDoChungChiTab />
                    </div>
                </Panel>

                <Panel
                    header={
                        <div className="text-lg font-semibold text-orange-600">
                            Quá trình công tác
                        </div>
                    }
                    key="qua-trinh-cong-tac"
                    className="border-none border-gray-200"
                >
                    <div className="p-4">
                        <QuaTrinhCongTacTab />
                    </div>
                </Panel>

                <Panel
                    header={
                        <div className="text-lg font-semibold text-cyan-600">Quá trình đào tạo</div>
                    }
                    key="qua-trinh-dao-tao"
                    className="border-none border-gray-200"
                >
                    <div className="p-4">
                        <QuaTrinhDaoTaoTab />
                    </div>
                </Panel>

                <Panel
                    header={
                        <div className="text-lg font-semibold text-yellow-600">
                            Khen thưởng - Kỷ luật
                        </div>
                    }
                    key="khen-thuong-ky-luat"
                    className="border-none border-gray-200"
                >
                    <div className="p-4">
                        <KhenThuongKyLuatTab />
                    </div>
                </Panel>

                <Panel
                    header={
                        <div className="text-lg font-semibold text-indigo-600">
                            Đối tượng chính sách
                        </div>
                    }
                    key="doi-tuong-chinh-sach"
                    className="border-none border-gray-200"
                >
                    <div className="p-4">
                        <DoiTuongChinhSachTab />
                    </div>
                </Panel>

                <Panel
                    header={
                        <div className="text-lg font-semibold text-red-600">Kê khai tài sản</div>
                    }
                    key="ke-khai-tai-san"
                    className="border-none border-gray-200"
                >
                    <div className="p-4">
                        <KeKhaiTaiSanTab />
                    </div>
                </Panel>

                <Panel
                    header={<div className="text-lg font-semibold text-pink-600">Thân nhân</div>}
                    key="than-nhan"
                    className="border-none border-gray-200"
                >
                    <div className="p-4">
                        <ThanNhanTab />
                    </div>
                </Panel>
            </Collapse>
        </div>
    )
}

StudentDetailPage.getLayout = function getLayout(page: React.ReactElement) {
    return (
        <DefaultLayout
            breadcrumbList={[
                { title: 'Danh mục' },
                {
                    title: 'Quản lý hồ sơ sinh viên',
                    href: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_HO_SO_QL_SINH_VIEN,
                },
                { title: 'Chi tiết sinh viên' },
            ]}
        >
            {page}
        </DefaultLayout>
    )
}
