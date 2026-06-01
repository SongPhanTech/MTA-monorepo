import { SchedulePreviewTimeline } from "@components/lich-cong-tac/schedule-preview-timeline"

import { WorkScheduleActions } from "@components/lich-cong-tac/work-schedule-actions"

import { WorkScheduleForm } from "@components/lich-cong-tac/work-schedule-form"

import DefaultLayout from "@layouts/default-layout"

import { useWorkScheduleForm } from "@hooks/use-work-schedule-form"

import { Alert, Col, Row, Typography } from "antd"

import dayjs from "dayjs"

import type React from "react"

function LichCongTacPage() {
  const {
    leaders,

    formValues,

    previewDate,

    previewEvents,

    validationErrors,

    conflicts,

    updateFormValues,

    saveDraft,

    saveAndAddNew,

    saveAndPublish,

    goToPreviousDay,

    goToNextDay,

    goToToday,

    selectPreviewDate,
  } = useWorkScheduleForm()

  const handleFormChange = (patch: Partial<typeof formValues>) => {
    updateFormValues(patch)

    if (patch.date) {
      selectPreviewDate(dayjs(patch.date))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Typography.Title level={4} className="!mb-1">
            Quản lý lịch công tác
          </Typography.Title>
          <Typography.Text type="secondary">
            Nhập thông tin lịch và xem trước theo thời gian thực
          </Typography.Text>
        </div>

        <WorkScheduleActions
          onSaveDraft={saveDraft}
          onSaveAndAddNew={saveAndAddNew}
          onSaveAndPublish={saveAndPublish}
        />
      </div>

      {conflicts.length > 0 ? (
        <Alert
          type="warning"
          showIcon
          message="Phát hiện xung đột lịch"
          description={
            <ul className="mb-0 pl-4">
              {conflicts.map((conflict) => (
                <li key={`${conflict.type}-${conflict.message}`}>{conflict.message}</li>
              ))}
            </ul>
          }
        />
      ) : null}

      <Row gutter={[16, 16]} align="stretch">
        <Col xs={24} xl={12}>
          <WorkScheduleForm
            leaders={leaders}
            values={formValues}
            validationErrors={validationErrors}
            onChange={handleFormChange}
          />
        </Col>

        <Col xs={24} xl={12}>
          <SchedulePreviewTimeline
            previewDate={previewDate}
            events={previewEvents}
            onPreviousDay={goToPreviousDay}
            onNextDay={goToNextDay}
            onSelectDate={selectPreviewDate}
            onGoToday={goToToday}
          />
        </Col>
      </Row>
    </div>
  )
}

export default LichCongTacPage

LichCongTacPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
