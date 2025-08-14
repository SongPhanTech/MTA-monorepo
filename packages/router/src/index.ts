import {
    ApartmentOutlined,
    BookOutlined,
    MessageOutlined,
    PieChartOutlined,
    ReadOutlined,
    SettingOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons'
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon'
// biome-ignore lint/style/useImportType: <>
import {
    BarChart3,
    BookOpenCheck,
    BookUser,
    CalendarRange,
    FileCheck2,
    Flag,
    FolderOpen,
    GitCompare,
    GraduationCap,
    House,
    Landmark,
    Library,
    ListChecks,
    ListTree,
    LucideProps,
    ScrollText,
    Settings,
    UserCog,
    UserRoundPen,
} from 'lucide-react'
import ROUTER_PATH from '../generated/router'
import './index.css'
interface MenuItem {
    id: string
    label: React.ReactNode
    icon?:
        | React.ForwardRefExoticComponent<
              Omit<AntdIconProps, 'ref'> & React.RefAttributes<HTMLSpanElement>
          >
        | React.ForwardRefExoticComponent<
              Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>
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
                        path: ROUTER_PATH.QL_NGUOI_DUNG.NGUOI_DUNG_NHOM_NGUOI_DUNG,
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
    // QL_DANH_MUC: {
    //     menus: [
    //         // {
    //         //     id: 'home',
    //         //     label: 'Trang chủ',
    //         //     icon: HomeOutlined,
    //         //     path: ROUTER_PATH.QL_DANH_MUC.HOME,
    //         //     description: 'Thông tin trang chủ',
    //         // },
    //         {
    //             id: 'danh-muc-chung',
    //             label: 'Danh mục chung',
    //             icon: PieChartOutlined,
    //             children: [
    //                 {
    //                     id: 'level',
    //                     label: 'Danh mục phân cấp',
    //                     icon: PieChartOutlined,
    //                     path: ROUTER_PATH.QL_DANH_MUC.DANH_MUC_LEVEL,
    //                 },
    //                 {
    //                     id: 'rank',
    //                     label: 'Danh mục cấp bậc hàm',
    //                     icon: PieChartOutlined,
    //                     path: ROUTER_PATH.QL_DANH_MUC.DANH_MUC_RANK,
    //                 },
    //                 {
    //                     id: 'academic-degree-type',
    //                     label: 'Danh mục học hàm',
    //                     icon: PieChartOutlined,
    //                     path: ROUTER_PATH.QL_DANH_MUC.DANH_MUC_ACADEMIC_DEGREE_TYPE,
    //                 },
    //                 {
    //                     id: 'academic-rank-type',
    //                     label: 'Danh mục học vị',
    //                     icon: PieChartOutlined,
    //                     path: ROUTER_PATH.QL_DANH_MUC.DANH_MUC_ACADEMIC_RANK_TYPE,
    //                 },
    //                 {
    //                     id: 'position',
    //                     label: 'Danh mục chức vụ',
    //                     icon: PieChartOutlined,
    //                     path: ROUTER_PATH.QL_DANH_MUC.DANH_MUC_POSITION,
    //                 },
    //                 {
    //                     id: 'organization-type',
    //                     label: 'Danh mục loại đơn vị',
    //                     icon: PieChartOutlined,
    //                     path: ROUTER_PATH.QL_DANH_MUC.DANH_MUC_ORGANIZATION_TYPE,
    //                 },
    //                 {
    //                     id: 'organization',
    //                     label: 'Danh mục đơn vị',
    //                     icon: PieChartOutlined,
    //                     path: ROUTER_PATH.QL_DANH_MUC.DANH_MUC_ORGANIZATION,
    //                 },
    //             ],
    //         },
    //         {
    //             id: 'danh-muc-dao-tao',
    //             label: 'Danh mục đào tạo',
    //             icon: PieChartOutlined,
    //             children: [
    //                 {
    //                     id: 'training-object-type',
    //                     label: 'Danh mục đối tượng đào tạo',
    //                     icon: PieChartOutlined,
    //                     path: ROUTER_PATH.QL_DANH_MUC.DANH_MUC_DAO_TAO_TRANINING_OBJECT_TYPE,
    //                 },
    //                 {
    //                     id: 'training-type',
    //                     label: 'Danh mục loại hình đào tạo',
    //                     icon: PieChartOutlined,
    //                     path: ROUTER_PATH.QL_DANH_MUC.DANH_MUC_DAO_TAO_TRAINING_TYPE,
    //                 },
    //                 {
    //                     id: 'training-level',
    //                     label: 'Danh mục bậc đào tạo',
    //                     icon: PieChartOutlined,
    //                     path: ROUTER_PATH.QL_DANH_MUC.DANH_MUC_DAO_TAO_TRAINING_LEVEL,
    //                 },
    //                 {
    //                     id: 'training-location',
    //                     label: 'Danh mục địa điểm đào tạo',
    //                     icon: PieChartOutlined,
    //                     path: ROUTER_PATH.QL_DANH_MUC.DANH_MUC_DAO_TAO_TRAINING_LOCATION,
    //                 },
    //                 {
    //                     id: 'training-field',
    //                     label: 'Danh mục ngành đào tạo',
    //                     icon: PieChartOutlined,
    //                     path: ROUTER_PATH.QL_DANH_MUC.DANH_MUC_DAO_TAO_TRANINING_FIELD,
    //                 },
    //                 {
    //                     id: 'training-major',
    //                     label: 'Danh mục chuyên ngành đào tạo',
    //                     icon: PieChartOutlined,
    //                     path: ROUTER_PATH.QL_DANH_MUC.DANH_MUC_DAO_TAO_TRANINING_MAJOR,
    //                 },
    //                 {
    //                     id: 'training-block',
    //                     label: 'Danh mục khối kiến thức',
    //                     icon: PieChartOutlined,
    //                     path: ROUTER_PATH.QL_DANH_MUC.DANH_MUC_DAO_TAO_TRANINING_BLOCK,
    //                 },
    //                 {
    //                     id: 'training-time',
    //                     label: 'Danh mục thời gian đào tạo',
    //                     icon: PieChartOutlined,
    //                     path: ROUTER_PATH.QL_DANH_MUC.DANH_MUC_DAO_TAO_TRANINING_TIME,
    //                 },
    //                 {
    //                     id: 'training-form',
    //                     label: 'Danh mục hình thức đào tạo',
    //                     icon: PieChartOutlined,
    //                     path: ROUTER_PATH.QL_DANH_MUC.DANH_MUC_DAO_TAO_TRANINING_FORM,
    //                 },
    //                 {
    //                     id: 'study-rank',
    //                     label: 'Danh mục xếp loại học tập',
    //                     icon: PieChartOutlined,
    //                     path: ROUTER_PATH.QL_DANH_MUC.DANH_MUC_DAO_TAO_STUDY_RANK,
    //                 },
    //                 {
    //                     id: 'training-rank',
    //                     label: 'Danh mục xếp loại rèn luyện',
    //                     icon: PieChartOutlined,
    //                     path: ROUTER_PATH.QL_DANH_MUC.DANH_MUC_DAO_TAO_TRAINING_RANK,
    //                 },
    //                 {
    //                     id: 'training-kpi',
    //                     label: 'Danh mục tải đào tạo',
    //                     icon: PieChartOutlined,
    //                     path: ROUTER_PATH.QL_DANH_MUC.DANH_MUC_DAO_TAO_TRAINING_KPI,
    //                 },
    //             ],
    //         },
    //         {
    //             id: 'danh-muc-ho-so',
    //             label: 'Danh mục hồ sơ',
    //             icon: PieChartOutlined,
    //             children: [
    //                 {
    //                     id: 'priority-object',
    //                     label: 'Danh mục đối tượng ưu tiên',
    //                     icon: PieChartOutlined,
    //                     path: ROUTER_PATH.QL_DANH_MUC.DANH_MUC_HO_SO_PRIORITY_OBJECT,
    //                 },
    //                 {
    //                     id: 'registration-area',
    //                     label: 'Danh mục khu vực đăng ký',
    //                     icon: PieChartOutlined,
    //                     path: ROUTER_PATH.QL_DANH_MUC.DANH_MUC_HO_SO_REGISTRATION_AREA,
    //                 },
    //                 {
    //                     id: 'nationality',
    //                     label: 'Danh mục quốc tịch',
    //                     icon: PieChartOutlined,
    //                     path: ROUTER_PATH.QL_DANH_MUC.DANH_MUC_HO_SO_NATIONALITY,
    //                 },
    //                 {
    //                     id: 'religion',
    //                     label: 'Danh mục tôn giáo',
    //                     icon: PieChartOutlined,
    //                     path: ROUTER_PATH.QL_DANH_MUC.DANH_MUC_HO_SO_RELIGION,
    //                 },
    //                 {
    //                     id: 'ethnicity',
    //                     label: 'Danh mục dân tộc',
    //                     icon: PieChartOutlined,
    //                     path: ROUTER_PATH.QL_DANH_MUC.DANH_MUC_HO_SO_ETHNICITY,
    //                 },
    //                 {
    //                     id: 'user-typ',
    //                     label: 'Danh mục đối tượng',
    //                     icon: PieChartOutlined,
    //                     path: ROUTER_PATH.QL_DANH_MUC.DANH_MUC_HO_SO_USER_TYPE,
    //                 },
    //             ],
    //         },
    //     ],

    //     label: 'Quản lý danh mục',
    // },
    QL_DAO_TAO: {
        menus: [
            {
                id: 'home',
                label: 'Trang chủ',
                icon: House,
                path: ROUTER_PATH.QL_DAO_TAO.HOME,
                description: 'Thông tin trang chủ',
            },
            {
                id: 'chuong-trinh-dao-tao',
                label: 'Chương trình đào tạo',
                icon: Library,
                children: [
                    {
                        id: 'danh-muc-chuong-trinh-dao-tao',
                        label: 'Danh mục CTĐT',
                        path: ROUTER_PATH.QL_DAO_TAO
                            .CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
                        description: 'Danh mục CTĐT',
                    },
                    {
                        id: 'khoi-kien-thuc-ctdt',
                        label: 'Khối kiến thức CTĐT',
                        path: ROUTER_PATH.QL_DAO_TAO.CHUONG_TRINH_DAO_TAO_KHOI_KIEN_THUC_CTDT,
                        description: 'Khối kiến thức CTĐT',
                    },
                    {
                        id: 'danh-sach-mon-hoc',
                        label: 'Danh sách môn học',
                        path: ROUTER_PATH.QL_DAO_TAO.CHUONG_TRINH_DAO_TAO_DANH_SACH_MON_HOC,
                        description: 'Danh sách môn học',
                    },
                ],
            },
            {
                id: 'ke-hoach-giao-duc',
                label: 'Kế hoạch đào tạo',
                icon: CalendarRange,
                children: [
                    {
                        id: 'ke-hoach-mo-lop-mon-hoc',
                        label: 'Kế hoạch mở lớp môn học',
                        path: ROUTER_PATH.QL_DAO_TAO.KE_HOACH_GIAO_DUC_KE_HOACH_MO_LOP_MON_HOC,
                        description: 'Kế hoạch mở lớp môn học',
                    },
                    {
                        id: 'quan-ly-lop-mon-hoc',
                        label: 'Quản lý lớp môn học',
                        path: ROUTER_PATH.QL_DAO_TAO.KE_HOACH_GIAO_DUC_QUAN_LY_LOP_MON_HOC,
                        description: 'Quản lý lớp môn học',
                    },
                    {
                        id: 'dang-ky-hoc',
                        label: 'Đăng ký học',
                        path: '/ke-hoach-giao-duc/dang-ky-hoc',
                        description: 'Đăng ký học',
                    },
                ],
            },
            {
                id: 'lop-mon-hoc',
                label: 'Quản lý điểm',
                icon: BarChart3,
                children: [
                    {
                        id: 'khoa-nhap-diem',
                        label: 'Mở/Khóa nhập điểm',
                        path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_KHOA_NHAP_DIEM,
                        description: 'Mở/Khóa nhập điểm',
                    },
                    {
                        id: 'ds-lop-mon-hoc',
                        label: 'Danh sách lớp môn học',
                        path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_DS_LOP_MON_HOC,
                        description: 'Danh sách lớp môn học',
                    },
                    {
                        id: 'ql-diem-lop-mon-hoc',
                        label: 'Nhập điểm',
                        path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC,
                        description: 'Nhập điểm',
                    },
                    {
                        id: 'ql-diem-ren-luyen',
                        label: 'Nhập điểm rèn luyện',
                        path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_QL_DIEM_REN_LUYEN,
                        description: 'Nhập điểm rèn luyện',
                    },
                    {
                        id: 'ql-diem-cong',
                        label: 'Quản lý điểm cộng',
                        path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_QL_DIEM_CONG,
                        description: 'Quản lý điểm cộng',
                    },
                ],
            },
            {
                id: 'milestone',
                label: 'Mốc huấn luyện',
                icon: Flag,
                path: ROUTER_PATH.QL_DAO_TAO.MOC_HUAN_LUYEN,
                description: 'Thông tin năm học, kỳ học',
            },
            {
                id: 'schoolyear-semester',
                label: 'Năm học kỳ học',
                icon: BookOpenCheck,
                path: ROUTER_PATH.QL_DAO_TAO.NAM_HOC_KY_HOC,
                description: 'Thông tin năm học, kỳ học',
            },
            {
                id: 'danh-muc-chuyen-doi-diem',
                label: 'Bảng chuyển đổi điểm',
                icon: GitCompare,
                path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_DANH_MUC_CHUYEN_DOI_DIEM,
                description: 'Bảng chuyển đổi điểm',
            },
            {
                id: 'category',
                label: 'Danh mục',
                icon: ListTree,
                children: [
                    {
                        id: 'doi-tuong-dao-tao',
                        label: 'Đối tượng đào tạo',
                        icon: PieChartOutlined,
                        path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_DOI_TUONG_DAO_TAO,
                        description: 'Đối tượng đào tạo',
                    },
                    {
                        id: 'loai-hinh-dao-tao',
                        label: 'Loại hình đào tạo',
                        icon: PieChartOutlined,
                        path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_LOAI_HINH_DAO_TAO,
                        description: 'Loại hình đào tạo',
                    },
                    {
                        id: 'danh-muc-nganh',
                        label: 'Danh mục ngành',
                        icon: PieChartOutlined,
                        path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_DANH_MUC_NGANH,
                        description: 'Danh mục ngành',
                    },
                    {
                        id: 'danh-muc-chuyen-nganh',
                        label: 'Danh mục chuyên ngành',
                        icon: PieChartOutlined,
                        path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_DANH_MUC_CHUYEN_NGANH,
                        description: 'Danh mục chuyên ngành',
                    },
                    {
                        id: 'khoa-huan-luyen',
                        label: 'Danh mục khoá đào tạo',
                        icon: BookOutlined,
                        path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_KHOA_HUAN_LUYEN,
                        description: 'Danh mục khoá đào tạo',
                    },
                    {
                        id: 'xep-loai-hoc-luc',
                        label: 'Xếp loại học lực',
                        icon: BookOutlined,
                        path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_XEP_LOAI_HOC_LUC,
                        description: 'Xếp loại học lực',
                    },
                    {
                        id: 'xep-loai-tot-nghiep',
                        label: 'Xếp loại tốt nghiệp',
                        icon: BookOutlined,
                        path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_XEP_LOAI_TOT_NGHIEP,
                        description: 'Xếp loại tốt nghiệp',
                    },
                    {
                        id: 'danh-muc-danh-muc-phong-hoc',
                        label: 'Danh mục phòng học',
                        icon: TeamOutlined,
                        path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_DANH_MUC_PHONG_HOC,
                        description: 'Danh mục phòng học',
                    },
                    {
                        id: 'lop-bien-che',
                        label: 'Quản lý lớp niên chế',
                        icon: TeamOutlined,
                        path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_LOP_BIEN_CHE,
                        description: 'Quản lý lớp niên chế',
                    },
                    {
                        id: 'hoc-bong',
                        label: 'Danh mục học bổng',
                        path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_DANH_MUC_HOC_BONG,
                        description: 'Danh mục học bổng',
                    },
                    {
                        id: 'canh-cao-hoc-tap',
                        label: 'Danh mục cảnh cáo học tập',
                        path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_DANH_MUC_CANH_CAO_HOC_TAP,
                        description: 'Danh mục cảnh cáo học tập',
                    },
                    {
                        id: 'canh-cao-hoc-duong',
                        label: 'Danh mục cảnh cáo học đường',
                        path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_DANH_MUC_CANH_CAO_HOC_DUONG,
                        description: 'Danh mục cảnh cáo học đường',
                    },
                    {
                        id: 'xu-ly-hoc-tap',
                        label: 'Danh mục xử lý học tập',
                        path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_DANH_MUC_XU_LY_HOC_TAP,
                        description: 'Danh mục xử lý học tập',
                    },
                    {
                        id: 'thoi-gian-dao-tao',
                        label: 'Danh mục thời gian đào tạo',
                        icon: TeamOutlined,
                        path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_THOI_GIAN_DAO_TAO,
                        description: 'Danh mục thời gian đào tạo',
                    },
                    {
                        id: 'hinh-thuc-huan-luyen',
                        label: 'Danh mục hình thức huấn luyện',
                        icon: TeamOutlined,
                        path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_HINH_THUC_HUAN_LUYEN,
                        description: 'Danh mục hình thức huấn luyện',
                    },
                ],
            },
            {
                id: 'ql-xet-tot-nghiep',
                label: 'Xét tốt nghiệp',
                icon: GraduationCap,
                children: [
                    {
                        id: 'ql-dot-xet-tot-nghiep',
                        label: 'Đợt xét tốt nghiệp',
                        path: ROUTER_PATH.QL_DAO_TAO.XET_TOT_NGHIEP_QL_DOT_XET_TOT_NGHIEP,
                        description: 'Đợt xét tốt nghiệp',
                    },
                ],
            },
            {
                id: 'ql-do-an',
                label: 'Quản lý đồ án',
                icon: FileCheck2,
                children: [
                    {
                        id: 'danh-muc-do-an',
                        label: 'Danh mục đồ án',
                        path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DO_AN_DANH_MUC_DO_AN,
                        description: 'Danh mục đồ án',
                    },
                    {
                        id: 'danh-sach-chuyen-gia',
                        label: 'Danh sách chuyên gia',
                        path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DO_AN_DANH_SACH_CHUYEN_GIA,
                        description: 'Danh sách chuyên gia',
                    },
                ],
            },
            {
                id: 'ql-ren-luyen',
                label: 'Quản lý rèn luyện',
                icon: ListChecks,
                children: [
                    {
                        id: 'ql-dot-ren-luyen',
                        label: 'QL đợt rèn luyện',
                        icon: ReadOutlined,
                        path: ROUTER_PATH.QL_DAO_TAO.QL_REN_LUYEN_DOT_DANH_GIA,
                    },
                    {
                        id: 'danh-gia-ren-luyen',
                        label: 'Đánh giá rèn luyện',
                        icon: ReadOutlined,
                        path: ROUTER_PATH.QL_DAO_TAO.QL_REN_LUYEN_DANH_GIA,
                    },
                    {
                        id: 'tong-hop-danh-gia-ren-luyen',
                        label: 'Tổng hợp đánh giá rèn luyện',
                        icon: ReadOutlined,
                        path: ROUTER_PATH.QL_DAO_TAO.QL_REN_LUYEN_DANH_GIA_TONG,
                    },
                ],
            },
            {
                id: 'ql-ho-so',
                label: 'Quản lý hồ sơ',
                icon: FolderOpen,
                children: [
                    {
                        id: 'ql-sinh-vien',
                        label: 'QL sinh viên, học viên',
                        icon: ReadOutlined,
                        path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_HO_SO_QL_SINH_VIEN,
                        description: 'QL sinh viên, học viên',
                    },
                    {
                        id: 'danh-sach-giang-vien',
                        label: 'Danh sách giảng viên',
                        icon: ReadOutlined,
                        path: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_HO_SO_DANH_SACH_GIANG_VIEN,
                        description: 'Danh sách giảng viên',
                    },
                ],
            },
            {
                id: 'quan-ly-van-bang',
                label: 'Quản lý văn bằng',
                icon: ScrollText,
                description: 'Quản lý văn bằng',
                children: [
                    {
                        id: 'danh-muc-van-bang',
                        label: 'Danh mục văn bằng',
                        path: ROUTER_PATH.QL_DAO_TAO.QL_VAN_BANG_DANH_MUC_VAN_BANG,
                        description: 'Danh mục văn bằng',
                    },
                    {
                        id: 'tra-cuu-van-bang-chung-tri',
                        label: 'Tra cứu văn bằng chứng chỉ',
                        path: ROUTER_PATH.QL_DAO_TAO.QL_VAN_BANG_TRA_CUU_VAN_BANG,
                        description: 'Tra cứu văn bằng chứng chỉ',
                    },
                    {
                        id: 'don-dang-ky-xac-minh',
                        label: 'Đơn đăng ký xác minh',
                        path: ROUTER_PATH.QL_DAO_TAO.QL_VAN_BANG_DON_DANG_KY_XAC_MINH,
                        description: 'Đơn đăng ký xác minh',
                    },
                    {
                        id: 'ql-don-dang-ky-xac-minh',
                        label: 'Quản lý đơn đăng ký xác minh',
                        path: ROUTER_PATH.QL_DAO_TAO.QL_VAN_BANG_QL_DON_DANG_KY_XAC_MINH,
                        description: 'Quản lý đơn đăng ký xác minh',
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
                id: 'home',
                label: 'Trang chủ',
                icon: House,
                path: ROUTER_PATH.KHAO_THI.HOME,
                description: 'Thông tin trang chủ',
            },
            {
                id: 'thiet-lap-de-thi',
                label: 'Thiết lập đề thi',
                icon: Landmark,
                children: [
                    {
                        id: 'danh-sach-ky-thi',
                        label: 'Danh sách kỳ thi',
                        path: ROUTER_PATH.KHAO_THI.THIET_LAP_DE_THI_DS_KY_THI,
                    },
                    {
                        id: 'ngan-hang-cau-hoi',
                        label: 'Ngân hàng câu hỏi',
                        path: ROUTER_PATH.KHAO_THI.THIET_LAP_DE_THI_NGAN_HANG_CAU_HOI,
                    },
                ],
            },
            {
                id: 'category',
                label: 'Danh mục',
                icon: ListTree,
                children: [
                    {
                        id: 'danh-muc-chuong-muc',
                        label: 'Danh mục chương mục',
                        path: ROUTER_PATH.KHAO_THI.DANH_MUC_DANH_MUC_CHUONG_MUC,
                    },
                    {
                        id: 'danh-muc-muc-do-kho',
                        label: 'Danh mục mức độ khó',
                        path: ROUTER_PATH.KHAO_THI.DANH_MUC_MUC_DO_KHO,
                    },
                ],
            },
            {
                id: 'thiet-lap-khao-sat',
                label: 'Thiết lập khảo sát',
                icon: Settings,
                children: [
                    {
                        id: 'thiet-lap-chung',
                        label: 'Thiết lập chung',
                        path: ROUTER_PATH.KHAO_THI.THIET_LAP_KHAO_SAT_THIET_LAP_CHUNG,
                    },
                    {
                        id: 'nhom-cau-hoi-khao-sat',
                        label: 'Nhóm câu hỏi khảo sát',
                        path: ROUTER_PATH.KHAO_THI.THIET_LAP_KHAO_SAT_NHOM_CAU_HOI_KHAO_SAT,
                    },
                    {
                        id: 'cau-hoi-khao-sat',
                        label: 'Câu hỏi khảo sát',
                        path: ROUTER_PATH.KHAO_THI.THIET_LAP_KHAO_SAT_CAU_HOI_KHAO_SAT,
                    },
                ],
            },
        ],
    },
    QL_HO_SO: {
        label: 'Quản lý hồ sơ',
        menus: [
            {
                id: 'home',
                label: 'Trang chủ',
                icon: House,
                path: ROUTER_PATH.KHAO_THI.HOME,
                description: 'Thông tin trang chủ',
            },
            {
                id: 'quan-tri',
                label: 'Quản lý hồ sơ',
                icon: BookUser,
                path: ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO,
                description: 'Quản lý hồ sơ',
            },
            {
                id: 'quan-ly-giang-vien',
                label: 'Quản lý giảng viên',
                icon: UserRoundPen,
                path: ROUTER_PATH.QL_HO_SO.QL_GIANG_VIEN,
                description: 'Quản lý giảng viên',
            },
            {
                id: 'quan-ly-can-bo',
                label: 'Quản lý cán bộ nhân viên',
                icon: UserCog,
                path: ROUTER_PATH.QL_HO_SO.QL_CAN_BO,
                description: 'Quản lý cán bộ nhân viên',
            },
            {
                id: 'danh-muc-ho-so',
                label: 'Danh mục hồ sơ',
                icon: ReadOutlined,
                path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO,
                description: 'Danh mục hồ sơ',
            },
        ],
    },
}
export { ROUTER_PATH }
export type { MenuItem, NavigationType }
export default NAVIGATION
