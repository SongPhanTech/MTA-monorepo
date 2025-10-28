import ImportScoreModal from '@components/commons/print/nhap-diem-tu-file'
import ExportScoreTemplate from '@components/commons/print/xuat-mau-nhap-diem'
import Table from '@components/commons/table'
import ExportTemplateExam from '@components/ui/in-phieu-danh-sach-thi'
import type { FilterProps } from '@constants/type'
import useSpinner from '@hooks/spinner'
import { useSession } from '@workspace/auth/react'
import type { StudentSubjectScore } from '@workspace/db/client'
import { useFindManyStudentSubjectScore } from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { listUser } from '@workspace/libs/constants'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION } from '@workspace/router'
import {
    Checkbox,
    Col,
    Form,
    Input,
    InputNumber,
    Modal,
    message,
    Row,
    Flex,
    Popover,
    Button,
} from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import { Ellipsis, FileUp, Save } from 'lucide-react'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'

type FilterTable = FilterProps & {
    fullname?: string
    fixedClassName?: string
    attendanceScore?: 'asc' | 'desc'
    midtermScore?: 'asc' | 'desc'
    examScore?: 'asc' | 'desc'
}
interface SubjectClassScoreForm {
    list: Record<
        string,
        {
            attendanceScore?: number | null
            midtermScore?: number | null
            description?: string | null
            examBanned?: boolean | null
            examBannedReason?: string | null
            examPostponed?: boolean | null
            examPostponedReason?: string | null
            attendanceScoreOld?: number | null
            midtermScoreOld?: number | null
        }
    >
}
export default function DiemQuaTrinh({
    dataDetailSubjectClass,
    refetchSubjectClass,
    subjectClassId,
}: any) {
    const { can } = useAbility()
    const canReadAll = can(
        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DS_LOP_MON_HOC,
        'XEM_TAT_CA'
    )
    const { showSpinner, hideSpinner } = useSpinner()
    const router = useRouter()
    const [form] = Form.useForm<SubjectClassScoreForm>()
    const [isChanged, setIsChanged] = useState(false)

    const { data: session } = useSession()
    const profileId = session?.sDM_NhanVienId || ''
    const [open, setOpen] = useState(false)
    const [importModalVisible, setImportModalVisible] = useState(false)
    const [filterTable, setFilterTable] = useState<FilterTable>({
        fullname: '',
        fixedClassName: '',
        dateOfBirth: undefined,
        attendanceScore: undefined,
        midtermScore: undefined,
        examScore: undefined,
    })

    const handleSave = () => {
        Modal.confirm({
            title: 'Xác nhận',
            content: 'Bạn có chắc chắn muốn lưu điểm không?',
            okText: 'Xác nhận',
            cancelText: 'Hủy',
            onOk: async () => {
                handleSaveScores()
            },
        })
    }
    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
            refetchSubjectClass()
        }, 500),
        []
    )

    const handleSaveScores = async () => {
        try {
            showSpinner()
            const dataTableSubmit = form.getFieldsValue()
            const listObject = Object.entries(dataTableSubmit.list).map(([key, value_]) => {
                return {
                    id: key,
                    ...value_,
                }
            })

            let listSqlTransaction: any = []

            const list = dataTable.find(
                (i: any) =>
                    (!i.attendanceScore || !dataTableSubmit.list[i.id].attendanceScore) &&
                    (!i.midtermScore || !dataTableSubmit.list[i.id].midtermScore)
            )
            if (!list && subjectClassId) {
                listSqlTransaction = [
                    ...listSqlTransaction,
                    {
                        model: 'SubjectClass',
                        operation: 'update',
                        data: {
                            where: {
                                id: subjectClassId,
                            },
                            data: { enteredScore: true },
                        },
                    },
                ]
            }
            const listChange = listObject.filter(
                (i: any) =>
                    i.attendanceScore ||
                    i.midtermScore ||
                    i.description ||
                    i.examPostponed ||
                    i.examPostponedReason ||
                    i.examBanned ||
                    i.examBannedReason
            )

            if (listChange.length > 0) {
                listSqlTransaction = [
                    ...listSqlTransaction,
                    ...listChange.map((item: any) => {
                        const { id } = item
                        const newData = dataTableSubmit.list[id]

                        return {
                            model: 'StudentSubjectScore',
                            operation: 'update',
                            data: {
                                where: { id },
                                data: {
                                    ...newData,
                                    attendanceScore:
                                        newData?.attendanceScore ?? item.attendanceScore,
                                    midtermScore: newData?.midtermScore ?? item.midtermScore,
                                    examScore: item?.examScore,
                                    description: newData?.description ?? item?.description,
                                    examPostponed: newData?.examPostponed ?? item?.examPostponed,
                                    examPostponedReason:
                                        newData?.examPostponedReason ?? item?.examPostponedReason,
                                    examBanned: newData?.examBanned ?? item?.examBanned,
                                    examBannedReason:
                                        newData?.examBannedReason ?? item?.examBannedReason,
                                },
                            },
                        }
                    }),
                    ...listChange.map((item: any) => {
                        const { id } = item
                        const newData = dataTableSubmit.list[id]

                        return {
                            model: 'StudentSubjectScoreHistory',
                            operation: 'create',
                            data: {
                                data: {
                                    studentSubjectScoreId: id,
                                    attendanceScore:
                                        newData?.attendanceScore ?? item.attendanceScore,
                                    midtermScore: newData?.midtermScore ?? item.midtermScore,
                                    examScore: item?.examScore,
                                    description: newData?.description ?? item?.description,
                                    examPostponed: newData?.examPostponed ?? item?.examPostponed,
                                    examPostponedReason:
                                        newData?.examPostponedReason ?? item?.examPostponedReason,
                                    examBanned: newData?.examBanned ?? item?.examBanned,
                                    examBannedReason:
                                        newData?.examBannedReason ?? item?.examBannedReason,
                                    finalScore: item?.finalScore,
                                    manualFinalScore: item?.manualFinalScore,
                                    updatedById: profileId,
                                },
                            },
                        }
                    }),
                ]
            }

            if (listSqlTransaction?.length > 0) {
                const res = await sqlTransaction(listSqlTransaction)
                if (res?.status === 200) {
                    message.success('Đã cập nhật điểm thi thành công!')
                    debouncedRefetch()
                    setIsChanged(false)
                }
            }
        } catch (error: any) {
            message.error(error)

            message.error('Đã xảy ra lỗi khi lưu điểm, vui lòng thử lại.')
        } finally {
            hideSpinner()
        }
    }

    const handleImportConfirm = (importedData: any[]) => {
        showSpinner()

        try {
            message.success('Nhập điểm từ file thành công!')
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Có lỗi xảy ra khi nhập điểm từ file')
        } finally {
            hideSpinner()
        }
    }

    const {
        data: dataTable = [],
        refetch,
        isFetching: loadingTable,
    } = useFindManyStudentSubjectScore(
        {
            where: {
                subjectClassId: subjectClassId || '',
                ...(filterTable.fullname
                    ? {
                          student: {
                              userProfile: {
                                  fullname: {
                                      contains: filterTable.fullname,
                                      mode: 'insensitive',
                                  },
                              },
                          },
                      }
                    : {}),
                ...(filterTable.code
                    ? {
                          student: {
                              userProfile: {
                                  code: { contains: filterTable.code, mode: 'insensitive' },
                              },
                          },
                      }
                    : {}),
                ...(filterTable.fixedClassName
                    ? {
                          student: {
                              fixedClass: {
                                  name: {
                                      contains: filterTable.fixedClassName,
                                      mode: 'insensitive',
                                  },
                              },
                          },
                      }
                    : {}),
                ...(filterTable.dateOfBirth?.length === 2
                    ? {
                          student: {
                              userProfile: {
                                  dateOfBirth: {
                                      gte: dayjs(
                                          filterTable.dateOfBirth?.[0],
                                          'DD/MM/YYYY'
                                      ).toDate(),
                                      lte: dayjs(
                                          filterTable.dateOfBirth?.[1],
                                          'DD/MM/YYYY'
                                      ).toDate(),
                                  },
                              },
                          },
                      }
                    : {}),
            },
            include: {
                student: {
                    include: {
                        userProfile: true,
                        fixedClass: {
                            include: {
                                trainingCourse: {
                                    include: {
                                        scoreConverts: true,
                                    },
                                },
                            },
                        },
                    },
                },
                subjectClass: {
                    include: {
                        subject: true,
                        semester: {
                            include: {
                                schoolYear: true,
                            },
                        },
                        mainLecturer: {
                            include: {
                                userProfile: true,
                            },
                        },
                        extraLecturer: {
                            include: {
                                userProfile: true,
                            },
                        },
                        enterGradeLecturer: {
                            include: {
                                userProfile: true,
                            },
                        },
                    },
                },
                awards: {
                    include: {
                        archivedAward: true,
                    },
                },
                certificates: {
                    include: {
                        archivedCertificate: true,
                    },
                },
            },
            orderBy: [
                ...(filterTable.attendanceScore
                    ? [
                          {
                              attendanceScore: filterTable.attendanceScore,
                          },
                      ]
                    : []),
                ...(filterTable.midtermScore
                    ? [
                          {
                              midtermScore: filterTable.midtermScore,
                          },
                      ]
                    : []),
                ...(filterTable.examScore
                    ? [
                          {
                              examScore: filterTable.examScore,
                          },
                      ]
                    : []),
                {
                    student: {
                        userProfile: {
                            firstName: 'asc',
                        },
                    },
                },
            ],
        },
        { refetchOnWindowFocus: false }
    )

    // const statistics = getScoreStatistics(dataTable)
    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
    }

    const handleScoreInputKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>,
        recordId: string,
        type: 'cc' | 'tx' | 'thi',
        dataTable: Partial<StudentSubjectScore>[]
    ) => {
        const fieldOrder: ('cc' | 'tx' | 'thi')[] = ['cc', 'tx', 'thi']
        const currentRowIndex = dataTable.findIndex((item) => item.id === recordId)

        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault()
            e.stopPropagation()
            const direction = e.key === 'ArrowDown' ? 1 : -1
            const targetRow = dataTable[currentRowIndex + direction]
            if (targetRow) {
                const nextInputId = `score-${type}-${targetRow.id}`
                const nextInput = document.getElementById(nextInputId)
                if (nextInput) {
                    ;(nextInput as HTMLElement).focus()
                }
            }
        }

        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault()
            e.stopPropagation()
            const currentColIndex = fieldOrder.indexOf(type)
            const direction = e.key === 'ArrowRight' ? 1 : -1
            const targetColIndex = currentColIndex + direction
            if (targetColIndex >= 0 && targetColIndex < fieldOrder.length) {
                const nextType = fieldOrder[targetColIndex]
                const nextInputId = `score-${nextType}-${recordId}`
                const nextInput = document.getElementById(nextInputId)
                if (nextInput) {
                    ;(nextInput as HTMLElement).focus()
                }
            }
        }
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    const disabledForm: boolean = useMemo(() => {
        return !(
            can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC, 'NHAP_DIEM') &&
            dataDetailSubjectClass?.scoreDeadLineStart &&
            dayjs().isAfter(dataDetailSubjectClass?.scoreDeadLineStart) &&
            dataDetailSubjectClass?.scoreDeadline &&
            dayjs().isBefore(dataDetailSubjectClass?.scoreDeadline) &&
            !dataDetailSubjectClass?.isLockScore &&
            profileId !== listUser.P13
        )
    }, [dataDetailSubjectClass, subjectClassId])

    // biome-ignore lint/correctness/useExhaustiveDependencies: <form>
    useEffect(() => {
        if (subjectClassId) {
            form.setFieldsValue({
                list: dataTable.reduce(
                    (acc, cur) => {
                        if (!acc) {
                            return {}
                        }
                        acc[cur.id] = {
                            attendanceScore: cur.attendanceScore,
                            midtermScore: cur.midtermScore,
                            description: cur.description,
                            examBanned: cur.examBanned,
                            examBannedReason: cur.examBannedReason,
                            examPostponed: cur.examPostponed,
                            examPostponedReason: cur.examPostponedReason,
                            attendanceScoreOld: cur.attendanceScore,
                            midtermScoreOld: cur.midtermScore,
                        }
                        return acc
                    },
                    {} as SubjectClassScoreForm['list']
                ),
            })
        }
    }, [dataDetailSubjectClass, subjectClassId, dataTable])
    const listForm = Form.useWatch('list', form) || []
    // useEffect(() => {
    //     if (listForm) {
    //         const item = Object.values(listForm).find(
    //             (i: any) =>
    //                 i?.attendanceScore !== i?.attendanceScoreOld ||
    //                 i?.midtermScore !== i?.midtermScoreOld
    //         )
    //         if (item) {
    //             setIsChanged(true)
    //         }
    //     }
    // }, [listForm])
    // useEffect(() => {
    //     if (!isChanged) return
    //     const handleRouteChange = (url: string) => {
    //         if (
    //             router.pathname !== url &&
    //             !confirm('Bạn có thay đổi chưa được lưu. Bạn có chắc muốn rời đi?')
    //         ) {
    //             router.events.emit('routeChangeError')
    //             throw 'Route change aborted'
    //         }
    //     }

    //     router.events.on('routeChangeStart', handleRouteChange)

    //     return () => {
    //         router.events.off('routeChangeStart', handleRouteChange)
    //     }
    // }, [isChanged, router.events.emit, router.events.off, router.events.on, router.pathname])

    return (
        <Row gutter={[16, 16]}>
            <Col span={24} className="flex justify-end">
                <Flex gap={4}>
                    {can(
                        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC,
                        'NHAP_EXCEL',
                        'XUAT_EXCEL'
                    ) && (
                        <Popover
                            content={
                                <Flex vertical align="flex-start" gap={4}>
                                    {can(
                                        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC,
                                        'NHAP_EXCEL'
                                    ) && (
                                        <>
                                            {!disabledForm &&
                                                !dataDetailSubjectClass.enteredScore && (
                                                    <Button
                                                        onClick={() => setImportModalVisible(true)}
                                                        disabled={!subjectClassId}
                                                        className="w-full flex justify-start"
                                                    >
                                                        <FileUp />
                                                        Nhập điểm từ file
                                                    </Button>
                                                )}

                                            <ImportScoreModal
                                                visible={importModalVisible}
                                                onCancel={() => setImportModalVisible(false)}
                                                onConfirm={handleImportConfirm}
                                                existingStudents={dataTable}
                                            />
                                        </>
                                    )}
                                    {can(
                                        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC,
                                        'XUAT_EXCEL'
                                    ) && (
                                        <ExportScoreTemplate
                                            selectedFixedClass={subjectClassId}
                                            dataTable={dataTable}
                                            type="cc-tx"
                                        />
                                    )}
                                </Flex>
                            }
                            trigger="click"
                            open={open}
                            onOpenChange={handleOpenChange}
                            placement="bottomLeft"
                            arrow={false}
                        >
                            <Button disabled={!subjectClassId}>
                                <Ellipsis />
                            </Button>
                        </Popover>
                    )}
                    {can(
                        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC,
                        'IN_DS_THI'
                    ) &&
                        !!dataDetailSubjectClass?.enteredScore && (
                            <ExportTemplateExam
                                selectedFixedClass={subjectClassId}
                                dataClass={dataDetailSubjectClass}
                                dataTable={dataTable}
                            />
                        )}

                    <Button type="primary" onClick={handleSave}>
                        <Save stroke="white" />
                        Lưu
                    </Button>
                </Flex>
            </Col>
            <Col span={24} className="mb-16">
                <Form form={form}>
                    <Table
                        rowKey="id"
                        id="student-subject-score"
                        filters={filterTable}
                        setFilters={setFilterTable}
                        columns={[
                            {
                                title: 'STT',
                                width: 60,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) => index + 1,
                            },
                            {
                                title: 'Mã sinh viên',
                                dataIndex: 'code',
                                align: 'center',
                                width: 150,
                                fixed: 'left',
                                type: 'input',
                                render: (_, record) => record.student?.code || '',
                            },
                            {
                                title: 'Họ và tên',
                                dataIndex: 'fullname',
                                width: 150,
                                fixed: 'left',
                                type: 'input',
                                render: (_, record) => record?.student?.userProfile?.fullname || '',
                            },
                            {
                                title: 'Ngày sinh',
                                dataIndex: 'dateOfBirth',
                                width: 125,
                                type: 'date',
                                align: 'center',
                                render: (_, record) =>
                                    record?.student?.userProfile.dateOfBirth
                                        ? dayjs(record?.student?.userProfile.dateOfBirth).format(
                                              'DD/MM/YYYY'
                                          )
                                        : '',
                            },
                            {
                                title: 'Lớp',
                                dataIndex: 'fixedClassName',
                                width: 120,
                                align: 'center',
                                type: 'input',
                                render: (_, record) => record.student?.fixedClass?.code || '',
                            },
                            // #region Điểm CC
                            {
                                title: 'Điểm CC',
                                dataIndex: 'attendanceScore',
                                width: 100,
                                align: 'center',
                                type: 'order',
                                render: (_, record) => {
                                    const recordForm = listForm?.[record.id]?.attendanceScore
                                    let currentList = listForm
                                    return (
                                        <Form.Item
                                            className="w-full mb-0"
                                            name={['list', record.id, 'attendanceScore']}
                                            label=""
                                            rules={[
                                                {
                                                    validator: (_, value) => {
                                                        if (value == null || value === '')
                                                            return Promise.resolve()
                                                        if (value > 10) {
                                                            message.error(
                                                                'Điểm phải là nhỏ hơn 10!'
                                                            )
                                                            return Promise.reject()
                                                        }
                                                        if (value % 0.5 !== 0) {
                                                            message.error(
                                                                'Điểm phải là bội số của 0.5!'
                                                            )
                                                            return Promise.reject()
                                                        }

                                                        return Promise.resolve()
                                                    },
                                                },
                                            ]}
                                        >
                                            <InputNumber
                                                disabled={disabledForm}
                                                min={0}
                                                id={`score-cc-${record.id}`}
                                                style={{
                                                    width: '100%',
                                                    borderColor:
                                                        !!recordForm &&
                                                        (recordForm > 10 ||
                                                            Math.round(recordForm * 10) !==
                                                                recordForm * 10)
                                                            ? 'red'
                                                            : recordForm !== record?.attendanceScore
                                                              ? '#f0b60ce0'
                                                              : '',
                                                }}
                                                step={0.5}
                                                controls={false}
                                                onChange={(value) => {
                                                    if (
                                                        Number(value) <=
                                                        record?.student?.fixedClass?.trainingCourse
                                                            ?.scoreToTakeExam
                                                    ) {
                                                        const currentList = {
                                                            ...listForm,
                                                            [record.id]: {
                                                                ...listForm[record.id],
                                                                examBanned: true,
                                                            },
                                                        }
                                                        form.setFieldsValue({ list: currentList })
                                                    }
                                                }}
                                                onKeyDown={(e) =>
                                                    handleScoreInputKeyDown(
                                                        e,
                                                        record.id,
                                                        'cc',
                                                        dataTable
                                                    )
                                                }
                                            />
                                        </Form.Item>
                                    )
                                },
                            },
                            // #region Điểm TX
                            {
                                title: 'Điểm TX',
                                dataIndex: 'midtermScore',
                                width: 100,
                                align: 'center',
                                type: 'order',
                                render: (_, record) => {
                                    const recordForm = listForm?.[record.id]?.midtermScore
                                    return (
                                        <Form.Item
                                            className="w-full mb-0"
                                            name={['list', record.id, 'midtermScore']}
                                            label=""
                                            rules={[
                                                {
                                                    validator: (_, value) => {
                                                        if (value == null || value === '')
                                                            return Promise.resolve()
                                                        if (value > 10) {
                                                            message.error(
                                                                'Điểm phải là nhỏ hơn 10!'
                                                            )
                                                            return Promise.reject()
                                                        }
                                                        if (value % 0.5 !== 0) {
                                                            message.error(
                                                                'Điểm phải là bội số của 0.5!'
                                                            )
                                                            return Promise.reject()
                                                        }

                                                        return Promise.resolve()
                                                    },
                                                },
                                            ]}
                                        >
                                            <InputNumber
                                                disabled={disabledForm}
                                                min={0}
                                                id={`score-tx-${record.id}`}
                                                style={{
                                                    width: '100%',
                                                    borderColor:
                                                        !!recordForm &&
                                                        (recordForm > 10 ||
                                                            Math.round(recordForm * 10) !==
                                                                recordForm * 10)
                                                            ? 'red'
                                                            : recordForm !== record?.midtermScore
                                                              ? '#f0b60ce0'
                                                              : '',
                                                }}
                                                step={0.5}
                                                controls={false}
                                                onChange={(value) => {
                                                    if (
                                                        Number(value) <=
                                                        record?.student?.fixedClass?.trainingCourse
                                                            ?.scoreToTakeExam
                                                    ) {
                                                        const currentList = {
                                                            ...listForm,
                                                            [record.id]: {
                                                                ...listForm[record.id],
                                                                examBanned: true,
                                                            },
                                                        }
                                                        form.setFieldsValue({ list: currentList })
                                                    }
                                                }}
                                                onKeyDown={(e) =>
                                                    handleScoreInputKeyDown(
                                                        e,
                                                        record.id,
                                                        'tx',
                                                        dataTable
                                                    )
                                                }
                                            />
                                        </Form.Item>
                                    )
                                },
                            },
                            // #region Điểm Thi
                            {
                                title: 'Điểm thi',
                                dataIndex: 'examScore',
                                width: 100,
                                type: 'order',
                                align: 'center',
                                render: (_, record, index: number) => {
                                    return record?.examScore || ''
                                },
                            },
                            {
                                title: 'Cấm thi',
                                dataIndex: 'examBanned',
                                width: 80,
                                align: 'center',
                                render: (value, record) => {
                                    return (
                                        <Form.Item
                                            className="w-full mb-0"
                                            name={['list', record.id, 'examBanned']}
                                            label=""
                                            valuePropName="checked"
                                        >
                                            <Checkbox disabled={disabledForm} />
                                        </Form.Item>
                                    )
                                },
                            },
                            {
                                title: 'Lý do cấm thi',
                                dataIndex: 'examBannedReason',
                                width: 150,
                                render: (_, record) => {
                                    const examBanned = listForm[record.id]?.examBanned
                                    return (
                                        <Form.Item
                                            name={['list', record.id, 'examBannedReason']}
                                            style={{ margin: 0 }}
                                        >
                                            <Input
                                                placeholder="Nhập lý do đình chỉ"
                                                disabled={!examBanned && profileId !== listUser.P13}
                                            />
                                        </Form.Item>
                                    )
                                },
                            },

                            {
                                title: 'Hoãn thi',
                                dataIndex: 'examPostponed',
                                width: 80,
                                align: 'center',
                                render: (value, record) => {
                                    return (
                                        <Form.Item
                                            className="w-full mb-0"
                                            name={['list', record.id, 'examPostponed']}
                                            label=""
                                            valuePropName="checked"
                                        >
                                            <Checkbox disabled={profileId !== listUser.P13} />
                                        </Form.Item>
                                    )
                                },
                            },

                            {
                                title: 'Lý do hoãn thi',
                                dataIndex: 'examPostponedReason',
                                width: 200,
                                render: (_, record) => {
                                    const examPostponed = listForm[record.id]?.examPostponed
                                    return (
                                        <Form.Item
                                            name={[record.id, 'examPostponedReason']}
                                            style={{ margin: 0 }}
                                        >
                                            <Input
                                                placeholder="Nhập lý do hoãn thi"
                                                disabled={
                                                    !(examPostponed && profileId !== listUser.P13)
                                                }
                                            />
                                        </Form.Item>
                                    )
                                },
                            },

                            {
                                title: 'Đình chỉ',
                                dataIndex: 'suspended',
                                width: 80,
                                align: 'center',
                                render: (value, record) => {
                                    return <Checkbox disabled={true} checked={record?.suspended} />
                                },
                            },

                            {
                                title: 'Lý do đình chỉ',
                                dataIndex: 'suspendedReason',
                                width: 200,
                                render: (value, record) => {
                                    return (
                                        <Input
                                            disabled={true}
                                            placeholder="Nhập lý do đình chỉ"
                                            value={record?.suspendedReason}
                                        />
                                    )
                                },
                            },

                            {
                                title: 'Ghi chú',
                                dataIndex: 'description',
                                width: 150,
                                align: 'center',
                                render: (value, record) => {
                                    return (
                                        <Form.Item
                                            className="w-full mb-0"
                                            name={[record.id, 'description']}
                                            label=""
                                        >
                                            <Input
                                                disabled={disabledForm}
                                                placeholder="Nhập ghi chú"
                                                style={{
                                                    width: '100%',
                                                }}
                                            />
                                        </Form.Item>
                                    )
                                },
                            },
                        ]}
                        data={dataTable}
                        pagination={{
                            pageSize: dataTable.length,
                            hideOnSinglePage: true,
                        }}
                    />
                </Form>
            </Col>
            <div className="fixed p-3 z-[10] bottom-[35px] left-0 right-0 w-[100vw] bg-white ">
                <div>
                    Bấm Tab: Chuyển ô theo hàng ngang, Mũi tên xuống: Chuyển ô theo hàng dọc, và
                    hàng ngang
                </div>
                <div className="text-red-500 font-bold uppercase text-lg">
                    Giáo viên nhập Lý do "Cấm thi", "Ghi chú" với truòng hợp điểm 0 hoặc không cho
                    điểm
                </div>
            </div>
        </Row>
    )
}
