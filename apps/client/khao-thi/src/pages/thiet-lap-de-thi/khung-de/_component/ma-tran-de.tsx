import { PlusOutlined } from '@ant-design/icons'
import { queryClient } from '@api/index'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { useFindManyExamMatrix, useUpdateExamMatrix } from '@workspace/db/hooks'
import { Button, Col, message, Row, Typography } from 'antd'
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import TableChuongMuc from './table-chuong-muc'

export default function MaTranDePage({ id }: { id?: string }) {
    const [selectedMatrixId, setSelectedMatrixId] = useState<string | undefined>(undefined)
    const { onOpen } = useDisclosure<{
        id?: string
    }>({
        tag: 'PutMaTranDeModal',
    })

    const { data: examMatrix = [] } = useFindManyExamMatrix(
        {
            where: {
                examFrameworkId: id,
                deletedAt: null,
            },
            orderBy: {
                createdAt: 'desc',
            },
        },
        {
            enabled: !!id,
        }
    )

    const { mutateAsync: updateExamMatrix } = useUpdateExamMatrix()

    const handleDeleteExamMatrix = async (matrixId: string) => {
        try {
            await updateExamMatrix({
                where: {
                    id: matrixId,
                },
                data: {
                    deletedAt: new Date(),
                },
            })

            queryClient.invalidateQueries({
                queryKey: ['ExamMatrix'],
            })

            message.success('Xoá ma trận đề thành công!')
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại!')
        }
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        setSelectedMatrixId(undefined)
    }, [id])

    useEffect(() => {
        if (examMatrix.length > 0) {
            const defaultMatrix = examMatrix.find((matrix) => matrix.isDefault)
            if (defaultMatrix) {
                setSelectedMatrixId(defaultMatrix.id)
            } else {
                setSelectedMatrixId(examMatrix[0].id)
            }
        }
    }, [examMatrix])

    return (
        <Row gutter={[8, 8]}>
            <Col span={5}>
                <div className="pb-2.5">
                    <div className="max-h-[calc(100vh-150px)] overflow-y-auto">
                        {examMatrix.map((matrix) => (
                            <div
                                key={matrix.id}
                                onClick={() => setSelectedMatrixId(matrix.id)}
                                className={clsx(
                                    'p-2.5 border rounded-[5px] first:mt-0 mt-2 mr-2 cursor-pointer transition-all',
                                    selectedMatrixId === matrix.id
                                        ? 'bg-[rgb(238,252,253)] border-[rgb(179,240,243)]'
                                        : 'bg-gray-100 border-gray-300 hover:border-gray-400'
                                )}
                            >
                                <div className="mb-2">
                                    <Typography.Text strong>{matrix.name}</Typography.Text>
                                </div>
                                <div className="flex justify-end items-center gap-2">
                                    <EditIcon onClick={() => onOpen({ id: matrix.id })} />
                                    <DeleteIcon
                                        popConfirm={{
                                            onConfirm: () => handleDeleteExamMatrix(matrix.id),
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mr-2">
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => onOpen()}
                            className="mt-2 w-full"
                        >
                            Tạo mới ma trận đề
                        </Button>
                    </div>
                </div>
            </Col>
            <Col span={19}>
                <TableChuongMuc matrixId={selectedMatrixId} />
            </Col>
        </Row>
    )
}
