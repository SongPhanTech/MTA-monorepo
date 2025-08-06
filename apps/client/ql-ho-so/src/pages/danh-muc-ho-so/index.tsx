import { ReadOutlined } from '@ant-design/icons'
import DefaultLayout from '@layouts/default-layout'
import { ROUTER_PATH } from '@workspace/router'
import { Col, Flex, Row } from 'antd'
import { useRouter } from 'next/router'

export default function Ngach() {
    const router = useRouter()
    const list = [
        {
            id: 'educational-level',
            label: 'Trình độ học vấn',
            icon: ReadOutlined,
            path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_TRINH_DO_HOC_VAN,
            description: 'Trình độ học vấn',
        },
        {
            id: 'political-theory-level',
            label: 'Trình độ lý luận chính trị',
            icon: ReadOutlined,
            path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_TRINH_DO_LY_LUAN_CHINH_TRI,
            description: 'Trình độ lý luận chính trị',
        },
        {
            id: 'state-management-level',
            label: 'Trình độ quản lý nhà nước',
            icon: ReadOutlined,
            path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_TRINH_DO_QUAN_LY_NHA_NUOC,
            description: 'Trình độ quản lý nhà nước',
        },
        {
            id: 'working-status',
            label: 'Trạng thái làm việc',
            icon: ReadOutlined,
            path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_TRANG_THAI_LAM_VIEC,
            description: 'Trạng thái làm việc',
        },
        {
            id: 'marital-status',
            label: 'Tình trạng hôn nhân',
            icon: ReadOutlined,
            path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_TINH_TRANG_HON_NHAN,
            description: 'Tình trạng hôn nhân',
        },
        {
            id: 'forms-of-government-commendation',
            label: 'Hình thức khen thưởng của chính quyền',
            icon: ReadOutlined,
            path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_HINH_THUC_KHEN_THUONG_CUA_CHINH_QUYEN,
            description: 'Hình thức khen thưởng của chính quyền',
        },
        {
            id: 'forms-of-party-commendation',
            label: 'Hình thức khen thưởng của Đảng',
            icon: ReadOutlined,
            path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_HINH_THUC_KHEN_THUONG_CUA_DANG,
            description: 'Hình thức khen thưởng của Đảng',
        },
        {
            id: 'cadre-evaluation',
            label: 'Xếp loại đánh giá cán bộ',
            icon: ReadOutlined,
            path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_XEP_LOAI_DANH_GIA_CAN_BO,
            description: 'Xếp loại đánh giá cán bộ',
        },
        {
            id: 'party-member-quality-evaluation',
            label: 'Xếp loại đánh giá chất lượng đảng viên',
            path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_XEP_LOAI_DANH_GIA_CHAT_LUONG_DANG_VIEN,
            description: 'Xếp loại đánh giá chất lượng đảng viên',
        },
        {
            id: 'type-of-work',
            label: 'Loại hình công tác',
            icon: ReadOutlined,
            path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_LOAI_HINH_CONG_TAC,
            description: 'Loại hình công tác',
        },
        {
            id: 'working-status',
            label: 'Tình Trạng Công Tác',
            icon: ReadOutlined,
            path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_TINH_TRANG_CONG_TAC,
            description: 'Tình Trạng Công Tác',
        },
        {
            id: 'type-of-study',
            label: 'Loại hình đi học tập',
            icon: ReadOutlined,
            path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_LOAI_HINH_DI_HOC_TAP,
            description: 'Loại hình đi học tập',
        },
        {
            id: 'study-status',
            label: 'Tình trạng đi học tập',
            icon: ReadOutlined,
            path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_TINH_TRANG_DI_HOC_TAP,
            description: 'Tình trạng đi học tập',
        },
        {
            id: 'coutries-sending-for-study',
            label: 'Các nước cử đi học tập',
            icon: ReadOutlined,
            path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_CAC_NUOC_CU_DI_HOC_TAP,
            description: 'Các nước cử đi học tập',
        },
        {
            id: 'professional-title-of-lecturer',
            label: 'Chức danh CMNV ngạch giảng viên',
            icon: ReadOutlined,
            path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_CHUC_DANH_CMNV_NGACH_GIANG_VIEN,
            description: 'Chức danh CMNV ngạch giảng viên',
        },
        {
            id: 'professional-title-of-researcher',
            label: 'Chức danh CMNV ngạch nghiên cứu viên',
            icon: ReadOutlined,
            path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_CHUC_DANH_CMNV_NGACH_NGHIEN_CUU_VIEN,
            description: 'Chức danh CMNV ngạch nghiên cứu viên',
        },
        {
            id: 'professional-title-of-engineer',
            label: 'Chức danh CMNV ngạch kỹ sư',
            icon: ReadOutlined,
            path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_CHUC_DANH_CMNV_NGACH_KY_SU,
            description: 'Chức danh CMNV ngạch kỹ sư',
        },
        {
            id: 'universities',
            label: 'Các trường đào tạo bậc đại học',
            icon: ReadOutlined,
            path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_CAC_TRUONG_DAO_TAO_BAC_DAI_HOC,
            description: 'Các trường đào tạo bậc đại học',
        },
        {
            id: 'undergraduate-training-majors',
            label: 'Các chuyên ngành đào tạo bậc đại học',
            icon: ReadOutlined,
            path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_CAC_CHUYEN_NGANH_DAO_TAO_BAC_DAI_HOC,
            description: 'Các chuyên ngành đào tạo bậc đại học',
        },
        {
            id: 'blood-group',
            label: 'Nhóm máu',
            icon: ReadOutlined,
            path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_NHOM_MAU,
            description: 'Nhóm máu',
        },
        {
            id: 'trinh-do-chuyen-mon-quan-ly',
            label: 'Trình độ chuyên môn quản lý',
            icon: ReadOutlined,
            path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_CHI_HUY_QUAN_LY,
            description: 'Trình độ chuyên môn quản lý',
        },
        {
            id: 'trinh-do-chuyen-mon-ky-thuat',
            label: 'Trình độ chuyên môn kỹ thuật',
            icon: ReadOutlined,
            path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_CHUYEN_MON_KY_THUAT,
            description: 'Trình độ chuyên môn kỹ thuật',
        },
        {
            id: 'loai-suc-khoe',
            label: 'Loại sức khỏe',
            icon: ReadOutlined,
            path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_LOAI_SUC_KHOE,
            description: 'Loại sức khỏe',
        },
        {
            id: 'loai-thuong-tat',
            label: 'Loại thương tật',
            icon: ReadOutlined,
            path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_LOAI_THUONG_TAT,
            description: 'Loại thương tật',
        },
        {
            id: 'nganh-hoc',
            label: 'Ngành học',
            icon: ReadOutlined,
            path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_NGANH_HOC,
            description: 'Ngành học',
        },
        {
            id: 'to-chuc-xa-hoi',
            label: 'Tổ chức xã hội',
            icon: ReadOutlined,
            path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_TO_CHUC_XA_HOI,
            description: 'Tổ chức xã hội',
        },
        {
            id: 'ngach',
            label: 'Ngạch',
            icon: ReadOutlined,
            path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_NGACH,
            description: 'Ngạch',
        },
        {
            id: 'bac-luong',
            label: 'Bậc lương',
            icon: ReadOutlined,
            path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_BAC_LUONG,
            description: 'Bậc lương',
        },
    ]

    return (
        <div>
            <Row gutter={16}>
                {list.map((i) => {
                    return (
                        <Col className="mb-4" xs={8} lg={6}>
                            <Flex
                                align="center"
                                className="h-[64px] bg-[#F3F6FB] p-3 rounded-md shadow-lg"
                                onClick={() => router.push(i.path)}
                            >
                                <div>
                                    <ReadOutlined style={{ fontSize: '24px' }} />
                                </div>
                                <div className="ml-3">
                                    <p className="font-semibold truncate">{i.label}</p>
                                    <p className="text-sm">{i.description}</p>
                                </div>
                            </Flex>
                        </Col>
                    )
                })}
            </Row>
        </div>
    )
}

Ngach.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
