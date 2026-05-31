import { ScheduleEntryDrawer } from "@components/lich-tuan/schedule-entry-drawer"
import { WeekScheduleLegend } from "@components/lich-tuan/week-schedule-shared"
import { WeekScheduleMatrix } from "@components/lich-tuan/week-schedule-matrix"
import { WeekScheduleToolbar } from "@components/lich-tuan/week-schedule-toolbar"
import DefaultLayout from "@layouts/default-layout"
import { useWeekScheduleView } from "@hooks/use-week-schedule-view"
import { formatWeekRangeLabel } from "@/utils/work-schedule-week"
import { printScheduleCard } from "@/utils/print-schedule"
import type { WeekScheduleEntry, WeekScheduleLeader } from "@/types/work-schedule-week-view"
import { ROUTER_PATH } from "@workspace/router"
import { Typography } from "antd"
import type React from "react"
import { useCallback, useState } from "react"
import "@components/lich-tuan/week-schedule.css"

const { Title, Text } = Typography

function LichTuanPage() {
  const {
    weekStart,
    weekEnd,
    weekDays,
    leaders,
    entriesByCell,
    hiddenTypes,
    toggleType,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    pickWeek,
  } = useWeekScheduleView()

  const [selectedEntry, setSelectedEntry] = useState<WeekScheduleEntry | null>(null)
  const [selectedLeader, setSelectedLeader] = useState<WeekScheduleLeader | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleEntryClick = useCallback((entry: WeekScheduleEntry, leader: WeekScheduleLeader) => {
    setSelectedEntry(entry)
    setSelectedLeader(leader)
    setDrawerOpen(true)
  }, [])

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
  }, [])

  return (
    <div className="week-schedule-page space-y-4">
      <div>
        <Title level={4} className="!mb-1">
          Lịch công tác tuần
        </Title>
        <Text type="secondary">
          Tổng hợp lịch công tác tuần của Ban Giám đốc theo từng thành viên
        </Text>
      </div>

      <div className="week-schedule-card">
        <div className="week-schedule-header">
          <Title level={3} className="!mb-2 !text-[#13ab55] uppercase tracking-wide">
            Lịch công tác tuần của Ban Giám đốc
          </Title>
          <Text className="text-base text-gray-600">
            ({formatWeekRangeLabel(weekStart, weekEnd)})
          </Text>
        </div>

        <WeekScheduleToolbar
          weekStart={weekStart}
          weekEnd={weekEnd}
          onPreviousWeek={goToPreviousWeek}
          onNextWeek={goToNextWeek}
          onCurrentWeek={goToCurrentWeek}
          onPickWeek={pickWeek}
          onPrint={() => printScheduleCard()}
        />

        <WeekScheduleMatrix
          weekDays={weekDays}
          leaders={leaders}
          entriesByCell={entriesByCell}
          weekStart={weekStart}
          returnPath={ROUTER_PATH.QL_LICH_CONG_TAC.QUAN_LY_LICH_LICH_TUAN}
          onEntryClick={handleEntryClick}
        />

        <WeekScheduleLegend hiddenTypes={hiddenTypes} onToggleType={toggleType} />
      </div>

      <ScheduleEntryDrawer
        open={drawerOpen}
        entry={selectedEntry}
        leader={selectedLeader}
        onClose={closeDrawer}
      />
    </div>
  )
}

export default LichTuanPage

LichTuanPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
