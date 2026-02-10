import Table from '@components/commons/table'
import ViewIcon from '@components/icons/view'
import { useFindManyTrainingBlockOnCurriculumVersion } from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Modal, Tag } from 'antd'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

interface TrainingBlockInput {
    trainingBlockId: string
    trainingBlockName?: string
}

const ModalCurriculumVersionByTrainingBlock = () => {
    const router = useRouter()

    const { isOpen, onClose, input } = useDisclosure<TrainingBlockInput>({
        tag: 'ModalCurriculumVersionByTrainingBlock',
    })

    const { trainingBlockId, trainingBlockName } = input || {}

    const { data = [] } = useFindManyTrainingBlockOnCurriculumVersion({
        where: {
            trainingBlockId: trainingBlockId || '',
            curriculumVersion: {
                deletedAt: null,
            },
        },
        include: {
            curriculumVersion: {
                include: {
                    curriculum: {
                        include: {
                            trainingMajor: true,
                            managementOrganization: true,
                        },
                    },
                },
            },
            trainingBlock: true,
        },
        orderBy: {
            priority: 'asc',
        },
    })

    // Group by curriculumVersionId to get unique curriculum versions
    const uniqueCurriculumVersions = useMemo(() => {
        const map = new Map()
        data.forEach((item) => {
            if (item.curriculumVersion && !map.has(item.curriculumVersion.id)) {
                map.set(item.curriculumVersion.id, item.curriculumVersion)
            }
        })
        return Array.from(map.values())
    }, [data])

    const handleViewDetail = (curriculumVersionId: string) => {
        router.push(
            `${ROUTER_PATH.QL_DAO_TAO.CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO}/${curriculumVersionId}`
        )
        onClose()
    }

    return (
        <Modal
            title={`Danh sách CTĐT có khối kiến thức: ${trainingBlockName || ''}`}
            open={isOpen}
            onCancel={onClose}
            width={1200}
            footer={null}
            destroyOnClose
        >
            <Table
                rowKey="id"
                dataSource={uniqueCurriculumVersions}
                pagination={false}
                columns={[
                    {
                        title: 'STT',
                        width: 50,
                        align: 'center',
                        render: (_, __, index) => index + 1,
                    },
                    {
                        title: 'Mã CTĐT',
                        dataIndex: 'code',
                        width: 120,
                        align: 'center',
                    },
                    {
                        title: 'Tên CTĐT',
                        dataIndex: 'name',
                        align: 'center',
                    },
                    {
                        title: 'Chuyên ngành',
                        align: 'center',
                        width: 200,
                        render: (_, record) => record?.curriculum?.trainingMajor?.name || '-',
                    },
                    {
                        title: 'Đơn vị quản lý',
                        align: 'center',
                        width: 200,
                        render: (_, record) =>
                            record?.curriculum?.managementOrganization?.sTen || '-',
                    },
                    {
                        title: 'Trạng thái',
                        align: 'center',
                        width: 120,
                        render: (_, record) =>
                            record?.active ? (
                                <Tag color="success">Đang áp dụng</Tag>
                            ) : (
                                <Tag color="error">Ngừng áp dụng</Tag>
                            ),
                    },
                    {
                        title: 'Thao tác',
                        width: 100,
                        align: 'center',
                        render: (_, record) => (
                            <ViewIcon
                                title="Xem chi tiết"
                                onClick={() => handleViewDetail(record.id)}
                                className="text-blue-700 cursor-pointer"
                            />
                        ),
                    },
                ]}
            />
        </Modal>
    )
}

export default ModalCurriculumVersionByTrainingBlock
