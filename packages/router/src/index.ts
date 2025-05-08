import {
    ApartmentOutlined,
    BookOutlined,
    ClockCircleOutlined,
    FileTextOutlined,
    HomeOutlined,
    IdcardOutlined,
    MessageOutlined,
    PieChartOutlined,
    ScheduleOutlined,
    SettingOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons'
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon'
import ROUTER_PATH from '../generated/router'
interface MenuItem {
    id: string
    label: React.ReactNode
    icon?: React.ForwardRefExoticComponent<
        Omit<AntdIconProps, 'ref'> & React.RefAttributes<HTMLSpanElement>
    >
    path?: string
    children?: MenuItem[]
    description?: string
    type?: string
}

type NavigationType = Record<
    keyof typeof ROUTER_PATH,
    {
        menus: MenuItem[]
        label: string
    }
>

const NAVIGATION: NavigationType = {
    QL_NGUOI_DUNG: {
        menus: [
            {
                id: 'home',
                label: 'Trang chủ',
                icon: PieChartOutlined,
                path: ROUTER_PATH.QL_NGUOI_DUNG.HOME,
                description: 'Thông tin trang chủ',
            },
            {
                id: 'nguoi-dung',
                label: 'Người dùng',
                icon: UserOutlined,
                children: [
                    {
                        id: 'danh-sach',
                        label: 'Danh sách',
                        path: ROUTER_PATH.QL_NGUOI_DUNG.NGUOI_DUNG_DANH_SACH,
                        description: 'Danh sách người dùng',
                    },
                    {
                        id: 'nhom-nguoi-dung',
                        label: 'Nhóm người dùng',
                        path: ROUTER_PATH.QL_NGUOI_DUNG
                            .NGUOI_DUNG_NHOM_NGUOI_DUNG,
                        description: 'Nhóm người dùng',
                    },
                    {
                        id: 'vai-tro',
                        label: 'Vai trò',
                        path: ROUTER_PATH.QL_NGUOI_DUNG.NGUOI_DUNG_VAI_TRO,
                        description: 'Vai trò người dùng',
                    },
                    {
                        id: 'quyen-co-ban',
                        label: 'Quyền cơ bản',
                        path: ROUTER_PATH.QL_NGUOI_DUNG.NGUOI_DUNG_QUYEN_CO_BAN,
                        description: 'Quyền cơ bản người dùng',
                    },
                ],
            },
            {
                id: 'gioi-han-dia-chi-mang',
                label: 'Quản trị giới hạn địa chỉ mạng',
                path: ROUTER_PATH.QL_NGUOI_DUNG.GIOI_HAN_DIA_CHI_MANG,
                description: 'Quản trị giới hạn địa chỉ mạng từ xa',
                icon: ApartmentOutlined,
            },
            {
                id: 'cau-hinh',
                label: 'Cấu hình',
                icon: SettingOutlined,
                children: [
                    {
                        id: 'thoi-gian-cho',
                        label: 'Thời gian chờ',
                        path: ROUTER_PATH.QL_NGUOI_DUNG.CAU_HINH_THOI_GIAN_CHO,
                    },
                    {
                        id: 'sso',
                        label: 'SSO',
                        path: 'https://auth.swantech.vn/t/carbon.super/console',
                    },
                ],
            },
        ],
        label: 'Quản lý người dùng',
    },
    QL_DANH_MUC: {
        menus: [
            {
                id: 'home',
                label: 'Trang chủ',
                icon: HomeOutlined,
                path: ROUTER_PATH.QL_DANH_MUC.HOME,
                description: 'Thông tin trang chủ',
            },
            {
                id: 'danh-muc-chung',
                label: 'Danh mục chung',
                icon: PieChartOutlined,
                children: [
                    {
                        id: 'level',
                        label: 'Danh mục phân cấp',
                        icon: PieChartOutlined,
                        path: ROUTER_PATH.QL_DANH_MUC.DANH_MUC_LEVEL,
                    },
                    {
                        id: 'rank',
                        label: 'Danh mục cấp bậc hàm',
                        icon: PieChartOutlined,
                        path: ROUTER_PATH.QL_DANH_MUC.DANH_MUC_RANK,
                    },
                    {
                        id: 'academic-degree-type',
                        label: 'Danh mục học hàm',
                        icon: PieChartOutlined,
                        path: ROUTER_PATH.QL_DANH_MUC
                            .DANH_MUC_ACADEMIC_DEGREE_TYPE,
                    },
                    {
                        id: 'academic-rank-type',
                        label: 'Danh mục học vị',
                        icon: PieChartOutlined,
                        path: ROUTER_PATH.QL_DANH_MUC
                            .DANH_MUC_ACADEMIC_RANK_TYPE,
                    },
                    {
                        id: 'position',
                        label: 'Danh mục chức vụ',
                        icon: PieChartOutlined,
                        path: ROUTER_PATH.QL_DANH_MUC.DANH_MUC_POSITION,
                    },
                    {
                        id: 'organization-type',
                        label: 'Danh mục loại đơn vị',
                        icon: PieChartOutlined,
                        path: ROUTER_PATH.QL_DANH_MUC
                            .DANH_MUC_ORGANIZATION_TYPE,
                    },
                    {
                        id: 'organization',
                        label: 'Danh mục đơn vị',
                        icon: PieChartOutlined,
                        path: ROUTER_PATH.QL_DANH_MUC.DANH_MUC_ORGANIZATION,
                    },
                ],
            },
            {
                id: 'danh-muc-dao-tao',
                label: 'Danh mục đào tạo',
                icon: PieChartOutlined,
                children: [
                    {
                        id: 'training-object-type',
                        label: 'Danh mục đối tượng đào tạo',
                        icon: PieChartOutlined,
                        path: ROUTER_PATH.QL_DANH_MUC
                            .DANH_MUC_DAO_TAO_TRANINING_OBJECT_TYPE,
                    },
                    {
                        id: 'training-type',
                        label: 'Danh mục loại hình đào tạo',
                        icon: PieChartOutlined,
                        path: ROUTER_PATH.QL_DANH_MUC
                            .DANH_MUC_DAO_TAO_TRAINING_TYPE,
                    },
                    {
                        id: 'training-level',
                        label: 'Danh mục bậc đào tạo',
                        icon: PieChartOutlined,
                        path: ROUTER_PATH.QL_DANH_MUC
                            .DANH_MUC_DAO_TAO_TRAINING_LEVEL,
                    },
                    {
                        id: 'training-location',
                        label: 'Danh mục địa điểm đào tạo',
                        icon: PieChartOutlined,
                        path: ROUTER_PATH.QL_DANH_MUC
                            .DANH_MUC_DAO_TAO_TRAINING_LOCATION,
                    },
                    {
                        id: 'training-field',
                        label: 'Danh mục ngành đào tạo',
                        icon: PieChartOutlined,
                        path: ROUTER_PATH.QL_DANH_MUC
                            .DANH_MUC_DAO_TAO_TRANINING_FIELD,
                    },
                    {
                        id: 'training-major',
                        label: 'Danh mục chuyên ngành đào tạo',
                        icon: PieChartOutlined,
                        path: ROUTER_PATH.QL_DANH_MUC
                            .DANH_MUC_DAO_TAO_TRANINING_MAJOR,
                    },
                    {
                        id: 'training-block',
                        label: 'Danh mục khối kiến thức',
                        icon: PieChartOutlined,
                        path: ROUTER_PATH.QL_DANH_MUC
                            .DANH_MUC_DAO_TAO_TRANINING_BLOCK,
                    },
                    {
                        id: 'training-time',
                        label: 'Danh mục thời gian đào tạo',
                        icon: PieChartOutlined,
                        path: ROUTER_PATH.QL_DANH_MUC
                            .DANH_MUC_DAO_TAO_TRANINING_TIME,
                    },
                    {
                        id: 'training-form',
                        label: 'Danh mục hình thức đào tạo',
                        icon: PieChartOutlined,
                        path: ROUTER_PATH.QL_DANH_MUC
                            .DANH_MUC_DAO_TAO_TRANINING_FORM,
                    },
                    {
                        id: 'study-rank',
                        label: 'Danh mục xếp loại học tập',
                        icon: PieChartOutlined,
                        path: ROUTER_PATH.QL_DANH_MUC
                            .DANH_MUC_DAO_TAO_STUDY_RANK,
                    },
                    {
                        id: 'training-rank',
                        label: 'Danh mục xếp loại rèn luyện',
                        icon: PieChartOutlined,
                        path: ROUTER_PATH.QL_DANH_MUC
                            .DANH_MUC_DAO_TAO_TRAINING_RANK,
                    },
                    {
                        id: 'training-kpi',
                        label: 'Danh mục tải đào tạo',
                        icon: PieChartOutlined,
                        path: ROUTER_PATH.QL_DANH_MUC
                            .DANH_MUC_DAO_TAO_TRAINING_KPI,
                    },
                ],
            },
            {
                id: 'danh-muc-ho-so',
                label: 'Danh mục hồ sơ',
                icon: PieChartOutlined,
                children: [
                    {
                        id: 'priority-object',
                        label: 'Danh mục đối tượng ưu tiên',
                        icon: PieChartOutlined,
                        path: ROUTER_PATH.QL_DANH_MUC
                            .DANH_MUC_HO_SO_PRIORITY_OBJECT,
                    },
                    {
                        id: 'registration-area',
                        label: 'Danh mục khu vực đăng ký',
                        icon: PieChartOutlined,
                        path: ROUTER_PATH.QL_DANH_MUC
                            .DANH_MUC_HO_SO_REGISTRATION_AREA,
                    },
                    {
                        id: 'nationality',
                        label: 'Danh mục quốc tịch',
                        icon: PieChartOutlined,
                        path: ROUTER_PATH.QL_DANH_MUC
                            .DANH_MUC_HO_SO_NATIONALITY,
                    },
                    {
                        id: 'religion',
                        label: 'Danh mục tôn giáo',
                        icon: PieChartOutlined,
                        path: ROUTER_PATH.QL_DANH_MUC.DANH_MUC_HO_SO_RELIGION,
                    },
                    {
                        id: 'ethnicity',
                        label: 'Danh mục dân tộc',
                        icon: PieChartOutlined,
                        path: ROUTER_PATH.QL_DANH_MUC.DANH_MUC_HO_SO_ETHNICITY,
                    },
                    {
                        id: 'user-typ',
                        label: 'Danh mục đối tượng',
                        icon: PieChartOutlined,
                        path: ROUTER_PATH.QL_DANH_MUC.DANH_MUC_HO_SO_USER_TYPE,
                    },
                ],
            },
        ],

        label: 'Quản lý danh mục',
    },
    QL_DAO_TAO: {
        menus: [
            {
                id: 'home',
                label: 'Trang chủ',
                icon: HomeOutlined,
                path: ROUTER_PATH.QL_DAO_TAO.HOME,
                description: 'Thông tin trang chủ',
            },
            {
                id: 'schoolyear-semester',
                label: 'Năm học, kỳ học',
                icon: ScheduleOutlined,
                path: ROUTER_PATH.QL_DAO_TAO.NAM_HOC_KY_HOC,
                description: 'Thông tin năm học, kỳ học',
            },
            {
                id: 'milestone',
                label: 'Mốc huấn luyện',
                icon: ClockCircleOutlined,
                path: ROUTER_PATH.QL_DAO_TAO.MOC_HUAN_LUYEN,
                description: 'Thông tin năm học, kỳ học',
            },
            {
                id: 'traning-course',
                label: 'Quản lý khóa',
                icon: BookOutlined,
                path: ROUTER_PATH.QL_DAO_TAO.KHOA_HUAN_LUYEN,
                description: 'Quản lý khóa',
            },
            {
                id: 'fixed-class',
                label: 'Quản lý lớp biên chế',
                icon: TeamOutlined,
                path: ROUTER_PATH.QL_DAO_TAO.LOP_BIEN_CHE,
                description: 'Quản lý lớp biên chế',
            },
            {
                id: 'user-profile-lecture',
                label: 'Quản lý hồ sơ giảng viên',
                icon: IdcardOutlined,
                path: ROUTER_PATH.QL_DAO_TAO.QL_GIANG_VIEN,
                description: 'Quản lý hồ sơ giảng viên',
            },
            {
                id: 'user-profile-qs',
                label: 'Quản lý hồ sơ học viên',
                icon: IdcardOutlined,
                path: ROUTER_PATH.QL_DAO_TAO.QL_HOC_VIEN,
                description: 'Quản lý hồ sơ học viên',
            },
            {
                id: 'user-profile-ds',
                label: 'Quản lý hồ sơ sinh viên',
                icon: IdcardOutlined,
                path: ROUTER_PATH.QL_DAO_TAO.QL_SINH_VIEN,
                description: 'Quản lý hồ sơ sinh viên',
            },
            // {
            //     id: 'teacher-profile-management',
            //     label: 'Quản lý hồ sơ giáo viên',
            //     icon: IdcardOutlined,
            //     path: ROUTER_PATH.QL_DAO_TAO.TEACHER_PROFILE_MANAGEMENT,
            //     description: 'Quản lý hồ sơ giáo viên',
            // },
            {
                id: 'chuong-trinh-dao-tao',
                label: 'Quản lý chương trình đào tạo',
                icon: PieChartOutlined,
                children: [
                    {
                        id: 'curriculumn',
                        label: 'Chương trình đào tạo',
                        icon: PieChartOutlined,
                        path: ROUTER_PATH.QL_DAO_TAO.CHUONG_TRINH_DAO_TAO,
                    },
                    // {
                    //     id: 'curriculumn-version',
                    //     label: 'Phiên bản chương trình đào tạo',
                    //     icon: PieChartOutlined,
                    //     path: ROUTER_PATH.QL_DAO_TAO.PHIEN_BAN_CTDT,
                    // },
                    {
                        id: 'subject-group',
                        label: 'Nhóm môn học',
                        icon: PieChartOutlined,
                        path: ROUTER_PATH.QL_DAO_TAO.NHOM_MON_HOC,
                    },
                    {
                        id: 'subject',
                        label: 'Môn học',
                        icon: PieChartOutlined,
                        path: ROUTER_PATH.QL_DAO_TAO.MON_HOC,
                    },
                ],
            },
        ],
        label: 'Quản lý đào tạo',
    },
    TRO_LY_AO: {
        label: 'Trợ lý ảo',
        menus: [
            {
                id: 'quan-tri',
                label: 'Quản trị trợ lý ảo',
                icon: SettingOutlined,
                children: [
                    {
                        id: 'quan-tri-du-lieu',
                        label: 'Dữ liệu',
                        path: ROUTER_PATH.TRO_LY_AO.QUAN_TRI_DU_LIEU,
                    },
                    {
                        id: 'quan-tri-cau-hinh-tham-so',
                        label: 'Cấu hình tham số',
                        path: ROUTER_PATH.TRO_LY_AO.QUAN_TRI_CAU_HINH_THAM_SO,
                    },
                    {
                        id: 'quan-tri-cau-hinh-promt-rag',
                        label: 'Cấu hình promt',
                        path: ROUTER_PATH.TRO_LY_AO.QUAN_TRI_CAU_HINH_PROMT,
                    },
                ],
            },
            {
                id: 'tro-ly-ao',
                label: 'Trợ lý ảo',
                icon: MessageOutlined,
                path: ROUTER_PATH.TRO_LY_AO.INDEX,
            },
        ],
    },
    KHAO_THI: {
        label: 'Khảo thí',
        menus: [
            {
                id: 'thiet-lap-khao-sat',
                label: 'Thiết lập khảo sát',
                icon: SettingOutlined,
                children: [
                    {
                        id: 'thiet-lap-chung',
                        label: 'Thiết lập chung',
                        path: ROUTER_PATH.KHAO_THI
                            .THIET_LAP_KHAO_SAT_THIET_LAP_CHUNG,
                    },
                    {
                        id: 'cau-hoi-khao-sat',
                        label: 'Câu hỏi khảo sát',
                        path: ROUTER_PATH.KHAO_THI
                            .THIET_LAP_KHAO_SAT_CAU_HOI_KHAO_SAT,
                    },
                ],
            },
            {
                id: 'tra-loi-khao-sat',
                label: 'Trả lời khảo sát',
                icon: FileTextOutlined,
                path: ROUTER_PATH.KHAO_THI.TRA_LOI_KHAO_SAT,
            },
        ],
    },
}
export { ROUTER_PATH }
export type { MenuItem, NavigationType }
export default NAVIGATION
