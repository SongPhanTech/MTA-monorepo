import FormItem from '@components/commons/form-item'
import type { PutSurveyType } from '@components/modal/put-modal-survey'
import { useFindManyDM_DonVi, useFindManyLecturer } from '@workspace/db/hooks'
import { Form, Table } from 'antd'
import React, { useMemo, useState, useEffect } from 'react'
import type { TreeNodeType } from '@/utils/convertOrganizationToTree'
interface MyTreeNode {
    title: string
    key: string
    value?: string // nếu bạn muốn gán giá trị riêng
    children?: MyTreeNode[]
}

function buildOrgAndLectureTree(
    list: Array<{ id: string; name: string | null; parentId: string | null }>,
    lecturers: Array<{
        id: string
        userProfile: { fullName: string }
        organizationId: string
        selectable: boolean
    }>,
    parentId: string | null = null
): Array<TreeNodeType> {
    return list
        .filter((item) => (item.parentId ?? null) === parentId)
        .map((item) => ({
            title: item.name || 'Đơn vị không tên',
            value: item.id,
            selectable: false,
            children: [
                ...lecturers
                    .filter((lecturer) => lecturer.organizationId === item.id)
                    .map((lecturer) => ({
                        ...lecturer,
                        title: lecturer.userProfile?.fullName || 'Giảng viên không tên',
                        value: `${lecturer.id}`,
                        children: [],
                    })),
                ...buildOrgAndLectureTree(list, lecturers, item.id),
            ],
        }))
}

function SelectLecturer({
    surveyTopicId,
    semesterId,
}: {
    surveyTopicId?: string
    semesterId?: string
}) {
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const form = Form.useFormInstance<PutSurveyType>()
    const [initValue, setInitValue] = useState<string[]>([])
    const where = useMemo(() => {
        return {
            mainSubjectClasses: {
                some: {
                    semester: {
                        id: semesterId,
                    },
                },
            },
        }
    }, [semesterId])
    const { data: lecturerData = [] } = useFindManyLecturer(
        {
            where,
            orderBy: {
                userProfile: {
                    firstName: 'asc',
                },
            },
            include: {
                userProfile: {
                    include:{
                        academicDegreeType: true,
                        academicRankType: true,
                        level: true,
                        rank: true
                    }
                },
                mainSubjectClasses: {
                    include: {
                        semester: true,
                    },
                },
                organization: true,
            },
        },
        {
            enabled: !!semesterId,
        }
    )

    const {
        data: organizations = [],
        isLoading: organizationsLoading,
        error: organizationsError,
    } = useFindManyDM_DonVi({
        where: {},
    })

    // Tạo treeData từ organizations và lecturers
    const treeData: TreeNodeType[] = useMemo(() => {
        if (!organizations.length || !lecturerData.length) return []

        return buildOrgAndLectureTree(
            organizations.map((org) => ({
                id: org.Id,
                name: `${org.sMa} - ${org.sTen}`,
                parentId: org.sParentId,
            })),
            lecturerData.map((lec) => ({
                ...lec,
                id: lec.id,
                userProfile: {
                    ...lec.userProfile,
                    fullName:
                        `${lec.userProfile?.lastName ?? ''} ${lec.userProfile?.firstName ?? ''}`.trim() ||
                        'Giảng viên không tên',
                },
                selectable: true,
                organizationId: lec.organizationId,
              
            })),
            null
        )
    }, [organizations, lecturerData])
    console.log(treeData);
    
    
    const rowSelection = {
        selectedRowKeys,
        checkStrictly: false,

        onChange: (newSelectedRowKeys: React.Key[]) => {
            setSelectedRowKeys(newSelectedRowKeys)
            form.setFieldsValue({
                lecturerIds: newSelectedRowKeys as string[],
            })
        },
        getCheckboxProps: (record: any) => ({
            disabled: !record.selectable,
        }),
    }

    useEffect(() => {
        if (lecturerData.length) {
            const list = lecturerData.map((lec) => lec.id)
            setSelectedRowKeys(list)
            form.setFieldsValue({
                lecturerIds: list,
            })
        }
    }, [lecturerData])

    return (
        <div className="w-full px-3 mt-3">
            <div className="mb-4 text-[14px] font-[500]">Chọn giảng viên</div>
            <div>
                <FormItem
                    form={form}
                    name="lecturerIds"
                    className="max-h-[500px] overflow-y-scroll"
                >
                    <Table
                        expandable={{
                            expandedRowKeys: initValue,
                            onExpandedRowsChange: (expandedRows) => {
                                setInitValue(expandedRows as string[])
                            },
                            rowExpandable: (record) => {
                                const children = record.children
                                return Array.isArray(children) && children.length > 0
                            },
                            expandRowByClick: true,
                        }}
                        rowKey={'value'}
                        rowSelection={rowSelection}
                        columns={[
                           
                            {
                                title: 'Giảng viên',
                                dataIndex: 'name',
                                render: (__, record) => <span>{record?.title}</span>,
                            },
                              {
                                title: 'Mã GV',
                                dataIndex: 'code',
                                render: (__, record:any) => <span>{record?.code}</span>,
                            },
                            {
                                title: 'Cấp bậc',
                                dataIndex: 'rank',
                                width: 100,
                                render: (__, record:any) => <>{record?.rank?.sTen}</>,
                            },
                            {
                                title: 'Học hàm',
                                dataIndex: 'rank',
                                width: 100,
                                render: (__, record:any) => <>{record?.academicRankType?.sTen}</>,
                            },
                              {
                                title: 'Học vị',
                                dataIndex: 'rank',
                                width: 100,
                                render: (__, record:any) => <>{record?.academicDegreeType?.sTen}</>,
                            },
                        ]}
                        bordered
                        dataSource={treeData}
                        pagination={false}
                    />
                    {/* <Tree
                        style={{ width: '100%' }}
                         autoExpandParent={true}
                                checkable={true}
                                defaultExpandAll={true}
                                multiple={true}
                        treeData={treeData}
        /> */}
                </FormItem>
            </div>
        </div>
    )
}

export default SelectLecturer
