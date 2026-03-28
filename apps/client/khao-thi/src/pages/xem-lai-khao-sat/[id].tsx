import Loading from "@components/commons/loading"
import Table from "@components/commons/table"
import useSpinner from "@hooks/spinner"
import KhaoSatPrivateLayout from "@layouts/khao-sat-layout/private"
import { useSession } from "@workspace/auth/react"
import { useFindFirstSurveySession } from "@workspace/db/hooks"
import { Button, Col, Input, Row } from "antd"

import { useRouter } from "next/router"
import { useMemo } from "react"

type GroupedSurveyQuestion = {
  id: string // group id
  name: string // group name
  children: {
    id: string
    name: string
    type: string
    requireExplanation: boolean
  }[]
}

function TakeTestPage() {
  const router = useRouter()
  const { showSpinner, hideSpinner } = useSpinner()
  const id = router.query.id as string
  // const surveyObjectTypeId = router.query.surveyObjectTypeId as string

  const { data: session } = useSession()
  const profileId = session?.sDM_NhanVienId || ""

  // const { data } =  useGetPublicSurvey(id)
  const { data, isLoading } = useFindFirstSurveySession(
    {
      where: {
        profileId,
        surveyId: id,
      },
      include: {
        responses: {
          include: {
            surveyQuestion: {
              include: {
                surveyQuestionGroup: true,
              },
            },
          },
        },
        survey: {
          include: {
            surveyChoice: true,
          },
        },
      },
    },
    {
      enabled: !!id && !!profileId,
    }
  )
  // const {  }=useValidateUserSurvey()

  const dataTest = useMemo(() => {
    const list =
      data?.responses.map((i) => {
        return {
          ...i?.surveyQuestion,
        }
      }) ?? []
    const groupedMap = list.reduce<Record<string, GroupedSurveyQuestion>>(
      (acc: any, item: any, index: number) => {
        const groupId = item.surveyQuestionGroupId

        if (!acc[groupId]) {
          acc[groupId] = {
            id: item.surveyQuestionGroup.id,
            name: item.surveyQuestionGroup.name,
            children: [],
          }
        }

        acc[groupId].children.push({
          id: item.id,
          name: item.name,
          type: item.type,
        })

        return acc
      },
      {}
    )

    // Chuyển thành array
    const grouped: GroupedSurveyQuestion[] = Object.values(groupedMap).map((i: any, index) => {
      return { ...i, name: `${index + 1}. ${i.name}` }
    })
    return grouped || []
    // return classGroups
  }, [data])

  const checkedQuestion = (qId: string, aId: string) => {
    const result = data?.responses.find(
      (i) => i.surveyQuestionId === qId && i.surveyChoiceId === aId
    )
    if (result) {
      return true
    }
    return false
  }

  return isLoading ? (
    <Loading />
  ) : !!data?.responses && data?.responses?.length > 0 ? (
    <div>
      <div className="text-xl font-bold">{data?.survey?.name}</div>
      {data?.survey?.surveyChoice?.length && (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Table
              rowKey="id"
              dataSource={[{ id: "abc" }]}
              columns={data?.survey.surveyChoice.map((i) => {
                return {
                  title: `${i?.description} ${i?.requireExplanation === true ? "*" : ""}`,
                  dataIndex: i?.id,
                  key: i?.id,
                  align: "center",
                  render: () => (
                    <div className="flex items-center justify-center">
                      <Button className="flex items-center justify-center w-6 h-6 border-solid border-[1px] border-[#ed9e9e] text-[#ea1212] text-[12px]">
                        {i?.answer}
                      </Button>
                    </div>
                  ),
                }
              })}
              pagination={false}
            />
          </Col>

          <Col span={24}>
            {dataTest.map((section, sectionIndex) => (
              <div key={section.id} className="mb-2">
                <div className="font-bold mb-1">{section.name}</div>

                {section.children?.map((q, qIndex) => {
                  return (
                    <div key={q.id} className="px-4">
                      {q.type === "SINGLE_CHOICE" ? (
                        <>
                          <div className="flex items-center w-full justify-between mb-2">
                            <div className="mb-2">
                              {sectionIndex + 1}.{qIndex + 1}. {q.name}
                            </div>
                            <div className="flex items-center justify-end">
                              {data?.survey?.surveyChoice.map((i) => {
                                return (
                                  <Button
                                    key={i.id}
                                    className={`flex items-center justify-center w-6 h-6 border-solid border-[1px] border-[#ed9e9e] text-[#ea1212] text-[12px] mr-2  ${checkedQuestion(q?.id, i.id) ? "!bg-[#ea1212] text-white" : "bg-white text-[#ea1212]"}`}
                                  >
                                    {i.answer}
                                  </Button>
                                )
                              })}
                            </div>
                          </div>

                          {/* Nếu requireExplanation true thì hiển thị input */}
                          {q?.requireExplanation && <Input.TextArea placeholder="Nhập lý do" />}
                        </>
                      ) : (
                        // ESSAY
                        <>
                          <div className="mb-2">
                            {sectionIndex + 1}.{qIndex + 1}. {q.name}
                          </div>
                          <Input.TextArea placeholder="Nhập lý do" />
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </Col>
        </Row>
      )}
    </div>
  ) : (
    <div>
      <div className="text-xl font-bold">Bạn chưa làm khảo sát này</div>
    </div>
  )
}

export default TakeTestPage
TakeTestPage.getLayout = function getLayout(page: React.ReactNode) {
  return <KhaoSatPrivateLayout headerName="Xem lại khảo sát">{page}</KhaoSatPrivateLayout>
}
