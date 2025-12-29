import Table from '@components/commons/table'

import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { CouncilRole, SupervisorRole } from '@workspace/db'
import {
    useFindManyDefaultCouncilRolePayAmount,
    useFindManyDefaultSupervisorPayAmount,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION } from '@workspace/router'
import { Col, Row } from 'antd'
import type React from 'react'
import { useState } from 'react'
const RoleType: Map<SupervisorRole | CouncilRole, string> = new Map([
    [CouncilRole.CHAIRMAN, 'Chủ tịch'],
    [CouncilRole.SECRETARY, 'Thư ký'],
    [CouncilRole.REVIEWER_1, 'Phản biện 1'],
    [CouncilRole.REVIEWER_2, 'Phản biện 2'],
    [CouncilRole.MEMBER, 'Ủy viên'],
    [SupervisorRole.SUPERVISOR, 'Chuyên gia hướng dẫn'],
    [SupervisorRole.CO_SUPERVISOR, 'Chuyên gia hướng dẫn phụ'],
])
interface RecordData {
    id: string
    role: RoleType
    amount: number
    description: string
}
export default function PaymentConfigurationPage() {
    const { can, canSome } = useAbility()

    const { data: councilRolePayAmounts = [] } = useFindManyDefaultCouncilRolePayAmount()
    const { data: supervisorPayAmounts = [] } = useFindManyDefaultSupervisorPayAmount()
    const buildCouncilRolePayAmounts = (): RecordData[] => {
        const data: RecordData[] = []
        councilRolePayAmounts.forEach((councilRolePayAmount) => {
            data.push({
                id: councilRolePayAmount.id,
                role: councilRolePayAmount.role as RoleType,
                amount: councilRolePayAmount.amount.toNumber(),
                description: councilRolePayAmount.description ?? '',
            })
        })
        supervisorPayAmounts.forEach((supervisorPayAmount) => {
            data.push({
                id: supervisorPayAmount.id,
                //@ts-ignore: ignore type error
                role: supervisorPayAmount.role as RoleType,
                amount: supervisorPayAmount.amount.toNumber(),
                description: supervisorPayAmount.description ?? '',
            })
        })
        return data
    }

    const { showSpinner, hideSpinner } = useSpinner()

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Table
                        rowKey="id"
                        id="training-category"
                        data={buildCouncilRolePayAmounts()}
                        columns={[
                            {
                                title: 'STT',
                                width: 50,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) => index + 1,
                            },
                            {
                                title: 'Tên vai trò',
                                dataIndex: 'role',
                                align: 'center',
                                fixed: 'left',
                                width: 150,
                                type: 'input',
                                render: (_, record) => {
                                    return
                                },
                            },
                            {
                                title: 'Thanh toán trong học viện',
                                align: 'center',
                                fixed: 'left',
                                width: 150,
                                type: 'input',
                            },
                            {
                                title: 'Thanh toán ngoài học viện',
                                width: 200,
                                fixed: 'left',
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Thao tác',
                                width: 50,
                                align: 'center',
                                fixed: 'right',
                                hidden: !canSome(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_NGANH,
                                    'SUA',
                                    'XOA'
                                ),
                                render: (_, { id }) => {
                                    return ''
                                },
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
