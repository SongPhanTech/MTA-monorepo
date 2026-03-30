import Table from "@components/commons/table"
import type { FilterProps } from "@components/commons/typeFilter"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import { useSurveyQuestionTypeOptions } from "@hooks/survey-question-type"
import DefaultLayout from "@layouts/default-layout"
import {
  useCountSurveyQuestion,
  useFindManySurveyQuestion,
  useFindManySurveyQuestionGroup,
  useUpdateSurveyQuestion,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { KHAO_THI_PERMISSION } from "@workspace/router"
import { Button, Col, Flex, message, Row } from "antd"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

function Page() {
  const { can, canSome } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const { options: surveyQuestionTypeOptions, getSurveyQuestionTypeLabel } =
    useSurveyQuestionTypeOptions()

  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
    surveyQuestionType: undefined,
    surveyQuestionGroupId: undefined,
  })

  const where = useMemo(
    () => ({
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
      ...(filters.surveyQuestionGroupId
        ? { surveyQuestionGroupId: { in: filters.surveyQuestionGroupId } }
        : {}),
      ...(filters.surveyQuestionType && filters.surveyQuestionType.length > 0
        ? {
            type: { in: filters.surveyQuestionType },
          }
        : {}),
    }),
    [filters.code, filters.name, filters.surveyQuestionType, filters.surveyQuestionGroupId]
  )

  const { data = [], refetch } = useFindManySurveyQuestion({
    where,
    include: { surveyQuestionGroup: true },
    orderBy: { createdAt: "desc" },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: count } = useCountSurveyQuestion({
    where: {
      ...where,
      deletedAt: null,
    },
  })
  const { data: surveyQuestionGroupData } = useFindManySurveyQuestionGroup({
    orderBy: { createdAt: "desc" },
  })

  const { onOpen } = useDisclosure<{
    id: string
    surveyQuestionGroupId?: string
    type?: string
  }>({
    tag: "PutSurveyQuestionModal",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const handleModal = () => {
    onOpen()
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
    } finally {
      hideSpinner()
    }
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Flex justify="end">
            {can(KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_CAU_HOI_KHAO_SAT, "THEM") && (
              <Button onClick={handleModal} type="primary">
                Thêm mới
              </Button>
            )}
          </Flex>
        </Col>
        <Col span={24}>
          <Table
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
                render: (_, __, index) => index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
              },
              {
                title: "Tên câu hỏi khảo sát",
                dataIndex: "name",
                type: "input",
              },
              {
                title: "Nhóm câu hỏi khảo sát",
                dataIndex: "surveyQuestionGroupId",
                type: "select",
                options: surveyQuestionGroupData?.map(({ id, name }) => ({
                  value: id,
                  label: name,
                })),
                render: (_, record) =>
                  record?.surveyQuestionGroup ? record.surveyQuestionGroup.name : "",
              },
              {
                title: "Loại câu hỏi khảo sát",
                dataIndex: "surveyQuestionType",
                type: "select",
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
                        onClick={onOpen.bind(null, {
                          id,
                          surveyQuestionGroupId,
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

export default Page
Page.getLayout = function getLayout(page: React.ReactNode) {
  return <DefaultLayout>{page}</DefaultLayout>
}
