import { queryClient } from '@api/index'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { Store, useStore } from '@tanstack/react-store'
import {
    useFindManyEvaluationStandardSet,
    useUpdateEvaluationStandardSet,
} from '@workspace/db/hooks'
import { Button, message, Typography } from 'antd'
import clsx from 'clsx'
import { useDisclosure } from 'react-hook-disclosure-modal'

export const store = new Store<{
    selectedStandardSetId: string | undefined
}>({
    selectedStandardSetId: undefined,
})

const SidebarStandardSet = () => {
    const { onOpen } = useDisclosure<{
        id?: string
    }>({
        tag: 'PutBoTieuChuanModal',
    })

    const selectedStandardSetId = useStore(store, (s) => s.selectedStandardSetId)

    const { data: evaluationStandardSets = [] } = useFindManyEvaluationStandardSet({
        where: {
            deletedAt: null,
        },
        orderBy: {
            createdAt: 'desc',
        },
    })

    const { mutateAsync: updateEvaluationStandardSet } = useUpdateEvaluationStandardSet()

    const handleDeleteStandardSet = async (id: string) => {
        try {
            await updateEvaluationStandardSet({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })

            queryClient.invalidateQueries({
                queryKey: ['EvaluationStandardSet'],
            })

            message.success('Xoá bộ tiêu chuẩn thành công!')
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại!')
        }
    }

    return (
        <div className="w-full border-r border-gray-200 bg-gray-50/50 p-3 h-[calc(100vh-120px)] overflow-y-auto">
            <Button onClick={() => onOpen()} type="primary" className="w-full mb-3" size="small">
                Tạo bộ tiêu chuẩn mới
            </Button>

            <div className="space-y-3">
                {evaluationStandardSets?.map((standardSet) => (
                    <div
                        key={standardSet.id}
                        onClick={() =>
                            store.setState((s) => ({ ...s, selectedStandardSetId: standardSet.id }))
                        }
                        className={clsx(
                            'p-2 rounded hover:shadow-sm transition-shadow cursor-pointer',
                            selectedStandardSetId === standardSet.id
                                ? 'bg-[rgb(238,252,253)] border-[rgb(179,240,243)] border'
                                : 'bg-white border border-gray-200 hover:border-gray-400'
                        )}
                    >
                        <div className="mb-2">
                            <Typography.Text strong className="text-xs line-clamp-2">
                                {standardSet.name}
                            </Typography.Text>
                        </div>
                        <div className="flex justify-end items-center gap-2">
                            <EditIcon
                                className="text-blue-600 cursor-pointer hover:text-blue-700 w-4 h-4"
                                onClick={() => onOpen({ id: standardSet.id })}
                            />
                            <DeleteIcon
                                popConfirm={{
                                    onConfirm: () => handleDeleteStandardSet(standardSet.id),
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default SidebarStandardSet
