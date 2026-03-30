// biome-ignore assist/source/organizeImports: biomes auto organize imports
import useSpinner from "@hooks/spinner"
import type { ExpertProfile, SubjectClass } from "@workspace/db/client"
import {
  useCreateCouncil,
  useFindManyCouncil,
  useFindManyDefenseSession,
  useFindManyExpertProfile,
  useFindManyRoom,
  useFindUniqueThesisSession,
  useUpdateManyThesisProject,
} from "@workspace/db/hooks"
import { Button, Col, Empty, Form, message, Modal, Tag, Typography } from "antd"
import dayjs, { type Dayjs } from "dayjs"
import "dayjs/locale/vi"
import DatePicker from "@components/commons/date-picker"
import Table from "@components/commons/table"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import DefaultLayout from "@layouts/default-layout"
import { ROUTER_PATH } from "@workspace/router"
import { debounce } from "lodash"
import { useRouter } from "next/router"
import type React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowLeftOutlined, InboxOutlined, ReloadOutlined } from "@ant-design/icons"
import { Select } from "@workspace/ui"

export type PutSettingClass = SubjectClass & {
  roomIds?: string[]
  defenseSessionIds?: string[]
  defenseDate?: Date[]
}
dayjs.locale("vi")

export default function SettingCouncil() {
  const router = useRouter()
  const thesisSessionId = router.query.id as string
  const { showSpinner, hideSpinner } = useSpinner()
  const [searchRoom, setSearchRoom] = useState("")
  const { mutateAsync: createCouncil } = useCreateCouncil()
  const { mutateAsync: updateProjects } = useUpdateManyThesisProject()
  const { data: councils, isLoading: isLoadingCouncils } = useFindManyCouncil({
    where: {
      thesis: {
        some: { thesisSessionId: thesisSessionId },
      },
    },
    include: {
      members: {
        include: { expert: true },
      },
      thesis: {
        include: {
          room: true,
          defenseSession: true,
          registrations: {
            include: { student: { include: { userProfile: true } } },
          },
        },
      },
    },
  })
  const [form] = Form.useForm<PutSettingClass>()
  const [selectedLeftKeys, setSelectedLeftKeys] = useState<React.Key[]>([])
  const [selectedRightKeys, setSelectedRightKeys] = useState<React.Key[]>([])
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([])
  const [selectedDefenseSessionIds, setSelectedDefenseSessionIds] = useState<string[]>([])
  const [selectedDefenseDate, setSelectedDefenseDate] = useState<string[]>([])
  const [leftData, setLeftData] = useState<ExpertProfile[]>([])
  const [rightData, setRightData] = useState<ExpertProfile[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    code: undefined,
    name: undefined,
    academicRank: undefined,
    academicDegree: undefined,
    specialization: undefined,
    workplace: undefined,
    phone: undefined,
    email: undefined,
  })
  const where = useMemo(
    () => ({
      thesisExpert: true,
      ...(filters.code ? { code: { contains: filters.code, mode: "insensitive" as const } } : {}),
      ...(filters.name ? { name: { contains: filters.name, mode: "insensitive" as const } } : {}),
      ...(filters.academicRank
        ? {
            academicRank: {
              contains: filters.academicRank,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.academicDegree
        ? {
            academicDegree: {
              contains: filters.academicDegree,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.specialization
        ? {
            specialization: {
              contains: filters.specialization,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.workplace
        ? {
            workplace: {
              contains: filters.workplace,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.phone
        ? { phone: { contains: filters.phone, mode: "insensitive" as const } }
        : {}),
      ...(filters.email
        ? { email: { contains: filters.email, mode: "insensitive" as const } }
        : {}),
    }),
    [
      filters.code,
      filters.name,
      filters.academicRank,
      filters.academicDegree,
      filters.specialization,
      filters.workplace,
      filters.phone,
      filters.email,
    ]
  )
  const { data: thesisSession } = useFindUniqueThesisSession({
    where: { id: thesisSessionId },
    include: {
      thesisProject: {
        include: {
          registrations: {
            include: { student: { include: { userProfile: true } } },
          },
          council: {
            include: {
              members: {
                include: {
                  expert: {
                    include: { lecturer: { include: { userProfile: true } } },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  const { data: room = [], refetch } = useFindManyRoom({
    where: {
      active: true,
      ...(searchRoom ? { name: { contains: searchRoom, mode: "insensitive" } } : {}),
    },
  })

  const { data: defenseSession } = useFindManyDefenseSession({})

  const { data: expertProfileData } = useFindManyExpertProfile(
    {
      where,
      include: { lecturer: { include: { userProfile: true } } },
    },
    { refetchOnWindowFocus: false }
  )
  const experts = useMemo(() => {
    if (!thesisSession) return []

    const allExperts = thesisSession.thesisProject?.flatMap(
      (thesis) => thesis.council?.members.filter((m) => m.expert).map((m) => m.expert) || []
    )

    const uniqueExperts = Array.from(new Map(allExperts.map((exp) => [exp.id, exp])).values())

    return uniqueExperts
  }, [thesisSession])
  useEffect(() => {
    if (experts.length) {
      setRightData(experts)

      const filtered = (expertProfileData || []).filter(
        (item) => !experts.some((exp) => exp.id === item.id)
      )
      setLeftData(filtered)
    } else {
      setLeftData(expertProfileData || [])
    }
  }, [expertProfileData, experts])
  const handleSearchRoom = (value: string) => {
    setSearchRoom(value)
    debouncedRefetch()
  }
  const handleCreateCouncil = async () => {
    if (councils && councils.length > 0) {
      Modal.confirm({
        title: "Hội đồng đã tồn tại",
        content: "Phiên này đã có hội đồng được thiết lập. Việc tạo lại sẽ ghi đè lịch bảo vệ cũ.",
        onOk: async () => {
          await executeCreateCouncil()
        },
      })
    } else {
      await executeCreateCouncil()
    }
  }
  const executeCreateCouncil = async () => {
    try {
      const values = await form.validateFields()
      const { defenseSessionIds, defenseDate, roomIds } = values
      const allProjects = [...(thesisSession?.thesisProject || [])]
      const expertPool = [...rightData] //

      const totalProjects = allProjects.length
      const numRooms = roomIds?.length || 0
      const numDates = defenseDate?.length || 0
      const numSessions = defenseSessionIds?.length || 0
      const totalSlots = numRooms * numDates * numSessions

      if (expertPool.length < 5) {
        message.error("Cần ít nhất 5 chuyên gia để lập hội đồng.")
        return
      }

      if (totalSlots < totalProjects) {
        message.error(
          `Không đủ slot! Có ${totalProjects} đề tài nhưng chỉ có ${totalSlots} ô lịch.`
        )
        return
      }

      showSpinner()
      const shuffle = (array: any[]) => array.sort(() => Math.random() - 0.5)

      for (let i = 0; i < totalProjects; i++) {
        const project = allProjects[i]

        const shuffledExperts = shuffle([...expertPool])

        const validExperts = shuffledExperts.filter((exp) => exp.id !== project.supervisorId)

        const chairman = validExperts.find((exp) => exp.eligiblePresident)
        const secretary = validExperts.find(
          (exp) => exp.eligibleSecretary && exp.id !== chairman?.id
        )
        const others = validExperts.filter(
          (exp) => exp.id !== chairman?.id && exp.id !== secretary?.id
        )

        if (!chairman || !secretary || others.length < 3) {
          throw new Error(
            `Không đủ nhân sự phù hợp (Chủ tịch/Thư ký/Thành viên) cho đề tài: ${project.title}`
          )
        }

        const reviewer1 = others[0]
        const reviewer2 = others[1]
        const member = others[2]

        const newCouncil = await createCouncil({
          data: {
            status: "PENDING",
            description: `Hội đồng đề tài: ${project.registrations?.[0]?.student?.userProfile?.fullname}`,
            members: {
              create: [
                { expertId: chairman.id, role: "CHAIRMAN" },
                { expertId: secretary.id, role: "SECRETARY" },
                { expertId: reviewer1.id, role: "REVIEWER_1" },
                { expertId: reviewer2.id, role: "REVIEWER_2" },
                { expertId: member.id, role: "MEMBER" },
              ],
            },
          },
        })

        const roomIdx = i % numRooms
        const sessionIdx = Math.floor(i / numRooms) % numSessions
        const dateIdx = Math.floor(i / (numRooms * numSessions)) % numDates

        await updateProjects({
          where: { id: project.id },
          data: {
            councilId: newCouncil?.id,
            roomId: roomIds?.[roomIdx],
            defenseSessionId: defenseSessionIds?.[sessionIdx],
            defenseDate: dayjs(defenseDate?.[dateIdx], "DD/MM/YYYY").toDate(),
          },
        })
      }

      message.success(`Đã tạo ${totalProjects} hội đồng riêng biệt cho từng đề tài.`)
      // router.reload();
    } catch (error: any) {
      message.error(error.message || "Lỗi hệ thống")
    } finally {
      hideSpinner()
    }
  }
  const minRoomsRequired =
    selectedDefenseSessionIds.length > 0 && selectedDefenseDate.length > 0
      ? Math.ceil(
          (thesisSession?.thesisProject?.length || 0) /
            (selectedDefenseSessionIds.length * selectedDefenseDate.length)
        )
      : 0
  const moveRight = () => {
    const selectedItems = leftData.filter((item) => selectedLeftKeys.includes(item.id))
    setRightData([...rightData, ...selectedItems])
    setLeftData(leftData.filter((item) => !selectedLeftKeys.includes(item.id)))
    setSelectedLeftKeys([])
  }

  const moveLeft = () => {
    const selectedItems = rightData.filter((item) => selectedRightKeys.includes(item.id))
    setLeftData([...leftData, ...selectedItems])
    setRightData(rightData.filter((item) => !selectedRightKeys.includes(item.id)))
    setSelectedRightKeys([])
  }
  const debouncedRefetch = useCallback(
    debounce(() => {
      refetch()
    }, 500),
    []
  )
  const CouncilListTable = () => {
    const [councilPageSize, setCouncilPageSize] = useState(10)
    const mainColumns = [
      {
        title: "Phòng bảo vệ",
        key: "room",
        width: 120,
        render: (_: any, record: any) => (
          <Tag color="blue" className="font-medium">
            {record.thesis?.[0]?.room?.name || "Chưa gán"}
          </Tag>
        ),
      },
      {
        title: "Ca bảo vệ",
        key: "session",
        width: 100,
        render: (_: any, record: any) => {
          const startTime = record.thesis?.[0]?.defenseSession?.startTime
          return startTime ? dayjs(startTime).format("HH:mm") : "N/A"
        },
      },
      {
        title: "Ngày bảo vệ",
        key: "date",
        width: 120,
        render: (_: any, record: any) => {
          const date = record.thesis?.[0]?.defenseDate
          return date ? dayjs(date).format("DD/MM/YYYY") : "N/A"
        },
      },
      {
        title: "Sinh viên",
        key: "student",
        width: 200,
        render: (_: any, record: any) => {
          const student = record.thesis?.[0]?.registrations?.[0]?.student
          console.log(student)
          return (
            <div>
              <div className="font-bold text-primary">
                {student?.userProfile?.fullname || "N/A"}
              </div>
              <div className="text-xs text-gray-500">{student?.code || "N/A"}</div>
            </div>
          )
        },
      },
      {
        title: "Tên đề tài",
        key: "title",
        width: 250,
        render: (_: any, record: any) => (
          <Typography.Text ellipsis={{ tooltip: record.thesis?.[0]?.title }}>
            {record.thesis?.[0]?.title || "N/A"}
          </Typography.Text>
        ),
      },
      {
        title: "Thành viên hội đồng",
        dataIndex: "members",
        key: "members",
        width: 300,
        render: (members: any[]) => (
          <div className="grid grid-cols-1 gap-1">
            {members.map((m) => (
              <div key={m.id} className="text-[13px] leading-5">
                <span className="font-semibold text-gray-700">{getRoleText(m.role)}:</span>{" "}
                <span className="text-gray-600">{m.expert?.name}</span>
              </div>
            ))}
          </div>
        ),
      },
    ]

    return (
      <div className="mt-10 bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <Typography.Title level={4} className="mb-6 flex items-center">
          <div className="w-1 h-6 bg-primary mr-3 rounded-full" />
          Danh sách hội đồng bảo vệ chi tiết
        </Typography.Title>
        <Table
          rowKey="id"
          columns={mainColumns}
          dataSource={councils}
          loading={isLoadingCouncils}
          pagination={{
            pageSize: councilPageSize,
            showSizeChanger: true,
            onShowSizeChange: (size) => {
              setCouncilPageSize(size)
            },
            onChange: (_, size) => {
              setCouncilPageSize(size)
            },
            pageSizeOptions: ["5", "10", "20", "50"],
            showTotal: (total) => `Tổng cộng ${total} hội đồng`,
          }}
          bordered
          scroll={{ x: 1300 }} // Đảm bảo bảng không bị vỡ khi nhiều cột
          className="custom-table"
        />
      </div>
    )
  }
  const getRoleText = (role: string) => {
    const roles: Record<string, string> = {
      CHAIRMAN: "Chủ tịch",
      SECRETARY: "Thư ký",
      REVIEWER_1: "Phản biện 1",
      REVIEWER_2: "Phản biện 2",
      MEMBER: "Ủy viên",
    }
    return roles[role] || role
  }
  if (thesisSession?.thesisProject?.length) {
    return (
      <Col span={24} className="p-2">
        <Form form={form} layout="horizontal" className="w-full mb-6">
          <div className="flex items-start gap-x-4">
            <Form.Item
              name="defenseSessionIds"
              label={<span className="font-semibold">Ca bảo vệ</span>}
              className="mb-0 flex-1"
            >
              <Select
                mode="multiple"
                placeholder="Chọn ca bảo vệ"
                options={defenseSession?.map((item) => ({
                  label: item.startTime ? dayjs(item.startTime).format("HH:mm") : "",
                  value: item.id,
                }))}
                showSearch
                maxTagCount="responsive"
                allowClear
                className="w-full"
                onChange={(values: string[]) => setSelectedDefenseSessionIds(values)}
              />
            </Form.Item>

            <Form.Item
              name="defenseDate"
              label={<span className="font-semibold">Thời gian bảo vệ</span>}
              className="mb-0 flex-1"
            >
              <DatePicker
                multiple
                format="DD/MM/YYYY"
                placeholder="Chọn các ngày"
                className="w-full"
                maxTagCount="responsive"
                onChange={(_date: Dayjs, dateString: string[] | string) => {
                  setSelectedDefenseDate(dateString as string[])
                }}
              />
            </Form.Item>

            <Form.Item
              name="roomIds"
              label={<span className="font-semibold">Phòng bảo vệ</span>}
              className="mb-0 flex-1"
              dependencies={["defenseSessionIds", "defenseDate"]}
              rules={[
                {
                  validator: async (_, values) => {
                    const selectedRoomCount = values?.length || 0
                    if (
                      selectedDefenseSessionIds.length === 0 ||
                      selectedDefenseDate.length === 0
                    ) {
                      return Promise.resolve()
                    }
                    if (selectedRoomCount < minRoomsRequired) {
                      return Promise.reject(new Error(`Cần ít nhất ${minRoomsRequired} phòng.`))
                    }
                    return Promise.resolve()
                  },
                },
              ]}
            >
              <Select
                mode="multiple"
                placeholder="Chọn phòng"
                options={room.map((item) => ({
                  label: item.name,
                  value: item.id,
                }))}
                showSearch
                maxTagCount="responsive"
                onSearch={handleSearchRoom}
                filterOption={false}
                allowClear
                className="w-full"
                onChange={(values: string[]) => setSelectedRoomIds(values)}
              />
            </Form.Item>

            <Form.Item className="mb-0 flex-none">
              <Button onClick={() => handleCreateCouncil()} type="primary" className="h-[32px]">
                Tạo hội đồng bảo vệ
              </Button>
            </Form.Item>
          </div>
        </Form>
        <Col span={24} className="flex flex-row  gap-2">
          <Col span={12}>
            <div
              style={{
                fontWeight: "bold",
              }}
            >
              Danh sách chuyên gia
            </div>

            <Table
              rowKey="id"
              id="expert-profile"
              filters={filters}
              setFilters={(value) => {
                setFilters(value)
                setCurrentPage(1)
              }}
              rowSelection={{
                selectedRowKeys: selectedLeftKeys,
                onChange: setSelectedLeftKeys,
              }}
              columns={[
                {
                  title: "STT",
                  width: 60,
                  align: "center",
                  fixed: "left",
                  render: (_, __, index: number) => index + 1 + (currentPage - 1) * numberOfPages,
                },
                {
                  title: "Tên chuyên gia",
                  dataIndex: "name",
                  width: 150,
                  type: "input",
                  align: "center",
                },
                {
                  title: "Học hàm",
                  dataIndex: "academicRank",
                  width: 150,
                  align: "center",
                  type: "input",
                },
                {
                  title: "Hàm vị",
                  dataIndex: "academicDegree",
                  width: 150,
                  align: "center",
                  type: "input",
                },
                {
                  title: "Chuyên ngành",
                  dataIndex: "specialization",
                  width: 150,
                  align: "center",
                  type: "input",
                },
                {
                  title: "Đơn vị công tác",
                  dataIndex: "workplace",
                  width: 150,
                  align: "center",
                  type: "input",
                },
                {
                  title: "Số điện thoại",
                  dataIndex: "phone",
                  width: 150,
                  align: "center",
                  type: "input",
                },
                {
                  title: "Email",
                  dataIndex: "email",
                  width: 150,
                  align: "center",
                  type: "input",
                },
              ]}
              data={leftData}
            />
          </Col>
          <Col
            span={1}
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <Button onClick={moveRight} disabled={!selectedLeftKeys.length}>
              →
            </Button>
            <Button onClick={moveLeft} disabled={!selectedRightKeys.length}>
              ←
            </Button>
          </Col>
          <Col span={11}>
            <div
              style={{
                fontWeight: "bold",
              }}
            >
              Danh sách chuyên gia hội đồng{" "}
              {selectedDefenseSessionIds.length && selectedDefenseDate.length
                ? `(Cần ít nhất ${
                    Math.ceil(
                      (thesisSession?.thesisProject?.length || 0) /
                        (selectedDefenseSessionIds.length * selectedDefenseDate.length)
                    ) * 5
                  } chuyên gia)`
                : ""}
            </div>
            <Table
              rowKey="id"
              id="expert-profile"
              rowSelection={{
                selectedRowKeys: selectedRightKeys,
                onChange: setSelectedRightKeys,
              }}
              columns={[
                {
                  title: "STT",
                  width: 60,
                  align: "center",
                  fixed: "left",
                  render: (_, __, index: number) => index + 1 + (currentPage - 1) * numberOfPages,
                },
                {
                  title: "Tên chuyên gia",
                  dataIndex: "name",
                  width: 150,
                  align: "center",
                },
                {
                  title: "Học hàm",
                  dataIndex: "academicRank",
                  width: 150,
                  align: "center",
                },
                {
                  title: "Hàm vị",
                  dataIndex: "academicDegree",
                  width: 150,
                  align: "center",
                },
                {
                  title: "Chuyên ngành",
                  dataIndex: "specialization",
                  width: 150,
                  align: "center",
                },
                {
                  title: "Đơn vị công tác",
                  dataIndex: "workplace",
                  width: 150,
                  align: "center",
                },
                {
                  title: "Số điện thoại",
                  dataIndex: "phone",
                  width: 150,
                  align: "center",
                },
                {
                  title: "Email",
                  dataIndex: "email",
                  width: 150,
                  align: "center",
                },
              ]}
              data={rightData}
            />
          </Col>
        </Col>
        <Col span={24}>
          <CouncilListTable />
        </Col>
      </Col>
    )
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-white p-4">
      <div className="max-w-lg w-full text-center animate-fade-in-up">
        <Empty
          image={
            <div className="flex justify-center">
              <div className="relative">
                <InboxOutlined className="relative text-8xl text-primary" />
              </div>
            </div>
          }
          description={
            <div className="mt-2">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">Chưa có đề tài nào</h1>
              <p className="text-base text-gray-500 max-w-sm mx-auto leading-relaxed">
                Hệ thống hiện chưa ghi nhận đề tài luận văn hoặc đề án nào trong đợt xét này
              </p>
            </div>
          }
        >
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="large"
              icon={<ArrowLeftOutlined />}
              className="flex items-center justify-center px-8  h-12 rounded-full"
            >
              Quay lại bảng điều khiển
            </Button>

            <Button
              type="primary"
              size="large"
              icon={<ReloadOutlined />}
              onClick={() => window.location.reload()}
              className="flex items-center justify-center px-8 h-12 rounded-full "
            >
              Làm mới dữ liệu
            </Button>
          </div>
        </Empty>
      </div>
    </div>
  )
}

SettingCouncil.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <DefaultLayout
      breadcrumbList={[
        { title: "Quản lý luận văn" },
        {
          title: "Danh mục luận văn",
          href: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_LUAN_VAN_DANH_MUC_LUAN_VAN,
        },
        { title: "Cấu hình hội đồng" },
      ]}
    >
      {page}
    </DefaultLayout>
  )
}
