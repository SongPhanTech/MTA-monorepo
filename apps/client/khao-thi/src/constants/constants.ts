import { $Enums } from '@workspace/db'
import { env } from '@/env'

const DEFAULT_PAGINATE_SIZE = 10
const MAX_INPUT_LENGTH = 255
const MAX_TEXTAREA_LENGTH = 1000
const API_BASE_URL = env.NEXT_PUBLIC_API_BASE_URL
const API_MODEL_BASE_URL = env.NEXT_PUBLIC_API_MODEL_BASE_URL
const DOCUMENT_TYPE = [
    {
        value: $Enums.DocumentType.GENERAL_ADMISSIONS_INFORMATION,
        label: 'Thông tin chung về tuyển sinh',
    },
    {
        value: $Enums.DocumentType.ADMISSIONS_RULES_AND_REGULATIONS,
        label: 'Quy định, quy chế tuyển sinh',
    },
    {
        value: $Enums.DocumentType.TRAINING_RULES_AND_REGULATIONS,
        label: 'Quy định, quy chế đào tạo',
    },
    {
        value: $Enums.DocumentType.EXAMINATION_RULES_AND_REGULATIONS,
        label: 'Quy định, quy chế thi',
    },
    {
        value: $Enums.DocumentType.ACADEMY_INFORMATION,
        label: 'Thông tin Học viện',
    },
    {
        value: $Enums.DocumentType.TRAINING_PROGRAMS_INFORMATION,
        label: 'Thông tin về các chương trình đào tạo',
    },
    {
        value: $Enums.DocumentType.REGULATIONS_POLICIES_AND_BENEFITS_FOR_MILITARY_CADETS,
        label: 'Quy định, chế độ, chính sách với Học viên quân sự',
    },
    {
        value: $Enums.DocumentType.REGULATIONS_POLICIES_AND_BENEFITS_FOR_CIVILIAN_STUDENTS,
        label: 'Quy định, chế độ, chính sách với Sinh viên dân sự',
    },
    {
        value: $Enums.DocumentType.PARTY_WORK_AND_POLITICAL_WORK,
        label: 'Đảng, công tác Chính trị',
    },
    {
        value: $Enums.DocumentType.INTERNAL_GUIDELINES_AND_REGULATIONS_OF_THE_ACADEMY,
        label: 'Hướng dẫn, quy định nội bộ của Học viện',
    },
    {
        value: $Enums.DocumentType.IN_THE_FACULTY_HANDBOOK,
        label: 'Sổ tay giảng viên',
    },
]

export {
    DEFAULT_PAGINATE_SIZE,
    MAX_INPUT_LENGTH,
    MAX_TEXTAREA_LENGTH,
    API_BASE_URL,
    DOCUMENT_TYPE,
    API_MODEL_BASE_URL,
}
