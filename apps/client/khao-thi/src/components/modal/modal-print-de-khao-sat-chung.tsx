import { FileWordOutlined } from "@ant-design/icons"
import { toRoman } from "@lib/utils"
import { useFindUniqueSurvey } from "@workspace/db/hooks"
import { Button, Col, Input, message, Modal, Radio, Row, Table } from "antd"
import dayjs from "dayjs"
import { useMemo } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { exportSurveyFormDocx, toDocxFileName } from "@/utils/export-survey-form-docx"

dayjs.locale("vi")

const SURVEY_NOTES = [
  'Để đóng góp phần tìm ra những giải pháp nhằm nâng cao chất lượng đào tạo của Học viện đề nghị đồng chí (anh/chị) vui lòng điền đầy đủ thông tin trả lời các câu hỏi dưới dây bằng cách đánh dấu "X" vào một ô phù hợp nhất trong mục "các phương án trả lời".',
  "Thông tin đồng chí (anh/chị) cung cấp sẽ được Học viện xử lý khách quan và bảo mật",
]
type GroupedSurveyQuestion = {
  id: string // group id
  name: string // group name
  question: {
    id: string
    name: string
    type: string
  }[]
}
const ModalPrintExamSurvey = () => {
  const { isOpen, onClose, input } = useDisclosure<{
    id: string
  }>({
    tag: "ModalPrintExamSurvey",
  })

  const { data: survey } = useFindUniqueSurvey({
    where: {
      id: input?.id,
    },
    include: {
      surveyChoice: true,
      surveyQuestion: {
        include: {
          surveyQuestionGroup: true,
          specificChoice: true,
        },
      },
    },
  })

  const { grouped, flatData } = useMemo(() => {
    const groupedMap = (survey?.surveyQuestion ?? []).reduce<Record<string, GroupedSurveyQuestion>>(
      (acc: any, item: any, index: number) => {
        const groupId = item.surveyQuestionGroupId

        if (!acc[groupId]) {
          acc[groupId] = {
            ...item,
            id: item.surveyQuestionGroup.id,
            name: item.surveyQuestionGroup.name,
            question: [],
            isParent: true,
          }
        }

        acc[groupId].question.push({
          ...item,
          id: item.id,
          name: item.name,
          type: item.type,
          isParent: false,
          index: index + 1,
        })

        return acc
      },
      {}
    )

    // Chuyển thành array

    const grouped: GroupedSurveyQuestion[] = Object.values(groupedMap).map((i: any, index) => {
      return { ...i, index: toRoman(index + 1) }
    })
    // const general=grouped.filter((i)=>i?.)
    const flatData = grouped.flatMap((i) => [i, ...(i.question || [])])
    return { grouped, flatData }
    // return classGroups
  }, [survey])

  const handleExportWord = async () => {
    if (!survey) return

    try {
      await exportSurveyFormDocx({
        headerLeft: "HỌC VIỆN KTQS",
        formCode: "Mẫu số 11-ĐBCL",
        title: survey?.name,
        notes: SURVEY_NOTES,
        infoTitle: "I. THÔNG TIN CHUNG",
        infoFields: [
          { label: "Chuyên ngành: " },
          { label: "Khoa (Viện): " },
          { label: "Lớp: " },
          { label: "Khoá: " },
          { label: "Đối tượng đào tạo: ", fullWidth: true },
        ],
        contentTitle: "II. NỘI DUNG ĐÁNH GIÁ",
        choices: survey?.surveyChoice ?? [],
        groups: grouped.map((group) => ({
          id: group.id,
          name: group.name,
          questions: group.question ?? [],
        })),
        fileName: toDocxFileName("Phieu khao sat", survey?.name),
      })
    } catch (error) {
      console.error(error)
      message.error("Không thể xuất file Word")
    }
  }

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={1000}
      style={{ top: 20 }}
      title={
        <div className="flex items-center justify-between w-[95%]">
          <span>Xem đề khảo sát</span>
          <Button
            icon={<FileWordOutlined />}
            onClick={handleExportWord}
            size="small"
            type="primary"
          >
            Tải file Word
          </Button>
        </div>
      }
    >
      <div className="mx-auto p-6 text-sm leading-relaxed !font-time-news-roman">
        <div className="flex justify-between items-start mb-2 color-black font-bold text-base">
          <div className="uppercase">HỌC VIỆN KTQS</div>
          <div className="italic">Mẫu số 11-ĐBCL</div>
        </div>
        <div className="text-xl font-bold mb-4 text-center uppercase color-black">
          {survey?.name}
        </div>
        <Row gutter={[0, 2]} className="mb-3 color-black">
          <Col span={24}>
            <div className="italic indent-8 mt-4">
              Để đóng góp phần tìm ra những giải pháp nhằm nâng cao chất lượng đào tạo của Học viện
              đề nghị đồng chí (anh/chị) vui lòng điền đầy đủ thông tin trả lời các câu hỏi dưới dây
              bằng cách đánh dấu "X" vào một ô phù hợp nhất trong mục "các phương án trả lời".
            </div>
          </Col>
          <Col span={24}>
            <div className="italic indent-8">
              Thông tin đồng chí (anh/chị) cung cấp sẽ được Học viện xử lý khách quan và bảo mật
            </div>
          </Col>
          <Col span={24}>
            <div className="indent-8 uppercase font-bold">I. Thông tin chung</div>
          </Col>
          <Col span={12}>
            <div className="flex items-end">
              <div className="!w-fit whitespace-nowrap">Chuyên ngành: </div>
              <span className="w-full mb-1 h-6 border-[0px] border-b-[1px] border-dotted border-black" />
            </div>
          </Col>
          <Col span={12}>
            <div className="flex items-end">
              <div className="!w-fit whitespace-nowrap">Khoa (Viện): </div>
              <span className="w-full mb-1 h-6 border-[0px] border-b-[1px] border-dotted border-black" />
            </div>
          </Col>
          <Col span={12}>
            <div className="flex items-end">
              <div className="!w-fit whitespace-nowrap">Lớp: </div>
              <span className="w-full mb-1 h-6 border-[0px] border-b-[1px] border-dotted border-black" />
            </div>
          </Col>
          <Col span={12}>
            <div className="flex items-end">
              <div className="!w-fit whitespace-nowrap">Khoá: </div>
              <span className="w-full mb-1 h-6 border-[0px] border-b-[1px] border-dotted border-black" />
            </div>
          </Col>
          <Col span={24}>
            <div className="flex items-end">
              <div className="!w-fit whitespace-nowrap">Đối tượng đào tạo: </div>
              <span className="w-full mb-1 h-6 border-[0px] border-b-[1px] border-dotted border-black" />
            </div>
          </Col>
          <div className="indent-8 uppercase font-bold">II. Nội dung đánh giá</div>
        </Row>
        {survey?.surveyChoice?.length && (
          <Row gutter={[16, 4]}>
            <Col span={24}>
              <Table
                rowKey="id"
                dataSource={[{ id: "abc" }]}
                className="custom-red-table"
                rowClassName={(record: any) => (record.isParent ? "group-row" : "")}
                columns={survey.surveyChoice.map((i) => {
                  return {
                    title: `${i?.description} ${i?.requireExplanation === true ? "*" : ""}`,
                    dataIndex: i?.id,
                    key: i?.id,
                    align: "center",
                    render: () => (
                      <div className="flex items-center justify-center">
                        <Button className="flex items-center justify-center w-6 h-6 border-solid border-[1px] border-[#ed9e9e] text-[#ea1212]  text-[12px]">
                          {i?.answer}
                        </Button>
                      </div>
                    ),
                  }
                })}
                pagination={false}
              />
            </Col>

            <Col span={24} className="my-3">
              <Table
                rowKey="id"
                dataSource={flatData}
                className="custom-red-table"
                rowClassName={(record: any) => (record.isParent ? "group-row" : "")}
                pagination={false}
                columns={[
                  {
                    title: "STT",
                    width: 50,
                    align: "center",
                    render: (_, record: any) => {
                      return (
                        <div className={`${record.isParent ? "font-semibold" : ""}`}>
                          {record?.index}
                        </div>
                      )
                    },
                  },
                  {
                    title: "Nội dung phản hồi",
                    dataIndex: "content",
                    render: (_, record) => {
                      return record.isParent ? (
                        <div className="font-semibold uppercase">{record?.name}</div>
                      ) : record?.type === "ESSAY" ? (
                        <div>
                          <div
                            dangerouslySetInnerHTML={{
                              __html: record?.name,
                            }}
                          />

                          <Input.TextArea
                            placeholder="Nhập câu trả lời"
                            className="pointer-events-none"
                          />
                        </div>
                      ) : record?.specificChoice?.length > 0 ? (
                        <div>
                          <div
                            dangerouslySetInnerHTML={{
                              __html: record?.name,
                            }}
                          />

                          <Radio.Group className="w-full gap-x-2 flex pointer-events-none">
                            {survey?.surveyChoice.map((i, index: number) => (
                              <Radio key={i?.id} value={i?.id} className="relative">
                                <div>{record?.specificChoice[index]?.description}</div>
                              </Radio>
                            ))}
                          </Radio.Group>
                        </div>
                      ) : (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: record?.name,
                          }}
                        />
                      )
                    },
                    onCell: (record, rowIndex) => {
                      return {
                        colSpan:
                          record.isParent ||
                          record?.specificChoice?.length > 0 ||
                          record?.type === "ESSAY"
                            ? 2
                            : 1,
                      }
                    },
                  },
                  {
                    title: "Mức phản hồi",
                    width: 200,
                    align: "center",
                    onCell: (record, rowIndex) => {
                      return {
                        colSpan:
                          record.isParent ||
                          record?.specificChoice?.length > 0 ||
                          record?.type === "ESSAY"
                            ? 0
                            : 1,
                      }
                    },
                    render: (_, record, qIndex) => {
                      return (
                        record?.type === "SINGLE_CHOICE" && (
                          <Radio.Group className="w-full gap-x-2 flex pointer-events-none">
                            {survey?.surveyChoice.map((i) => (
                              <Radio.Button key={i?.id} value={i?.id}>
                                {i?.answer}
                              </Radio.Button>
                            ))}
                          </Radio.Group>
                        )
                      )
                    },
                  },
                ]}
                bordered={true}
              />
              {/* <Table
                                rowKey="id"
                                dataSource={data?.surveyQuestion || []}
                                pagination={false}
                                columns={[
                                    {
                                        title: 'STT',
                                        width: 50,
                                        align: 'center',
                                        render: (_, __, index) => index + 1,
                                    },
                                    {
                                        title: 'Nội dung phản hồi',
                                        dataIndex: 'content',
                                        render: (_, record) => {
                                            return (
                                                <div
                                                    dangerouslySetInnerHTML={{
                                                        __html: record?.name,
                                                    }}
                                                />
                                            )
                                        },
                                    },
                                    {
                                        title: 'Mức phản hồi',
                                        dataIndex: 'level',
                                        width: 200,
                                        align: 'center',
                                        render: (_, record) => {
                                            return record?.type === 'SINGLE_CHOICE' ? (
                                                <div className="w-full flex items-center justify-center gap-x-2">
                                                    {data?.surveyChoice.map((i) => {
                                                        return (
                                                            <div className="flex items-center justify-center">
                                                                <Button className="flex items-center justify-center w-6 h-6 border-solid border-[1px] border-[#b0d2bb] text-[#red] text-[12px]">
                                                                    {i?.answer}
                                                                </Button>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            ) : (
                                                <Input.TextArea placeholder="Nhập câu trả lời" className="pointer-events-none" />
                                            )
                                        },
                                    },
                                ]}
                                bordered={true}
                            /> */}
            </Col>
          </Row>
        )}
      </div>
      <style>
        {`
                    .custom-red-table .ant-table-thead > tr > th {
                        background: #fff !important;
                        border: 0.5px solid #red !important;
                    }

                    .custom-red-table .group-row > td {
                        background: #fff !important;
                        border: 0.5px solid #red !important;
                        font-weight: 700;
                    }

                    .custom-red-table .ant-table,
                    .custom-red-table .ant-table-container,
                    .custom-red-table .ant-table-content table,
                    .custom-red-table .ant-table-cell {
                        border: 0.5px solid #red !important;
                    }

                    .custom-red-table .ant-radio-inner {
                        border: 0.5px solid #red !important;
                        background: white !important;
                        box-shadow: none !important;
                    }

                    .custom-red-table .ant-radio-checked .ant-radio-inner {
                    border-color: #red !important;
                    background: white !important;
                    }

                    .custom-red-table .ant-radio-checked .ant-radio-inner::after {
                        background: #red !important;
                        transform: scale(1) !important;
                    }

                    .custom-red-table .ant-radio-wrapper:hover .ant-radio-inner,
                    .custom-red-table .ant-radio-input:focus + .ant-radio-inner {
                        border-color: #red !important;
                        box-shadow: none !important;
                    }

                    .custom-red-table .ant-radio-input:focus {
                        outline: none !important;
                    }

                    .custom-red-table .ant-radio-button-wrapper {
                        border-color: #red !important;
                    }

                    .custom-red-table .ant-radio-button-wrapper-checked {
                        background: #red !important;
                        border-color: #red !important;
                        color: #ffffff !important;
                    }

                    .custom-red-table textarea,
                    .custom-red-table .ant-input {
                        border: 0.5px solid #red !important;
                        box-shadow: none !important;
                    }

                    .custom-red-table textarea:focus,
                    .custom-red-table .ant-input:focus,
                    .custom-red-table .ant-input-focused {
                        border: 0.5px solid #red !important;
                        box-shadow: none !important;
                        outline: none !important;
                    }
                        
                    @media print {
                    .color-black {
                        color: #000 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                        .page {
                            width: 210mm;
                            min-height: 297mm; 
                            page-break-after: auto;
                            background: white;
                            overflow: visible;
                        }
                    }
                    table {
                        page-break-inside: auto;
                    }
                    tr {
                        page-break-inside: avoid;
                        page-break-after: auto;
                    }
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    @media screen {
                        .page {
                            width: 210mm;
                            min-height: 297mm;
                            margin: 10px auto;
                            padding: 20mm;
                            background: white;
                            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        }
                    }
            `}
      </style>
    </Modal>
  )
}

export default ModalPrintExamSurvey
