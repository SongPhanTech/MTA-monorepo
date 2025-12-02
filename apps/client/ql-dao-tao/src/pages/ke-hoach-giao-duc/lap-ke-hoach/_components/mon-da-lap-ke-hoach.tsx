import { queryClient } from '@api/index'
import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { getMinioUrl } from '@workspace/constant'
import { $Enums } from '@workspace/db/client'
import {
    useDeleteManyPlanTrainingSubject,
    useFindFirstPlanTraining,
    useFindUniqueSemester,
} from '@workspace/db/hooks'
import { exportFromTemplate } from '@workspace/libs/template-excel'
import { useAbility } from '@workspace/permissions/hooks'
import { useSemesterStore, useTrainingCourseStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { Button, Col, Flex, Form, Input, message, Popconfirm, Row } from 'antd'
import _ from 'lodash'
import { Search } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

type MonDaLapKeHoachForm = {
    searchText: string | null
    subjectSelected?: Array<string>
}

export default function MonDaLapKeHoach({ hocLai = false }: { hocLai?: boolean }) {
    const { can } = useAbility()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(100)
    const { id: semesterId } = useSemesterStore()
    const [form] = Form.useForm<MonDaLapKeHoachForm>()
    const searchText = Form.useWatch('searchText', form)
    const subjectSelected = Form.useWatch('subjectSelected', form) || []
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const { id: trainingCourseId } = useTrainingCourseStore()
    const { data: semesterData } = useFindUniqueSemester(
        {
            where: { id: semesterId },
            select: {
                id: true,
                name: true,
                schoolYear: {
                    select: { id: true, name: true },
                },
            },
        },
        {
            enabled: !!semesterId,
        }
    )

    const { data: planTraining } = useFindFirstPlanTraining(
        {
            where: {
                semesterId: semesterId as string,
                trainingObjectTypeId,
                trainingCourseId,
            },
            include: {
                planTrainingSubjects: {
                    take: numberOfPages,
                    skip: (currentPage - 1) * numberOfPages,
                    include: {
                        trainingBlockSubject: {
                            include: {
                                subject: {
                                    include: {
                                        managementOrganization: {
                                            select: {
                                                sMa: true,
                                            },
                                        },
                                    },
                                },
                                trainingBlockOnCurriculumVersion: {
                                    include: {
                                        curriculumVersion: {
                                            include: {
                                                fixedClasses: {
                                                    include: {
                                                        _count: {
                                                            select: {
                                                                students: {
                                                                    where: {
                                                                        active: true,
                                                                        status: 'ENROLLED',
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                    orderBy: {
                                                        code: 'asc',
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    where: {
                        trainingBlockSubject: {
                            subject: {
                                ...(searchText
                                    ? {
                                          name: {
                                              contains: searchText,
                                              mode: 'insensitive',
                                          },
                                      }
                                    : {}),
                            },
                        },
                        subjectClassType: hocLai
                            ? $Enums.SubjectClassType.RETAKE
                            : $Enums.SubjectClassType.NORMAL,
                    },
                },
                _count: {
                    select: {
                        planTrainingSubjects: {
                            where: {
                                deletedAt: null,
                                active: true,
                                subjectClassType: hocLai
                                    ? $Enums.SubjectClassType.RETAKE
                                    : $Enums.SubjectClassType.NORMAL,
                            },
                        },
                    },
                },
            },
        },
        { enabled: !!semesterId && !!trainingObjectTypeId }
    )

    const { onOpen: openKhoiTaoMon } = useDisclosure<{
        hocLai: boolean
    }>({
        tag: 'KhoiTaoMon',
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: deleteManyPlanTrainingSubject } = useDeleteManyPlanTrainingSubject()

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            queryClient.invalidateQueries({ queryKey: ['/api/subject-class/open-subject-class'] })
            queryClient.invalidateQueries({ queryKey: ['zenstack', 'PlanTraining'] })
            queryClient.invalidateQueries({ queryKey: ['zenstack', 'PlanTrainingDelay'] })
            queryClient.invalidateQueries({
                queryKey: ['zenstack', 'PlanTrainingSubject'],
            })
            queryClient.invalidateQueries({
                queryKey: ['/api/subject-class/open-subject-class-retake'],
            })
        }, 500),
        []
    )

    return (
        <Form
            className="w-full"
            form={form}
            onValuesChange={(filter: MonDaLapKeHoachForm) => {
                if (!filter.subjectSelected) {
                    debouncedRefetch()
                }
            }}
        >
            <Row align="top" justify="space-between">
                <Col span={10}>
                    <Form.Item className="m-0" name="searchText">
                        <Input
                            id="search"
                            placeholder="Nhập tên môn..."
                            style={{ height: 32 }}
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
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Flex justify="end" gap={4}>
                        <Button
                            onClick={() =>
                                openKhoiTaoMon({
                                    hocLai,
                                })
                            }
                            type="default"
                        >
                            Bổ sung môn
                        </Button>
                        <Button
                            type="primary"
                            onClick={() =>
                                exportFromTemplate({
                                    templateUrl: getMinioUrl(
                                        '/mta/template/ke-hoach-dao-tao/ke-hoach-mo-lop.xlsx'
                                    ),
                                    sheets: [
                                        {
                                            sheet: 'KeHoachMoLop',
                                            data: {
                                                hoc_ky: semesterData?.name ?? '',
                                                nam_hoc: semesterData?.schoolYear?.name ?? '',
                                            },
                                            tableStartCell: { row: 7, col: 1 },
                                            rows:
                                                planTraining?.planTrainingSubjects.flatMap(
                                                    (item, index) =>
                                                        item?.trainingBlockSubject?.trainingBlockOnCurriculumVersion?.curriculumVersion?.fixedClasses?.map?.(
                                                            (fc, idx, arr) => {
                                                                const rowSpan =
                                                                    idx === 0 ? arr.length : 1
                                                                return {
                                                                    cells: [
                                                                        {
                                                                            value: index + 1,
                                                                            align: 'center',
                                                                            rowSpan,
                                                                        },
                                                                        {
                                                                            value:
                                                                                item
                                                                                    .trainingBlockSubject
                                                                                    .subject
                                                                                    ?.code ?? '',
                                                                            align: 'center',
                                                                            rowSpan,
                                                                        },
                                                                        {
                                                                            value:
                                                                                item
                                                                                    .trainingBlockSubject
                                                                                    .subject
                                                                                    ?.name ?? '',
                                                                            rowSpan,
                                                                        },
                                                                        {
                                                                            value:
                                                                                item
                                                                                    .trainingBlockSubject
                                                                                    .subject
                                                                                    ?.credit ?? '',
                                                                            align: 'center',
                                                                            rowSpan,
                                                                        },
                                                                        {
                                                                            value: `${fc.code}`,
                                                                            align: 'center',
                                                                        },
                                                                        {
                                                                            value: `${fc._count.students ?? 0}`,
                                                                            align: 'center',
                                                                        },
                                                                        {
                                                                            value: '',
                                                                            align: 'center',
                                                                            rowSpan,
                                                                        },
                                                                        {
                                                                            value: item?.trainingBlockSubject?.trainingBlockOnCurriculumVersion.curriculumVersion?.fixedClasses?.reduce?.(
                                                                                (sum, fc) =>
                                                                                    sum +
                                                                                    (fc._count
                                                                                        ?.students ??
                                                                                        0),
                                                                                0
                                                                            ) ?? 0,
                                                                            align: 'center',
                                                                            rowSpan,
                                                                        },
                                                                        {
                                                                            value:
                                                                                item
                                                                                    ?.trainingBlockSubject
                                                                                    ?.subject
                                                                                    ?.managementOrganization
                                                                                    ?.sMa ?? '',
                                                                            align: 'center',
                                                                            rowSpan,
                                                                        },
                                                                    ],
                                                                }
                                                            }
                                                        )
                                                ) ?? [],
                                        },
                                    ],
                                    fileName: `ke-hoach-mo-lop-mon-hoc-${semesterData?.name}-${semesterData?.schoolYear.name}.xlsx`,
                                })
                            }
                        >
                            Xuất kế hoạch
                        </Button>
                        <Popconfirm
                            title="Bạn có chắc chắn xoá các môn đã lập kế hoạch đã chọn?"
                            onConfirm={async () => {
                                try {
                                    showSpinner()
                                    await deleteManyPlanTrainingSubject({
                                        where: {
                                            trainingBlockSubjectId: { in: subjectSelected },
                                            subjectClassType: hocLai
                                                ? $Enums.SubjectClassType.RETAKE
                                                : $Enums.SubjectClassType.NORMAL,
                                        },
                                    })
                                    debouncedRefetch()
                                    message.success('Xoá môn đã lập kế hoạch thành công')
                                    form.resetFields()
                                } catch (error) {
                                    console.log(error)
                                    message.error('Xoá môn đã lập kế hoạch thất bại')
                                }
                                hideSpinner()
                            }}
                        >
                            <Button disabled={!subjectSelected.length} type="primary" danger>
                                Đưa môn ra khỏi KHDK
                            </Button>
                        </Popconfirm>
                    </Flex>
                </Col>
                <Form.Item hidden name="subjectSelected" />
                <Table
                    rowKey="trainingBlockSubjectId"
                    id="fixed-class"
                    rowSelection={{
                        selectedRowKeys: subjectSelected,
                        onChange: (selectedRowKeys) => {
                            form.setFieldValue('subjectSelected', selectedRowKeys)
                        },
                        type: 'checkbox',
                        columnWidth: 20,
                    }}
                    onRow={(record) => {
                        return {
                            onClick: () => {
                                const isSelected = subjectSelected.includes(record.subjectVersionId)
                                if (isSelected) {
                                    form.setFieldValue(
                                        'subjectSelected',
                                        subjectSelected.filter(
                                            (id) => id !== record.subjectVersionId
                                        )
                                    )
                                } else {
                                    form.setFieldValue('subjectSelected', [
                                        ...subjectSelected,
                                        record.subjectVersionId,
                                    ])
                                }
                            },
                        }
                    }}
                    data={planTraining?.planTrainingSubjects ?? []}
                    columns={[
                        {
                            title: 'STT',
                            width: 35,
                            align: 'center',
                            fixed: 'left',
                            render: (_, __, index) =>
                                index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                        },
                        {
                            title: 'Mã MH',
                            dataIndex: ['subjectVersion', 'code'],
                            align: 'center',
                            width: 80,
                        },
                        {
                            title: 'Tên môn',
                            dataIndex: ['subjectVersion', 'name'],
                            width: 120,
                            align: 'center',
                            render: (text, record) => (
                                <div className="text-left">
                                    {text} ({record.subjectVersion.credit})
                                </div>
                            ),
                        },
                    ]}
                    pagination={{
                        current: currentPage,
                        pageSize: numberOfPages,
                        total: planTraining?._count.planTrainingSubjects ?? 0,
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
            </Row>
        </Form>
    )
}
