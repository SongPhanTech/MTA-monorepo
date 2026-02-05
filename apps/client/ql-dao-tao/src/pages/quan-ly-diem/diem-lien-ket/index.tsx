import Select from '@components/commons/select'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import ViewIcon from '@components/icons/view'
import { SCORE_LINK_STATUS } from '@constants/constants'
import DefaultLayout from '@layouts/default-layout'
import { formatDate } from '@lib/utils'
import { Button, Col, Flex, Row } from 'antd'
import { ColumnsType } from 'antd/es/table'
import type React from 'react'
import { useMemo } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function ScoreLinkPage() {
    const { onOpen } = useDisclosure<{ id: string; mode: 'view' | 'edit' }>({
        tag: 'PutScoreLinkSheetModal',
    })
    const columns = useMemo<ColumnsType<any>>(
        () => [
            {
                title: 'STT',
                width: 60,
                align: 'center',
            },
            {
                title: 'Mã sinh viên',
                dataIndex: 'code',
                width: 150,
                align: 'center',
            },
            {
                title: 'Sinh viên',
                align: 'center',
                render: (_, record) => record.student?.userProfile?.fullname || '',
            },
            {
                title: 'Ngày tạo',
                align: 'center',
                width: 150,
                render: (_, record) =>
                    record.createdAt ? formatDate(record.createdAt) : undefined,
            },
            {
                title: 'Số môn',
                width: 100,
                align: 'center',
                render: (_, record) => record._count?.subjectScoreConvert ?? 0,
            },
            {
                title: 'Mô tả',
                dataIndex: 'description',
                width: 250,
            },
            {
                title: 'Thao tác',
                width: 100,
                align: 'center',
                render: () => (
                    <Row className="justify-center gap-2">
                        <ViewIcon className="text-sm text-gray-700 cursor-pointer" />
                        <EditIcon className="text-sm text-blue-700 cursor-pointer" />
                        <DeleteIcon />
                    </Row>
                ),
            },
        ],
        []
    )

    return (
        <Row gutter={[16, 0]}>
            <Col span={24}>
                <Row gutter={[16, 16]} align="top" justify="space-between">
                    <Col span={12}>
                        <Select
                            allowClear
                            placeholder="Chọn trạng thái"
                            style={{ width: 200 }}
                            options={Object.entries(SCORE_LINK_STATUS).map(([value, label]) => ({
                                label,
                                value,
                            }))}
                        />
                    </Col>
                    <Col span={6}>
                        <Flex justify="end">
                            <Button onClick={() => onOpen()} type="primary">
                                Thêm mới
                            </Button>
                        </Flex>
                    </Col>
                </Row>
            </Col>
            <Col span={24}>
                <Table columns={columns} data={[]} />
            </Col>
        </Row>
    )
}

ScoreLinkPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
