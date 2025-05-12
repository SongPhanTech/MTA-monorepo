import { RobotOutlined, UserOutlined } from '@ant-design/icons'

const AI_TYPES = [
    // Thông tin học viện
    {
        key: 'ACADEMY_INFORMATION',
        label: 'Thông tin học viện',
        icon: RobotOutlined,
        group: 'Thông tin học viện',
    },

    // Đào tạo
    {
        key: 'TRAINING_RULES_AND_REGULATIONS',
        label: 'Quy chế đào tạo',
        icon: UserOutlined,
        group: 'Đào tạo',
    },
    {
        key: 'EXAMINATION_RULES_AND_REGULATIONS',
        label: 'Quy chế thi cử',
        icon: UserOutlined,
        group: 'Đào tạo',
    },
    {
        key: 'TRAINING_PROGRAMS_INFORMATION',
        label: 'Thông tin chương trình đào tạo',
        icon: RobotOutlined,
        group: 'Đào tạo',
    },

    // Tuyển sinh
    {
        key: 'GENERAL_ADMISSIONS_INFORMATION',
        label: 'Thông tin tuyển sinh chung',
        icon: RobotOutlined,
        group: 'Tuyển sinh',
    },
    {
        key: 'ADMISSIONS_RULES_AND_REGULATIONS',
        label: 'Quy chế tuyển sinh',
        icon: UserOutlined,
        group: 'Tuyển sinh',
    },

    // Chính sách & quyền lợi
    {
        key: 'REGULATIONS_POLICIES_AND_BENEFITS_FOR_MILITARY_CADETS',
        label: 'Chính sách học viên quân sự',
        icon: UserOutlined,
        group: 'Chính sách & quyền lợi',
    },
    {
        key: 'REGULATIONS_POLICIES_AND_BENEFITS_FOR_CIVILIAN_STUDENTS',
        label: 'Chính sách sinh viên dân sự',
        icon: UserOutlined,
        group: 'Chính sách & quyền lợi',
    },

    // Thông tin nội bộ
    {
        key: 'PARTY_WORK_AND_POLITICAL_WORK',
        label: 'Công tác Đảng & Chính trị',
        icon: UserOutlined,
        group: 'Thông tin nội bộ',
    },
    {
        key: 'INTERNAL_GUIDELINES_AND_REGULATIONS_OF_THE_ACADEMY',
        label: 'Quy định nội bộ học viện',
        icon: UserOutlined,
        group: 'Thông tin nội bộ',
    },

    // Tài liệu học thuật
    {
        key: 'IN_THE_FACULTY_HANDBOOK',
        label: 'Tài liệu khoa',
        icon: RobotOutlined,
        group: 'Tài liệu học thuật',
    },

    // Hỗ trợ & giải đáp
    {
        key: 'FREQUENTLY_ASKED_QUESTIONS',
        label: 'Câu hỏi thường gặp',
        icon: RobotOutlined,
        group: 'Hỗ trợ & giải đáp',
    },
]
export default AI_TYPES
