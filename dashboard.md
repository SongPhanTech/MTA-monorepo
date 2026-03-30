# Dashboard

### 1. Dành cho Ban Giám đốc (BGĐ) 🎯

BGĐ cần một cái nhìn **tổng quan, chiến lược** về toàn bộ hoạt động của Học viện. Dashboard nên tập trung vào các chỉ số hiệu suất chính (KPIs).

- **Biểu đồ tròn/cột - Tỷ lệ phân bổ Sinh viên/Học viên:**
  - Phân bổ theo **Hệ đào tạo** (`TrainingObjectType`: Quân sự, Dân sự, Quốc tế).
  - Phân bổ theo **Bậc đào tạo** (`TrainingLevel`: Đại học, Thạc sĩ, Tiến sĩ).
  - Phân bổ theo **Khoá học** (`TrainingCourse`).
  - _Nguồn dữ liệu:_ `Student`, `TrainingObjectType`, `TrainingLevel`, `FixedClass`.

- **Biểu đồ đường - Xu hướng chất lượng đầu vào và đầu ra qua các năm:**
  - **Đầu vào:** Điểm trúng tuyển trung bình (`entryScore`) qua các khoá.
  - **Đầu ra:** Điểm GPA tích lũy trung bình (`cumulativeGpaBase10`) của sinh viên tốt nghiệp qua các khoá.
  - **Tỷ lệ tốt nghiệp:** % sinh viên tốt nghiệp đúng hạn, trễ hạn qua các khoá.
  - _Nguồn dữ liệu:_ `Student`, `StudentSemesterResult`, `GraduationDecision`.

- **Biểu đồ cột chồng - Thống kê kết quả học tập toàn Học viện:**
  - Số lượng sinh viên/học viên được xếp loại **Xuất sắc, Giỏi, Khá, Trung bình, Yếu** qua từng năm học.
  - _Nguồn dữ liệu:_ `StudentYearResult`, `academicRanking`.

- **Thẻ chỉ số (KPI Cards) - Các con số tổng quan:**
  - **Tổng số HV/SV** đang theo học (`Student` với `status = ENROLLED`).
  - **Tổng số Giảng viên** (`Lecturer`): Phân bổ học hàm, học vị.
  - **Tỷ lệ HV/SV trên Giảng viên**.
  - **Số lượng chương trình đào tạo** (`Curriculum` đang `active`).
  - **Tỷ lệ sinh viên bị cảnh báo học tập** (`academicWarningLevel > 0`).

- **Bản đồ - Phân bổ địa lý của sinh viên:**
  - Phân bổ sinh viên theo tỉnh/thành phố (`provinceHometownId` trong `UserProfile`).
  - _Nguồn dữ liệu:_ `UserProfile`, `DM_Tinh`.

---

### 2. Dành cho Trưởng phòng Đào tạo 📈

Đây là vai trò có nhu cầu dữ liệu **chi tiết và đa dạng nhất**, bao quát toàn bộ vòng đời của sinh viên và chương trình đào tạo.

- **Dashboard Tổng quan (Tương tự BGĐ nhưng có thể lọc theo Khoa/Viện):**
  - Tất cả các mục của BGĐ, nhưng thêm bộ lọc theo Đơn vị quản lý (`managementOrganizationId`).

- **Dashboard Quản lý Sinh viên & Học tập:**
  - **Bảng dữ liệu - Danh sách SV cần quan tâm:**
    - SV bị **cảnh báo học tập** (`academicWarningLevel` > 0).
    - SV có **số tín chỉ nợ đọng cao** (`cumulativeDebtCredits`).
    - SV có **GPA thấp** (dưới ngưỡng quy định).
    - _Nguồn dữ liệu:_ `Student`, `StudentSemesterResult`.

  - **Biểu đồ cột - Phân tích kết quả học tập theo học kỳ/năm học:**
    - Điểm GPA trung bình theo **Lớp niên chế** (`FixedClass`), **Khoá học** (`TrainingCourse`), **Ngành** (`TrainingMajor`).
    - Tỷ lệ % sinh viên qua môn/rớt môn của các học phần.
    - _Nguồn dữ liệu:_ `StudentSemesterResult`, `StudentYearResult`, `StudentSubjectScore`.

  - **Dashboard Quản lý Chương trình & Lớp học:**
    - **Thống kê CTĐT:** Số lượng CTĐT (`Curriculum`) và phiên bản (`CurriculumVersion`) đang áp dụng.
    - **Thống kê Lớp học phần:**
      - Số lượng lớp được mở trong học kỳ (`SubjectClass`).
      - Tỷ lệ lấp đầy lớp (số SV đăng ký / `maxStudent`).
      - Các lớp học phần có tỷ lệ sinh viên rớt cao.
    - **Tải giảng dạy của Giảng viên:** Số lớp, số giờ giảng của từng giảng viên (`mainLecturer`, `extraLecturerId`).
    - _Nguồn dữ liệu:_ `Curriculum`, `CurriculumVersion`, `SubjectClass`, `Lecturer`.

- **Dashboard Xét tốt nghiệp & Xử lý học vụ:**
  - **Thống kê xếp hạng tốt nghiệp** (`AcademicRankingConvert`).
  - **Danh sách SV bị đề nghị xử lý:** Lưu ban, đình chỉ, buộc thôi học (dựa trên `AcademicActionConfig` và `StudentAcademicDecision`).
  - _Nguồn dữ liệu:_ `GraduationSession`, `StudentGraduationApplication`, `ApplicationCheckResult`, `AcademicActionConfig`, `StudentAcademicDecision`.

---

### 3. Dành cho Trưởng phòng Khảo thí 📝

- **Dashboard Quản lý Kỳ thi:**
  - **Thẻ chỉ số (KPI Cards):**
    - Tổng số lượt sinh viên dự thi trong học kỳ.
  - **Biểu đồ đường - Xu hướng kết quả thi:**
    - Điểm thi trung bình (`examScore`) của các học phần qua các học kỳ.
    - _Nguồn dữ liệu:_ `StudentSubjectScore`.

- **Dashboard Ngân hàng câu hỏi (NHCH):**
  - **Thống kê câu hỏi:**
    - Tổng số câu hỏi trong hệ thống (`Question`).
    - Phân bổ câu hỏi theo **Ngân hàng đề** (`QuestionBank`), **Môn học** (`SubjectVersion`), **Độ khó** (`Difficulty`), **Khối kiến thức** (`KnowledgeBlock`).
  - **Phân tích chất lượng câu hỏi:**
    - Danh sách câu hỏi có tỷ lệ trả lời sai cao nhất (từ `Answer`).
    - Danh sách câu hỏi được sử dụng nhiều nhất trong các kỳ thi.
  - _Nguồn dữ liệu:_ `Question`, `QuestionBank`, `Difficulty`, `KnowledgeBlock`, `Answer`.

---

### 4. Dành cho Trưởng phòng Hồ sơ (Vai trò suy luận) 📇

- **Dashboard Nhân khẩu học:**
  - **Biểu đồ tròn/cột - Phân bổ HV/SV:** Theo **Giới tính** (`gender`), **Dân tộc** (`ethnicityId`), **Tôn giáo** (`religionId`), **Quê quán** (`provinceHometownId`).
  - **Biểu đồ đường - Xu hướng tuyển sinh** qua các năm theo ngành/khoá.
  - _Nguồn dữ liệu:_ `UserProfile`, `Student`.

- **Dashboard Quản lý Hồ sơ:**
  - **Báo cáo - Tình trạng hoàn thiện hồ sơ:**
    - Tỷ lệ % hồ sơ đã đầy đủ thông tin (kiểm tra các trường `nullable` trong `UserProfile`).
    - Danh sách HV/SV/Giảng viên thiếu thông tin quan trọng (SĐT, email...).
  - **Dashboard Văn bằng, chứng chỉ:**
    - Thống kê các loại văn bằng, chứng chỉ được cấp.
  - _Nguồn dữ liệu:_ `UserProfile`, `GraduationDecision`.

---

### 5. Dành cho Admin Hệ thống ⚙️

- **Dashboard Quản lý người dùng:**
  - **Thẻ chỉ số:** Tổng số người dùng (`UserProfile`), số người dùng theo loại.
  - **Biểu đồ đường:** Số lượng người dùng mới được tạo theo thời gian.

- **Dashboard Phân quyền & Vai trò:**
  - Tổng số Nhóm (`Group`), Vai trò (`Role`), Quyền (`Permission`).
  - Danh sách các vai trò và số lượng người dùng trong mỗi vai trò.

- **Dashboard Sức khỏe Hệ thống (System Health):**
  - **Trạng thái cơ sở dữ liệu**.
  - **Tải CPU, bộ nhớ của máy chủ**.
  - **Báo cáo lỗi:** Số lượng lỗi 5xx, 4xx của API (cần tích hợp với hệ thống logging).

---

### 6. Dành cho các Phó phòng 👥

Dashboard của các Phó phòng về cơ bản sẽ **giống với Trưởng phòng** nhưng có thể được tùy chỉnh hoặc lọc theo phạm vi công việc được phân công cụ thể.

- **Ví dụ:** Phó phòng Đào tạo phụ trách khối năm 1-2 sẽ có dashboard tương tự Trưởng phòng nhưng mặc định lọc dữ liệu cho các khoá và lớp thuộc năm 1 và 2.
- Hệ thống nên cho phép **tùy chỉnh (customize) dashboard**, để mỗi người dùng có thể thêm/bớt/sắp xếp các widget phù hợp nhất với nhu cầu công việc của họ.
