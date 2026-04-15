import { $Enums } from "@workspace/db/client"

const DEFAULT_PAGINATE_PAGE = 1
const DEFAULT_PAGINATE_SIZE = 10
const MAX_INPUT_LENGTH = 255
const MAX_TEXTAREA_LENGTH = 1000
const TRAINING_COURSE_STATUS = {
  ACTIVE: "Đang hoạt động",
  COMPLETED: "Hoàn thành",
  SUSPEND: "Tạm dừng",
  CANCEL: "Hủy bỏ",
}

const GENDER_MEAN = {
  Male: "Nam",
  Female: "Nữ",
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
  REPEATED: { label: "Lưu ban", color: "magenta" },
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
const TRAINING_OBJECT_TYPE = {
  MILITARY: "Quân sự",
  CIVILIAN: "Dân sự",
  INTERNATIONAL_MILITARY: "Quốc tế",
}

const SCORE_CONVERT_STATUS = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Không được duyệt",
  PARTIAL: "Duyệt một phần",
}

const SCORE_LINK_STATUS = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Không được duyệt",
}

const EXAMTYPECOLOR: Record<$Enums.ExamType, string> = {
  [$Enums.ExamType.OfflineWritten]: "#1677ff",
  [$Enums.ExamType.OnlineWritten]: "#722ed1",
  [$Enums.ExamType.Oral]: "#fa8c16",
  [$Enums.ExamType.Practice]: "#52c41a",
  [$Enums.ExamType.Project]: "#13c2c2",
  [$Enums.ExamType.Other]: "#8c8c8c",
}

export {
  DEFAULT_PAGINATE_PAGE,
  DEFAULT_PAGINATE_SIZE,
  MAX_INPUT_LENGTH,
  MAX_TEXTAREA_LENGTH,
  TRAINING_COURSE_STATUS,
  GENDER_MEAN,
  GENDER_LIST,
  CTDT_STATUS,
  KHOA_HL_STATUS,
  LOAI_MON_HOC_CTDT,
  TRANG_THAI_HOC_VIEN,
  FIXED_CLASS_STUDENT_STATUS,
  STUDENT_STATUS_OPTIONS,
  SUBJECT_CLASS_SCHEDULE_TYPE,
  CUSTOM_VI_LOCALE,
  TRAINING_OBJECT_TYPE,
  SCORE_CONVERT_STATUS,
  SCORE_LINK_STATUS,
  EXAMTYPECOLOR,
}

export const examBanReason = [
  "Không đủ 80% thời lượng lên lớp",
  "Không hoàn thành nội dung bắt buộc của học phần",
  "Bị điểm liệt",
  "Bị kỷ luật học đường ở mức cấm thi",
]

export const examPostponeReason = [
  "Bị ốm (có giấy chứng nhận y tế)",
  "Bị tai nạn (có giấy chứng nhận y tế)",
  "Lý do khách quan hoặc đặc biệt khác (có xác nhận của cơ quan thẩm quyền)",
]

export const examSuspendedReason = [
  "Đã bị cảnh cáo một lần nhưng vẫn tiếp tục vi phạm",
  "Mang vật dụng trái phép vào phòng thi (tài liệu, thiết bị truyền tin...)",
  "Đưa đề thi ra ngoài hoặc nhận bài giải từ ngoài vào",
  "Viết, vẽ nội dung không liên quan vào bài thi",
  "Đe dọa, gây gổ với cán bộ coi thi hoặc sinh viên/học viên khác",
  "Giả mạo chữ ký cán bộ coi thi",
  "Đánh tráo bài thi hoặc tráo đổi đề thi",
  "Đi thi hộ hoặc nhờ người khác thi hộ",
]
