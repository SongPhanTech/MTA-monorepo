import { PrinterOutlined } from '@ant-design/icons'
import { toRoman } from '@lib/utils'
import { useFindUniqueSurvey } from '@workspace/db/hooks'
import { Button, Col, Input, Modal, Radio, Row, Table } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useRef } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { useReactToPrint } from 'react-to-print'

dayjs.locale('vi')
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
    const printRef = useRef<HTMLDivElement>(null)
    const { isOpen, onClose, input } = useDisclosure<{
        id: string
    }>({
        tag: 'ModalPrintExamSurvey',
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

    const dataTest = useMemo(() => {
        const groupedMap = (survey?.surveyQuestion ?? []).reduce<
            Record<string, GroupedSurveyQuestion>
        >((acc: any, item: any, index: number) => {
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
        }, {})

        // Chuyển thành array

        const grouped: GroupedSurveyQuestion[] = Object.values(groupedMap).map((i: any, index) => {
            return { ...i, index: toRoman(index + 1) }
        })
        // const general=grouped.filter((i)=>i?.)
        const flatData = grouped.map((i) => [i, ...(i.question || [])]).flat()
        return flatData || []
        // return classGroups
    }, [survey])

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
                    <Button
                        icon={<PrinterOutlined />}
                        onClick={handlePrint}
                        size="small"
                        type="primary"
                    >
                        In
                    </Button>
                </div>
            }
        >
            <div
                ref={printRef}
                className="mx-auto p-6 text-sm leading-relaxed !font-time-news-roman"
            >
                <div className="text-xl font-bold mb-4 text-center uppercase color-black">
                    {survey?.name}
                </div>
                <Row gutter={[0, 2]} className="mb-3 color-black">
                    <Col span={24}>
                        <div className="italic indent-8 mt-4">
                            Để đóng góp phần tìm ra những giải pháp nhằm nâng cao chất lượng đào tạo
                            của Học viện đề nghị đồng chí (anh/chị) vui lòng điền đầy đủ thông tin
                            trả lời các câu hỏi dưới dây bằng cách đánh dấu "X" vào một ô phù hợp
                            nhất trong mục "các phương án trả lời".
                        </div>
                    </Col>
                    <Col span={24}>
                        <div className="italic indent-8">
                            Thông tin đồng chí (anh/chị) cung cấp sẽ được Học viện xử lý khách quan
                            và bảo mật
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
                                dataSource={[{ id: 'abc' }]}
                                columns={survey.surveyChoice.map((i) => {
                                    return {
                                        title: `${i?.description} ${i?.requireExplanation === true ? '*' : ''}`,
                                        dataIndex: i?.id,
                                        key: i?.id,
                                        align: 'center',
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
                                dataSource={dataTest || []}
                                pagination={false}
                                columns={[
                                    {
                                        title: 'STT',
                                        width: 50,
                                        align: 'center',
                                        render: (_, record: any) => {
                                            return (
                                                <div
                                                    className={`${record.isParent ? 'font-semibold' : ''}`}
                                                >
                                                    {record?.index}
                                                </div>
                                            )
                                        },
                                    },
                                    {
                                        title: 'Nội dung phản hồi',
                                        dataIndex: 'content',
                                        render: (_, record) => {
                                            return record.isParent ? (
                                                <div className="font-semibold uppercase">
                                                    {record?.name}
                                                </div>
                                            ) : record?.type === 'ESSAY' ? (
                                                <div>
                                                    <div
                                                        dangerouslySetInnerHTML={{
                                                            __html: record?.name,
                                                        }}
                                                    />

                                                    <Input.TextArea placeholder="Nhập câu trả lời" />
                                                </div>
                                            ) : record?.specificChoice?.length > 0 ? (
                                                <div>
                                                    <div
                                                        dangerouslySetInnerHTML={{
                                                            __html: record?.name,
                                                        }}
                                                    />

                                                    <Radio.Group className="w-full gap-x-2 flex">
                                                        {survey?.surveyChoice.map(
                                                            (i, index: number) => (
                                                                <Radio
                                                                    key={i?.id}
                                                                    value={i?.id}
                                                                    className="relative"
                                                                >
                                                                    <div>
                                                                        {
                                                                            record?.specificChoice[
                                                                                index
                                                                            ]?.description
                                                                        }
                                                                    </div>
                                                                </Radio>
                                                            )
                                                        )}
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
                                                    record?.type === 'ESSAY'
                                                        ? 2
                                                        : 1,
                                            }
                                        },
                                    },
                                    {
                                        title: 'Mức phản hồi',
                                        width: 200,
                                        align: 'center',
                                        onCell: (record, rowIndex) => {
                                            return {
                                                colSpan:
                                                    record.isParent ||
                                                    record?.specificChoice?.length > 0 ||
                                                    record?.type === 'ESSAY'
                                                        ? 0
                                                        : 1,
                                            }
                                        },
                                        render: (_, record, qIndex) => {
                                            return (
                                                record?.type === 'SINGLE_CHOICE' && (
                                                    <Radio.Group className="w-full gap-x-2 flex">
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
                                                                <Button className="flex items-center justify-center w-6 h-6 border-solid border-[1px] border-[#ed9e9e] text-[#ea1212] text-[12px]">
                                                                    {i?.answer}
                                                                </Button>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            ) : (
                                                <Input.TextArea placeholder="Nhập câu trả lời" />
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

export default ModalPrintExamSurvey
