import { PutMonHocTuongDuong } from '@components/modal'
import useSpinner from '@hooks/spinner'
import { EquivalencySide } from '@workspace/db'
import {
    useCreateEquivalencyGroup,
    useCreateSubjectInGroup,
    useDeleteEquivalencyGroup,
    useDeleteSubjectInGroup,
    useFindUniqueSubjectVersion,
} from '@workspace/db/hooks'
import { Button, Col, Divider, Flex, message, Popconfirm, Row } from 'antd'
import { ArrowRightLeft, BookPlus, Plus, X } from 'lucide-react'
import { useDisclosure } from 'react-hook-disclosure-modal'

type Props = {
    subjectVersionId: string
}

type SubjectItem = {
    subjectInGroupId: string
    fullDisplay: string
    subjectId: string
}

function SubjectList({
    subjects,
    onRemove,
    disableRemoveForId,
}: {
    subjects: SubjectItem[]
    onRemove: (id: string) => void
    disableRemoveForId?: string
}) {
    return (
        <div className="flex flex-col items-center gap-2 w-full">
            {subjects.map((subject, i) => (
                <div
                    key={`${subject.subjectInGroupId}-${i + 1}`}
                    className="p-2 border border-primary border-solid rounded w-full flex items-center justify-between min-h-[58px]"
                >
                    <span className="whitespace-normal break-words">{subject.fullDisplay}</span>
                    {disableRemoveForId !== subject.subjectId && (
                        <Popconfirm
                            placement="topRight"
                            title="Bạn có chắc muốn xóa môn học này không?"
                            okText="Xóa"
                            cancelText="Hủy"
                            onConfirm={() => onRemove(subject.subjectInGroupId)}
                        >
                            <X className="text-red-500 hover:text-red-700 cursor-pointer w-6 flex-shrink-0" />
                        </Popconfirm>
                    )}
                </div>
            ))}
        </div>
    )
}

export default function MonHocTienQuyetSongHanhPage({ subjectVersionId }: Props) {
    const { showSpinner, hideSpinner } = useSpinner()
    const { data } = useFindUniqueSubjectVersion(
        {
            where: { id: subjectVersionId },
            include: {
                equivalencyGroups: {
                    include: {
                        equivalencyGroup: {
                            include: {
                                subjects: {
                                    include: {
                                        subject: { select: { id: true, name: true, code: true } },
                                    },
                                },
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        },
        { enabled: !!subjectVersionId }
    )

    const { onOpen } = useDisclosure<{
        subjectVersionId: string
        equivalencyGroupId: string
        side: EquivalencySide
    }>({
        tag: PutMonHocTuongDuong.name,
    })

    const { mutateAsync: createSubjectInGroup } = useCreateSubjectInGroup()
    const { mutateAsync: createEquivalencyGroup } = useCreateEquivalencyGroup()
    const { mutateAsync: deleteSubjectInGroup } = useDeleteSubjectInGroup()
    const { mutateAsync: deleteEquivalencyGroup } = useDeleteEquivalencyGroup()

    const handleAdd = async () => {
        try {
            showSpinner()
            const newGroup = await createEquivalencyGroup({ data: {} })

            if (!newGroup) return

            await createSubjectInGroup({
                data: {
                    subjectId: subjectVersionId,
                    side: EquivalencySide.SOURCE,
                    equivalencyGroupId: newGroup?.id,
                },
            })
            message.success('Thêm mới thành công')
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const handleDelete = async (id: string) => {
        try {
            showSpinner()
            await deleteEquivalencyGroup({ where: { id } })
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const handleRemoveSubject = async (id: string) => {
        try {
            showSpinner()
            await deleteSubjectInGroup({ where: { id } })
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const sortSubjects = (group: any, side: EquivalencySide): SubjectItem[] => {
        return group?.equivalencyGroup?.subjects
            .filter((s: any) => s?.side === side)
            .map((s: any) => ({
                subjectInGroupId: s?.id,
                fullDisplay: [s?.subject?.code, s?.subject?.name].filter(Boolean).join(' - '),
                subjectId: s?.subjectId,
            }))
    }

    return (
        <div className="bg-white rounded-lg shadow-sm p-4">
            <Flex justify="end" gap={8}>
                <Button type="primary" onClick={handleAdd}>
                    <BookPlus />
                    Thêm
                </Button>
            </Flex>

            {data?.equivalencyGroups?.map((group, idx) => (
                <div key={group?.id}>
                    {idx > 0 && <Divider className="my-0" />}
                    <Row gutter={[16, 0]} align="top" justify="space-between">
                        <div className="border border-primary border-solid p-4 m-4 rounded-lg relative w-full">
                            <Popconfirm
                                placement="topRight"
                                title="Bạn có chắc muốn xóa nhóm này không?"
                                okText="Xóa"
                                cancelText="Hủy"
                                onConfirm={() => handleDelete(group?.equivalencyGroupId)}
                            >
                                <Button className="absolute top-2 right-2 h-8 w-8 p-0">
                                    <X />
                                </Button>
                            </Popconfirm>

                            <Col span={24} className="mt-8">
                                <Row gutter={[16, 16]} justify="center" align="middle">
                                    <Col span={11}>
                                        <SubjectList
                                            subjects={sortSubjects(group, EquivalencySide.SOURCE)}
                                            onRemove={handleRemoveSubject}
                                            disableRemoveForId={subjectVersionId}
                                        />
                                    </Col>
                                    <Col span={2} className="flex items-center justify-center">
                                        <ArrowRightLeft />
                                    </Col>
                                    <Col span={11}>
                                        <SubjectList
                                            subjects={sortSubjects(group, EquivalencySide.TARGET)}
                                            onRemove={handleRemoveSubject}
                                        />
                                    </Col>

                                    <Col span={11} className="flex justify-center">
                                        <Button
                                            onClick={() =>
                                                onOpen({
                                                    subjectVersionId,
                                                    equivalencyGroupId: group?.equivalencyGroupId,
                                                    side: EquivalencySide.SOURCE,
                                                })
                                            }
                                        >
                                            <Plus />
                                        </Button>
                                    </Col>
                                    <Col span={2} />
                                    <Col span={11} className="flex justify-center">
                                        <Button
                                            onClick={() =>
                                                onOpen({
                                                    subjectVersionId,
                                                    equivalencyGroupId: group?.equivalencyGroupId,
                                                    side: EquivalencySide.TARGET,
                                                })
                                            }
                                        >
                                            <Plus />
                                        </Button>
                                    </Col>
                                </Row>
                            </Col>
                        </div>
                    </Row>
                </div>
            ))}
        </div>
    )
}
