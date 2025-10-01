import TreeSelectSemester from '@components/commons/semester-select/TreeSelectSemester'
import TableCollapse from '@components/commons/tableCollapse'
import type { FilterProps } from '@components/commons/typeFilter'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useExamTypeOptions } from '@hooks/examType'
import { useCountSubjectVersion, useFindManySubjectVersion } from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { KHAO_THI_PERMISSION, ROUTER_PATH } from '@workspace/router'
import { useTrainingObjectTypeStore } from '@workspace/ui'
import { Button, Col, Flex, Input, Row, Tag } from 'antd'
import { BookOpenCheck, Search } from 'lucide-react'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'

function SubjectVersion() {
    const { can, canSome } = useAbility()
    const router = useRouter()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [selectedSemesterId, setSelectedSemesterId] = useState<string>('')
    const { options: examTypeOption, getExamTypeLabel } = useExamTypeOptions()
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const [uiSelectedKeys, setUiSelectedKeys] = useState<React.Key[]>([])
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        code: '',
        name: '',
        credit: undefined,
        examType: undefined,
        hasExam: undefined,
        count: undefined,
    })

    const where = useMemo(
        () => ({
            ...(filters.searchText && filters.searchText !== ''
                ? {
                      OR: [
                          {
                              code: {
                                  contains: filters.searchText,
                                  mode: 'insensitive' as const,
                              },
                          },
                          {
                              name: {
                                  contains: filters.searchText,
                                  mode: 'insensitive' as const,
                              },
                          },
                      ],
                  }
                : {}),
            subjectClass: {
                some: {
                    cancelled: false,
                    trainingObjectTypeId,
                    ...(selectedSemesterId && {
                        semesterId: selectedSemesterId,
                    }),
                    ...(filters.code && {
                        code: {
                            contains: filters.code,
                            mode: 'insensitive' as const,
                        },
                    }),
                    ...(filters.name && {
                        name: {
                            contains: filters.name,
                            mode: 'insensitive' as const,
                        },
                    }),
                    ...(filters.examType
                        ? {
                              examType: {
                                  in: filters.examType,
                              },
                          }
                        : {}),
                    ...(Array.isArray(filters.hasExam) &&
                        filters.hasExam.length === 1 &&
                        filters.hasExam[0] === true && { exam: { isNot: null } }),
                    ...(Array.isArray(filters.hasExam) &&
                        filters.hasExam.length === 1 &&
                        filters.hasExam[0] === false && { exam: { is: null } }),
                },
            },
        }),
        [
            filters.searchText,
            selectedSemesterId,
            trainingObjectTypeId,
            filters.code,
            filters.name,
            filters.examType,
            filters.hasExam,
        ]
    )

    const { data = [] } = useFindManySubjectVersion({
        where,
        include: {
            subjectClass: {
                include: {
                    semester: { include: { schoolYear: true } },
                    mainLecturer: {
                        select: {
                            code: true,
                            userProfile: {
                                select: {
                                    fullname: true,
                                },
                            },
                        },
                    },
                    exam: true,
                    _count: {
                        select: {
                            subjectClassStudent: true,
                        },
                    },
                },
                orderBy: filters.count
                    ? {
                          subjectClassStudent: {
                              _count: filters.count,
                          },
                      }
                    : undefined,
                where: {
                    cancelled: false,
                    trainingObjectTypeId,
                    ...(selectedSemesterId && {
                        semesterId: selectedSemesterId,
                    }),
                    ...(filters.code && {
                        code: {
                            contains: filters.code,
                            mode: 'insensitive',
                        },
                    }),
                    ...(filters.name && {
                        name: {
                            contains: filters.name,
                            mode: 'insensitive',
                        },
                    }),
                    ...(filters.examType
                        ? {
                              examType: {
                                  in: filters.examType,
                              },
                          }
                        : {}),
                    ...(Array.isArray(filters.hasExam) &&
                        filters.hasExam.length === 1 &&
                        filters.hasExam[0] === true && { exam: { isNot: null } }),
                    ...(Array.isArray(filters.hasExam) &&
                        filters.hasExam.length === 1 &&
                        filters.hasExam[0] === false && { exam: { is: null } }),
                },
            },
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountSubjectVersion({
        where: { ...where, deletedAt: null },
    })

    const getChildIds = (record: any) => {
        return (record?.subjectClass || [])
            .filter((child: any) => !child.exam)
            .map((child: any) => child.id)
    }

    // Đồng bộ cha để hiển thị UI tick
    const syncUISelection = (childKeys: React.Key[], allRecords: any[]): React.Key[] => {
        let uiKeys: React.Key[] = [...childKeys]

        allRecords.forEach((record) => {
            if (record.subjectClass) {
                const childIds = getChildIds(record)
                if (childIds.length > 0) {
                    const allChildrenSelected = childIds.every((id: string) =>
                        childKeys.includes(id)
                    )
                    if (allChildrenSelected) {
                        uiKeys.push(record.id) // tick cha trong UI
                    } else {
                        uiKeys = uiKeys.filter((k) => k !== record.id) // bỏ tick cha
                    }
                }
            }
        })

        return uiKeys
    }

    const getParentId = (record: any, allRecords: any[]): string | null => {
        if (record.subjectClass) {
            // record là cha
            return record.id
        }
        // record là con → tìm cha chứa nó
        const parent = allRecords.find((r) =>
            (r.subjectClass || []).some((c: any) => c.id === record.id)
        )
        return parent?.id || null
    }

    const rowSelection = {
        selectedRowKeys: uiSelectedKeys,
        onSelect: (record: any, selected: boolean) => {
            let newChildKeys: React.Key[] = []

            const parentId = getParentId(record, data)

            // Tìm xem hiện tại đang chọn cha nào
            let currentParent: string | null = null
            for (const rec of data) {
                const childIds = getChildIds(rec)
                if (childIds.some((id: string) => selectedRowKeys.includes(id))) {
                    currentParent = rec.id
                    break
                }
            }

            // Nếu đang chọn 1 cha khác => reset selection
            if (currentParent && currentParent !== parentId) {
                newChildKeys = []
            } else {
                newChildKeys = [...selectedRowKeys]
            }

            if (record.subjectClass) {
                // Click vào cha
                const childIds = getChildIds(record)
                if (selected) {
                    newChildKeys = [...childIds]
                } else {
                    newChildKeys = []
                }
            } else {
                // Click vào con
                if (selected) {
                    newChildKeys.push(record.id)
                } else {
                    newChildKeys = newChildKeys.filter((id) => id !== record.id)
                }
            }

            // Cập nhật state
            setSelectedRowKeys(newChildKeys) // chỉ con
            setUiSelectedKeys(syncUISelection(newChildKeys, data)) // UI tick cha
        },
        getCheckboxProps: (record: any) => {
            if (record.subjectClass) {
                const allChildrenDisabled =
                    record.subjectClass.length > 0 &&
                    record.subjectClass.every((c: any) => !!c.exam)
                return { disabled: allChildrenDisabled }
            }
            return { disabled: !!record.exam }
        },
        hideSelectAll: true,
    }

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 0]} align="top" justify="end">
                        <Col span={12}>
                            <Flex gap={8}>
                                <Input
                                    id="search"
                                    onChange={(e) =>
                                        setFilters({
                                            ...filters,
                                            searchText: e.target.value,
                                        })
                                    }
                                    className="py-0 h-8"
                                    placeholder="Tìm kiếm phiên bản môn học"
                                    prefix={
                                        <Search
                                            size={15}
                                            style={{
                                                color: 'rgba(0, 0, 0, 0.25)',
                                            }}
                                        />
                                    }
                                    allowClear
                                />
                                <TreeSelectSemester
                                    filterTimeNow={true}
                                    onChange={(val) => setSelectedSemesterId(val)}
                                />
                            </Flex>
                        </Col>
                        <Col span={12}>
                            <Flex justify="end">
                                {can(
                                    KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_DE_THI_DS_KY_THI,
                                    'THEM'
                                ) && (
                                    <Button
                                        onClick={() => {
                                            if (selectedRowKeys.length === 0) {
                                                return
                                            }
                                            router.push(
                                                `${ROUTER_PATH.KHAO_THI.THIET_LAP_DE_THI_DS_KY_THI}/create?ids=${selectedRowKeys.join(',')}`
                                            )
                                        }}
                                        type="primary"
                                        disabled={selectedRowKeys.length === 0}
                                    >
                                        <BookOpenCheck />
                                        Tạo kỳ thi
                                    </Button>
                                )}
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <TableCollapse
                        rowKey="id"
                        filters={filters}
                        setFilters={(value) => {
                            setFilters(value)
                            setCurrentPage(1)
                        }}
                        headerTitleKey={({ code, name, credit }) =>
                            `${[code, name].filter(Boolean).join(' - ')} (${credit} tín chỉ)`
                        }
                        rowSelection={rowSelection}
                        childrenFieldName="subjectClass"
                        defaultExpandAll
                        columns={[
                            {
                                title: 'Mã lớp',
                                dataIndex: 'code',
                                fixed: 'left',
                                width: 220,
                                type: 'input',
                                align: 'center',
                            },
                            {
                                title: 'Tên lớp',
                                dataIndex: 'name',
                                fixed: 'left',
                                width: 220,
                                type: 'input',
                            },
                            {
                                title: 'Học kỳ',
                                width: 220,

                                render: (_, record) => {
                                    return [
                                        record?.semester?.name,
                                        record?.semester?.schoolYear?.name,
                                    ]
                                        .filter(Boolean)
                                        .join(' - ')
                                },
                            },
                            {
                                title: 'Giảng viên',
                                width: 220,
                                render: (_, record) => {
                                    return [
                                        record?.mainLecturer?.code,
                                        record?.mainLecturer?.userProfile?.fullname,
                                    ]
                                        .filter(Boolean)
                                        .join(' - ')
                                },
                            },
                            {
                                title: 'SL sinh viên',
                                width: 120,
                                align: 'center',
                                type: 'order',
                                dataIndex: 'count',
                                render: (_, record) => {
                                    return record?._count?.subjectClassStudent || 0
                                },
                            },
                            {
                                title: 'Hình thức thi',
                                dataIndex: 'examType',
                                width: 150,
                                align: 'center',
                                fixed: 'right',
                                type: 'select',
                                options: examTypeOption,
                                render: (_, record) => {
                                    return getExamTypeLabel(record?.examType)
                                },
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                fixed: 'right',
                                width: 100,
                                type: 'select',
                                dataIndex: 'hasExam',
                                options: [
                                    { label: 'Đã có kỳ thi', value: true },
                                    { label: 'Chưa có kỳ thi', value: false },
                                ],
                                render: (__, record) => {
                                    const hasExam = !!record.exam

                                    return hasExam ? (
                                        <Tag color="green">Đã tạo kỳ thi</Tag>
                                    ) : (
                                        <Tag color="default">Chưa tạo kỳ thi</Tag>
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 120,
                                align: 'center',
                                fixed: 'right',
                                hidden: !canSome(
                                    KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_DE_THI_DS_KY_THI,
                                    'THEM'
                                ),
                                render: (_, { id, exam }) => (
                                    <Row className="justify-center gap-2">
                                        <Button
                                            disabled={!!exam}
                                            className="flex items-center gap-2 text-primary"
                                            onClick={() => {
                                                router.push(
                                                    `${ROUTER_PATH.KHAO_THI.THIET_LAP_DE_THI_DS_KY_THI}/create?ids=${id}`
                                                )
                                            }}
                                        >
                                            <BookOpenCheck />
                                            <span>Tạo kỳ thi</span>
                                        </Button>
                                    </Row>
                                ),
                            },
                        ]}
                        data={data}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            total: count,
                            onChange: (page, pageSize) => {
                                if (numberOfPages === pageSize) {
                                    setCurrentPage(page)
                                } else {
                                    setCurrentPage(1)
                                    setNumberOfPages(pageSize)
                                }
                            },
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

export default SubjectVersion
