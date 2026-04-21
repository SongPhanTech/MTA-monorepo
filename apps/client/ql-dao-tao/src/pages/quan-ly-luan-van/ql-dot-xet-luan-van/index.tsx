import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import SettingsIcon from "@components/icons/settings"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import {
  useCountThesisSession,
  useFindManyThesisSession,
  useUpdateThesisSession,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION, ROUTER_PATH } from "@workspace/router"
import { Button, Col, Flex, message, Row } from "antd"
import dayjs from "dayjs"
import { BookPlus } from "lucide-react"
import { useRouter } from "next/router"
import type React from "react"
import { useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function ThesisSession() {
  const { can, canSome } = useAbility()
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    name: "",
    sessionDate: undefined,
    applicationStart: undefined,
    applicationEnd: undefined,
    statusGraduationSession: undefined,
  })

  const { data: thesisSessionData } = useFindManyThesisSession({
    where: {
      ...(filters.name && filters.name !== ""
        ? {
            name: {
              contains: filters.name,
              mode: "insensitive",
            },
          }
        : {}),
      ...(filters.sessionDate?.length === 2
        ? {
            startDate: {
              gte: dayjs(filters.sessionDate?.[0], "DD/MM/YYYY").toDate(),
              lte: dayjs(filters.sessionDate?.[1], "DD/MM/YYYY").toDate(),
            },
          }
        : {}),
    },
    include: {
      trainingObjectType: true,
      trainingCourse: true,
    },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: count } = useCountThesisSession({
    where: {
      ...(filters.name && filters.name !== ""
        ? {
            name: {
              contains: filters.name,
              mode: "insensitive",
            },
          }
        : {}),
      ...(filters.sessionDate?.length === 2
        ? {
            startDate: {
              gte: dayjs(filters.sessionDate?.[0], "DD/MM/YYYY").toDate(),
              lte: dayjs(filters.sessionDate?.[1], "DD/MM/YYYY").toDate(),
            },
          }
        : {}),
      deletedAt: null,
    },
  })
  const { mutateAsync: updateThesisSession } = useUpdateThesisSession()

  const { onOpen } = useDisclosure<string>({
    tag: "PutThesisSession",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const handleModal = () => {
    onOpen()
  }
  const handleNavigateSetting = (id: string) => {
    router.push(
      ROUTER_PATH.QL_DAO_TAO.QUAN_LY_LUAN_VAN_QL_DOT_XET_LUAN_VAN_CAU_HINH_HOI_DONG_ID.replace(
        "[id]",
        id
      )
    )
  }

  async function handleDelete(id: string) {
    try {
      showSpinner()
      await updateThesisSession({
        where: {
          id,
        },
        data: {
          deletedAt: new Date(),
        },
      })
      message.success("Xóa thành công")
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  return (
    <div>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <Row gutter={[16, 16]} align="top" justify="space-between">
            <Col span={24}>
              <Flex justify="end">
                {can(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_LUAN_VAN_QL_DOT_XET_LUAN_VAN,
                  "THEM"
                ) && (
                  <Button onClick={handleModal} type="primary">
                    <BookPlus />
                    Thêm
                  </Button>
                )}
              </Flex>
            </Col>
          </Row>
        </Col>

        <Col span={24}>
          <Table
            rowKey="id"
            id="thesis-session"
            filters={filters}
            setFilters={(value) => {
              setFilters(value)
              setCurrentPage(1)
            }}
            columns={[
              {
                title: "STT",
                width: 60,
                align: "center",
                fixed: "left",
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Tên đợt",
                dataIndex: "name",
                width: 180,
                type: "input",
                align: "center",
              },
              {
                title: "Đối tượng đào tạo",
                width: 180,
                align: "center",
                render: (_, record) => record?.trainingObjectType?.name || "",
              },
              {
                title: "Khoá học",
                dataIndex: "trainingCourseId",
                width: 140,
                align: "center",
                render: (_, record) => record?.trainingCourse.name || "",
              },
              {
                title: "Số QĐĐT",
                dataIndex: "decisionNumber",
                width: 160,
                align: "center",
              },
              {
                title: "Ngày QĐĐT",
                dataIndex: "decisionDate",
                width: 170,
                align: "center",
                render: (_, record) =>
                  record?.decisionDate ? dayjs(record.decisionDate).format("DD/MM/YYYY") : "",
              },
              {
                title: "Số QĐBVLV",
                dataIndex: "defenseDecisionNumber",
                width: 160,
                align: "center",
              },
              {
                title: "Ngày QĐBVLV",

                width: 170,
                align: "center",
                render: (_, record) =>
                  record?.defenseDecisionDate
                    ? dayjs(record.defenseDecisionDate).format("DD/MM/YYYY")
                    : "",
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                fixed: "right",
                hidden: !canSome(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_LUAN_VAN_QL_DOT_XET_LUAN_VAN,
                  "XEM_CHI_TIET",
                  "SUA",
                  "XOA"
                ),
                render: (_, { id }) => {
                  if (id) {
                    return (
                      <Row className="justify-center gap-2">
                        {can(
                          QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_LUAN_VAN_QL_DOT_XET_LUAN_VAN,
                          "SUA"
                        ) && (
                          <EditIcon
                            onClick={(e) => {
                              e.stopPropagation()
                              onOpen(id)
                            }}
                            className="text-sm text-blue-700 cursor-pointer"
                          />
                        )}
                        {can(
                          QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_LUAN_VAN_QL_DOT_XET_LUAN_VAN,
                          "XOA"
                        ) && (
                          <DeleteIcon
                            popConfirm={{
                              onConfirm: (e) => {
                                e?.stopPropagation()
                                handleDelete(id)
                              },
                              onCancel: (e) => {
                                e?.stopPropagation()
                              },
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        <SettingsIcon
                          title="Cấu hình đợt xét luận văn"
                          onClick={() => handleNavigateSetting(id)}
                        />
                      </Row>
                    )
                  }
                  return ""
                },
              },
            ]}
            pagination={{
              current: currentPage,
              pageSize: numberOfPages,
              total: count,

              onChange: (page, pageSize) => {
                if (numberOfPages === pageSize) {
                  setCurrentPage(page)
                } else {
                  setCurrentPage(1)
                  setNumberOfPages(pageSize)
                }
              },
            }}
            data={thesisSessionData}
          />
        </Col>
      </Row>
    </div>
  )
}

ThesisSession.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
