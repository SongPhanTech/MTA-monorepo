import { PrinterOutlined } from "@ant-design/icons"
import { useFindUniqueClusterSurvey } from "@workspace/db/hooks"
import { Button, Col, Input, Modal, Radio, Row, Table } from "antd"
import dayjs from "dayjs"
import { useRef, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useReactToPrint } from "react-to-print"

dayjs.locale("vi")

const ModalPrintExamClusterSurvey = () => {
  const printRef = useRef<HTMLDivElement>(null)
  const [selectedAnswers] = useState<Record<string, string>>({})
  const { isOpen, onClose, input } = useDisclosure<{
    id: string
  }>({
    tag: "ModalPrintExamClusterSurvey",
  })

  const { data } = useFindUniqueClusterSurvey({
    where: {
      id: input?.id,
    },
    include: {
      surveyChoice: true,
      surveyQuestion: {
        include: {
          specificChoice: true,
        },
      },
      surveys: true,
    },
  })

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: `
        @page {
            size: A4;
            margin: 1cm;
        }
        @media print {
            .page-break {
                page-break-after: always;
            }
            .blank-page {
                height: 100vh;
                visibility: hidden;
            }
            table {
                page-break-inside: auto;
            }
            tr {
                page-break-inside: avoid;
            }
        }
      `,
  })

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
          <Button icon={<PrinterOutlined />} onClick={handlePrint} size="small" type="primary">
            In
          </Button>
        </div>
      }
    >
      <div ref={printRef} className="mx-auto p-6 text-sm leading-relaxed !font-time-news-roman">
        <div className="flex justify-between items-start mb-2 color-black font-bold text-base">
          <div className="uppercase">HỌC VIỆN KTQS</div>
          <div className="italic">Mẫu số 11-ĐBCL</div>
        </div>
        <div className="text-xl font-bold mb-4 text-center uppercase color-black">{data?.name}</div>
        <Row gutter={[0, 2]} className="mb-3 color-black">
          <Col span={12}>
            <div className="flex items-end">
              <div className="!w-fit whitespace-nowrap">Tên giảng viên: </div>
              <span className="w-full mb-1 h-6 border-[0px] border-b-[1px] border-dotted border-black" />
            </div>
          </Col>
          <Col span={12}>
            <div className="flex items-end">
              <div className="!w-fit whitespace-nowrap">Tên học phần: </div>
              <span className="w-full mb-1 h-6 border-[0px] border-b-[1px] border-dotted border-black" />
            </div>
          </Col>
          <Col span={12}>
            <div className="flex items-end">
              <div className="!w-fit whitespace-nowrap">Khoa (Viện): </div>
              <span className="w-full mb-1 h-6 border-[0px] border-b-[1px] border-dotted border-black" />
            </div>
          </Col>
          <Col span={6}>
            <div className="flex items-end">
              <div className="!w-fit whitespace-nowrap">Bộ môn: </div>
              <span className="w-full mb-1 h-6 border-[0px] border-b-[1px] border-dotted border-black" />
            </div>
          </Col>
          <Col span={6}>
            <div className="flex items-end">
              <div className="!w-fit whitespace-nowrap">Lớp: </div>
              <span className="w-full mb-1 h-6 border-[0px] border-b-[1px] border-dotted border-black" />
            </div>
          </Col>
          <Col span={12}>
            <div className="flex items-end">
              <div className="!w-fit whitespace-nowrap">Ngày lấy ý kiến: </div>
              <span className="w-full mb-1 h-6 border-[0px] border-b-[1px] border-dotted border-black" />
            </div>
          </Col>
          <Col span={6}>
            <div className="flex items-end">
              <div className="!w-fit whitespace-nowrap">Học kỳ: </div>
              <span className="w-full mb-1 h-6 border-[0px] border-b-[1px] border-dotted border-black" />
            </div>
          </Col>
          <Col span={6}>
            <div className="flex items-end">
              <div className="!w-fit whitespace-nowrap">Năm học: </div>
              <span className="w-full mb-1 h-6 border-[0px] border-b-[1px] border-dotted border-black" />
            </div>
          </Col>
          <Col span={24}>
            <div className="italic indent-8 mt-4">
              Nhằm góp phần nâng cao chất lượng giảng dạy, phục vụ lợi ích của người học, Học viện
              đề nghị Anh/Chị với tinh thần trách nhiệm và xây dựng , cho ý kiến về hoạt động giảng
              dạy của giảng viên thông qua phiếu phản hồi này. Thông tin do Anh/Chị cung cấp sẽ được
              Học viên bảo mật và xử lý đảm bảo không làm ảnh hưởng đến kết quả học tập, rèn luyên
              của Anh/Chị
            </div>
          </Col>
          <Col span={24}>
            <div className="italic indent-8">
              Đề nghị Anh/chị đánh xấu "X" vào các ô tương ứng với nội dung trong bảng câu hỏi theo
              thang phản hồi
            </div>
          </Col>
        </Row>
        {data?.surveyChoice?.length && (
          <Row gutter={[16, 4]}>
            <Col span={24}>
              <Table
                rowKey="id"
                dataSource={[{ id: "abc" }]}
                className="custom-red-table"
                columns={data.surveyChoice.map((i) => {
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

            <Col span={24} className="my-3">
              <Table
                rowKey="id"
                dataSource={data?.surveyQuestion || []}
                className="custom-red-table"
                pagination={false}
                columns={[
                  {
                    title: "STT",
                    width: 50,
                    align: "center",
                    render: (_, __, index) => index + 1,
                  },
                  {
                    title: "Nội dung phản hồi",
                    dataIndex: "content",
                    render: (_, record) => {
                      const isSpecificSingleChoice =
                        record?.type === "SINGLE_CHOICE" && record?.specificChoice?.length > 0
                      const isEssay = record?.type === "ESSAY"

                      return isSpecificSingleChoice || isEssay ? (
                        <div>
                          <div
                            dangerouslySetInnerHTML={{
                              __html: record?.name,
                            }}
                          />

                          {isSpecificSingleChoice ? (
                            <Radio.Group
                              className="w-full gap-x-2 flex pointer-events-none"
                              value={selectedAnswers[record?.id]}
                            >
                              {data?.surveyChoice.map((choice, index: number) => (
                                <Radio key={choice?.id} value={choice?.id} className="relative">
                                  {record?.specificChoice[index]?.description}
                                </Radio>
                              ))}
                            </Radio.Group>
                          ) : (
                            <Input.TextArea placeholder="Nhập câu trả lời" className="pointer-events-none" />
                          )}
                        </div>
                      ) : (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: record?.name,
                          }}
                        />
                      )
                    },
                    onCell: (record: any) => ({
                      colSpan:
                        record?.type === "ESSAY" ||
                        (record?.type === "SINGLE_CHOICE" && record?.specificChoice?.length > 0)
                          ? 2
                          : 1,
                    }),
                  },
                  {
                    title: "Mức phản hồi",
                    dataIndex: "level",
                    width: 200,
                    align: "center",
                    onCell: (record: any) => ({
                      colSpan:
                        record?.type === "ESSAY" ||
                        (record?.type === "SINGLE_CHOICE" && record?.specificChoice?.length > 0)
                          ? 0
                          : 1,
                    }),
                    render: (_, record) => {
                      return (
                        <Radio.Group
                          className="w-full gap-x-2 flex pointer-events-none"
                          value={selectedAnswers[record?.id]}
                        >
                          {data?.surveyChoice.map((i) => (
                            <Radio.Button key={i?.id} value={i?.id}>
                              {i?.answer}
                            </Radio.Button>
                          ))}
                        </Radio.Group>
                      )
                    },
                  },
                ]}
                bordered={true}
              />
            </Col>
          </Row>
        )}
      </div>
      <style>
        {`
                    .custom-red-table .ant-table-thead > tr > th {
                        background: #fff !important;
                        border: 0.5px solid red !important;
                    }

                    .custom-red-table .ant-table,
                    .custom-red-table .ant-table-container,
                    .custom-red-table .ant-table-content table,
                    .custom-red-table .ant-table-cell {
                        border: 0.5px solid red !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                        background: #fff !important;
                    }

                    .custom-red-table .ant-radio-inner {
                        border: 0.5px solid red !important;
                        background: white !important;
                        box-shadow: none !important;
                    }

                    .custom-red-table .ant-radio-checked .ant-radio-inner {
                        border-color: red !important;
                        background: white !important;
                    }

                    .custom-red-table .ant-radio-checked .ant-radio-inner::after {
                        background: red !important;
                        transform: scale(1) !important;
                    }

                    .custom-red-table .ant-radio-wrapper:hover .ant-radio-inner,
                    .custom-red-table .ant-radio-input:focus + .ant-radio-inner {
                        border-color: red !important;
                        box-shadow: none !important;
                    }

                    .custom-red-table .ant-radio-input:focus {
                        outline: none !important;
                    }

                    .custom-red-table .ant-radio-button-wrapper {
                        border: 0.5px solid red !important;
                        color: red !important;
                        background: #fff !important;
                        border-radius: 6px;
                        margin-right: 8px;
                        line-height: 22px;
                        height: 24px;
                        min-width: 32px;
                        text-align: center;
                        padding-inline: 6px;
                    }

                    .custom-red-table .ant-radio-button-wrapper::before {
                        display: none !important;
                    }

                    .custom-red-table .ant-radio-button-wrapper-checked {
                        background: red !important;
                        border-color: red !important;
                        color: #fff !important;
                        box-shadow: none !important;
                    }

                    .custom-red-table .ant-radio-button-wrapper-checked:hover {
                        background: red !important;
                        border-color: red !important;
                        color: #fff !important;
                    }

                    .custom-red-table .ant-table-tbody > tr > td,
                    .custom-red-table .ant-table-tbody > tr:hover > td,
                    .custom-red-table .ant-table-tbody > tr.ant-table-row:hover > td {
                        background: #fff !important;
                        box-shadow: none !important;
                    }

                    .custom-red-table textarea,
                    .custom-red-table .ant-input {
                        border: 0.5px solid red !important;
                        box-shadow: none !important;
                        background: #fff !important;
                    }

                    .custom-red-table textarea:focus,
                    .custom-red-table .ant-input:focus,
                    .custom-red-table .ant-input-focused {
                        border: 0.5px solid red !important;
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

export default ModalPrintExamClusterSurvey
