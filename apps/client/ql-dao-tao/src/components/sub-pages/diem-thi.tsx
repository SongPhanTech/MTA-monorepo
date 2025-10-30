import ImportScoreModal from '@components/commons/print/nhap-diem-tu-file'
import ExportScoreTemplate from '@components/commons/print/xuat-mau-nhap-diem'
import Table from '@components/commons/table'
import { type DataTable, EnumInPhieuDiem } from '@components/modal/modal-in-phieu-diem'
import ExportTemplateExam from '@components/ui/in-phieu-danh-sach-thi'
import type { FilterProps } from '@constants/type'
import useSpinner from '@hooks/spinner'
import { useSession } from '@workspace/auth/react'
import type { StudentSubjectScore } from '@workspace/db/client'
import { useFindManyStudentSubjectScore, useUpdateSubjectClass } from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { listUser } from '@workspace/libs/constants'
import { calcFinalScore } from '@workspace/libs/utils'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION } from '@workspace/router'
import { Button, Checkbox, Col, Flex, Form, Input, InputNumber, Modal, message, Row } from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import { FileUp, Printer, Save } from 'lucide-react'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

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
            examScore?: number | null
            description?: string | null
            suspended?: boolean | null
            suspendedReason?: string | null
            examScoreOld?: number | null
        }
    >
}
export default function DiemThi({
    dataDetailSubjectClass,
    refetchSubjectClass,
    subjectClassId,
    dataForm,
}: any) {
    const { can } = useAbility()

    const { showSpinner, hideSpinner } = useSpinner()
    const router = useRouter()
    const [form] = Form.useForm<SubjectClassScoreForm>()

    const [isChanged, setIsChanged] = useState(false)
    const { data: session } = useSession()
    const [mesasge, setMesasge] = useState<string>('')
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

    const { onOpen } = useDisclosure<{
        dataTable: DataTable[]
        type: number // 1: In phiếu điểm và khóa, 0: In phiếu điểm nháp
    }>({
        tag: 'ModalPrintStudentSubjectScore',
    })

    const handlePrint = async () => {
        Modal.confirm({
            title: 'Xác nhận',
            content: 'Bạn có chắc chắn muốn in phiếu điểm và khoá nhập điểm lại không?',
            okText: 'Xác nhận',
            cancelText: 'Hủy',
            onOk: async () => {
                onOpen({
                    dataTable,
                    type: EnumInPhieuDiem.PHIEU_DIEM_KHOA,
                })
            },
        })
    }

    const { mutateAsync: updateSubjectClass } = useUpdateSubjectClass()

    const handleSave = () => {
        Modal.confirm({
            title: 'Xác nhận',
            content: 'Bạn có chắc chắn muốn nhập điểm không?',
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
            let listSqlTransaction: any = []
            if (
                dataForm?.isLockExamScore !== dataForm?.isLockExamScoreOld ||
                dataForm?.scoreSubmitted !== dataForm?.scoreSubmittedOld ||
                dataForm?.scoreChecked !== dataForm?.scoreCheckedOld
            ) {
                if (dataForm?.scoreSubmitted === true && dataForm?.scoreSubmittedOld === false) {
                    listSqlTransaction = [
                        ...listSqlTransaction,
                        {
                            model: 'SubjectClass',
                            operation: 'update',
                            data: {
                                where: {
                                    id: subjectClassId,
                                },
                                data: {
                                    isLockExamScore: true,
                                    scoreSubmitted: true,
                                    scoreChecked: true,
                                    isLockScore: true,
                                },
                            },
                        },
                    ]
                } else {
                    listSqlTransaction = [
                        ...listSqlTransaction,
                        {
                            model: 'SubjectClass',
                            operation: 'update',
                            data: {
                                where: {
                                    id: subjectClassId,
                                },
                                data: {
                                    isLockExamScore: dataForm?.isLockExamScore,
                                    scoreSubmitted: dataForm?.scoreSubmitted,
                                    scoreChecked: dataForm?.scoreChecked,
                                },
                            },
                        },
                    ]
                }
            }
            const dataSubmit = form.getFieldsValue()
            const listObject = Object.entries(dataSubmit.list).map(([key, value_]) => {
                return {
                    id: key,
                    ...value_,
                }
            })

            const error = listObject?.find((i: any) => i?.examScore > 10 || i?.examScore < 0)
            if (error) {
                message.error('Bạn chưa nhập đúng điểm số')
                return
            }

            const list = dataTable.find(
                (i: any) => !i.examScore || !dataSubmit.list[i.id].examScore
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
                            data: { enteredExamScore: true },
                        },
                    },
                ]
            }
            const listChange = listObject.filter(
                (i: any) => i.examScore || i.description || i.suspended || i.suspendedReason
            )

            if (listChange?.length > 0 && profileId !== listUser.P13) {
                listSqlTransaction = [
                    ...listSqlTransaction,
                    ...listChange.map((item: any) => {
                        const { id } = item
                        const newData = dataSubmit.list[id]

                        return {
                            model: 'StudentSubjectScore',
                            operation: 'update',
                            data: {
                                where: { id },
                                data: {
                                    ...newData,
                                    attendanceScore: item?.subjectVersion?.onePoint
                                        ? item.examScore
                                            ? item.examScore
                                            : newData?.examScore
                                        : item?.attendanceScore,
                                    midtermScore: item?.subjectVersion?.onePoint
                                        ? item.examScore
                                            ? item.examScore
                                            : newData?.examScore
                                        : item?.midtermScore,
                                    examScore: item.examScore ? item.examScore : newData?.examScore,
                                    description: item.description
                                        ? item.description
                                        : newData?.description,
                                    suspended: item.suspended ? item.suspended : newData?.suspended,
                                    suspendedReason: item.suspendedReason
                                        ? item.suspendedReason
                                        : newData?.suspendedReason,
                                },
                            },
                        }
                    }),

                    ...listChange.map((item: any) => {
                        const { id } = item
                        const newData = dataSubmit.list[id]

                        return {
                            model: 'StudentSubjectScoreHistory',
                            operation: 'create',
                            data: {
                                data: {
                                    studentSubjectScoreId: id,
                                    attendanceScore: item?.subjectVersion?.onePoint
                                        ? item.examScore
                                            ? item.examScore
                                            : newData?.examScore
                                        : item?.attendanceScore,
                                    midtermScore: item?.subjectVersion?.onePoint
                                        ? item.examScore
                                            ? item.examScore
                                            : newData?.examScore
                                        : item?.midtermScore,
                                    examScore: item.examScore ? item.examScore : newData?.examScore,
                                    finalScore: item?.finalScore,
                                    manualFinalScore: item?.manualFinalScore,
                                    description: item.description
                                        ? item.description
                                        : newData?.description,
                                    suspended: item.suspended ? item.suspended : newData?.suspended,
                                    suspendedReason: item.suspendedReason
                                        ? item.suspendedReason
                                        : newData?.suspendedReason,
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
                    if (mesasge) {
                        message.success(mesasge)
                    }
                    message.success('Đã cập nhật điểm thi thành công!')
                    debouncedRefetch()
                    setIsChanged(false)
                }
            }
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
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
            (
                can(
                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC,
                    'NHAP_DIEM'
                ) &&
                dataDetailSubjectClass?.examScoreDeadline &&
                dayjs().isBefore(dataDetailSubjectClass?.examScoreDeadline) &&
                !dataDetailSubjectClass?.isLockExamScore &&
                dataDetailSubjectClass?.examType !== 'OfflineWritten' &&
                profileId !== listUser.P13
            )
            // ((dataDetailSubjectClass?.examType === 'OfflineWritten' &&
            //     profileId === listUser.P13) ||
            //   )
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
                            examScore: cur?.examScore,
                            description: cur?.description,
                            suspended: cur?.suspended,
                            suspendedReason: cur?.suspendedReason,
                            examScoreOld: cur?.examScore,
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
    //         const item = Object.values(listForm).find((i: any) => i?.examScore !== i.examScoreOld)
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
        <div className="bg-white relative">
            <Row gutter={[16, 16]}>
                <Col span={24} className="flex justify-end">
                    <Flex gap={4}>
                        {can(
                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC,
                            'NHAP_EXCEL'
                        ) && (
                            <>
                                <Button
                                    onClick={() => setImportModalVisible(true)}
                                    disabled={
                                        !subjectClassId ||
                                        disabledForm ||
                                        dataDetailSubjectClass.enteredExamScore
                                    }
                                    className="w-full flex justify-start"
                                >
                                    <FileUp />
                                    Nhập điểm từ file
                                </Button>
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
                                type="thi"
                            />
                        )}
                        {can(
                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC,
                            'IN_DS_THI'
                        ) && (
                            <ExportTemplateExam
                                selectedFixedClass={subjectClassId}
                                dataClass={dataDetailSubjectClass}
                                dataTable={dataTable}
                                disabled={!dataDetailSubjectClass?.enteredScore}
                            />
                        )}
                        {can(
                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC,
                            'IN_PHIEU_DIEM'
                        ) && (
                            <>
                                <Button
                                    disabled={
                                        !subjectClassId || !dataDetailSubjectClass?.enteredExamScore
                                    }
                                    onClick={() => handlePrint()}
                                >
                                    <Printer />
                                    In phiếu điểm và khoá
                                </Button>
                                <Button
                                    disabled={!subjectClassId}
                                    onClick={() =>
                                        onOpen({
                                            dataTable,
                                            type: EnumInPhieuDiem.PHIEU_DIEM_NHAP,
                                        })
                                    }
                                >
                                    <Printer />
                                    In phiếu điểm nháp
                                </Button>
                            </>
                        )}

                        <Button type="primary" onClick={handleSave}>
                            <Save stroke="white" />
                            Lưu
                        </Button>
                    </Flex>
                </Col>
                <Col span={24} className="mb-16">
                    <Form form={form}>
                        <Form.Item name="list">
                            <Table
                                className="table-subject-score"
                                rowKey="id"
                                id="student-subject-score"
                                filters={filterTable}
                                setFilters={setFilterTable}
                                // onRow={(record) => {
                                //     return {
                                //         className: cn(
                                //             listForm?.[record.id]
                                //                 ?.examScore ===
                                //                 listForm?.[record.id]
                                //                     ?.examScoreOld
                                //                 ? ''
                                //                 : 'bg-yellow-100'
                                //         ),
                                //     }
                                // }}
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
                                        render: (_, record) =>
                                            record?.student?.userProfile?.fullname || '',
                                    },
                                    {
                                        title: 'Ngày sinh',
                                        dataIndex: 'dateOfBirth',
                                        width: 125,
                                        align: 'center',
                                        type: 'date',
                                        render: (_, record) =>
                                            record?.student?.userProfile.dateOfBirth
                                                ? dayjs(
                                                      record?.student?.userProfile.dateOfBirth
                                                  ).format('DD/MM/YYYY')
                                                : '',
                                    },
                                    {
                                        title: 'Lớp',
                                        dataIndex: 'fixedClassName',
                                        width: 120,
                                        align: 'center',
                                        type: 'input',
                                        render: (_, record) =>
                                            record.student?.fixedClass?.code || '',
                                    },
                                    // #region Điểm CC
                                    {
                                        title: 'Điểm CC',
                                        dataIndex: 'attendanceScore',
                                        width: 100,
                                        align: 'center',
                                        type: 'order',
                                        hidden: !!dataDetailSubjectClass?.subject?.onePoint,
                                        render: (_, record) => {
                                            return record?.attendanceScore || ''
                                        },
                                    },
                                    // #region Điểm TX
                                    {
                                        title: 'Điểm TX',
                                        dataIndex: 'midtermScore',
                                        width: 100,
                                        align: 'center',
                                        type: 'order',
                                        hidden: !!dataDetailSubjectClass?.subject?.onePoint,
                                        render: (_, record) => {
                                            return record?.midtermScore || ''
                                        },
                                    },
                                    {
                                        title: 'Điểm thi',
                                        dataIndex: 'examScore',
                                        width: 100,
                                        type: 'order',
                                        align: 'center',
                                        render: (_, record) => {
                                            const recordForm = listForm?.[record.id]?.examScore
                                            return (
                                                <Form.Item
                                                    className="w-full mb-0"
                                                    name={['list', record.id, 'examScore']}
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
                                                                if (
                                                                    Math.round(value * 10) !==
                                                                    value * 10
                                                                ) {
                                                                    message.error(
                                                                        'Điểm phải là bội số của 0.1!'
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
                                                        id={`score-thi-${record.id}`}
                                                        style={{
                                                            width: '100%',
                                                            borderColor:
                                                                !!recordForm &&
                                                                (recordForm > 10 ||
                                                                    Math.round(recordForm * 10) !==
                                                                        recordForm * 10)
                                                                    ? 'red'
                                                                    : recordForm !==
                                                                        record?.examScore
                                                                      ? '#f0b60ce0'
                                                                      : '',
                                                        }}
                                                        step={0}
                                                        controls={false}
                                                        onKeyDown={(e) =>
                                                            handleScoreInputKeyDown(
                                                                e,
                                                                record.id,
                                                                'thi',
                                                                dataTable
                                                            )
                                                        }
                                                    />
                                                </Form.Item>
                                            )
                                        },
                                    },
                                    {
                                        title: 'Điểm HP',
                                        width: 80,
                                        align: 'center',
                                        render: (_, record: any) => {
                                            const recordForm = listForm?.[record.id]?.examScore
                                            const finalScore = calcFinalScore(
                                                record?.student?.fixedClass?.trainingCourse,
                                                {
                                                    ...record,
                                                    examScore: recordForm
                                                        ? recordForm
                                                        : record?.examScore,
                                                }
                                            )?.toFixed(1)

                                            return <div>{finalScore}</div>
                                        },
                                    },
                                    {
                                        title: 'Cấm thi',
                                        dataIndex: 'examBanned',
                                        width: 80,
                                        align: 'center',
                                        render: (value, record, index: number) => {
                                            return (
                                                <Checkbox
                                                    disabled={true}
                                                    checked={record?.examBanned}
                                                />
                                            )
                                        },
                                    },
                                    {
                                        title: 'Lý do cấm thi',
                                        dataIndex: 'examBannedReason',
                                        width: 150,
                                        render: (value, record, index: number) => {
                                            return (
                                                <Input
                                                    disabled={true}
                                                    placeholder="Nhập lý do cấm thi"
                                                    value={record?.examBannedReason}
                                                />
                                            )
                                        },
                                    },

                                    {
                                        title: 'Hoãn thi',
                                        dataIndex: 'examPostponed',
                                        width: 80,
                                        align: 'center',
                                        render: (value, record, index: number) => {
                                            return (
                                                <Checkbox
                                                    disabled={true}
                                                    checked={record?.examPostponed}
                                                />
                                            )
                                        },
                                    },

                                    {
                                        title: 'Lý do hoãn thi',
                                        dataIndex: 'repeatedReason',
                                        width: 140,
                                        render: (value, record, index: number) => {
                                            return (
                                                <Input
                                                    disabled={true}
                                                    placeholder="Nhập lý do hoãn thi"
                                                    value={record?.repeatedReason}
                                                />
                                            )
                                        },
                                    },

                                    {
                                        title: 'Đình chỉ',
                                        dataIndex: 'suspended',
                                        width: 80,
                                        align: 'center',
                                        render: (value, record) => {
                                            return (
                                                <Form.Item
                                                    className="w-full mb-0"
                                                    name={['list', record.id, 'suspended']}
                                                    label=""
                                                    valuePropName="checked"
                                                >
                                                    <Checkbox
                                                        disabled={profileId !== listUser.P13}
                                                    />
                                                </Form.Item>
                                            )
                                        },
                                    },

                                    {
                                        title: 'Lý do đình chỉ',
                                        dataIndex: 'suspendedReason',
                                        width: 140,
                                        render: (_, record) => {
                                            const suspended = listForm[record.id]?.suspended
                                            return (
                                                <Form.Item
                                                    name={['list', record.id, 'suspendedReason']}
                                                    style={{ margin: 0 }}
                                                >
                                                    <Input
                                                        placeholder="Nhập lý do đình chỉ"
                                                        disabled={
                                                            !(
                                                                suspended &&
                                                                profileId === listUser.P13
                                                            )
                                                        }
                                                    />
                                                </Form.Item>
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
                                                    name={['list', record.id, 'description']}
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
                        </Form.Item>
                    </Form>
                </Col>
            </Row>
            <div className="fixed p-3 z-[10] bottom-[34px] left-0 right-0 w-[100vw] bg-white ">
                <div>
                    Bấm Tab: Chuyển ô theo hàng ngang, Mũi tên xuống: Chuyển ô theo hàng dọc, và
                    hàng ngang
                </div>
                <div className="text-red-500 font-bold uppercase text-lg">
                    Giáo viên nhập Lý do "Cấm thi", "Ghi chú" với truòng hợp điểm 0 hoặc không cho
                    điểm
                </div>
            </div>
        </div>
    )
}
