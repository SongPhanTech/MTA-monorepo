import { DownloadOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import type { FilterProps } from "@components/commons/typeFilter"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import { useSurveyQuestionTypeOptions } from "@hooks/survey-question-type"
import { $Enums } from "@workspace/db/client"
import {
  useCountSurveyQuestion,
  useFindManySurveyQuestion,
  useFindManySurveyQuestionGroup,
  useUpdateSurveyQuestion,
} from "@workspace/db/hooks"
import { getMinioUrl } from "@workspace/libs/utils"
import { useAbility } from "@workspace/permissions/hooks"
import { KHAO_THI_PERMISSION } from "@workspace/router"
import { Button, Col, Flex, message, Row } from "antd"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

function CauHoiKhaoSat({
  id,
  type,
  surveyTopicId,
}: {
  id?: string
  type: string
  surveyTopicId?: string
}) {
  const isLecturerSurvey = type === $Enums.SurveyType.CLUSTER
  const { can, canSome } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const { options: surveyQuestionTypeOptions, getSurveyQuestionTypeLabel } =
    useSurveyQuestionTypeOptions()
  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
    surveyQuestionType: undefined,
    surveyId: undefined,
  })

  const { data: topicQuestionGroups = [] } = useFindManySurveyQuestionGroup(
    {
      where: {
        surveyTopic: {
          some: {
            id: surveyTopicId,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 1,
    },
    {
      enabled: !!surveyTopicId,
    }
  )

  const defaultQuestionGroupId = topicQuestionGroups[0]?.id || ""
  const questionGroupId = isLecturerSurvey ? defaultQuestionGroupId : id

  const where = useMemo(
    () => ({
      ...(isLecturerSurvey && surveyTopicId
        ? {
            surveyQuestionGroup: {
              surveyTopic: {
                some: {
                  id: surveyTopicId,
                },
              },
            },
          }
        : {
            surveyQuestionGroupId: id,
          }),
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
      ...(filters.surveyId
        ? Array.isArray(filters.surveyId)
          ? { surveyId: { in: filters.surveyId } }
          : { surveyId: filters.surveyId }
        : {}),
      ...(filters.surveyQuestionType && filters.surveyQuestionType.length > 0
        ? {
            type: { in: filters.surveyQuestionType },
          }
        : {}),
    }),
    [
      filters.code,
      filters.name,
      filters.surveyId,
      filters.surveyQuestionType,
      id,
      isLecturerSurvey,
      surveyTopicId,
    ]
  )

  const { data = [] } = useFindManySurveyQuestion(
    {
      where,
      include: { survey: true },
      orderBy: { createdAt: "asc" },
      take: numberOfPages,
      skip: (currentPage - 1) * numberOfPages,
    },
    {
      enabled: isLecturerSurvey ? !!surveyTopicId : !!id,
    }
  )

  const { data: count } = useCountSurveyQuestion({
    where: {
      ...where,
      deletedAt: null,
    },
  })
  // const { data: surveyData } = useFindManySurvey({ orderBy: { createdAt: 'desc' } })

  const { onOpen: openSurveyQuestionModal } = useDisclosure<{
    id: string
    surveyQuestionGroupId?: string
    type?: string
    surveyTopicId?: string
  }>({
    tag: "PutSurveyQuestionModal",
  })
  const { onOpen: openImportQuestionModal } = useDisclosure<{
    id: string
    surveyQuestionGroupId?: string
    type?: string
    surveyTopicId?: string
  }>({
    tag: "PutSurveyImportQuestionModal",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const handleModal = () => {
    openSurveyQuestionModal({
      id: "",
      surveyQuestionGroupId: questionGroupId,
      type,
      surveyTopicId,
    })
  }
  const handleImport = () => {
    openImportQuestionModal({
      id: questionGroupId || "",
      surveyQuestionGroupId: questionGroupId,
      type,
      surveyTopicId,
    })
  }

  const { mutateAsync: updateSurveyQuestion } = useUpdateSurveyQuestion()

  async function handleDelete(id: string) {
    try {
      showSpinner()
      await updateSurveyQuestion({
        where: {
          id,
        },
        data: {
          deletedAt: new Date(),
        },
      })
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    }
    hideSpinner()
  }

  return (
    <div>
      <Row gutter={[16, 8]}>
        <Col span={24}>
          <Flex justify="end" className="gap-2">
            <Button
              size="small"
              icon={<DownloadOutlined />}
              href={getMinioUrl("mta/template/Mau-import-cau-hoi-khao-sat.docx")}
              type="primary"
            >
              Tải file mẫu
            </Button>
            <Button onClick={handleImport} type="primary" size="small">
              Import câu hỏi
            </Button>
            {can(KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_CAU_HOI_KHAO_SAT, "THEM") && (
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
            columns={[
              {
                title: "STT",
                width: 20,
                align: "center",
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Tên câu hỏi",
                dataIndex: "name",
                type: "input",
              },

              {
                title: "Loại câu hỏi",
                dataIndex: "surveyQuestionType",
                type: "select",
                width: 150,
                options: surveyQuestionTypeOptions,
                render: (_, record) => getSurveyQuestionTypeLabel(record?.type),
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                hidden: !canSome(
                  KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_CAU_HOI_KHAO_SAT,
                  "SUA",
                  "XOA"
                ),
                render: (_, { id, surveyQuestionGroupId }) => (
                  <Row className="justify-center gap-2">
                    {can(
                      KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_CAU_HOI_KHAO_SAT,
                      "SUA"
                    ) && (
                      <EditIcon
                        onClick={openSurveyQuestionModal.bind(null, {
                          id,
                          surveyQuestionGroupId,
                          type,
                        })}
                        className="text-sm text-blue-700 cursor-pointer"
                      />
                    )}
                    {can(
                      KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_CAU_HOI_KHAO_SAT,
                      "XOA"
                    ) && (
                      <DeleteIcon
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

export default CauHoiKhaoSat
