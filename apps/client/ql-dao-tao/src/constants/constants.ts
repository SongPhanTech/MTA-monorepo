import { env } from '@/env'

const DEFAULT_PAGINATE_SIZE = 10
const MAX_INPUT_LENGTH = 255
const MAX_TEXTAREA_LENGTH = 1000
const API_BASE_URL = env.NEXT_PUBLIC_API_BASE_URL
const TRAINING_COURSE_STATUS = {
    "ACTIVE": "Đang hoạt động",
    "COMPLETED": "Hoàn thành",
    "SUSPEND": "Tạm dừng",
    "CANCEL": "Hủy bỏ"
}

const GENDER_MEAN = {
    "Male": "Nam",
    "Female": "Nữ",
}

const GENDER_LIST = [
    {
        name: "Nam",
        id: "Male",
    },
    {
        name: "Nữ",
        id: "Female",
    }
]
export {
    DEFAULT_PAGINATE_SIZE,
    MAX_INPUT_LENGTH,
    MAX_TEXTAREA_LENGTH,
    API_BASE_URL,
    TRAINING_COURSE_STATUS,
    GENDER_MEAN,
    GENDER_LIST
}
