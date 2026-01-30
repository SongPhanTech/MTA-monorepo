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
import { LayoutGrid } from 'lucide-react'
import { store } from '@pages/thiet-lap-de-thi/khung-de'

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
        if (!id) return

        setSelectedMatrixId(undefined)
        store.setState((s) => ({ ...s, matrixId: undefined }))
    }, [id])

    useEffect(() => {
         if (store.state.matrixId) {
            setSelectedMatrixId(store.state.matrixId)
            return
        }
        if (examMatrix.length > 0) {
            const defaultMatrix = examMatrix.find((matrix) => matrix.isDefault)
            if (defaultMatrix) {
                setSelectedMatrixId(defaultMatrix.id)
                store.setState((s) => ({ ...s, matrixId: defaultMatrix.id }))
            } else {
                setSelectedMatrixId(examMatrix[0].id)
                store.setState((s) => ({ ...s, matrixId: examMatrix[0].id }))
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
                                onClick={() => {
                                    setSelectedMatrixId(matrix.id)
                                    store.setState((s) => ({ ...s, matrixId: matrix.id }))
                                }}
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
                                    <EditIcon
                                        className="text-blue-600"
                                        onClick={() => onOpen({ id: matrix.id })}
                                    />
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
                {selectedMatrixId ? (
                    <TableChuongMuc matrixId={selectedMatrixId} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-[80vh] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <div className="w-24 h-30 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <LayoutGrid className="w-12 h-12 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            Chọn ma trận đề
                        </h3>
                        <p className="text-gray-500 text-center max-w-md mb-4 text-sm">
                            Vui lòng chọn một ma trận đề bên trái để xem và quản lý khung đề
                        </p>
                    </div>
                )}
            </Col>
        </Row>
    )
}
