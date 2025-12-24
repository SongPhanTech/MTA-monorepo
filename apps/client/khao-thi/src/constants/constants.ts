import { $Enums } from '@workspace/db'

const DEFAULT_PAGINATE_SIZE = 10
const MAX_INPUT_LENGTH = 255
const MAX_TEXTAREA_LENGTH = 1000

const EVALUATION_MEMBER_ROLE = [
    { label: 'Chủ tịch hội đồng', value: $Enums.EvaluationMemberRole.CHAIRMAN },
    { label: 'Phó chủ tịch', value: $Enums.EvaluationMemberRole.VICE_PRESIDENT },
    { label: 'Trưởng ban thư ký', value: $Enums.EvaluationMemberRole.HEAD_SECRETARY },
    { label: 'Thư ký', value: $Enums.EvaluationMemberRole.SECRETARY },
    { label: 'Uỷ viên', value: $Enums.EvaluationMemberRole.MEMBER },
    { label: 'Ban tư vấn', value: $Enums.EvaluationMemberRole.ADVISORY_BOARD },
    { label: 'Trướng nhóm chuyên trách', value: $Enums.EvaluationMemberRole.HEAD_SPECIALIZED },
    { label: 'Nhóm chuyên trách', value: $Enums.EvaluationMemberRole.SPECIALIZED },
]

const EVALUATION_CRITERION_STATUS_OPTIONS = [
    { value: $Enums.EvaluationCriterionStatus.PENDING, label: 'Chưa nộp' },
    { value: $Enums.EvaluationCriterionStatus.SUBMITTED, label: 'Đã nộp' },
    { value: $Enums.EvaluationCriterionStatus.REVISION, label: 'Yêu cầu sửa đổi' },
    {
        value: $Enums.EvaluationCriterionStatus.APPROVED,
        label: 'Đã duyệt',
    },
    { value: $Enums.EvaluationCriterionStatus.COMPLETED, label: 'Hoàn thành' },
]

const DEADLINE_OPTIONS = [
    { value: 'overdue', label: 'Quá hạn' },
    { value: 'near', label: 'Sắp quá hạn' },
]

const STANDARD_CATALOG_TYPE_OPTIONS = [
    { value: $Enums.StandardCatalogType.PROGRAM, label: 'Chương trình đào tạo' },
    { value: $Enums.StandardCatalogType.ASSET, label: 'Cơ sở vật chất' },
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

const getStatusConfig = (status: $Enums.EvaluationStatus) => {
    switch (status) {
        case $Enums.EvaluationStatus.LOCK:
            return { color: 'default', text: 'Khoá' }
        case $Enums.EvaluationStatus.PENDING:
            return { color: 'warning', text: 'Chưa nộp' }
        case $Enums.EvaluationStatus.SUBMITTED:
            return { color: 'processing', text: 'Đã nộp' }
        case $Enums.EvaluationStatus.REVISION:
            return {
                color: 'error',
                text: 'Yêu cầu chỉnh sửa',
            }
        case $Enums.EvaluationStatus.APPROVED:
            return { color: 'success', text: 'Đã duyệt' }
        case $Enums.EvaluationStatus.COMPLETED:
            return { color: 'success', text: 'Hoàn thành' }
        default:
            return { color: 'default', text: 'Không xác định' }
    }
}

const EVALUATION_PERIOD_STATUS_LABELS: Record<string, { label: string; color: string }> = {
    [$Enums.EvaluationPeriodStatus.COUNCIL_ESTABLISHED]: {
        label: 'Thành lập hội đồng',
        color: 'geekblue',
    },
    [$Enums.EvaluationPeriodStatus.ASSIGNMENT]: {
        label: 'Phân công đánh giá',
        color: 'volcano',
    },
    [$Enums.EvaluationPeriodStatus.ANALYSIS_WRITING]: {
        label: 'Viết phiếu phân tích',
        color: 'orange',
    },
    [$Enums.EvaluationPeriodStatus.SECRETARY_REVIEW]: {
        label: 'Xét duyệt ban tư vấn',
        color: 'purple',
    },
    [$Enums.EvaluationPeriodStatus.DIRECTOR_REVIEW]: {
        label: 'Xét duyệt trưởng ban thư ký',
        color: 'magenta',
    },
    [$Enums.EvaluationPeriodStatus.EVALUATION_WRITING]: {
        label: 'Viết phiếu đánh giá',
        color: 'cyan',
    },
    [$Enums.EvaluationPeriodStatus.CROSS_REVIEW_ASSIGNMENT]: {
        label: 'Phân công phản biện',
        color: 'gold',
    },
    [$Enums.EvaluationPeriodStatus.CROSS_REVIEW]: {
        label: 'Phản biện chéo',
        color: 'lime',
    },
    [$Enums.EvaluationPeriodStatus.CONSOLIDATION]: {
        label: 'Tổng hợp phiếu đánh giá',
        color: 'green',
    },
    [$Enums.EvaluationPeriodStatus.COUNCIL_APPROVAL]: {
        label: 'Xét duyệt cuối cùng',
        color: 'red',
    },
    [$Enums.EvaluationPeriodStatus.COMPLETED]: {
        label: 'Hoàn thành',
        color: 'success',
    },
}

export {
    DEFAULT_PAGINATE_SIZE,
    MAX_INPUT_LENGTH,
    MAX_TEXTAREA_LENGTH,
    EVALUATION_MEMBER_ROLE,
    SUBJECT_OBJECT,
    getStatusEvaluation,
    getStatusConfig,
    EVALUATION_PERIOD_STATUS_LABELS,
    EVALUATION_CRITERION_STATUS_OPTIONS,
    DEADLINE_OPTIONS,
    STANDARD_CATALOG_TYPE_OPTIONS,
}
