import type { ParsedSubject } from '@workspace/libs/parseExcel'
import { useFindManySubject, useFindManySubjectVersion } from '@workspace/db/hooks'
import { Button, Collapse, Modal, Table, Tag } from 'antd'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

const { Panel } = Collapse

type ModalPreviewUploadInput = {
    previewData: ParsedSubject[]
    errorData: any[]
}

const ModalPreviewUpload = () => {
    const { isOpen, onClose, input, updateInput } = useDisclosure<ModalPreviewUploadInput>({
        tag: 'ModalPreviewUpload',
    })

    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(10)

    const { data: existingSubjects = [] } = useFindManySubject({
        select: { name: true, code: true },
    })
    const { data: existingSubjectVersions = [] } = useFindManySubjectVersion({
        select: { code: true },
    })

    const rawPreviewData = input?.previewData || []
    const errorData = input?.errorData || []

    const { filteredData, duplicateErrors } = useMemo(() => {
        const existingVersionCodes = new Set(
            existingSubjectVersions.map((sv) => sv.code?.toLowerCase())
        )
        const existingSubjectNames = new Set(existingSubjects.map((s) => s.name?.toLowerCase()))

        const filtered: Array<ParsedSubject & { status: 'new' | 'new-version' | 'duplicate' }> = []
        const duplicates: any[] = []

        for (const subject of rawPreviewData) {
            const codeExists = existingVersionCodes.has(subject.code?.toLowerCase())
            const nameExists = existingSubjectNames.has(subject.name?.toLowerCase())

            if (codeExists) {
                // Nếu mã học phần đã tồn tại, đánh dấu là duplicate (sẽ chỉ connect)
                filtered.push({
                    ...subject,
                    status: 'duplicate',
                })
            } else if (nameExists) {
                // Nếu tên môn học đã có nhưng mã chưa có, tạo phiên bản mới
                filtered.push({
                    ...subject,
                    status: 'new-version',
                })
            } else {
                // Hoàn toàn mới
                filtered.push({
                    ...subject,
                    status: 'new',
                })
            }
        }

        return {
            filteredData: filtered,
            duplicateErrors: duplicates,
        }
    }, [rawPreviewData, existingSubjects, existingSubjectVersions])

    const allErrors = [...errorData, ...duplicateErrors]

    const handleConfirmImport = () => {
        updateInput({
            previewData: filteredData,
            errorData: allErrors,
        })
        onClose()
    }

    return (
        <Modal
            title={
                <div className="text-xl font-semibold">
                    Danh sách dữ liệu - {filteredData.length} môn học
                </div>
            }
            open={isOpen}
            onCancel={onClose}
            width="90vw"
            style={{ top: 20 }}
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
            {/* Error list */}
            {allErrors?.length > 0 && (
                <Collapse defaultActiveKey={['1']} className="mb-4">
                    <Panel
                        header={
                            <div className="text-lg font-[500] text-red-500">
                                Danh sách lỗi ({allErrors.length} lỗi)
                            </div>
                        }
                        key="1"
                    >
                        <Table
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

            {/* Preview table */}
            <Table
                columns={[
                    {
                        title: 'STT',
                        dataIndex: 'stt',
                        key: 'stt',
                        width: 60,
                        align: 'center',
                        fixed: 'left',
                        render: (_, __, index: number) =>
                            index + 1 + (currentPage - 1) * numberOfPages,
                    },
                    {
                        title: 'Trạng thái',
                        dataIndex: 'status',
                        key: 'status',
                        width: 150,
                        fixed: 'left',
                        align: 'center',
                        render: (status: 'new' | 'new-version' | 'duplicate') => {
                            if (status === 'new') {
                                return <Tag color="green">Nhóm học mới</Tag>
                            }
                            if (status === 'new-version') {
                                return <Tag color="blue">Môn học mới</Tag>
                            }
                            return <Tag color="orange">Đã có môn học</Tag>
                        },
                    },
                    {
                        title: 'Khối kiến thức',
                        dataIndex: 'knowledgeBlock',
                        key: 'knowledgeBlock',
                        fixed: 'left',
                        width: 250,
                    },
                    {
                        title: 'Tên học phần',
                        dataIndex: 'name',
                        key: 'name',
                        width: 270,
                        fixed: 'left',
                    },
                    {
                        title: 'Bắt buộc',
                        dataIndex: 'required',
                        key: 'required',
                        width: 150,
                    },
                    {
                        title: 'HP điều kiện',
                        dataIndex: 'prerequisite',
                        key: 'prerequisite',
                        align: 'center',
                        width: 170,
                    },
                    {
                        title: 'Loại học phần',
                        dataIndex: 'type',
                        key: 'type',
                        width: 270,
                    },
                    {
                        title: 'Mã học phần',
                        dataIndex: 'code',
                        key: 'code',
                        width: 170,
                    },
                    {
                        title: 'Khoa, Viện phụ trách',
                        dataIndex: 'managementOrganization',
                        key: 'managementOrganization',
                        align: 'center',
                        width: 150,
                    },
                    {
                        title: 'Số tín chỉ',
                        dataIndex: 'credit',
                        key: 'credit',
                        width: 100,
                        align: 'center',
                    },
                    {
                        title: 'Số tiết CTĐT',
                        dataIndex: 'periodCtdt',
                        key: 'periodCtdt',
                        width: 120,
                        align: 'center',
                    },
                    {
                        title: 'Số tiết TKB',
                        dataIndex: 'periodTkb',
                        key: 'periodTkb',
                        width: 120,
                        align: 'center',
                    },
                    {
                        title: 'LT',
                        dataIndex: 'theory',
                        key: 'theory',
                        width: 100,
                        align: 'center',
                    },
                    {
                        title: 'TL,BT',
                        dataIndex: 'practice',
                        key: 'practice',
                        width: 100,
                        align: 'center',
                    },
                    {
                        title: 'ThL',
                        dataIndex: 'discussion',
                        key: 'discussion',
                        width: 100,
                        align: 'center',
                    },
                    {
                        title: 'TN,TH',
                        dataIndex: 'experiment',
                        key: 'experiment',
                        width: 100,
                        align: 'center',
                    },
                    {
                        title: 'Ôn',
                        dataIndex: 'review',
                        key: 'review',
                        width: 100,
                        align: 'center',
                    },
                    {
                        title: 'KT,Thi',
                        dataIndex: 'exam',
                        key: 'exam',
                        width: 80,
                        align: 'center',
                    },
                    {
                        title: 'Học kỳ dự kiến',
                        dataIndex: 'semester',
                        key: 'semester',
                        align: 'center',
                        width: 180,
                    },
                    {
                        title: 'Hình thức thi',
                        dataIndex: 'examType',
                        key: 'examType',
                        align: 'center',
                        width: 170,
                    },
                    {
                        title: 'Một đầu điểm',
                        dataIndex: 'gradePoints',
                        key: 'gradePoints',
                        align: 'center',
                        width: 170,
                    },
                ]}
                dataSource={filteredData}
                pagination={{
                    current: currentPage,
                    pageSize: numberOfPages,
                    total: filteredData.length,
                    onChange: (page) => setCurrentPage(page),
                    showSizeChanger: true,
                    onShowSizeChange: (_current: number, size: number) => {
                        setNumberOfPages(size)
                        setCurrentPage(1)
                    },
                    showTotal: (total) => `Tổng ${total} môn học`,
                    pageSizeOptions: ['10', '20', '50', '100'],
                }}
                rowKey={(record: ParsedSubject, index?: number) => record.code || `row-${index}`}
                scroll={{ x: 3000, y: 500 }}
                size="small"
            />
        </Modal>
    )
}

export default ModalPreviewUpload
