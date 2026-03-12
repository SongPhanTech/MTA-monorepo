import Table from '@components/commons/table'
import type { $Enums } from '@workspace/db/client'
import { useFindManySubjectVersion } from '@workspace/db/hooks'
import type { SubjectResult } from '@workspace/libs/parseExcel'
import { useTrainingObjectTypeStore } from '@workspace/ui'
import { Button, Checkbox, Collapse, Modal, Tooltip } from 'antd'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

const { Panel } = Collapse

const mapExamType = (examType: $Enums.ExamType): string => {
    const examTypeMap: Partial<Record<$Enums.ExamType, string>> = {
        OfflineWritten: 'Thi viết',
        Oral: 'Thi vấn đáp',
        Other: 'Khác',
    }
    return examTypeMap[examType] || examType
}

const mapSubjectRequirementType = (type: $Enums.SubjectRequirementType): string => {
    const typeMap: Partial<Record<$Enums.SubjectRequirementType, string>> = {
        Mandatory: 'Bắt buộc',
        Optional: 'Tự chọn',
    }
    return typeMap[type] || type
}

const mapSubjectVersionType = (type: $Enums.SubjectVersionType): string => {
    const typeMap: Partial<Record<$Enums.SubjectVersionType, string>> = {
        Normal: 'Thường',
        Internship: 'Thực tập',
        Research: 'Chuyên đề nghiên cứu',
        Project: 'Luận văn/đề án',
    }
    return typeMap[type] || type
}

type ModalPreviewUploadInput = {
    previewData: SubjectResult[]
    errorData: any[]
    onConfirm?: (subjects: SubjectResult[]) => void
}

type SubjectData = {
    trainingObjectTypeId: string
    name: string
    code?: string
    organizationCode?: string
    credit: number
    examType: $Enums.ExamType
    type: $Enums.SubjectVersionType
    onePoint?: boolean
    period: number
    schedulePeriod: number
    numberOfTheory?: number
    numberOfPractical?: number
    numberOfSelfStudy?: number
    numberOfPractice?: number
    numberOfReview?: number
    numberOfExam?: number
}

const ModalPreviewUpload = () => {
    const { isOpen, onClose, input } = useDisclosure<ModalPreviewUploadInput>({
        tag: 'ModalPreviewUpload',
    })

    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

    const subjects =
        input?.previewData.map((s) => ({
            trainingObjectTypeId,
            ...s,
            type: s.subjectVersionType,
        })) || []

    const subjectSet = new Set<string>(subjects.map((s) => JSON.stringify(s)))
    const uniqueSubject = Array.from(subjectSet).map((s) => JSON.parse(s) as SubjectData)

    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(100)

    const { data: existingSubjectVersions = [], isError } = useFindManySubjectVersion({
        select: { name: true },
        where: {
            OR: uniqueSubject.map((s) => ({
                name: s.name,
                trainingObjectTypeId: s.trainingObjectTypeId,
                ...(s.code ? { code: s.code } : {}),
                // TODO: check it
                // ...(s.organizationCode
                //     ? {
                //           subject: {
                //               managementOrganization: {
                //                   sMa: s.organizationCode,
                //               },
                //           },
                //       }
                //     : {}),
                credit: s.credit,
                examType: s.examType,
                type: s.type,
                period: s.period,
                schedulePeriod: s.schedulePeriod,
            })),
        },
    })

    const rawPreviewData = input?.previewData || []
    const errorData = input?.errorData || []

    const { filteredData, duplicateErrors } = useMemo(() => {
        const existingSubjectNames = new Set(existingSubjectVersions.map((s) => s.name))

        const filtered: Array<SubjectResult & { status: 'new-version' | 'duplicate' }> = []
        const duplicates: any[] = []

        for (const subject of rawPreviewData) {
            const nameExists = existingSubjectNames.has(subject.name)

            if (!isError && nameExists) {
                filtered.push({
                    ...subject,
                    status: 'duplicate',
                })
            } else {
                filtered.push({
                    ...subject,
                    status: 'new-version',
                })
            }
        }

        return {
            filteredData: filtered,
            duplicateErrors: duplicates,
        }
    }, [isError, rawPreviewData, existingSubjectVersions])

    const allErrors = [...errorData, ...duplicateErrors]

    const handleConfirmImport = () => {
        input?.onConfirm?.(filteredData)
        onClose()
    }

    return (
        <Modal
            title={`Danh sách dữ liệu - ${filteredData.length} môn học`}
            open={isOpen}
            onCancel={onClose}
            className="w-[100vw]"
            style={{ top: 5, position: 'fixed', left: 0, right: 0 }}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Hủy
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    onClick={handleConfirmImport}
                    disabled={allErrors.length > 0}
                >
                    Xác nhận nhập {filteredData.length} môn học
                </Button>,
            ]}
        >
            <div className="h-[85vh] overflow-auto">
                {allErrors?.length > 0 && (
                    <Collapse defaultActiveKey={['1']} className="mb-4">
                        <Panel header={`Danh sách lỗi (${allErrors.length} lỗi)`} key="1">
                            <Table
                                className="p-0 m-0"
                                columns={[
                                    {
                                        title: 'STT',
                                        width: 60,
                                        align: 'center',
                                        render: (_, __, index: number) => index + 1,
                                    },
                                    {
                                        title: 'Sheet',
                                        dataIndex: 'sheet',
                                        key: 'sheet',
                                        width: 120,
                                    },
                                    {
                                        title: 'Vị trí',
                                        dataIndex: 'cell',
                                        key: 'cell',
                                        width: 100,
                                    },
                                    {
                                        title: 'Lỗi',
                                        dataIndex: 'message',
                                        key: 'message',
                                    },
                                ]}
                                dataSource={allErrors}
                                pagination={false}
                                size="small"
                                scroll={{ y: 200 }}
                            />
                        </Panel>
                    </Collapse>
                )}

                <Table
                    scrollable
                    maxHeight={'calc(85vh - 260px)'}
                    columns={[
                        {
                            title: 'TT',
                            width: 35,
                            align: 'center',
                            render: (_, __, index: number) =>
                                index + 1 + (currentPage - 1) * numberOfPages,
                        },
                        {
                            title: 'Môn mới',
                            width: 70,
                            align: 'center',
                            render: (_, record) => {
                                // if (record.status === 'new') {
                                //     return <Tag color="green">Nhóm học mới</Tag>
                                // }
                                // if (record.status === 'new-version') {
                                //     return <Tag color="blue">Môn học mới</Tag>
                                // }
                                return <Checkbox checked={record.status === 'new-version'} />
                                // return <Tag color="orange">Đã có môn học</Tag>
                            },
                        },
                        {
                            title: 'Bắt buộc',
                            align: 'center',
                            width: 100,
                            render: (_, record) => mapSubjectRequirementType(record.type),
                        },
                        {
                            title: 'Khối kiến thức',
                            // dataIndex: 'trainingBlockName',
                            width: 200,
                            render: (_, record) => record.trainingBlockName || '---',
                        },
                        {
                            title: <Tooltip title="Mã môn học">Mã MH</Tooltip>,
                            align: 'center',
                            width: 100,
                            render: (_, record) => record.code?.toUpperCase(),
                        },
                        {
                            title: 'Tên học phần',
                            // dataIndex: 'name',
                            // key: 'name',
                            width: 270,
                            render: (_, record) => record?.name,
                        },
                        {
                            title: 'HP điều kiện',
                            align: 'center',
                            width: 100,
                            render: (_, record) => {
                                return <Checkbox checked={!record.useForFinalScore} />
                            },
                        },
                        {
                            title: 'Loại học phần',
                            // dataIndex: 'subjectVersionType',
                            key: 'type',
                            width: 110,
                            render: (_, record) => mapSubjectVersionType(record.subjectVersionType),
                        },

                        {
                            title: <Tooltip title="Khoa, Viện phụ trách">ĐVPT</Tooltip>,
                            // dataIndex: 'organizationCode',
                            align: 'center',
                            width: 80,
                            render: (_, record) => record.organizationCode,
                        },
                        {
                            title: <Tooltip title="Số tín chỉ">STC</Tooltip>,
                            // dataIndex: 'credit',
                            width: 50,
                            align: 'center',
                            render: (_, record) => record.credit,
                        },
                        {
                            title: 'Số tiết',
                            // dataIndex: 'period',
                            // key: 'periodCtdt',
                            width: 60,
                            align: 'center',
                            render: (_, record) => record.period,
                        },
                        // {
                        //     title: 'Số tiết TKB',
                        //     // dataIndex: 'period',
                        //     key: 'periodTkb',
                        //     width: 120,
                        //     align: 'center',
                        //     render: (_, record) => record.period
                        // },
                        {
                            title: 'LT',
                            width: 60,
                            align: 'center',
                            render: (_, record) => record.numberOfTheory,
                        },
                        {
                            title: 'TL,BT',
                            width: 60,
                            align: 'center',
                            render: (_, record) => record.numberOfPractical,
                        },
                        {
                            title: 'ThL',
                            width: 80,
                            align: 'center',
                            render: (_, record) => record.numberOfSelfStudy,
                        },
                        {
                            title: 'TN,TH',
                            // dataIndex: 'numberOfPractice',
                            // key: 'experiment',
                            width: 60,
                            align: 'center',
                            render: (_, record) => record.numberOfPractice,
                        },
                        {
                            title: 'Ôn',
                            width: 60,
                            align: 'center',
                            render: (_, record) => record.numberOfReview,
                        },
                        {
                            title: 'KT,Thi',
                            width: 60,
                            align: 'center',
                            render: (_, record) => record.numberOfExam,
                        },
                        {
                            title: <Tooltip title="Học kỳ dự kiến">HKDK</Tooltip>,
                            align: 'center',
                            width: 60,
                            render: (_, record) => record.semester,
                        },
                        {
                            title: 'Hình thức thi',
                            align: 'center',
                            width: 100,
                            render: (value) => mapExamType(value),
                        },
                        {
                            title: 'Một đầu điểm',
                            align: 'center',
                            width: 100,
                            render: (_, record) => {
                                return <Checkbox checked={record.onePoint} />
                            },
                        },
                    ]}
                    data={filteredData}
                    pagination={{
                        hideOnSinglePage: true,
                        current: currentPage,
                        pageSize: numberOfPages,
                        total: filteredData.length,
                        onChange: (page, pageSize) => {
                            setCurrentPage(page)
                            setNumberOfPages(pageSize)
                        },
                        onShowSizeChange: (size: number) => {
                            setNumberOfPages(size)
                            setCurrentPage(1)
                        },
                        showTotal: (total) => `Tổng ${total} môn học`,
                    }}
                    rowKey={'id'}
                />
            </div>
        </Modal>
    )
}

export default ModalPreviewUpload
