import { $Enums } from "@workspace/db"

const DEFAULT_PAGINATE_SIZE = 10
const MAX_INPUT_LENGTH = 255
const MAX_TEXTAREA_LENGTH = 1000
const TRAINING_COURSE_STATUS = {
  ACTIVE: "Đang hoạt động",
  COMPLETED: "Hoàn thành",
  SUSPEND: "Tạm dừng",
  CANCEL: "Hủy bỏ",
}
const SUBJECT_EQUIVALENT_TYPE = {
  // loại môn học tương đương
  NONE: "Không tương đương",
  OneByOne: "Tương đương 1-1",
  TwoByOne: "Hai môn tương đương 1",
  ThreeByOne: "Ba môn tương đương 1",
  FourByOne: "Bốn môn tương đương 1",
  OneByTwo: "Một môn tương đương hai",
  OneByThree: "Một môn tương đương ba",
}

const GENDER_MEAN = {
  Male: "Nam",
  Female: "Nữ",
}

const GENDER_MEAN_NEW = {
  0: "Nam",
  1: "Nữ",
}

const GENDER_LIST = [
  {
    name: "Nam",
    id: "Male",
  },
  {
    name: "Nữ",
    id: "Female",
  },
]

export const RELATIONSHIP_TYPE = {
  FATHER: "Cha",
  MOTHER: "Mẹ",
  OLDER_BROTHER: "Anh trai",
  OLDER_SISTER: "Chị gái",
  YOUNGER_BROTHER: "Em trai",
  YOUNGER_SISTER: "Em gái",
  MARRIER: "Vợ/Chồng",
  FATHER_IN_LOW: "Bố vợ/chồng",
  MOTHER_IN_LOW: "Mẹ vợ/chồng",
  SON: "Con trai",
  DAUGHTER: "Con gái",
} as const

const CTDT_STATUS = {
  ACTIVE: { label: "Đang hoạt động", color: "green" },
  INACTIVATED: { label: "Không hoạt động", color: "red" },
}

const KHOA_HL_STATUS = {
  ACTIVE: { label: "Đang hoạt động", color: "green" },
  COMPLETED: { label: "Hoàn thành", color: "blue" },
  SUSPEND: { label: "Tạm dừng", color: "orange" },
  CANCEL: { label: "Hủy bỏ", color: "red" },
}
const LOAI_MON_HOC_CTDT = {
  None: "Không xác định",
  Mandatory: "Bắt buộc",
  Optional: "Tự chọn",
  Elective: "Tự chọn tự do",
}
const TRANG_THAI_HOC_VIEN = {
  ENROLLED: {
    label: "Đang học",
    color: "green",
  },
  GRADUATED: {
    label: "Tốt nghiệp",
    color: "blue",
  },
  DEFERRED_STUDY: {
    label: "Bảo lưu",
    color: "gold",
  },
  SUSPENDED_STUDY: {
    label: "Tạm ngưng học",
    color: "orange",
  },
  WITHDRAWN: {
    label: "Thôi học",
    color: "red",
  },
  TRANSFERRED: {
    label: "Chuyển trường",
    color: "purple",
  },
  PENDING_GRADUATION_REVIEW: {
    label: "Chờ xét tốt nghiệp",
    color: "cyan",
  },
  ACADEMIC_SUSPENSION: {
    label: "Đình chỉ",
    color: "volcano",
  },
}

const FIXED_CLASS_STUDENT_STATUS = {
  ENROLLED: { label: "Đang học", color: "success" },
  GRADUATED: { label: "Đã tốt nghiệp", color: "blue" },
  DEFERRED_STUDY: { label: "Bảo lưu", color: "orange" },
  SUSPENDED_STUDY: { label: "Tạm ngưng học", color: "warning" },
  WITHDRAWN: { label: "Thôi học", color: "error" },
  TRANSFERRED: { label: "Chuyển trường", color: "purple" },
  PENDING_GRADUATION_REVIEW: { label: "Chờ xét tốt nghiệp", color: "cyan" },
  ACADEMIC_SUSPENSION: { label: "Đình chỉ học", color: "red" },
} as const

const STUDENT_STATUS_OPTIONS = [
  { value: $Enums.StudentStatus.ENROLLED, label: "Đang theo học" },
  { value: $Enums.StudentStatus.GRADUATED, label: "Đã tốt nghiệp" },
  { value: $Enums.StudentStatus.DEFERRED_STUDY, label: "Bảo lưu" },
  {
    value: $Enums.StudentStatus.SUSPENDED_STUDY,
    label: "Tạm ngưng học",
  },
  { value: $Enums.StudentStatus.WITHDRAWN, label: "Thôi học" },
  {
    value: $Enums.StudentStatus.TRANSFERRED,
    label: "Chuyển trường",
  },
  {
    value: $Enums.StudentStatus.PENDING_GRADUATION_REVIEW,
    label: "Chờ xét tốt nghiệp",
  },
  {
    value: $Enums.StudentStatus.ACADEMIC_SUSPENSION,
    label: "Đình chỉ học",
  },
  {
    value: $Enums.StudentStatus.REPEATED,
    label: "Lưu ban",
  },
]

const SUBJECT_CLASS_SCHEDULE_TYPE = {
  MORNING: "Sáng",
  AFTERNOON: "Chiều",
  EVENING: "Tối",
}

const CUSTOM_VI_LOCALE = {
  lang: {
    locale: "vi_VN",
    placeholder: "Chọn ngày",
    rangePlaceholder: ["Từ ngày", "Đến ngày"] as [string, string],
    today: "Hôm nay",
    now: "Bây giờ",
    backToToday: "Về hôm nay",
    ok: "Đồng ý",
    clear: "Xóa",
    month: "Tháng",
    year: "Năm",
    timeSelect: "Chọn giờ",
    dateSelect: "Chọn ngày",
    monthSelect: "Chọn tháng",
    yearSelect: "Chọn năm",
    decadeSelect: "Chọn thập kỷ",
    yearFormat: "YYYY",
    dateFormat: "DD/MM/YYYY",
    dayFormat: "D",
    dateTimeFormat: "DD/MM/YYYY HH:mm:ss",
    monthBeforeYear: true,
    previousMonth: "Tháng trước",
    nextMonth: "Tháng sau",
    previousYear: "Năm trước",
    nextYear: "Năm sau",
    previousDecade: "Thập kỷ trước",
    nextDecade: "Thập kỷ sau",
    previousCentury: "Thế kỷ trước",
    nextCentury: "Thế kỷ sau",
  },
  timePickerLocale: {
    placeholder: "Chọn giờ",
  },
}

export {
  DEFAULT_PAGINATE_SIZE,
  MAX_INPUT_LENGTH,
  MAX_TEXTAREA_LENGTH,
  TRAINING_COURSE_STATUS,
  GENDER_MEAN,
  GENDER_LIST,
  SUBJECT_EQUIVALENT_TYPE,
  CTDT_STATUS,
  KHOA_HL_STATUS,
  LOAI_MON_HOC_CTDT,
  TRANG_THAI_HOC_VIEN,
  FIXED_CLASS_STUDENT_STATUS,
  STUDENT_STATUS_OPTIONS,
  SUBJECT_CLASS_SCHEDULE_TYPE,
  CUSTOM_VI_LOCALE,
  GENDER_MEAN_NEW,
}
