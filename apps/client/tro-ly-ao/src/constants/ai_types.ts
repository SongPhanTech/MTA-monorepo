import { RobotOutlined, UserOutlined } from "@ant-design/icons";

const AI_TYPES = [
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
    {
        key: 'ACADEMY_INFORMATION',
        label: 'Thông tin học viện',
        icon: RobotOutlined,
        group: 'Thông tin học viện',
    },
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
    {
        key: 'FREQUENTLY_ASKED_QUESTIONS',
        label: 'Câu hỏi thường gặp',
        icon: RobotOutlined,
        group: 'Hỗ trợ & giải đáp',
    },
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
    {
        key: 'IN_THE_FACULTY_HANDBOOK',
        label: 'Tài liệu khoa',
        icon: RobotOutlined,
        group: 'Tài liệu học thuật',
    },
    {
        key: 'TRANSLATION_FROM_OTHER_LANGUAGES_INTO_VIETNAMESE',
        label: 'Dịch sang tiếng Việt',
        icon: RobotOutlined,
        group: 'Xử lý ngôn ngữ',
    },
    {
        key: 'DETECTION_AND_CORRECTION_OF_TEXT_ERRORS',
        label: 'Phát hiện & sửa lỗi văn bản',
        icon: RobotOutlined,
        group: 'Xử lý ngôn ngữ',
    },
    {
        key: 'EXTRACTIVE_TEXT_SUMMARIZATION',
        label: 'Tóm tắt trích xuất',
        icon: RobotOutlined,
        group: 'Tóm tắt văn bản',
    },
    {
        key: 'ABSTRACTIVE_TEXT_SUMMARIZATION',
        label: 'Tóm tắt sáng tạo',
        icon: RobotOutlined,
        group: 'Tóm tắt văn bản',
    },
]
export default AI_TYPES