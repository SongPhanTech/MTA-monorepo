import { env } from '@/env'

const DEFAULT_PAGINATE_SIZE = 10
const MAX_INPUT_LENGTH = 255
const MAX_TEXTAREA_LENGTH = 1000
const API_BASE_URL = env.NEXT_PUBLIC_API_BASE_URL
const TRAINING_COURSE_STATUS = {
    ACTIVE: 'Đang hoạt động',
    COMPLETED: 'Hoàn thành',
    SUSPEND: 'Tạm dừng',
    CANCEL: 'Hủy bỏ',
}
const SUBJECT_EQUIVALENT_TYPE = {
    // loại môn học tương đương
    NONE: 'Không tương đương',
    OneByOne: 'Tương đương 1-1',
    TwoByOne: 'Hai môn tương đương 1',
    ThreeByOne: 'Ba môn tương đương 1',
    FourByOne: 'Bốn môn tương đương 1',
    OneByTwo: 'Một môn tương đương hai',
    OneByThree: 'Một môn tương đương ba',
}

const GENDER_MEAN = {
    Male: 'Nam',
    Female: 'Nữ',
}

const GENDER_LIST = [
    {
        name: 'Nam',
        id: 'Male',
    },
    {
        name: 'Nữ',
        id: 'Female',
    },
]

const CTDT_STATUS = {
    ACTIVE: { label: 'Đang hoạt động', color: 'green' },
    INACTIVATED: { label: 'Không hoạt động', color: 'red' },
}

const KHOA_HL_STATUS = {
    ACTIVE: { label: 'Đang hoạt động', color: 'green' },
    COMPLETED: { label: 'Hoàn thành', color: 'blue' },
    SUSPEND: { label: 'Tạm dừng', color: 'orange' },
    CANCEL: { label: 'Hủy bỏ', color: 'red' },
}
export {
    DEFAULT_PAGINATE_SIZE,
    MAX_INPUT_LENGTH,
    MAX_TEXTAREA_LENGTH,
    API_BASE_URL,
    TRAINING_COURSE_STATUS,
    GENDER_MEAN,
    GENDER_LIST,
    SUBJECT_EQUIVALENT_TYPE,
    CTDT_STATUS,
    KHOA_HL_STATUS,
}
