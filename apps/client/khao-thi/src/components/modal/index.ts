import { XemTaiLieu } from "@workspace/ui"
import AddEvidenceToPeriod from "./add-minh-chung"
import ConfirmModal from "./confirm-dialog"
import PrintExplanation from "./download-dap-an"
import PrintExamBank from "./download-de-thi"
import ExamImportModal from "./exam-import-modal"
import ExportExcelModal from "./export-data-modal"
import PinEvidenceToPeriod from "./ghim-minh-chung"
import WordImportModal from "./import-word-modal"
import MoveQuestionModal from "./modal-chuyen-question"
import ModalPrintAllExams from "./modal-print-all-exam-bank"
import ModalPrintBaoCaoDonVi from "./modal-print-bao-cao-don-vi"
import ModalPrintExamClusterSurvey from "./modal-print-de-khao-sat"
import ModalPrintExamSurvey from "./modal-print-de-khao-sat-chung"
import ModalPrintDotDanhGia from "./modal-print-dot-danh-gia"
import ModalPrintExamBank from "./modal-print-exam-bank"
import ModalPrintSurveylecturer from "./modal-print-survey-lecturer-report"
import ModalPrintSurveyOrganization from "./modal-print-survey-organization-report"
import ModalExportDocxTemplate from "./modal-export-docx-template"
import QuestionListByKnowledgeBlockModal from "./modal-question-by-knowledge"
import ModalSinhDeThiTuDong from "./modal-sinh-de-thi-tu-dong"
import PickQuestionFromBankModal from "./pick-question-from-bank-modal"
import PrintBatchExplanation from "./print-dap-an-hang-loat"
import PrintBatchExamBank from "./print-de-thi-hang-loat"
import PutBoTieuChuanModal from "./put-bo-tieu-chuan"
import PutChuongMucModal from "./put-chuan-dau-ra"
import PutExamBank from "./put-de-thi"
import PutEvaluationPeriod from "./put-dot-danh-gia-ctdt"
import PutEvaluationCouncilMember from "./put-evaluation-council-member"
import PutMaTranDeModal from "./put-ma-tran-de"
import PutEvidence from "./put-minh-chung"
import PutSurveyModal from "./put-modal-survey"
import PutSurveyImportQuestionModal from "./put-modal-survey-import-question"
import PutSurveyObjectTypeModal from "./put-modal-survey-object-type"
import PutSurveyQuestionModal from "./put-modal-survey-question"
import PutSurveyQuestionGroupModal from "./put-modal-survey-question-group"
import PutSurveyTopicModal from "./put-modal-survey-topic"
import PutTieuChiMinhChungModal from "./put-modal-tieu-chi-minh-chung"
import PutQuestionBank from "./put-ngan-hang-cau-hoi"
import PutEvidenceCategory from "./put-nhom-minh-chung"
import PutPhanCongHangLoatModal from "./put-phan-cong-hang-loat"
import PutPhanCongHangLoatCrossModal from "./put-phan-cong-hang-loat-cross"
import PutQuestionModal from "./put-question-modal"
import PutCriterionCatalog from "./put-tieu-chi-danh-gia-ctdt"
import PutStandardCatalog from "./put-tieu-chuan-ctdt"
import PutRequirementCriterionCatalog from "./put-yeu-cau"
import PutTieuChuanTieuChi from "./ql-dot-tu-danh-gia/put-tieu-chuan-tieu-chi"
import ReviewSurveyModal from "./review-survey-modal"
import ThongTinKhaoSatModal from "./show-exam"
import SinhDeModal from "./sinh-de-modal"
import SinhDeThuCongModal from "./sinh-de-thu-cong"
import ModalTaoKhungDe from "./tao-khung-de"
import ModalImportCDR from "./modal-import-CDR"
import AddHuongDanNganHang from "./add-huong-dan-ngan-hang"
import ModalPrintSurvey from "./modal-print-survey-report"
import ModalPrintSurveyToFieldReport from "./modal-print-survey-to-fielde-report"
import ModalPrintDanhSachDoiTuong from "./modal-print-danh-sach-doi-tuong"
import PutPhanCongThanhVienModal from "./put-phan-cong-thanh-vien"
import AddNganHangKhungDe from "./add-ngan-hang-khung-de"
import ViewMinhChungModal from "./view-minh-chung-modal"
import XemBangChungFilesModal from "./xem-bang-chung-files-modal"
export {
  ConfirmModal,
  PutSurveyObjectTypeModal,
  PutSurveyTopicModal,
  PutSurveyModal,
  PutSurveyQuestionModal,
  PutQuestionBank,
  ModalSinhDeThiTuDong,
  PutExamBank,
  ModalPrintExamBank,
  ModalPrintAllExams,
  PutSurveyQuestionGroupModal,
  PutStandardCatalog,
  PutCriterionCatalog,
  PutRequirementCriterionCatalog,
  PutEvaluationPeriod,
  PutEvidenceCategory,
  PutEvidence,
  AddEvidenceToPeriod,
  PinEvidenceToPeriod,
  PutEvaluationCouncilMember,
  ModalPrintDotDanhGia,
  ThongTinKhaoSatModal,
  PutTieuChiMinhChungModal,
  PutTieuChuanTieuChi,
  PutPhanCongHangLoatModal,
  PutPhanCongThanhVienModal,
  PutPhanCongHangLoatCrossModal,
  ReviewSurveyModal,
  XemTaiLieu,
  ModalPrintExamSurvey,
  ModalPrintExamClusterSurvey,
  PutSurveyImportQuestionModal,
  ModalTaoKhungDe,
  PutMaTranDeModal,
  PutChuongMucModal,
  SinhDeModal,
  PutQuestionModal,
  WordImportModal,
  ExamImportModal,
  SinhDeThuCongModal,
  PrintExamBank,
  PrintExplanation,
  PrintBatchExamBank,
  PrintBatchExplanation,
  MoveQuestionModal,
  PickQuestionFromBankModal,
  QuestionListByKnowledgeBlockModal,
  ExportExcelModal,
  ModalPrintBaoCaoDonVi,
  ModalPrintSurveyOrganization,
  PutBoTieuChuanModal,
  ModalPrintSurveylecturer,
  ModalExportDocxTemplate,
  ModalImportCDR,
  AddHuongDanNganHang,
  ModalPrintSurvey,
  ModalPrintSurveyToFieldReport,
  ModalPrintDanhSachDoiTuong,
  AddNganHangKhungDe,
  ViewMinhChungModal,
  XemBangChungFilesModal,
}
