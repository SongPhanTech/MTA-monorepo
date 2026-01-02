import Table from '@components/commons/table'

import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { CouncilRole, SupervisorRole } from '@workspace/db'
import {
    useFindManyDefaultCouncilRolePayAmount,
    useFindManyDefaultSupervisorPayAmount,
    useUpdateDefaultCouncilRolePayAmount,
    useUpdateDefaultSupervisorPayAmount,
} from '@workspace/db/hooks'
import { Button, Col, Flex, Input, InputNumber, message, Row, Space } from 'antd'
import type React from 'react'
import { useState, useEffect } from 'react'

const RoleType: Map<SupervisorRole | CouncilRole, string> = new Map([
    [CouncilRole.CHAIRMAN, 'Chủ tịch'],
    [CouncilRole.SECRETARY, 'Thư ký'],
    [CouncilRole.REVIEWER_1, 'Phản biện 1'],
    [CouncilRole.REVIEWER_2, 'Phản biện 2'],
    [CouncilRole.MEMBER, 'Ủy viên'],
    [SupervisorRole.SUPERVISOR, 'Chuyên gia hướng dẫn (GVHD1)'],
    [SupervisorRole.CO_SUPERVISOR, 'Chuyên gia hướng dẫn phụ (GVHD2)'],
])

interface GroupedRecordData {
    roleName: string
    idProjectIn: string
    idThesisIn: string
    projectIn: number
    projectOut: number
    idProjectOut: string
    thesisIn: number
    idThesisOut: string
    thesisOut: number
    type: 'COUNCIL' | 'SUPERVISOR'
}
export default function PaymentConfigurationPage() {
    const [isEditing, setIsEditing] = useState(false)
    const [dataSource, setDataSource] = useState<GroupedRecordData[]>([])

    const { data: councilRolePayAmounts = [] } = useFindManyDefaultCouncilRolePayAmount()

    const { data: supervisorPayAmounts = [] } = useFindManyDefaultSupervisorPayAmount()
    const { mutateAsync: updateCouncilPay } = useUpdateDefaultCouncilRolePayAmount()
    const { mutateAsync: updateSupervisorPay } = useUpdateDefaultSupervisorPayAmount()

    const { showSpinner, hideSpinner } = useSpinner()
    const buildGroupedData = (): GroupedRecordData[] => {
        const map = new Map<string, GroupedRecordData>()

        const allRawData = [
            ...councilRolePayAmounts.map((item) => ({ ...item, type: 'COUNCIL' })),
            ...supervisorPayAmounts.map((item) => ({ ...item, type: 'SUPERVISOR' })),
        ]

        allRawData.forEach((item) => {
            const roleName = RoleType.get(item.role) ?? 'N/A'

            if (!map.has(roleName)) {
                map.set(roleName, {
                    roleName,
                    idProjectIn: '',
                    idThesisIn: '',
                    idProjectOut: '',
                    idThesisOut: '',
                    projectIn: 0,
                    projectOut: 0,
                    thesisIn: 0,
                    thesisOut: 0,
                    type: item.type as 'COUNCIL' | 'SUPERVISOR',
                })
            }

            const current = map.get(roleName)!
            const amount = item.amount.toNumber()

            if (item.description === 'PROJECT') {
                if (item.inAcademy) {
                    current.projectIn = amount
                    current.idProjectIn = item.id
                } else {
                    current.projectOut = amount
                    current.idProjectOut = item.id
                }
            } else if (item.description === 'THESIS') {
                if (item.inAcademy) {
                    current.thesisIn = amount
                    current.idThesisIn = item.id
                } else {
                    current.thesisOut = amount
                    current.idThesisOut = item.id
                }
            }
        })
        const result = Array.from(map.values())
        console.log('result', result)
        return result
    }
    useEffect(() => {
        // Gọi hàm buildGroupedData và lưu vào state
        const data = buildGroupedData()
        setDataSource(data)
    }, [councilRolePayAmounts, supervisorPayAmounts])
    const handleInputChange = (
        value: string | null,
        roleName: string,
        field: keyof GroupedRecordData
    ) => {
        const newData = [...dataSource]
        const index = newData.findIndex((item) => item.roleName === roleName)
        if (index > -1) {
            ;(newData[index][field] as string) = value || ''
            setDataSource(newData)
        }
    }
    const renderCell = (
        value: number,
        record: GroupedRecordData,
        field: keyof GroupedRecordData
    ) => {
        if (isEditing) {
            return (
                <Input
                    value={value}
                    style={{ width: '100%' }}
                    onChange={(val) => handleInputChange(val.target.value, record.roleName, field)}
                />
            )
        }
        return value ? value : '-'
    }
    const handleSave = async () => {
        showSpinner()
        try {
            const updatePromises: Promise<any>[] = []

            dataSource.forEach((item) => {
                // Tách logic theo Type để TypeScript nhận diện đúng signature của hàm
                if (item.type === 'COUNCIL') {
                    if (item.idProjectIn) {
                        updatePromises.push(
                            updateCouncilPay({
                                where: { id: item.idProjectIn },
                                data: { amount: item.projectIn },
                            })
                        )
                    }
                    if (item.idProjectOut) {
                        updatePromises.push(
                            updateCouncilPay({
                                where: { id: item.idProjectOut },
                                data: { amount: item.projectOut },
                            })
                        )
                    }
                    if (item.idThesisIn) {
                        updatePromises.push(
                            updateCouncilPay({
                                where: { id: item.idThesisIn },
                                data: { amount: item.thesisIn },
                            })
                        )
                    }
                    if (item.idThesisOut) {
                        updatePromises.push(
                            updateCouncilPay({
                                where: { id: item.idThesisOut },
                                data: { amount: item.thesisOut },
                            })
                        )
                    }
                } else {
                    // Ở đây TypeScript hiểu chắc chắn là SUPERVISOR
                    if (item.idProjectIn) {
                        updatePromises.push(
                            updateSupervisorPay({
                                where: { id: item.idProjectIn },
                                data: { amount: item.projectIn },
                            })
                        )
                    }
                    if (item.idProjectOut) {
                        updatePromises.push(
                            updateSupervisorPay({
                                where: { id: item.idProjectOut },
                                data: { amount: item.projectOut },
                            })
                        )
                    }
                    if (item.idThesisIn) {
                        updatePromises.push(
                            updateSupervisorPay({
                                where: { id: item.idThesisIn },
                                data: { amount: item.thesisIn },
                            })
                        )
                    }
                    if (item.idThesisOut) {
                        updatePromises.push(
                            updateSupervisorPay({
                                where: { id: item.idThesisOut },
                                data: { amount: item.thesisOut },
                            })
                        )
                    }
                }
            })

            await Promise.all(updatePromises)
            message.success('Cập nhật thành công!')
            setIsEditing(false)
        } catch (error) {
            console.error('Lưu thất bại:', error)
            message.error('Có lỗi xảy ra!')
        } finally {
            hideSpinner()
        }
    }
    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={24}>
                            <Flex justify="start">
                                {!isEditing ? (
                                    <Button type="primary" onClick={() => setIsEditing(true)}>
                                        Chỉnh sửa
                                    </Button>
                                ) : (
                                    <Space>
                                        <Button
                                            type="primary"
                                            onClick={() => {
                                                console.log('Dữ liệu cần lưu:', dataSource)
                                                handleSave()
                                            }}
                                        >
                                            Lưu thay đổi
                                        </Button>
                                        <Button onClick={() => setIsEditing(false)}>Hủy</Button>
                                    </Space>
                                )}
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Table
                        rowKey="id"
                        id="training-category"
                        data={buildGroupedData()}
                        pagination={false}
                        columns={[
                            {
                                title: 'STT',
                                width: 50,
                                align: 'center',
                                size: 'small',
                                fixed: 'left',
                                render: (_, __, index) => index + 1,
                            },
                            {
                                title: 'Tên vai trò',
                                align: 'center',
                                fixed: 'left',
                                width: 600,
                                type: 'input',
                                render: (_, record) => {
                                    return record.roleName
                                },
                            },
                            {
                                title: 'Thanh toán trong học viện',
                                align: 'center',
                                children: [
                                    {
                                        title: 'Đồ án',
                                        dataIndex: 'projectIn',
                                        align: 'center',
                                        width: 150,
                                        render: (val: number, _record: GroupedRecordData) =>
                                            renderCell(val, _record, 'projectIn'),
                                    },
                                    {
                                        title: 'Luận văn/Đề án',
                                        dataIndex: 'thesisIn',
                                        align: 'center',
                                        width: 150,
                                        render: (val: number, _record: GroupedRecordData) =>
                                            renderCell(val, _record, 'thesisIn'),
                                    },
                                ],
                            },
                            {
                                title: 'Thanh toán ngoài học viện',
                                align: 'center',
                                children: [
                                    {
                                        title: 'Đồ án',
                                        dataIndex: 'projectOut',
                                        align: 'center',
                                        width: 150,
                                        render: (val: number, _record: GroupedRecordData) =>
                                            renderCell(val, _record, 'projectOut'),
                                    },
                                    {
                                        title: 'Luận văn/Đề án',
                                        dataIndex: 'thesisOut',
                                        align: 'center',
                                        width: 150,
                                        render: (val: number, _record: GroupedRecordData) =>
                                            renderCell(val, _record, 'thesisOut'),
                                    },
                                ],
                            },
                        ]}
                    />
                </Col>
            </Row>
        </div>
    )
}

PaymentConfigurationPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
