export const EXPORT_MAP = {
  // ===== DỮ LIỆU GỐC =====
  "du-lieu-goc-DM_DonVi": {
    sheet: "DM_DonVi",
    columns: {
      Id: "Id",
      sMa: "Mã",
      sTen: "Tên",
      sTenVietTat: "Tên viết tắt",
      iCapDonVi: "Cấp đơn vị",
      iLoaiDonVi: "Loại đơn vị",
      bActive: "Hoạt động",
    },
  },

  "du-lieu-goc-Subject": {
    sheet: "Subject",
    columns: {
      id: "Id",
      name: "Tên môn học",
      donViId: "Đơn vị",
      active: "Hoạt động",
    },
  },

  "du-lieu-goc-SubjectVersion": {
    sheet: "SubjectVersion",
    columns: {
      id: "Id",
      name: "Tên phiên bản",
      semesterName: "Học kỳ",
      subjectId: "Môn học",
      donViId: "Đơn vị",
      active: "Hoạt động",
    },
  },

  // ===== HỌC KỲ – NĂM HỌC =====
  "du-lieu-thay-doi-SchoolYear": {
    sheet: "SchoolYear",
    columns: {
      id: "Id",
      name: "Tên năm học",
      startDate: "Ngày bắt đầu",
      endDate: "Ngày kết thúc",
      active: "Hoạt động",
    },
  },

  "du-lieu-thay-doi-Semester": {
    sheet: "Semester",
    columns: {
      id: "Id",
      name: "Tên học kỳ",
      semesterType: "Loại học kỳ",
      schoolYearId: "Năm học",
      startDate: "Ngày bắt đầu",
      endDate: "Ngày kết thúc",
      active: "Hoạt động",
    },
  },

  // ===== CƠ SỞ – PHÒNG =====
  "du-lieu-thay-doi-TrainingLocation": {
    sheet: "TrainingLocation",
    columns: {
      id: "Id",
      name: "Tên địa điểm",
      dM_Tinh_NewId: "Tỉnh",
      active: "Hoạt động",
    },
  },

  "du-lieu-thay-doi-Building": {
    sheet: "Building",
    columns: {
      id: "Id",
      name: "Tên tòa nhà",
      floor: "Số tầng",
      trainingLocationId: "Địa điểm",
      active: "Hoạt động",
    },
  },

  "du-lieu-thay-doi-Room": {
    sheet: "Room",
    columns: {
      id: "Id",
      name: "Tên phòng",
      capacity: "Sức chứa",
      examCapacity: "Sức chứa thi",
      buildingId: "Tòa nhà",
      active: "Hoạt động",
    },
  },

  // ===== KỲ THI =====
  "du-lieu-thay-doi-Exam": {
    sheet: "Exam",
    columns: {
      id: "Id",
      subjectVersionId: "Môn học",
      semesterId: "Học kỳ",
      status: "Trạng thái",
      duration: "Thời gian (phút)",
      session: "Số ca",
    },
  },

  "du-lieu-thay-doi-ExamRoom": {
    sheet: "ExamRoom",
    columns: {
      id: "Id",
      examId: "Kỳ thi",
      roomId: "Phòng",
      capacity: "Sức chứa",
    },
  },

  "du-lieu-thay-doi-ExamList": {
    sheet: "ExamList",
    columns: {
      id: "Id",
      examRoomId: "Phòng thi",
      start: "SBD bắt đầu",
      end: "SBD kết thúc",
      createdExamCode: "Đã đánh phách",
    },
  },
} as const
export type ExportKey = keyof typeof EXPORT_MAP

export const SYNC_ITEM_TO_SHEET: Record<string, string> = {
  "du-lieu-goc-DM_DonVi": "DM_DonVi",
  "du-lieu-goc-Subject": "Subject",

  "du-lieu-thay-doi-Semester": "Semester",
  "du-lieu-thay-doi-Exam": "Exam",
  "du-lieu-thay-doi-ExamRoom": "Exam-room",
  "du-lieu-thay-doi-ExamList": "Exam-list",
  "du-lieu-thay-doi-Room": "Room",
  "du-lieu-thay-doi-Building": "Building",
  "du-lieu-thay-doi-TrainingLocation": "TrainingLocation",
}
