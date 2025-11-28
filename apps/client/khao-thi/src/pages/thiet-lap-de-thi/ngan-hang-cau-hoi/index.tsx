import type { PutQuestionBankInput } from '@components/modal/put-ngan-hang-cau-hoi'
import useSpinner from '@hooks/spinner'
import ExamLayout from '@layouts/default-layout/exam-layout'
import { useFindManyDM_DonVi, useUpdateQuestionBank } from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { KHAO_THI_PERMISSION } from '@workspace/router'
import { Button, Col, Flex, Input, message, Row, Space } from 'antd'
import { BookPlus, Building2, BookOpen, FileText, Database } from 'lucide-react'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { QuestionList } from '@components/ngan-hang-cau-hoi/question-list'
import { QuestionBankTree } from '@components/ngan-hang-cau-hoi/question-bank-tree'

export default function QuestionBank() {
    const { can } = useAbility()
    const [searchName, setSearchName] = useState('')
    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])
    const [selectedQuestionBankId, setSelectedQuestionBankId] = useState<string | null>(null)

    const { data: donViData = [] } = useFindManyDM_DonVi({
        include: {
            subjects: {
                include: {
                    subjectVersion: {
                        include: {
                            questionBanks: {
                                where: {
                                    deletedAt: null,
                                },
                            },
                        },
                    },
                },
                where: {
                    deletedAt: null,
                },
            },
        },
    })

    const { onOpen: onOpenPutQuestionBank } = useDisclosure<PutQuestionBankInput>({
        tag: 'PutQuestionBank',
    })

    const { showSpinner, hideSpinner } = useSpinner()
    const { mutateAsync: updateQuestionBank } = useUpdateQuestionBank()

    const handleDeleteQuestionBank = useCallback(
        async (id: string) => {
            try {
                showSpinner()
                await updateQuestionBank({
                    where: { id },
                    data: { deletedAt: new Date() },
                })
                message.success('Xóa thành công')
            } catch (error: any) {
                if (error?.info?.message) {
                    message.error(error?.info?.message)
                    return
                }
                message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
            } finally {
                hideSpinner()
            }
        },
        [showSpinner, hideSpinner, updateQuestionBank]
    )

    return (
        <div>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Flex justify="space-between" align="center">
                        <Space size="middle">
                            <Input
                                placeholder="Tìm theo tên hoặc mã (Đơn vị, Nhóm môn học, Môn học, Ngân hàng câu hỏi)"
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                                className="w-96"
                                allowClear
                            />
                        </Space>
                        {can(
                            KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_DE_THI_NGAN_HANG_CAU_HOI,
                            'THEM'
                        ) && (
                            <Button
                                onClick={() => onOpenPutQuestionBank()}
                                type="primary"
                                size="small"
                            >
                                <BookPlus />
                                Thêm mới
                            </Button>
                        )}
                    </Flex>
                </Col>

                <Col span={24}>
                    <div className="flex gap-4">
                        <span className="flex gap-2 items-center justify-end">
                            <Building2 className="w-4 h-4 flex-shrink-0 text-blue-600" />
                            Đơn vị
                        </span>
                        <span className="flex gap-2 items-center justify-end">
                            <BookOpen className="w-4 h-4 flex-shrink-0 text-purple-600" />
                            Nhóm môn học
                        </span>
                        <span className="flex gap-2 items-center justify-end">
                            <FileText className="w-4 h-4 flex-shrink-0 text-orange-600" />
                            Môn học
                        </span>
                        <span className="flex gap-2 items-center justify-end">
                            <Database className="w-4 h-4 flex-shrink-0 text-green-600" />
                            Ngân hàng câu hỏi
                        </span>
                    </div>
                </Col>

                <Col span={6}>
                    <QuestionBankTree
                        searchName={searchName}
                        expandedKeys={expandedKeys}
                        setExpandedKeys={setExpandedKeys}
                        setSelectedQuestionBankId={setSelectedQuestionBankId}
                        donViData={donViData}
                        can={can}
                        onOpenPutQuestionBank={onOpenPutQuestionBank}
                        handleDeleteQuestionBank={handleDeleteQuestionBank}
                    />
                </Col>

                <Col span={18}>
                    {selectedQuestionBankId ? (
                        <QuestionList questionBankId={selectedQuestionBankId} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[60vh] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                                <Database className="w-12 h-12 text-green-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                Chọn ngân hàng câu hỏi
                            </h3>
                            <p className="text-gray-500 text-center max-w-md mb-4 text-sm">
                                Vui lòng chọn một ngân hàng câu hỏi từ cây dữ liệu bên trái để xem
                                và quản lý câu hỏi
                            </p>
                        </div>
                    )}
                </Col>
            </Row>
        </div>
    )
}

QuestionBank.getLayout = function getLayout(page: React.ReactElement) {
    return <ExamLayout>{page}</ExamLayout>
}
