import ImportScoreModal from '@components/commons/print/nhap-diem-tu-file'
import ExportScoreTemplate from '@components/commons/print/xuat-mau-nhap-diem'
import Select from '@components/commons/select'
import Table from '@components/commons/table'
import { type DataTable, EnumInPhieuDiem } from '@components/modal/modal-in-phieu-diem'
import ExportTemplateExam from '@components/ui/in-phieu-danh-sach-thi'
import type { FilterProps } from '@constants/type'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { formatDate } from '@lib/utils'
import { useSession } from '@workspace/auth/react'
import type { StudentSubjectScore } from '@workspace/db'
import {
    useFindManyStudentSubjectScore,
    useFindManySubjectClass,
    useFindUniqueSubjectClass,
} from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { listUser } from '@workspace/libs/constants'
import { calcFinalScore, getScoreStatistics } from '@workspace/libs/utils'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION } from '@workspace/router'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import {
    Button,
    Checkbox,
    Col,
    Flex,
    Form,
    Input,
    InputNumber,
    Modal,
    message,
    Popover,
    Row,
    Skeleton,
} from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import { Ellipsis, FileUp, Printer, Save } from 'lucide-react'
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
export default function SubjectClassScore() {
    const { can } = useAbility()
    const canReadAll = can(
        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DS_LOP_MON_HOC,
        'XEM_TAT_CA'
    )
    const { showSpinner, hideSpinner } = useSpinner()
    const router = useRouter()
    const [form] = Form.useForm<{
        isLockExamScore: boolean
        isLockScore: boolean
        scoreChecked: boolean
        scoreSubmitted: boolean
    }>()

    const [isChanged, setIsChanged] = useState(false)
    const [formTable] =
        Form.useForm<
            {
                examScore?: number
                description?: string
                suspended?: boolean
                suspendedReason?: string
            }[]
        >()
    const { id: semesterId } = useSemesterStore()
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const { data: session } = useSession()
    const profileId = session?.sDM_NhanVienId || ''
    const [open, setOpen] = useState(false)
    const subjectClassId = router.query?.subjectClassId as string
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
        }, 500),
        []
    )

    const handleSaveScores = async () => {
        try {
            showSpinner()
            const dataSubmit = form.getFieldsValue()
            const dataTableSubmit = formTable.getFieldsValue()
            const listObject = Object.entries(dataTableSubmit).map(([key, value_]) => {
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
            let listSqlTransaction: any = []
            if (subjectClassId && profileId !== listUser.lecturer) {
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
                                isLockScore: dataSubmit?.isLockScore,
                                isLockExamScore: dataSubmit?.isLockExamScore,
                                scoreSubmitted: dataSubmit?.scoreSubmitted,
                                scoreChecked: dataSubmit?.scoreChecked,
                            },
                        },
                    },
                ]
            }
            const list = dataTable.find(
                (i: any) => !i.examScore || !dataTableSubmit[i.id].examScore
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

            if (listChange?.length > 0) {
                listSqlTransaction = [
                    ...listSqlTransaction,
                    ...listChange.map((item: any) => {
                        const { id } = item
                        const newData = dataTableSubmit[id]

                        return {
                            model: 'StudentSubjectScore',
                            operation: 'update',
                            data: {
                                where: { id },
                                data: {
                                    ...newData,
                                    attendanceScore: !!item?.subjectVersion?.onePoint
                                        ? !!item.examScore
                                            ? item.examScore
                                            : newData?.examScore
                                        : item?.attendanceScore,
                                    midtermScore: !!item?.subjectVersion?.onePoint
                                        ? !!item.examScore
                                            ? item.examScore
                                            : newData?.examScore
                                        : item?.midtermScore,
                                    examScore: !!item.examScore
                                        ? item.examScore
                                        : newData?.examScore,
                                    description: !!item.description
                                        ? item.description
                                        : newData?.description,
                                    suspended: !!item.suspended
                                        ? item.suspended
                                        : newData?.suspended,
                                    suspendedReason: !!item.suspendedReason
                                        ? item.suspendedReason
                                        : newData?.suspendedReason,
                                },
                            },
                        }
                    }),

                    ...listChange.map((item: any) => {
                        const { id } = item
                        const newData = dataTableSubmit[id]

                        return {
                            model: 'StudentSubjectScoreHistory',
                            operation: 'create',
                            data: {
                                data: {
                                    studentSubjectScoreId: id,
                                    attendanceScore: !!item?.subjectVersion?.onePoint
                                        ? !!item.examScore
                                            ? item.examScore
                                            : newData?.examScore
                                        : item?.attendanceScore,
                                    midtermScore: !!item?.subjectVersion?.onePoint
                                        ? !!item.examScore
                                            ? item.examScore
                                            : newData?.examScore
                                        : item?.midtermScore,
                                    examScore: !!item.examScore
                                        ? item.examScore
                                        : newData?.examScore,
                                    finalScore: item?.finalScore,
                                    manualFinalScore: item?.manualFinalScore,
                                    description: !!item.description
                                        ? item.description
                                        : newData?.description,
                                    suspended: !!item.suspended
                                        ? item.suspended
                                        : newData?.suspended,
                                    suspendedReason: !!item.suspendedReason
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
                await sqlTransaction(listSqlTransaction)
                message.success('Đã cập nhật điểm thi thành công!')
                debouncedRefetch()
                setIsChanged(false)
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

    const { data: subjectClassData = [], isFetching } = useFindManySubjectClass(
        {
            where: {
                ...(semesterId ? { semesterId } : {}),
                ...(trainingObjectTypeId ? { trainingObjectTypeId } : {}),
                ...(!canReadAll
                    ? {
                          mainLecturer: {
                              userProfileId: profileId,
                          },
                      } //Nếu không có quyền xem tất cả thì chỉ được xem lớp do mình giảng dạy
                    : {}),
                deletedAt: null,
                active: true,
                cancelled: false,
            },
            include: {
                subject: {
                    include: {
                        managementOrganization: true,
                    },
                },
                semester: {
                    include: {
                        schoolYear: true,
                    },
                },
                mainLecturer: {
                    include: { userProfile: true },
                },
                extraLecturer: {
                    include: { userProfile: true },
                },
                subjectClassStudent: {
                    include: {
                        student: {
                            include: {
                                userProfile: true,
                                fixedClass: {
                                    include: {
                                        trainingCourse: true,
                                    },
                                },
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        subjectClassStudent: {
                            where: {
                                deletedAt: null,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        },
        { refetchOnWindowFocus: false }
    )

    const {
        data: dataDetailSubjectClass,
        refetch: refetchSubjectClass,
        isFetching: isFetchingSubject,
    } = useFindUniqueSubjectClass(
        {
            where: {
                id: subjectClassId,
            },
            include: {
                subject: true,
            },
        },
        { refetchOnWindowFocus: false, enabled: !!subjectClassId }
    )

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

    const selectedClassInfo = subjectClassData.find((item) => item.id === subjectClassId)

    const statistics = getScoreStatistics(dataTable)
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
            (can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC, 'NHAP_DIEM') &&
                dataDetailSubjectClass?.examScoreDeadline &&
                dayjs().isBefore(dataDetailSubjectClass?.examScoreDeadline) &&
                !dataDetailSubjectClass?.isLockExamScore &&
                ((dataDetailSubjectClass?.examType === 'OfflineWritten' &&
                    profileId === listUser.P13) ||
                    (dataDetailSubjectClass?.examType !== 'OfflineWritten' &&
                        profileId !== listUser.P13)))
        )
    }, [dataDetailSubjectClass, subjectClassId])

    // biome-ignore lint/correctness/useExhaustiveDependencies: <form>
    useEffect(() => {
        if (subjectClassId) {
            form.setFieldsValue({
                isLockExamScore: dataDetailSubjectClass?.isLockExamScore,
                isLockScore: dataDetailSubjectClass?.isLockScore,
                scoreChecked: dataDetailSubjectClass?.scoreChecked,
                scoreSubmitted: dataDetailSubjectClass?.scoreSubmitted,
            })
        }
    }, [dataTable, subjectClassId])
    const listForm = Form.useWatch([], formTable) || []
    useEffect(() => {
        if (listForm) {
            const item = Object.values(listForm).find(
                (i: any) => i?.examScore || i?.description || i?.suspended || i?.suspendedReason
            )
            if (item) {
                setIsChanged(true)
            }
        }
    }, [listForm])

    // // biome-ignore lint/correctness/useExhaustiveDependencies: <formTable>
    // useEffect(() => {
    //     if (subjectClassId) {
            
    //     }
    // }, [subjectClassId])

    useEffect(() => {
        if (!isChanged) return
        const handleRouteChange = (url: string) => {
            if (
                router.pathname !== url &&
                !confirm('Bạn có thay đổi chưa được lưu. Bạn có chắc muốn rời đi?')
            ) {
                router.events.emit('routeChangeError')
                throw 'Route change aborted'
            }
        }

        router.events.on('routeChangeStart', handleRouteChange)

        return () => {
            router.events.off('routeChangeStart', handleRouteChange)
        }
    }, [isChanged, router.events.emit, router.events.off, router.events.on, router.pathname])

    return (
        <div className="bg-white">
            {isFetching ? (
                <Skeleton />
            ) : (
                <Row gutter={[16, 16]}>
                    <Col span={24}>
                        <Col span={6}>
                            <Form.Item name="searchText">
                                <Select
                                    placeholder="Chọn lớp môn học"
                                    options={subjectClassData?.map((i) => {
                                        return {
                                            label: `${i.name}-${i.code}`,
                                            value: i.id,
                                            key: i.id,
                                        }
                                    })}
                                    defaultValue={subjectClassId}
                                    onChange={(value) => {
                                        formTable.setFieldsValue([])
                                        router.push(
                                            `/quan-ly-diem/ql-diem-thi?subjectClassId=${value}`
                                        )
                                    }}
                                />
                            </Form.Item>
                        </Col>
                    </Col>
                    {isFetchingSubject ? (
                        <Skeleton />
                    ) : (
                        <>
                            {dataDetailSubjectClass && (
                                <>
                                    <Col span={12}>
                                        <Flex align="center">
                                            <div className="mr-6">
                                                Thời gian nhập điểm TX/CC:
                                                {dataDetailSubjectClass?.scoreDeadLineStart &&
                                                    dataDetailSubjectClass?.scoreDeadline && (
                                                        <span
                                                            className={`ml-1 ${
                                                                dayjs().isBefore(
                                                                    dataDetailSubjectClass?.scoreDeadline
                                                                )
                                                                    ? ''
                                                                    : 'text-red-500'
                                                            }`}
                                                        >
                                                            {formatDate(
                                                                dataDetailSubjectClass?.scoreDeadLineStart
                                                            )}
                                                            <span className="mx-1">-</span>
                                                            {formatDate(
                                                                dataDetailSubjectClass?.scoreDeadline
                                                            )}
                                                        </span>
                                                    )}
                                            </div>
                                            <div className="mr-6">
                                                Hạn nhập điểm thi:
                                                <span
                                                    className={`ml-1 ${
                                                        dayjs().isBefore(
                                                            dataDetailSubjectClass?.examScoreDeadline
                                                        )
                                                            ? ''
                                                            : 'text-red-500'
                                                    }`}
                                                >
                                                    {dataDetailSubjectClass?.examScoreDeadline &&
                                                        formatDate(
                                                            dataDetailSubjectClass?.examScoreDeadline
                                                        )}
                                                </span>
                                            </div>
                                        </Flex>
                                    </Col>
                                    <Col span={12} className="flex justify-end">
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
                                                                        !dataDetailSubjectClass.enteredExamScore && (
                                                                            <Button
                                                                                onClick={() =>
                                                                                    setImportModalVisible(
                                                                                        true
                                                                                    )
                                                                                }
                                                                                disabled={
                                                                                    !subjectClassId
                                                                                }
                                                                                className="w-full flex justify-start"
                                                                            >
                                                                                <FileUp />
                                                                                Nhập điểm từ file
                                                                            </Button>
                                                                        )}

                                                                    <ImportScoreModal
                                                                        visible={importModalVisible}
                                                                        onCancel={() =>
                                                                            setImportModalVisible(
                                                                                false
                                                                            )
                                                                        }
                                                                        onConfirm={
                                                                            handleImportConfirm
                                                                        }
                                                                        existingStudents={dataTable}
                                                                    />
                                                                </>
                                                            )}
                                                            {can(
                                                                QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC,
                                                                'XUAT_EXCEL'
                                                            ) && (
                                                                <ExportScoreTemplate
                                                                    selectedFixedClass={
                                                                        subjectClassId
                                                                    }
                                                                    dataTable={dataTable}
                                                                    type="thi"
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
                                                        dataClass={selectedClassInfo}
                                                        dataTable={dataTable}
                                                    />
                                                )}

                                            {can(
                                                QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC,
                                                'IN_PHIEU_DIEM'
                                            ) && (
                                                <>
                                                    {!!dataDetailSubjectClass?.enteredExamScore && (
                                                        <Button
                                                            disabled={!subjectClassId}
                                                            onClick={() => handlePrint()}
                                                        >
                                                            <Printer />
                                                            In phiếu điểm và khoá
                                                        </Button>
                                                    )}

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
                                    <Col span={24} className="">
                                        <Flex align="center" justify="space-between">
                                            <Form
                                                className="flex gap-0 lg:gap-[2px] 2xl:gap-3"
                                                form={form}
                                                layout="horizontal"
                                            >
                                                <Form.Item
                                                    className="mb-0"
                                                    name="isLockScore"
                                                    valuePropName="checked"
                                                >
                                                    <Checkbox
                                                        disabled={profileId !== listUser?.P13}
                                                    >
                                                        Khóa điểm CC/TX
                                                    </Checkbox>
                                                </Form.Item>

                                                <Form.Item
                                                    className="mb-0"
                                                    name="isLockExamScore"
                                                    valuePropName="checked"
                                                >
                                                    <Checkbox
                                                        disabled={profileId !== listUser?.P13}
                                                    >
                                                        Khóa điểm thi
                                                    </Checkbox>
                                                </Form.Item>

                                                <Form.Item
                                                    className="mb-0"
                                                    name="scoreSubmitted"
                                                    valuePropName="checked"
                                                >
                                                    <Checkbox
                                                        disabled={profileId !== listUser?.P13}
                                                    >
                                                        P13 đã nhận Phiếu điểm
                                                    </Checkbox>
                                                </Form.Item>

                                                <Form.Item
                                                    className="mb-0"
                                                    name="scoreChecked"
                                                    valuePropName="checked"
                                                >
                                                    <Checkbox disabled={profileId !== listUser?.P2}>
                                                        P2/P7 đã kiểm tra
                                                    </Checkbox>
                                                </Form.Item>
                                            </Form>
                                        </Flex>
                                    </Col>
                                </>
                            )}
                            {loadingTable ? (
                                <Col span={24}>
                                    <Skeleton />
                                </Col>
                            ) : (
                                <Col span={24}>
                                    {dataDetailSubjectClass && (
                                        <div className="flex flex-row gap-2">
                                            <div className="font-bold">Tổng hợp kết quả thi:</div>
                                            {Object.entries(statistics).map(
                                                ([type, { count, percentage }]) => (
                                                    <p key={type}>
                                                        {type}: {count}= {percentage}%
                                                    </p>
                                                )
                                            )}
                                        </div>
                                    )}
                                    <Form form={formTable}>
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
                                                    render: (_, record) =>
                                                        record.student?.code || '',
                                                },
                                                {
                                                    title: 'Họ và tên',
                                                    dataIndex: 'fullname',
                                                    width: 150,
                                                    fixed: 'left',
                                                    type: 'input',
                                                    render: (_, record) =>
                                                        record?.student?.userProfile?.fullname ||
                                                        '',
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
                                                                  record?.student?.userProfile
                                                                      .dateOfBirth
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
                                                    hidden:
                                                        !!dataDetailSubjectClass?.subject?.onePoint,
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
                                                    hidden:
                                                        !!dataDetailSubjectClass?.subject?.onePoint,
                                                    render: (_, record) => {
                                                        return record?.midtermScore || ''
                                                    },
                                                },
                                                // #region Điểm Thi
                                                {
                                                    title: 'Điểm thi',
                                                    dataIndex: 'examScore',
                                                    width: 100,
                                                    type: 'order',
                                                    align: 'center',
                                                    render: (_, record) => {
                                                        return (
                                                            <Form.Item
                                                                noStyle
                                                                shouldUpdate={(prev, cur) =>
                                                                    prev?.[record.id]?.examScore !==
                                                                    cur?.[record.id]?.examScore
                                                                }
                                                            >
                                                                {({ getFieldValue }) => {
                                                                    const recordForm: any =
                                                                        getFieldValue([
                                                                            record.id,
                                                                            'examScore',
                                                                        ])

                                                                    return (
                                                                        <Form.Item
                                                                            className="w-full mb-0"
                                                                            name={[
                                                                                record.id,
                                                                                'examScore',
                                                                            ]}
                                                                            label=""
                                                                            rules={[
                                                                                {
                                                                                    validator: (
                                                                                        _,
                                                                                        value
                                                                                    ) => {
                                                                                        if (
                                                                                            value ==
                                                                                                null ||
                                                                                            value ===
                                                                                                ''
                                                                                        )
                                                                                            return Promise.resolve()
                                                                                        if (
                                                                                            value >
                                                                                            10
                                                                                        ) {
                                                                                            message.error(
                                                                                                'Điểm phải là nhỏ hơn 10!'
                                                                                            )
                                                                                            return Promise.reject()
                                                                                        }
                                                                                        if (
                                                                                            Math.round(
                                                                                                value *
                                                                                                    10
                                                                                            ) !==
                                                                                            value *
                                                                                                10
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
                                                                                disabled={
                                                                                    disabledForm
                                                                                }
                                                                                min={0}
                                                                                id={`score-thi-${record.id}`}
                                                                                style={{
                                                                                    width: '100%',
                                                                                    borderColor:
                                                                                        !!recordForm &&
                                                                                        (recordForm >
                                                                                            10 ||
                                                                                            Math.round(
                                                                                                recordForm *
                                                                                                    10
                                                                                            ) !==
                                                                                                recordForm *
                                                                                                    10)
                                                                                            ? 'red'
                                                                                            : !!recordForm &&
                                                                                                recordForm !==
                                                                                                    record?.examScore
                                                                                              ? '#f0b60ce0'
                                                                                              : '',
                                                                                }}
                                                                                step={0}
                                                                                defaultValue={
                                                                                    record?.examScore
                                                                                }
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
                                                                }}
                                                            </Form.Item>
                                                        )
                                                    },
                                                },
                                                {
                                                    title: 'Điểm HP',
                                                    width: 80,
                                                    align: 'center',
                                                    render: (_, record: any) => (
                                                        <Form.Item
                                                            noStyle
                                                            shouldUpdate={(prev, cur) =>
                                                                prev?.[record.id]?.examScore !==
                                                                cur?.[record.id]?.examScore
                                                            }
                                                        >
                                                            {({ getFieldValue }) => {
                                                                const recordForm = getFieldValue([
                                                                    record.id,
                                                                    'examScore',
                                                                ])
                                                                const finalScore = calcFinalScore(
                                                                    record?.student?.fixedClass
                                                                        ?.trainingCourse,
                                                                    {
                                                                        ...record,
                                                                        examScore: !!recordForm
                                                                            ? recordForm
                                                                            : record?.examScore,
                                                                    }
                                                                )?.toFixed(1)

                                                                return <div>{finalScore}</div>
                                                            }}
                                                        </Form.Item>
                                                    ),
                                                },
                                                // #region Cấm thi/Hoãn thi/Đình chỉ
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
                                                    width: 200,
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
                                                                name={[record.id, 'suspended']}
                                                                label=""
                                                                valuePropName="checked"
                                                            >
                                                                <Checkbox
                                                                    disabled={
                                                                        profileId !== listUser.P13
                                                                    }
                                                                    checked={record?.suspended}
                                                                />
                                                            </Form.Item>
                                                        )
                                                    },
                                                },

                                                {
                                                    title: 'Lý do đình chỉ',
                                                    dataIndex: 'suspendedReason',
                                                    width: 200,
                                                    render: (_, record) => (
                                                        <Form.Item
                                                            noStyle
                                                            shouldUpdate={(prev, cur) =>
                                                                prev?.[record.id]?.suspended !==
                                                                cur?.[record.id]?.suspended
                                                            }
                                                        >
                                                            {({ getFieldValue }) => {
                                                                const suspended = getFieldValue([
                                                                    record.id,
                                                                    'suspended',
                                                                ])
                                                                return (
                                                                    <Form.Item
                                                                        name={[
                                                                            record.id,
                                                                            'suspendedReason',
                                                                        ]}
                                                                        style={{ margin: 0 }}
                                                                    >
                                                                        <Input
                                                                            placeholder="Nhập lý do đình chỉ"
                                                                            disabled={
                                                                                !(
                                                                                    suspended &&
                                                                                    profileId ===
                                                                                        listUser.P13
                                                                                )
                                                                            }
                                                                        />
                                                                    </Form.Item>
                                                                )
                                                            }}
                                                        </Form.Item>
                                                    ),
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
                            )}
                        </>
                    )}
                </Row>
            )}
        </div>
    )
}

SubjectClassScore.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
