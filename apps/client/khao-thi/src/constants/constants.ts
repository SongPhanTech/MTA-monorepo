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
    { label: 'Ban tư vấn', value: $Enums.EvaluationMemberRole.ADVISORY_BOARD },
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

const getStatusEvaluation = (status: $Enums.EvaluationCriterionStatus) => {
    switch (status) {
        case $Enums.EvaluationCriterionStatus.PENDING:
            return {
                color: 'yellow',
                label: 'Chưa nộp',
            }
        case $Enums.EvaluationCriterionStatus.SUBMITTED:
            return {
                color: 'blue',
                label: 'Đã nộp',
            }
        case $Enums.EvaluationCriterionStatus.REVISION:
            return {
                color: 'orange',
                label: 'Yêu cầu sửa đổi',
            }
        case $Enums.EvaluationCriterionStatus.APPROVED:
            return {
                color: 'green',
                label: 'Đã duyệt',
            }
        case $Enums.EvaluationCriterionStatus.COMPLETED:
            return {
                color: 'purple',
                label: 'Hoàn thành',
            }
    }
}

export {
    DEFAULT_PAGINATE_SIZE,
    MAX_INPUT_LENGTH,
    MAX_TEXTAREA_LENGTH,
    API_MODEL_BASE_URL,
    EVALUATION_MEMBER_ROLE,
    SUBJECT_OBJECT,
    getStatusEvaluation,
}
