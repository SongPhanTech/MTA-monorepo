import { PutLichVaSuKienModal, ViewNotificationModal, XemTaiLieu } from "@workspace/ui"
import PutAddCertificateScoreModal from "./add-certificate"
import AddStudentToFixedClassModal from "./add-student-to-fixedClass"
import ConfirmModal from "./confirm-dialog"
import ExportStatsArchivedAwardModal from "./export-stats-archived-award"
import PutScoreLinkSheetModal from "./modal-add-diem-lien-ket"
import PutMonHocTuongDuong from "./modal-add-mon-tuong-duong"
import PutUpdatePaymentStatus from "./modal-cap-nhat-trang-thai-thanh-toan"
import ModalCauHinhLuanVan from "./modal-cau-hinh-luan-van"
import ModalChiTietGiangVien from "./modal-chi-tiet-giang-vien"
import ModalChiTietLopBienChe from "./modal-chi-tiet-lop-bien-che"
import ModalChiTietMonHoc from "./modal-chi-tiet-mon-hoc"
import ModalChiTietSinhVien from "./modal-chi-tiet-sinh-vien"
import ModalChuyenDiemLopMonHoc from "./modal-chuyen-diem-lmh"
import ModalChuyenDoiChungChiThanhDiem from "./modal-chuyen-doi-chung-chi-thanh-diem"
import ModalChuyenLop from "./modal-chuyen-lop"
import ModalChuyenLopLuuBan from "./modal-chuyen-lop-luu-ban"
import ModalDanhSachChungChi from "./modal-danh-sach-chung-chi"
import HanNhapDiem from "./modal-han-nhap-diem"
import ModalNhapTKB from "./modal-import-tkb"
import ModalPrintStudentSubjectScore from "./modal-in-phieu-diem"
import ModalLearningResult from "./modal-ket-qua-hoc-tap-ctdt"
import MoKhoaNhapDiem from "./modal-mo-khoa-nhap-diem"
import ModalPhuLucThacSi from "./modal-phu-luc-thac-si"
import ModalPreviewUpload from "./modal-preview-upload-ctdt"
import ModalPrintToDSHV from "./modal-print-ds-sinh-vien-lop"
import ModalPrintInvitation from "./modal-print-giay-moi"
import ModalPrintToKQHT from "./modal-print-ket-qua-hoc-tap"
import ModalPrintDecision from "./modal-print-quyet-dinh-hoi-dong"
import ModalPrintSupervisorGuide from "./modal-print-quyet-dinh-huong-dan"
import ModalGraduationCriteria from "./modal-tieu-chi-xet-tn"
import ModalTraCuuVanBang from "./modal-tra-cuu-van-bang"
import ModalVanBang from "./modal-van-bang"
import ModalViewHistoryChange from "./modal-xem-lich-su-thay-doi"
import NhapDiemThuCong from "./nhap-diem"
import PutArchivedAwardModal from "./put-archived-award"
import PutCertificateArchivedModal from "./put-archived-certificate"
import PutDiplomaType from "./put-bac-dao-tao"
import PutDisciplinaryWarningReason from "./put-canh-cao-hoc-duong"
import PutAcademicWarningRule from "./put-canh-cao-hoc-tap"
import PutCertificateOnSubjectScoreModal from "./put-certificate-on-subject"
import PutChuanDauRaModal from "./put-chuan-dau-ra"
import PutCertificateScoreModal from "./put-chung-chi-score"
import PutResearchTopicModal from "./put-chuyen-de-nghien-cuu"
import PutConvertScore from "./put-chuyen-doi-diem"
import PutExpertProfile from "./put-chuyen-gia"
import PutTrainingMajorModal from "./put-chuyen-nganh"
import PutCloneAcademicRanking from "./put-clone-acdemic-ranking"
import PutCloneConvertScore from "./put-clone-convert-score"
import PutCurriculum from "./put-danh-muc-chuong-trinh-dao-dao"
import PutSubjectListModal from "./put-danh-sach-mon-hoc"
import PutOlympicScoreModal from "./put-diem-cong"
import PutRankingCondition from "./put-dieu-kien-xep-loai-tn"
import PutAcademicActionCondition from "./put-dieu-kien-xu-ly-hoc-tap"
import PutThesisProject from "./put-do-an"
import PutTrainingObjectTypeModal from "./put-doi-tuong-dao-tao"
import PutGraduationApplication from "./put-don-xet-tot-nghiep"
import PutClassRegisterSession from "./put-dot-dang-ky-hoc"
import PutDotRenLuyen from "./put-dot-danh-gia-ren-luyen"
import PutThesisSession from "./put-dot-xet-luan-van"
import PutGraduationSession from "./put-dot-xet-tot-nghiep"
import PutUploadFixedClassModal from "./put-file-lop-bien-che"
import PutUploadDivisionModal from "./put-file-phan-lop"
import PutHocBong from "./put-hoc-bong"
import PutCouncil from "./put-hoi-dong-danh-gia"
import PutTrainingCourseModal from "./put-khoa-huan-luyen"
import PutTrainingBlockOnCurriculumVersion from "./put-khoi-kien-thuc"
import PutTrainingBlock from "./put-khoi-kien-thuc-ctdt"
import PutTrainingLocationModal from "./put-khu-vuc"
import PutSemesterModal from "./put-ky-hoc"
import PutTrainingTypeModal from "./put-loai-hinh-dao-tao"
import PutFixedClassModal from "./put-lop-bien-che"
import PutMilestoneModal from "./put-moc-huan-luyen"
import PutSubjectModal from "./put-mon-hoc"
import PutTrainingBlockSubject from "./put-mon-hoc-chuong-trinh-dao-tao"
import PutSubjectTienQuyetSongHanh from "./put-mon-hoc-tien-quyet-song-hanh"
import PutSchoolYearModal from "./put-nam-hoc"
import PutTrainingFieldModal from "./put-nganh"
import PutTrainingLanguage from "./put-ngon-ngu-dao-tao"
import PutSubjectGroupModal from "./put-nhom-mon-hoc"
import PutNoiDungTinhTaiModal from "./put-noi-dung-tinh-tai"
import PutOneSubjectClassModal from "./put-one-subject-class"
import PutCurriculumVersion from "./put-phien-ban-danh-muc-ctdt"
import PutVersionSubjectModal from "./put-phien-ban-mon-hoc"
import PutRoomModal from "./put-phong"
import PutRankDowngradeCondition from "./put-quy-tac-ha-bac"
import PutDecision from "./put-quyet-dinh-do-an"
import PutGraduationDecision from "./put-quyet-dinh-tot-nghiep"
import PutStudentAcademicDecision from "./put-quyet-dinh-xu-ly-hoc-tap"
import PutScholarshipAward from "./put-scholarship-award"
import PutScholarshipCriteria from "./put-scholarship-criteria"
import PutStudentModal from "./put-sinh-vien"
import PutStudentThesisRegistration from "./put-sinh-vien-dang-ky-da"
import PutStatusQLTraCuuVanBang from "./put-status-ql-tra-cuu-van-bang"
import PutAcademicWarning from "./put-sv-canh-cao-hoc-tap"
import PutStudentScoreConvertModal from "./put-sv-hv-chuyen-truong"
import PutPaymentRecord from "./put-thanh-toan"
import PutPaymentRecordDetail from "./put-thanh-toan-detail"
import PutSupervisorPaymentRecord from "./put-thanh-toan-gvhd"
import PutCouncilMember from "./put-thanh-vien-hoi-dong"
import PutBuildingModal from "./put-toa-nha"
import PutTrainingFormModal from "./put-training-form"
import PutTrainingTimeModal from "./put-training-time"
import PutTrainingLevel from "./put-trinh-do-dao-tao"
import PutUpdateProfileModal from "./put-update-profile"
import PutUploadProfileModal from "./put-upload-profile"
import PutAcademicRanking from "./put-xep-loai-hoc-luc"
import PutDisciplinaryWarning from "./put-xet-canh-cao-hoc-duong"
import PutAcademicActionConfig from "./put-xu-ly-hoc-tap"
import PutDeadlineScoreModal from "./set-deadline-score"
import PutAddOlympicScoreModal from "./them-diem-cong"
import ThongTinBaoCaoModal from "./thong-tin-bao-cao"
import PutInternshipModal from "./put-thuc-tap"
import ModalCurriculumVersionByTrainingBlock from "./modal-ctdt-theo-kkt"
import ModalPreviewReason from "./modal-preview-reason"
import ModalScoreDetail from "./modal-chi-tiet-diem-hoc-phan"
import ModalChuyenCTDT from "./modal-chuyen-ctdt"
import AddSubjectClassAttendance from "./add-diem-danh"
import AddSubjectClassAttendanceStudent from "./add-diem-danh-mon-hoc"
import PutAvailableTrainingTimeModal from "./PutAvailableTrainingTimeModal"

export {
  ExportStatsArchivedAwardModal,
  ModalChiTietLopBienChe,
  ModalChiTietGiangVien,
  ModalChiTietMonHoc,
  ModalChiTietSinhVien,
  PutNoiDungTinhTaiModal,
  XemTaiLieu,
  PutLichVaSuKienModal,
  ViewNotificationModal,
  ModalViewHistoryChange,
  PutUpdateProfileModal,
  PutUploadProfileModal,
  ConfirmModal,
  PutSchoolYearModal,
  PutSemesterModal,
  PutMilestoneModal,
  PutTrainingCourseModal,
  PutFixedClassModal,
  PutUploadFixedClassModal,
  PutUploadDivisionModal,
  PutSubjectGroupModal,
  PutSubjectModal,
  ThongTinBaoCaoModal,
  PutTrainingFieldModal,
  PutTrainingMajorModal,
  PutSubjectListModal,
  PutTrainingBlock,
  PutCurriculumVersion,
  PutVersionSubjectModal,
  PutCurriculum,
  PutTrainingBlockOnCurriculumVersion,
  PutTrainingBlockSubject,
  PutConvertScore,
  PutTrainingLocationModal,
  PutBuildingModal,
  PutRoomModal,
  ModalPrintToKQHT,
  PutOneSubjectClassModal,
  AddStudentToFixedClassModal,
  PutOlympicScoreModal,
  PutCertificateScoreModal,
  PutAddOlympicScoreModal,
  PutAddCertificateScoreModal,
  HanNhapDiem,
  PutCloneConvertScore,
  ModalPrintStudentSubjectScore,
  PutTrainingTimeModal,
  PutTrainingFormModal,
  PutHocBong,
  PutScholarshipCriteria,
  PutAcademicRanking,
  PutCloneAcademicRanking,
  PutGraduationSession,
  PutDisciplinaryWarningReason,
  PutAcademicWarningRule,
  PutDisciplinaryWarning,
  PutAcademicActionConfig,
  PutGraduationApplication,
  PutAcademicActionCondition,
  PutStudentAcademicDecision,
  ModalLearningResult,
  ModalPrintToDSHV,
  PutGraduationDecision,
  PutScholarshipAward,
  ModalGraduationCriteria,
  PutRankingCondition,
  PutRankDowngradeCondition,
  PutAcademicWarning,
  PutDiplomaType,
  PutThesisProject,
  PutExpertProfile,
  PutDecision,
  PutStudentThesisRegistration,
  PutCouncil,
  PutCouncilMember,
  PutStudentModal,
  PutTrainingObjectTypeModal,
  PutTrainingTypeModal,
  ModalVanBang,
  ModalTraCuuVanBang,
  ModalPrintDecision,
  ModalNhapTKB,
  ModalPhuLucThacSi,
  PutPaymentRecord,
  PutPaymentRecordDetail,
  PutUpdatePaymentStatus,
  PutStatusQLTraCuuVanBang,
  PutDotRenLuyen,
  PutSupervisorPaymentRecord,
  PutSubjectTienQuyetSongHanh,
  PutMonHocTuongDuong,
  ModalPrintInvitation,
  PutTrainingLevel,
  PutClassRegisterSession,
  ModalPrintSupervisorGuide,
  NhapDiemThuCong,
  PutChuanDauRaModal,
  MoKhoaNhapDiem,
  PutTrainingLanguage,
  ModalChuyenLop,
  PutStudentScoreConvertModal,
  PutScoreLinkSheetModal,
  ModalPreviewUpload,
  ModalChuyenLopLuuBan,
  PutArchivedAwardModal,
  PutCertificateOnSubjectScoreModal,
  PutCertificateArchivedModal,
  PutDeadlineScoreModal,
  PutThesisSession,
  ModalCauHinhLuanVan,
  ModalDanhSachChungChi,
  ModalChuyenDoiChungChiThanhDiem,
  PutResearchTopicModal,
  PutInternshipModal,
  ModalChuyenDiemLopMonHoc,
  ModalCurriculumVersionByTrainingBlock,
  ModalPreviewReason,
  ModalScoreDetail,
  ModalChuyenCTDT,
  AddSubjectClassAttendance,
  AddSubjectClassAttendanceStudent,
  PutAvailableTrainingTimeModal,
}
export * from "./ke-hoach-dao-tao"
export * from "./thong-bao"
export * from "./update-progress-modal"
