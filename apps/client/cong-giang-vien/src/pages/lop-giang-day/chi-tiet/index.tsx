import DanhSachTaiLieu from "@components/cong-giang-vien/lop-tro-giang/chi-tiet/danh-sach-tai-lieu"
import NoiDungRichText from "@components/cong-giang-vien/lop-tro-giang/chi-tiet/noi-dung-rich-text"
import TongQuanMonHoc from "@components/cong-giang-vien/lop-tro-giang/chi-tiet/tong-quan-mon-hoc"
import { DocKeywords } from "@components/modal/put-phien-ban-mon-hoc"
import { useExamTypeOptions } from "@hooks/examType"
import type { DocumentFile } from "@workspace/db/client"
import { useFindUniqueSubjectClass, useFindUniqueSubjectVersion } from "@workspace/db/hooks"
import { ROUTER_PATH } from "@workspace/router"
import { Breadcrumb, Button, Menu, Skeleton } from "antd"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/router"
import { useMemo, useState } from "react"

const TAB_KEYS = {
  TONG_QUAN: "tong-quan",
  DE_CUONG: "de-cuong",
  BAI_GIANG: "bai-giang",
  KE_HOACH: "ke-hoach",
  MUC_TIEU: "muc-tieu",
  CHUAN_DAU_RA: "chuan-dau-ra",
  CAU_TRUC: "cau-truc",
  KE_HOACH_PP: "ke-hoach-pp",
  DANH_GIA: "danh-gia",
  CO_SO_VAT_CHAT: "co-so-vat-chat",
  QUY_DINH: "quy-dinh",
} as const

const MENU_ITEMS = [
  { key: TAB_KEYS.TONG_QUAN, label: "Tổng quan" },
  { key: TAB_KEYS.DE_CUONG, label: "Đề cương học phần" },
  { key: TAB_KEYS.BAI_GIANG, label: "Bài giảng" },
  { key: TAB_KEYS.KE_HOACH, label: "Kế hoạch" },
  { key: TAB_KEYS.MUC_TIEU, label: "Mục tiêu" },
  { key: TAB_KEYS.CHUAN_DAU_RA, label: "Chuẩn đầu ra" },
  { key: TAB_KEYS.CAU_TRUC, label: "Cấu trúc học phần" },
  { key: TAB_KEYS.KE_HOACH_PP, label: "Kế hoạch và phương pháp dạy học" },
  { key: TAB_KEYS.DANH_GIA, label: "Đánh giá kết quả học tập" },
  { key: TAB_KEYS.CO_SO_VAT_CHAT, label: "Cơ sở vật chất, học liệu" },
  { key: TAB_KEYS.QUY_DINH, label: "Quy định của học phần" },
]

const TrangChiTietMonHocGiangDay = () => {
  const router = useRouter()
  const subjectVersionId = router.query.subjectVersionId as string | undefined
  const subjectClassId = router.query.lopId as string | undefined
  const [activeKey, setActiveKey] = useState<string>(TAB_KEYS.TONG_QUAN)
  const { getExamTypeLabel } = useExamTypeOptions()

  const { data: subjectVersion, isLoading } = useFindUniqueSubjectVersion(
    {
      where: { id: subjectVersionId },
      include: {
        subject: { include: { managementOrganization: true } },
        trainingObjectType: { include: { trainingLevel: true, trainingForm: true } },
        documentFiles: true,
        prerequisiteSubject: { include: { subject: true } },
      },
    },
    { enabled: !!subjectVersionId }
  )

  // Ngôn ngữ giảng dạy lấy theo khóa học của lớp (qua fixedClass → trainingCourse).
  const { data: subjectClass } = useFindUniqueSubjectClass(
    {
      where: { id: subjectClassId },
      include: {
        fixedClasses: {
          include: { trainingCourse: { include: { trainingLanguage: true } } },
        },
      },
    },
    { enabled: !!subjectClassId }
  )

  const ngonNguGiangDay = useMemo(() => {
    const tenNgonNgu = (subjectClass?.fixedClasses ?? [])
      .map((fc) => fc.trainingCourse?.trainingLanguage?.name)
      .filter((ten): ten is string => !!ten)
    return Array.from(new Set(tenNgonNgu)).join(", ")
  }, [subjectClass?.fixedClasses])

  // Hệ số điểm lấy theo khoá học của lớp (qua fixedClass → trainingCourse).
  const heSoDiem = useMemo(() => {
    const trainingCourse = (subjectClass?.fixedClasses ?? []).find(
      (fc) => fc.trainingCourse
    )?.trainingCourse
    return {
      thuongXuyen: trainingCourse?.coef_1,
      dinhKy: trainingCourse?.coef_2,
      thi: trainingCourse?.coef_3,
    }
  }, [subjectClass?.fixedClasses])

  const quayLai = () =>
    router.push(ROUTER_PATH.CONG_GIANG_VIEN.LOP_GIANG_DAY_DANH_SACH_LOP_GIANG_DAY)

  // Phân loại tài liệu theo quy ước description (null → Đề cương).
  const { deCuong, baiGiang, keHoach } = useMemo(() => {
    const files = (subjectVersion?.documentFiles ?? []) as DocumentFile[]
    return {
      deCuong: files.filter((f) => !f.description || f.description === DocKeywords.SYLLABUS),
      baiGiang: files.filter((f) => f.description === DocKeywords.LECTURE),
      keHoach: files.filter((f) => f.description === DocKeywords.PLAN),
    }
  }, [subjectVersion?.documentFiles])

  const dieuKienTienQuyet = useMemo(
    () =>
      (subjectVersion?.prerequisiteSubject ?? [])
        .map((v) => [v.code, v.subject?.name].filter(Boolean).join(" - "))
        .join(", "),
    [subjectVersion?.prerequisiteSubject]
  )

  const renderNoiDung = () => {
    if (!subjectVersion) return null
    switch (activeKey) {
      case TAB_KEYS.TONG_QUAN:
        return (
          <TongQuanMonHoc
            tenHocPhan={subjectVersion.name ?? subjectVersion.subject?.name ?? ""}
            maMonHoc={subjectVersion.code ?? ""}
            soTinChi={subjectVersion.credit}
            soTiet={subjectVersion.period}
            hinhThucThi={getExamTypeLabel(subjectVersion.examType)}
            khoaBoMon={subjectVersion.subject?.managementOrganization?.sTen ?? ""}
            doiTuongDaoTao={subjectVersion.trainingObjectType?.name ?? ""}
            trinhDoDaoTao={subjectVersion.trainingObjectType?.trainingLevel?.name ?? ""}
            hinhThucDaoTao={subjectVersion.trainingObjectType?.trainingForm?.name ?? ""}
            ngonNguGiangDay={ngonNguGiangDay}
            dieuKienTienQuyet={dieuKienTienQuyet}
            moTa={subjectVersion.description}
            mucTieu={subjectVersion.objectives}
            heSoThuongXuyen={heSoDiem.thuongXuyen}
            heSoDinhKy={heSoDiem.dinhKy}
            heSoThi={heSoDiem.thi}
          />
        )
      case TAB_KEYS.DE_CUONG:
        return <DanhSachTaiLieu taiLieu={deCuong} />
      case TAB_KEYS.BAI_GIANG:
        return <DanhSachTaiLieu taiLieu={baiGiang} />
      case TAB_KEYS.KE_HOACH:
        return <DanhSachTaiLieu taiLieu={keHoach} />
      case TAB_KEYS.MUC_TIEU:
        return <NoiDungRichText value={subjectVersion.objectives} />
      case TAB_KEYS.CHUAN_DAU_RA:
        return <NoiDungRichText value={subjectVersion.learningOutcome} />
      case TAB_KEYS.CAU_TRUC:
        return <NoiDungRichText value={subjectVersion.structure} />
      case TAB_KEYS.KE_HOACH_PP:
        return <NoiDungRichText value={subjectVersion.guild} />
      case TAB_KEYS.DANH_GIA:
        return <NoiDungRichText value={subjectVersion.academicResults} />
      case TAB_KEYS.CO_SO_VAT_CHAT:
        return <NoiDungRichText value={subjectVersion.materials} />
      case TAB_KEYS.QUY_DINH:
        return <NoiDungRichText value={subjectVersion.rules} />
      default:
        return null
    }
  }

  return (
    <div className="flex h-[calc(100vh-112px)] flex-col gap-4">
      <div className="flex shrink-0 items-start justify-between">
        <div className="flex flex-col gap-1">
          <Breadcrumb>
            <Breadcrumb.Item href="/" className="text-sm">
              Trang chủ
            </Breadcrumb.Item>
            <Breadcrumb.Item className="text-sm">Lớp giảng dạy</Breadcrumb.Item>
            <Breadcrumb.Item className="text-sm">Chi tiết môn học</Breadcrumb.Item>
          </Breadcrumb>
          <div className="flex items-center gap-2">
            <Button
              type="text"
              icon={<ArrowLeft size={18} />}
              onClick={quayLai}
              className="flex h-9 w-9 items-center justify-center text-cgv-green-dark"
            />
            <h1 className="m-0 text-xl font-bold uppercase tracking-wide text-cgv-green-dark">
              Chi tiết môn học
            </h1>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="min-h-0 overflow-y-auto rounded-lg border border-gray-100 bg-white">
          <Menu
            mode="inline"
            selectedKeys={[activeKey]}
            onClick={({ key }) => setActiveKey(key)}
            items={MENU_ITEMS}
            className="border-r-0"
          />
        </div>

        <div className="min-h-0 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-4">
          {isLoading ? <Skeleton active paragraph={{ rows: 8 }} /> : renderNoiDung()}
        </div>
      </div>
    </div>
  )
}

export default TrangChiTietMonHocGiangDay
