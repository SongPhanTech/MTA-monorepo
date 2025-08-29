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
import { Button, Col, Divider, Flex, message, Row } from 'antd'
import { ArrowRightLeft, BookPlus, Plus, X } from 'lucide-react'
import { useDisclosure } from 'react-hook-disclosure-modal'

type Props = {
    subjectVersionId: string
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
                                    include: { subject: { select: { name: true, id: true } } },
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

    const { onOpen, onClose } = useDisclosure<{
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

    const sortSubjects = (group: any, side: EquivalencySide) => {
        return group.equivalencyGroup.subjects
            .filter((s: any) => s.side === side)
            .map((s: any) => s.subject?.name)
    }

    return (
        <div className="bg-white rounded-lg shadow-sm p-4">
            <div>
                <Flex justify="end" gap={8}>
                    <Button type="primary" onClick={handleAdd}>
                        <BookPlus />
                        Thêm
                    </Button>
                </Flex>
            </div>
            {data?.equivalencyGroups?.map((group, idx) => (
                <div key={group.id}>
                    {idx > 0 && <Divider className="my-0" />}
                    <Row gutter={[16, 0]} align="top" justify="space-between">
                        <div className="border border-primary border-solid p-4 m-4 rounded-lg relative w-full">
                            <Button className="absolute top-2 right-2 h-8 w-8 p-0">
                                <X />
                            </Button>
                            <Col span={24} className="mt-8">
                                <Row gutter={[16, 16]} justify="center" align="middle">
                                    <Col span={11} className="flex flex-col items-center gap-2">
                                        {sortSubjects(group, EquivalencySide.SOURCE).map(
                                            (name: string, i: number) => (
                                                <div
                                                    key={`${name}-${i + 1}`}
                                                    className="p-2 border border-primary border-solid rounded w-full text-center"
                                                >
                                                    {name}
                                                </div>
                                            )
                                        )}
                                    </Col>
                                    <Col span={2} className="flex items-center justify-center">
                                        <ArrowRightLeft />
                                    </Col>
                                    <Col span={11} className="flex flex-col items-center gap-2">
                                        {sortSubjects(group, EquivalencySide.TARGET).map(
                                            (name: string, i: number) => (
                                                <div
                                                    key={`${name}-${i + 1}`}
                                                    className="p-2 border border-primary border-solid rounded w-full text-center"
                                                >
                                                    {name}
                                                </div>
                                            )
                                        )}
                                    </Col>
                                    <Col span={11} className="flex justify-center">
                                        <Button
                                            onClick={() =>
                                                onOpen({
                                                    subjectVersionId,
                                                    equivalencyGroupId: group.id,
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
                                                    equivalencyGroupId: group.id,
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
