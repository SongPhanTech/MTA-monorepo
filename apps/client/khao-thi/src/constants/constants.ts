import { $Enums } from '@workspace/db'
import { env } from '@/env'

const DEFAULT_PAGINATE_SIZE = 10
const MAX_INPUT_LENGTH = 255
const MAX_TEXTAREA_LENGTH = 1000
const API_MODEL_BASE_URL = env.NEXT_PUBLIC_API_MODEL_BASE_URL

const EVALUATION_MEMBER_ROLE = [
    { label: 'Chủ tịch hội đồng', value: $Enums.EvaluationMemberRole.CHAIRMAN },
    { label: 'Phó chủ tịch', value: $Enums.EvaluationMemberRole.VICE_PRESIDENT },
    { label: 'Trưởng ban thư ký', value: $Enums.EvaluationMemberRole.HEAD_SECRETARY },
    { label: 'Thư ký', value: $Enums.EvaluationMemberRole.SECRETARY },
    { label: 'Uỷ viên', value: $Enums.EvaluationMemberRole.MEMBER },
]
const EVALUATION_SECRETARY_MEMBER_ROLE = [
    { label: 'Trưởng ban thư ký', value: $Enums.EvaluationSecretaryMemberRole.HEAD_SECRETARY },
    { label: 'Uỷ viên', value: $Enums.EvaluationSecretaryMemberRole.MEMBER },
]
const SUBJECT_OBJECT = [
    {
        value: $Enums.SurveyObject.MILITARY_STUDENT,
        label: 'Sinh viên dân sự',
    },
    {
        value: $Enums.SurveyObject.CIVILIAN_STUDENT,
        label: 'Học viên quân sự',
    },
    {
        value: $Enums.SurveyObject.LECTURER,
        label: 'Giảng viên',
    },
    {
        value: $Enums.SurveyObject.STAFF,
        label: 'Cán bộ nhân viên',
    },
]

export {
    DEFAULT_PAGINATE_SIZE,
    MAX_INPUT_LENGTH,
    MAX_TEXTAREA_LENGTH,
    API_MODEL_BASE_URL,
    EVALUATION_MEMBER_ROLE,
    SUBJECT_OBJECT,
    EVALUATION_SECRETARY_MEMBER_ROLE,
}
