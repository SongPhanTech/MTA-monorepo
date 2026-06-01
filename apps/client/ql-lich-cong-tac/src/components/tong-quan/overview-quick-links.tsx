import { WEEK_SCHEDULE_LEADERS } from "@constants/work-schedule-week-mock"
import { resolveDefaultWeekLeaderId } from "@/utils/default-leader-id"
import { buildPersonalScheduleHref } from "@/utils/personal-schedule-link"
import { ROUTER_PATH } from "@workspace/router"
import { useSession } from "@workspace/auth/react"
import { Button, Col, Modal, Row, Select } from "antd"
import dayjs from "dayjs"
import Link from "next/link"
import { useRouter } from "next/router"
import { useMemo, useState } from "react"

export function OverviewQuickLinks() {
  const router = useRouter()
  const { data: session } = useSession()
  const [personalModalOpen, setPersonalModalOpen] = useState(false)
  const [selectedLeaderId, setSelectedLeaderId] = useState("")

  const defaultLeaderId = useMemo(() => {
    const displayName = session?.fullName ?? null

    return resolveDefaultWeekLeaderId(displayName)
  }, [session])

  const leaderOptions = useMemo(
    () =>
      WEEK_SCHEDULE_LEADERS.map((leader) => ({
        value: leader.id,
        label: `${leader.rankTitle} ${leader.fullName}`,
      })),
    []
  )

  const links = [
    {
      label: "Lịch công tác",
      href: ROUTER_PATH.QL_LICH_CONG_TAC.QUAN_LY_LICH_LICH_CONG_TAC,
      action: "link" as const,
    },
    {
      label: "Lịch tuần",
      href: ROUTER_PATH.QL_LICH_CONG_TAC.QUAN_LY_LICH_LICH_TUAN,
      action: "link" as const,
    },
    {
      label: "Lịch tháng",
      href: ROUTER_PATH.QL_LICH_CONG_TAC.QUAN_LY_LICH_LICH_THANG,
      action: "link" as const,
    },
    {
      label: "Lịch cá nhân",
      action: "personal" as const,
    },
  ]

  const openPersonalModal = () => {
    setSelectedLeaderId(defaultLeaderId)
    setPersonalModalOpen(true)
  }

  const goToPersonalSchedule = () => {
    const href = buildPersonalScheduleHref({
      leaderId: selectedLeaderId || defaultLeaderId,
      periodStart: dayjs().startOf("isoWeek").format("YYYY-MM-DD"),
      periodType: "week",
      from: ROUTER_PATH.QL_LICH_CONG_TAC.TONG_QUAN,
    })

    setPersonalModalOpen(false)
    router.push(href)
  }

  return (
    <>
      <Row gutter={[8, 8]}>
        {links.map((link) => (
          <Col key={link.label}>
            {link.action === "link" ? (
              <Link href={link.href!}>
                <Button type="default">{link.label}</Button>
              </Link>
            ) : (
              <Button type="default" onClick={openPersonalModal}>
                {link.label}
              </Button>
            )}
          </Col>
        ))}
      </Row>

      <Modal
        title="Chọn thủ trưởng xem lịch cá nhân"
        open={personalModalOpen}
        onCancel={() => setPersonalModalOpen(false)}
        onOk={goToPersonalSchedule}
        okText="Xem lịch"
        cancelText="Hủy"
      >
        <Select
          className="w-full"
          value={selectedLeaderId || defaultLeaderId}
          options={leaderOptions}
          onChange={setSelectedLeaderId}
        />
      </Modal>
    </>
  )
}
