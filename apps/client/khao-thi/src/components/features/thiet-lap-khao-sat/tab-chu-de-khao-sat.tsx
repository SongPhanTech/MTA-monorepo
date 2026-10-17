import Table from "@components/commons/table"
import type { FilterProps } from "@components/commons/typeFilter"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import { cn } from "@lib/utils"
import type { SurveyTopic } from "@workspace/db"
import {
  useCountSurveyTopic,
  useFindManySurveyTopic,
  useUpdateSurveyTopic,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { KHAO_THI_PERMISSION } from "@workspace/router"
import { Button, Col, Flex, message, Row } from "antd"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

function TabChuDeKhaoSat({
  topicSlected,
  setTopicSelected,
}: {
  topicSlected: SurveyTopic | null
  setTopicSelected: (key: SurveyTopic | null) => void
}) {
  const { can, canSome } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
  })

  const where = useMemo(
    () => ({
      deletedAt: null,
      ...(filters.code && filters.code !== ""
        ? {
            code: {
              contains: filters.code,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.name && filters.name !== ""
        ? {
            name: {
              contains: filters.name,
              mode: "insensitive" as const,
            },
          }
        : {}),
    }),
    [filters.code, filters.name]
  )

  const { data = [], refetch } = useFindManySurveyTopic({
    where,
    include: {
      surveyQuestionGroup: {
        where: {
          deletedAt: null,
        },
        include: {
          surveyQuestion: {
            where: {
              deletedAt: null,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: count } = useCountSurveyTopic({ where })

  const { onOpen, onClose } = useDisclosure<string>({
    tag: "PutSurveyTopicModal",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const handleModal = () => {
    onOpen()
  }
  const { mutateAsync: updateSurveyObjectType } = useUpdateSurveyTopic()

  async function handleDelete(id: string) {
    try {
      showSpinner()
      await updateSurveyObjectType({
        where: {
          id,
        },
        data: {
          deletedAt: new Date(),
        },
      })
      refetch()
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
      <Row gutter={[16, 8]}>
        <Col span={24}>
          <Flex justify="end">
            {can(KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_THIET_LAP_CHUNG, "THEM") && (
              <Button onClick={handleModal} type="primary" size="small">
                Thêm mới
              </Button>
            )}
          </Flex>
        </Col>
        <Col span={24}>
          <Table
            className="h-[calc(100vh-230px)]"
            rowKey="id"
            filters={filters}
            setFilters={(value) => {
              setFilters(value)
              setCurrentPage(1)
            }}
            onRow={(record) => {
              return {
                onClick: () => {
                  setTopicSelected(record as SurveyTopic)
                },
                className: cn(topicSlected?.id === record.id ? "bg-orange-200" : ""),
              }
            }}
            columns={[
              {
                title: "STT",
                width: 20,
                align: "center",
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Mã chủ đề khảo sát",
                dataIndex: "code",
                type: "input",
              },
              {
                title: "Tên chủ đề khảo sát",
                dataIndex: "name",
                type: "input",
              },
              {
                title: "Loại khảo sát",
                dataIndex: "type",
                type: "input",
                render: (__, record) => {
                  return record.type === "CLUSTER" ? "Khảo sát giảng viên" : "Khảo sát chung"
                },
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                hidden: !canSome(
                  KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_THIET_LAP_CHUNG,
                  "SUA",
                  "XOA"
                ),
                render: (_, { id, surveyQuestionGroup, type }: any) => (
                  <Row className="justify-center gap-2">
                    {can(
                      KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_THIET_LAP_CHUNG,
                      "SUA"
                    ) && (
                      <EditIcon
                        onClick={onOpen.bind(null, id)}
                        className="text-sm text-blue-700 cursor-pointer"
                      />
                    )}
                    {can(
                      KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_THIET_LAP_CHUNG,
                      "XOA"
                    ) && (
                      <DeleteIcon
                        disabled={
                          type === "CLUSTER"
                            ? surveyQuestionGroup.some(
                                (group: any) => group.surveyQuestion?.length > 0
                              )
                            : surveyQuestionGroup.length > 0
                        }
                        popConfirm={{
                          onConfirm: () => handleDelete(id),
                        }}
                      />
                    )}
                  </Row>
                ),
              },
            ]}
            data={data}
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
          />
        </Col>
      </Row>
    </div>
  )
}

export default TabChuDeKhaoSat
