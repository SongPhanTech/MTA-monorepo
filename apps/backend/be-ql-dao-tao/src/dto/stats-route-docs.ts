/** Mô tả OpenAPI (summary + description) theo path — dùng trong stats.ts */
export const STATS_ROUTE_DOCS: Record<string, { summary: string; description: string }> = {
  "/student-distribution-by-training-object-type": {
    summary: "Phân bổ SV theo hệ đào tạo",
    description: `Thống kê số học viên theo từng hệ đào tạo (Ban Giám đốc).

**Bảng dữ liệu nguồn:** TrainingObjectType, Student.

**Tham số:** preview — dữ liệu mẫu khi true.`,
  },
  "/student-distribution-by-training-level": {
    summary: "Phân bổ SV theo bậc đào tạo",
    description: `Thống kê số học viên theo bậc đào tạo.

**Bảng dữ liệu nguồn:** TrainingLevel, Student.

**Tham số:** preview.`,
  },
  "/student-distribution-by-training-course": {
    summary: "Phân bổ SV theo khóa học",
    description: `Thống kê số học viên theo khóa / niên khóa.

**Bảng dữ liệu nguồn:** TrainingCourse, Student.

**Tham số:** preview.`,
  },
  "/average-entry-score-by-course": {
    summary: "Điểm đầu vào TB theo khóa",
    description: `Điểm trung bình đầu vào theo khóa học.

**Bảng dữ liệu nguồn:** Student, TrainingCourse.

**Tham số:** preview.`,
  },
  "/average-gpa-by-course": {
    summary: "GPA trung bình theo khóa",
    description: `GPA trung bình theo khóa học.

**Bảng dữ liệu nguồn:** Student, TrainingCourse.

**Tham số:** preview.`,
  },
  "/graduation-rate-by-course": {
    summary: "Tỷ lệ tốt nghiệp theo khóa",
    description: `Tỷ lệ tốt nghiệp theo khóa.

**Bảng dữ liệu nguồn:** Student, TrainingCourse.

**Tham số:** preview.`,
  },
  "/academic-performance-by-year": {
    summary: "Thành tích học tập theo năm",
    description: `Phân loại thành tích học tập theo năm học.

**Bảng dữ liệu nguồn:** Student, StudentSubjectScore.

**Tham số:** preview.`,
  },
  "/kpi-cards": {
    summary: "Thẻ KPI tổng quan",
    description: `Các chỉ số KPI tổng hợp cho dashboard.

**Bảng dữ liệu nguồn:** Student, SubjectClass, TrainingCourse (tùy metric).

**Tham số:** preview.`,
  },
  "/student-distribution-by-province": {
    summary: "Phân bổ SV theo tỉnh/thành",
    description: `Số học viên theo tỉnh/thành phố.

**Bảng dữ liệu nguồn:** Student, UserProfile, Province.

**Tham số:** preview.`,
  },
  "/student-distribution-by-training-object-type-filtered": {
    summary: "Phân bổ SV theo hệ (lọc đơn vị)",
    description: `Phân bổ theo hệ đào tạo, lọc theo đơn vị quản lý.

**Bảng dữ liệu nguồn:** TrainingObjectType, Student, ManagementOrganization.

**Tham số:** preview, managementOrganizationId.`,
  },
  "/student-distribution-by-training-level-filtered": {
    summary: "Phân bổ SV theo bậc (lọc đơn vị)",
    description: `Phân bổ theo bậc đào tạo, lọc theo đơn vị quản lý.

**Bảng dữ liệu nguồn:** TrainingLevel, Student, ManagementOrganization.

**Tham số:** preview, managementOrganizationId.`,
  },
  "/student-distribution-by-training-course-filtered": {
    summary: "Phân bổ SV theo khóa (lọc đơn vị)",
    description: `Phân bổ theo khóa, lọc theo đơn vị quản lý.

**Bảng dữ liệu nguồn:** TrainingCourse, Student, ManagementOrganization.

**Tham số:** preview, managementOrganizationId.`,
  },
  "/average-entry-score-by-course-filtered": {
    summary: "Điểm đầu vào TB (lọc đơn vị)",
    description: `Điểm đầu vào trung bình theo khóa, lọc đơn vị.

**Bảng dữ liệu nguồn:** Student, TrainingCourse, ManagementOrganization.

**Tham số:** preview, managementOrganizationId.`,
  },
  "/average-gpa-by-course-filtered": {
    summary: "GPA TB theo khóa (lọc đơn vị)",
    description: `GPA trung bình theo khóa, lọc đơn vị.

**Bảng dữ liệu nguồn:** Student, TrainingCourse, ManagementOrganization.

**Tham số:** preview, managementOrganizationId.`,
  },
  "/graduation-rate-by-course-filtered": {
    summary: "Tỷ lệ TN theo khóa (lọc đơn vị)",
    description: `Tỷ lệ tốt nghiệp theo khóa, lọc đơn vị.

**Bảng dữ liệu nguồn:** Student, TrainingCourse, ManagementOrganization.

**Tham số:** preview, managementOrganizationId.`,
  },
  "/academic-performance-by-year-filtered": {
    summary: "Thành tích HT theo năm (lọc ĐV)",
    description: `Thành tích học tập theo năm, lọc đơn vị quản lý.

**Bảng dữ liệu nguồn:** Student, StudentSubjectScore, ManagementOrganization.

**Tham số:** preview, managementOrganizationId.`,
  },
  "/student-distribution-by-province-filtered": {
    summary: "Phân bổ SV theo tỉnh (lọc ĐV)",
    description: `Phân bổ theo tỉnh/thành, lọc đơn vị quản lý.

**Bảng dữ liệu nguồn:** Student, UserProfile, Province, ManagementOrganization.

**Tham số:** preview, managementOrganizationId.`,
  },
  "/students-of-interest": {
    summary: "Học viên cần quan tâm",
    description: `Danh sách học viên có nguy cơ học tập (cảnh báo, nợ tín chỉ, GPA thấp).

**Bảng dữ liệu nguồn:** Student, StudentSubjectScore, UserProfile.

**Tham số:** preview, warningLevel, debtCredits, gpaThreshold.`,
  },
  "/average-gpa-by-fixed-class": {
    summary: "GPA TB theo lớp niên chế",
    description: `GPA trung bình theo lớp quản lý (niên chế).

**Bảng dữ liệu nguồn:** FixedClass, Student.

**Tham số:** preview.`,
  },
  "/average-gpa-by-training-major": {
    summary: "GPA TB theo ngành",
    description: `GPA trung bình theo ngành đào tạo.

**Bảng dữ liệu nguồn:** TrainingMajor, Student, Curriculum.

**Tham số:** preview.`,
  },
  "/subject-pass-fail-rate": {
    summary: "Tỷ lệ đậu/rớt môn",
    description: `Tỷ lệ đậu / trượt theo học phần.

**Bảng dữ liệu nguồn:** StudentSubjectScore, SubjectClass, SubjectVersion.

**Tham số:** preview.`,
  },
  "/curriculum-statistics": {
    summary: "Thống kê chương trình đào tạo",
    description: `Số liệu tổng hợp về CTĐT / phiên bản CTĐT.

**Bảng dữ liệu nguồn:** Curriculum, CurriculumVersion, TrainingBlockSubject.

**Tham số:** preview.`,
  },
  "/subject-class-statistics": {
    summary: "Thống kê lớp học phần",
    description: `Thống kê lớp học phần theo học kỳ.

**Bảng dữ liệu nguồn:** SubjectClass, Semester, StudentSubjectScore.

**Tham số:** preview, semesterId.`,
  },
  "/lecturer-workload": {
    summary: "Khối lượng giảng dạy GV",
    description: `Thống kê giờ / lớp giảng viên phụ trách.

**Bảng dữ liệu nguồn:** Lecturer, SubjectClass, ClassSchedule.

**Tham số:** preview.`,
  },
  "/graduation-ranking-statistics": {
    summary: "Xếp hạng tốt nghiệp",
    description: `Thống kê xếp loại / xếp hạng tốt nghiệp.

**Bảng dữ liệu nguồn:** Student, GraduationApplication.

**Tham số:** preview.`,
  },
  "/students-for-academic-action": {
    summary: "SV chờ xử lý học vụ",
    description: `Học viên cần xử lý học vụ (cảnh báo, buộc thôi học, …).

**Bảng dữ liệu nguồn:** Student, AcademicAction.

**Tham số:** preview.`,
  },
  "/exam-participants-by-semester": {
    summary: "Số SV thi theo học kỳ",
    description: `Số lượng học viên tham gia thi theo học kỳ.

**Bảng dữ liệu nguồn:** Exam, ExamSession, StudentSubjectScore, Semester.

**Tham số:** preview, semesterId.`,
  },
  "/average-exam-score-trend": {
    summary: "Xu hướng điểm thi TB",
    description: `Xu hướng điểm thi trung bình theo thời gian / học kỳ.

**Bảng dữ liệu nguồn:** StudentSubjectScore, Exam.

**Tham số:** preview.`,
  },
  "/question-statistics": {
    summary: "Thống kê câu hỏi đề thi",
    description: `Thống kê câu hỏi trong ngân hàng đề.

**Bảng dữ liệu nguồn:** Question, ExamQuestion.

**Tham số:** preview.`,
  },
  "/highest-incorrect-answer-rate-questions": {
    summary: "Câu hỏi sai nhiều nhất",
    description: `Câu hỏi có tỷ lệ trả lời sai cao nhất.

**Bảng dữ liệu nguồn:** Question, ExamAnswer.

**Tham số:** preview.`,
  },
  "/most-used-questions": {
    summary: "Câu hỏi dùng nhiều nhất",
    description: `Câu hỏi được sử dụng nhiều nhất trong đề thi.

**Bảng dữ liệu nguồn:** Question, ExamQuestion.

**Tham số:** preview.`,
  },
  "/demographics": {
    summary: "Thống kê nhân khẩu học",
    description: `Phân bổ giới tính, độ tuổi, vùng miền học viên.

**Bảng dữ liệu nguồn:** Student, UserProfile.

**Tham số:** preview.`,
  },
  "/enrollment-trend": {
    summary: "Xu hướng tuyển sinh / nhập học",
    description: `Xu hướng số lượng nhập học theo thời gian.

**Bảng dữ liệu nguồn:** Student, TrainingCourse.

**Tham số:** preview.`,
  },
  "/Admission-statistics-by-major": {
    summary: "Tuyển sinh theo ngành",
    description: `Thống kê tuyển sinh theo ngành đào tạo.

**Bảng dữ liệu nguồn:** TrainingMajor, Student, TrainingCourse.

**Tham số:** preview.`,
  },
  "/statistics-of-records-by-date": {
    summary: "Hồ sơ theo ngày",
    description: `Số hồ sơ / bản ghi tạo theo ngày.

**Bảng dữ liệu nguồn:** (theo loại hồ sơ trong handler).

**Tham số:** preview.`,
  },
  "/summary-admission-statistics": {
    summary: "Tổng hợp tuyển sinh",
    description: `Bảng tổng hợp chỉ tiêu — trúng tuyển — nhập học.

**Bảng dữ liệu nguồn:** Student, TrainingLevel, TrainingObjectType.

**Tham số:** preview.`,
  },
  "/science-technology-overview": {
    summary: "Tổng quan KH&CN",
    description: `Tổng quan hoạt động khoa học công nghệ.

**Bảng dữ liệu nguồn:** ScienceProject, Contract, Article (tùy metric).

**Tham số:** preview.`,
  },
  "/contract-statistics-by-year": {
    summary: "Hợp đồng KH theo năm",
    description: `Thống kê hợp đồng nghiên cứu theo năm.

**Bảng dữ liệu nguồn:** Contract.

**Tham số:** preview.`,
  },
  "/project-statistics-by-year": {
    summary: "Đề tài KH theo năm",
    description: `Thống kê đề tài / dự án theo năm.

**Bảng dữ liệu nguồn:** ScienceProject.

**Tham số:** preview.`,
  },
  "/innovations-statistics-by-year": {
    summary: "Sáng kiến theo năm",
    description: `Thống kê sáng kiến, cải tiến theo năm.

**Bảng dữ liệu nguồn:** Innovation.

**Tham số:** preview.`,
  },
  "/articles-statistics-by-year": {
    summary: "Bài báo KH theo năm",
    description: `Thống kê bài báo khoa học theo năm.

**Bảng dữ liệu nguồn:** Article.

**Tham số:** preview.`,
  },
  "/final-exam-info": {
    summary: "Thông tin thi cuối kỳ",
    description: `Thống kê lịch / quy mô thi cuối kỳ.

**Bảng dữ liệu nguồn:** Exam, SubjectClass, Semester.

**Tham số:** preview.`,
  },
  "/student-count-by-academic-results": {
    summary: "Số SV theo học lực",
    description: `Số học viên theo xếp loại học lực.

**Bảng dữ liệu nguồn:** Student, StudentSubjectScore.

**Tham số:** preview.`,
  },
  "/subject-pass-fail-rates": {
    summary: "Tỷ lệ đậu/rớt (nhiều môn)",
    description: `Tỷ lệ đậu/rớt theo danh sách học phần.

**Bảng dữ liệu nguồn:** StudentSubjectScore, SubjectVersion.

**Tham số:** preview.`,
  },
  "/subjects-high-fail-rates": {
    summary: "Môn tỷ lệ trượt cao",
    description: `Học phần có tỷ lệ trượt cao nhất.

**Bảng dữ liệu nguồn:** StudentSubjectScore, SubjectVersion.

**Tham số:** preview.`,
  },
  "/subjects-high-absent-students": {
    summary: "Môn vắng thi nhiều",
    description: `Học phần có nhiều học viên vắng thi.

**Bảng dữ liệu nguồn:** StudentSubjectScore, Exam.

**Tham số:** preview.`,
  },
  "/statistics-exam-bank-not-yet": {
    summary: "Ngân hàng đề chưa có",
    description: `Thống kê học phần chưa có ngân hàng đề thi.

**Bảng dữ liệu nguồn:** SubjectVersion, ExamBank.

**Tham số:** preview.`,
  },
  "/late-grade-subjects": {
    summary: "Môn nhập điểm trễ",
    description: `Học phần nhập điểm quá hạn.

**Bảng dữ liệu nguồn:** SubjectClass, StudentSubjectScore.

**Tham số:** preview.`,
  },
  "/exam-bank-update": {
    summary: "Ngân hàng đề đã cập nhật",
    description: `Thống kê ngân hàng đề đã bổ sung / cập nhật.

**Bảng dữ liệu nguồn:** ExamBank, SubjectVersion.

**Tham số:** preview.`,
  },
  "/language-standard-progress": {
    summary: "Tiến độ chuẩn ngoại ngữ",
    description: `Tỷ lệ đạt / chưa đạt chuẩn ngoại ngữ theo tiến trình.

**Bảng dữ liệu nguồn:** Student, LanguageStandard.

**Tham số:** preview.`,
  },
  "/admission-statistics": {
    summary: "Thống kê tuyển sinh chi tiết",
    description: `Bảng tuyển sinh theo năm, đối tượng, bậc (chỉ tiêu, trúng tuyển, nhập học).

**Bảng dữ liệu nguồn:** Student, TrainingLevel, TrainingObjectType, TrainingCourse.

**Tham số:** preview, labels, trainingLevelNames, includeEmpty.`,
  },
  "/retest-rates": {
    summary: "Tỷ lệ thi lại",
    description: `Tỷ lệ học viên thi lại theo học phần / khóa.

**Bảng dữ liệu nguồn:** StudentSubjectScore, SubjectClass.

**Tham số:** preview và bộ lọc trong body (xem schema).`,
  },
  "/relearn-rates": {
    summary: "Tỷ lệ học lại",
    description: `Tỷ lệ học viên học lại môn.

**Bảng dữ liệu nguồn:** StudentSubjectScore, ReSubjectClass.

**Tham số:** preview và bộ lọc trong body (xem schema).`,
  },
}
