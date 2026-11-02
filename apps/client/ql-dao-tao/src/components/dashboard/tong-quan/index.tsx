import {
  CalendarOutlined,
  CarryOutOutlined,
  ClusterOutlined,
  FileTextOutlined,
  ReadOutlined,
  SolutionOutlined,
  TeamOutlined,
} from "@ant-design/icons"
import ResponsiveCardRow from "@components/commons/responsive-card-row"
import DanhSachLopGiangVien from "@components/sub-pages/danh-sach-lop-giang-vien"
import {
  useCountClassSchedule,
  useCountGraduationDecision,
  useCountStudent,
  useCountSubjectClass,
  useFindFirstSemester,
  useFindManyClassSchedule,
  useFindManyDM_DonVi,
} from "@workspace/db/hooks"
import { whereActiveOrganization } from "@workspace/libs/org-tree"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION, ROUTER_PATH } from "@workspace/router"
import {
  LichCongTac,
  LichCongTacViewSwitcher,
  dayjs,
  useLichCongTacView,
  useSemesterStore,
  useTrainingObjectTypeStore,
} from "@workspace/ui"
import { Grid } from "antd"
import { useRouter } from "next/router"
import { useMemo } from "react"
import {
  CoCauToChucDonVi,
  dashboardOrgSelect,
  mapDashboardOrgs,
  totalAcademyLecturers,
} from "./co-cau-to-chuc"
import { KpiCard, Panel, type KpiCardProps } from "./shared"
import { ThongBaoHocVien } from "./thong-bao"

function schoolYearLabel(name?: string | null): string {
  if (!name?.trim()) return "—"
  const trimmed = name.trim()
  return /^năm/i.test(trimmed) ? trimmed : `Năm học ${trimmed}`
}

function graduationDecisionWhere(
  schoolYear?: { startDate: Date; endDate: Date | null } | null,
  trainingObjectTypeId?: string
) {
  return {
    deletedAt: null,
    ...(schoolYear
      ? {
          decisionDate: {
            gte: schoolYear.startDate,
            ...(schoolYear.endDate ? { lte: schoolYear.endDate } : {}),
          },
        }
      : {}),
    ...(trainingObjectTypeId
      ? {
          student: {
            deletedAt: null,
            active: true,
            fixedClass: { trainingCourse: { trainingObjectTypeId } },
          },
        }
      : {}),
  }
}

export default function TongQuanDashboard() {
  const router = useRouter()
  const { can } = useAbility()
  const screens = Grid.useBreakpoint()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { id: semesterId } = useSemesterStore()
  const [tkbViewType, setTkbViewType] = useLichCongTacView()

  const todayStart = dayjs().startOf("day").toDate()
  const todayEnd = dayjs().endOf("day").toDate()

  const teachPeriodTypes = ["THEORY", "PRACTICE", "LAB", "SEMINAR"] as const

  const studentWhereBase = {
    deletedAt: null as null,
    active: true,
    status: "ENROLLED" as const,
    ...(trainingObjectTypeId ? { fixedClass: { trainingCourse: { trainingObjectTypeId } } } : {}),
  }

  const subjectClassWhereBase = {
    deletedAt: null as null,
    active: true,
    cancelled: false,
    status: "OFFICIAL" as const,
    ...(trainingObjectTypeId ? { trainingObjectTypeId } : {}),
  }

  const scheduleSubjectFilter = trainingObjectTypeId
    ? { subjectClass: { trainingObjectTypeId, deletedAt: null, active: true } }
    : { subjectClass: { deletedAt: null, active: true } }

  const scheduleTodayBase = {
    deletedAt: null,
    classDate: { gte: todayStart, lte: todayEnd },
    ...scheduleSubjectFilter,
  }

  const { data: orgRows = [], isLoading: loadingOrg } = useFindManyDM_DonVi({
    where: whereActiveOrganization,
    orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
    select: dashboardOrgSelect,
  })

  const dashboardOrgs = useMemo(() => mapDashboardOrgs(orgRows), [orgRows])
  const academyLecturerTotal = useMemo(() => totalAcademyLecturers(dashboardOrgs), [dashboardOrgs])

  const { data: classCount = 0, isLoading: loadingClass } = useCountSubjectClass({
    where: {
      ...subjectClassWhereBase,
      ...(semesterId ? { semesterId } : {}),
    },
  })

  const { data: studentCount = 0, isLoading: loadingStudent } = useCountStudent({
    where: studentWhereBase,
  })

  const { data: semesterInfo, isLoading: loadingSemesterInfo } = useFindFirstSemester(
    {
      where: { id: semesterId ?? "" },
      select: {
        schoolYear: { select: { name: true, startDate: true, endDate: true } },
      },
    },
    { enabled: !!semesterId }
  )

  const schoolYear = semesterInfo?.schoolYear ?? null
  const yearLabel = schoolYearLabel(schoolYear?.name)
  const graduationReady = !!semesterId && !!schoolYear

  const { data: graduatedCount = 0, isLoading: loadingGraduation } = useCountGraduationDecision(
    { where: graduationDecisionWhere(schoolYear, trainingObjectTypeId) },
    { enabled: graduationReady }
  )

  const { data: teachTodayRows = [], isLoading: loadingTeach } = useFindManyClassSchedule({
    where: {
      ...scheduleTodayBase,
      periodType: { in: [...teachPeriodTypes] },
      subjectClassId: { not: null },
    },
    distinct: ["subjectClassId"],
    select: { subjectClassId: true },
  })

  const { data: checkToday = 0, isLoading: loadingCheck } = useCountClassSchedule({
    where: { ...scheduleTodayBase, periodType: "CHECK" },
  })

  const { data: examToday = 0, isLoading: loadingExam } = useCountClassSchedule({
    where: { ...scheduleTodayBase, periodType: "EXAM" },
  })

  const teachToday = teachTodayRows.length

  const kpis: KpiCardProps[] = [
    {
      icon: <ClusterOutlined />,
      title: "Tổng số giảng viên",
      value: academyLecturerTotal,
      loading: loadingOrg,
      onClick: () => router.push(ROUTER_PATH.QL_DAO_TAO.QUAN_LY_HO_SO_DANH_SACH_GIANG_VIEN),
    },
    {
      icon: <ReadOutlined />,
      title: "Số lớp đang giảng dạy",
      value: classCount,
      loading: loadingClass,
      onClick: () => router.push(ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_DS_LOP_MON_HOC),
    },
    {
      icon: <TeamOutlined />,
      title: "Học viên đang học",
      value: studentCount,
      loading: loadingStudent,
      onClick: () => router.push(ROUTER_PATH.QL_DAO_TAO.QUAN_LY_HO_SO_QL_SINH_VIEN),
    },
    {
      icon: <SolutionOutlined />,
      title: "Học viên tốt nghiệp",
      value: graduatedCount,
      hint: yearLabel,
      loading: loadingGraduation || loadingSemesterInfo,
      onClick: () => router.push(ROUTER_PATH.QL_DAO_TAO.QUAN_LY_HO_SO_QL_SINH_VIEN),
    },
    {
      icon: <CalendarOutlined />,
      title: "Lịch giảng dạy hôm nay",
      value: teachToday,
      hint: "Lớp",
      loading: loadingTeach,
      onClick: () => router.push(ROUTER_PATH.QL_DAO_TAO.KHOA_BO_MON_PHAN_CONG_GIANG_DAY),
    },
    {
      icon: <CarryOutOutlined />,
      title: "Lịch kiểm tra hôm nay",
      value: checkToday,
      hint: "Ca kiểm tra",
      loading: loadingCheck,
      onClick: () => router.push(ROUTER_PATH.QL_DAO_TAO.LICH_KIEM_TRA_GIANG_DAY),
    },
    {
      icon: <FileTextOutlined />,
      title: "Lịch thi hôm nay",
      value: examToday,
      hint: "Ca thi",
      loading: loadingExam,
      onClick: () => router.push(ROUTER_PATH.QL_DAO_TAO.TO_CHUC_THI_DANH_SACH_THI),
    },
  ]

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden [scrollbar-width:thin]">
      <ResponsiveCardRow
        items={kpis.map((kpi) => ({ ...kpi, key: kpi.title }))}
        renderItem={(kpi) => <KpiCard {...kpi} />}
        gridColsClass="grid-cols-7"
        slidesToShow={4}
        responsive={[
          { breakpoint: 1100, settings: { slidesToShow: 3 } },
          { breakpoint: 800, settings: { slidesToShow: 2 } },
          { breakpoint: 640, settings: { slidesToShow: 1 } },
        ]}
      />

      {/* Ngay dưới KPI: danh sách lớp của giảng viên (compact, cuộn ngang) */}
      {/* <div className="h-[190px] shrink-0 xl:h-[220px]">
        <DanhSachLopGiangVien compact />
      </div> */}

      {/* Hàng dưới co giãn lấp hết chỗ trống; không min-w → không scroll ngang ở 1024 */}
      <div className="grid min-h-[280px] w-full min-w-0 flex-1 grid-cols-[200px_minmax(0,1fr)_240px] items-stretch gap-2 xl:grid-cols-[230px_minmax(0,1fr)_290px] xl:gap-3">
        <div className="h-full min-h-0 w-full overflow-hidden">
          <CoCauToChucDonVi orgs={dashboardOrgs} isLoading={loadingOrg} />
        </div>
        <div className="h-full min-h-0 min-w-0 overflow-hidden">
          <Panel
            title="Kế hoạch huấn luyện của đơn vị (Thời khóa biểu)"
            className="h-full"
            titleClassName="truncate whitespace-nowrap"
            bodyClassName="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-hidden px-2 pb-2 pt-1"
            action={
              <LichCongTacViewSwitcher value={tkbViewType} onChange={setTkbViewType} size="small" />
            }
          >
            <LichCongTac
              compact
              hideViewSwitcher
              // < xl: ẩn mini-calendar bên trái để lịch tháng đủ rộng
              hiddenCalendarFilter={!screens.xl}
              viewCalendarType={tkbViewType}
              onViewCalendarTypeChange={setTkbViewType}
              onlyMySchedule={can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_LICH_TUAN_THANG, "XEM")}
            />
          </Panel>
        </div>
        <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
          <ThongBaoHocVien
            className="min-h-0 flex-1"
            onViewAll={() => router.push(ROUTER_PATH.QL_DAO_TAO.THONG_BAO)}
          />
        </div>
      </div>
    </div>
  )
}
