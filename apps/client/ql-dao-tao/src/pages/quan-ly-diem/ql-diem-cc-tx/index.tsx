import FormItem from '@components/commons/form-item'
import ImportScoreModal from '@components/commons/print/nhap-diem-tu-file'
import ExportScoreTemplate from '@components/commons/print/xuat-mau-nhap-diem'
import Select from '@components/commons/select'
import Table from '@components/commons/table'
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
import { calcFinalScore } from '@workspace/libs/utils'
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
import { Ellipsis, FileUp, Save } from 'lucide-react'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'

type PutStudentSubjectScore = StudentSubjectScore & {}
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
        list: PutStudentSubjectScore[]
        isLockExamScore: boolean
        isLockScore: boolean
        scoreChecked: boolean
        scoreSubmitted: boolean
    }>()
    const { id: semesterId } = useSemesterStore()
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const { data: session } = useSession()
    const profileId = session?.sDM_NhanVienId || ''
    const [open, setOpen] = useState(false)
    const subjectClassId = router.query?.subjectClassId as string
    const [importModalVisible, setImportModalVisible] = useState(false)
    const [listChange, setListChange] = useState<string[]>([])
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
            const error = dataSubmit?.list.find(
                (i: any) =>
                    i?.attendanceScore > 10 ||
                    i?.attendanceScore < 0 ||
                    i?.midtermScore > 10 ||
                    i?.midtermScore < 0 
            )
            if (error) {
                message.error('Bạn chưa nhập đúng điểm số')
                return
            }
            let listSqlTransaction: any = []
            const itemEnteredScore = dataSubmit?.list.find(
                (i) => i?.attendanceScore || i?.midtermScore
            )
            if (!itemEnteredScore && subjectClassId) {
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
            //  const itemEnteredExamScore = dataSubmit?.list.find((i) => i?.examScore)
            //     if (!itemEnteredExamScore && subjectClassId) {
            //     listSqlTransaction = [
            //         ...listSqlTransaction,
            //         {
            //             model: 'SubjectClass',
            //             operation: 'update',
            //             data: {
            //                 where: {
            //                     id: subjectClassId,
            //                 },
            //                 data: { enteredExamScore: true },
            //             },
            //         },
            //     ]
            // }
            if (dataSubmit?.list?.length > 0) {
                listSqlTransaction = [
                    ...listSqlTransaction,
                    ...dataSubmit.list.map(({ id, newData }: any) => {
                        return {
                            model: 'StudentSubjectScore',
                            operation: 'update',
                            data: {
                                where: {
                                    id,
                                },
                                data: newData,
                            },
                        }
                    }),
                ]
            }
            if (listSqlTransaction?.length > 0) {
                await sqlTransaction(listSqlTransaction)
                message.success('Đã cập nhật điểm thi thành công!')
                debouncedRefetch()
            }
            setListChange([])
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
                                  fullname: { contains: filterTable.fullname, mode: 'insensitive' },
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
            (can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC, 'NHAP_DIEM') &&
                dataDetailSubjectClass?.scoreDeadline &&
                dayjs().isBefore(dataDetailSubjectClass?.scoreDeadline) &&
                !dataDetailSubjectClass?.isLockScore &&
                profileId !== listUser.P13) ||
            false
        )
    }, [dataDetailSubjectClass, subjectClassId])

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (subjectClassId) {
            form.setFieldsValue({
                list: [...dataTable],
                isLockExamScore: dataDetailSubjectClass?.isLockExamScore,
                isLockScore: dataDetailSubjectClass?.isLockScore,
                scoreChecked: dataDetailSubjectClass?.scoreChecked,
                scoreSubmitted: dataDetailSubjectClass?.scoreSubmitted,
            })
        }
    }, [dataTable, subjectClassId])

    useEffect(() => {
        if (subjectClassId) {
            console.log('subjectClassId', subjectClassId)
            setListChange([])
            // setSubjectClassIdSelected(subjectClassId as string)
        }
    }, [subjectClassId])

    useEffect(() => {
        if (listChange.length > 0) {
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
        }
    }, [listChange, router.events.emit, router.events.off, router.events.on, router.pathname])

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
                                        setListChange([])
                                        router.push(
                                            `/quan-ly-diem/ql-diem-cc-tx?subjectClassId=${value}`
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
                                                Hạn nhập điểm TX/CC:
                                                <span
                                                    className={`ml-1 ${dayjs().isBefore(dataDetailSubjectClass?.scoreDeadline) ? '' : 'text-red-500'}`}
                                                >
                                                    {dataDetailSubjectClass?.scoreDeadline &&
                                                        formatDate(
                                                            dataDetailSubjectClass?.scoreDeadline
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
                                                                    {!disabledForm && !dataDetailSubjectClass.enteredScore && (
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
                                            dataClass={selectedClassInfo}
                                            dataTable={dataTable}
                                        />
                                    )}

                                            <Button
                                                disabled={!listChange.length}
                                                type="primary"
                                                onClick={handleSave}
                                            >
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
                                                        Khoá điểm CC/TX
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
                                                        Khoá điểm thi
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
                                    {/* {dataDetailSubjectClass && (
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
                                    )} */}
                                    <Form form={form}>
                                        <FormItem form={form} name="list">
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
                                                            record?.student?.userProfile
                                                                ?.fullname || '',
                                                    },
                                                    {
                                                        title: 'Ngày sinh',
                                                        dataIndex: 'dateOfBirth',
                                                        width: 125,
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
                                                        title: 'Tên lớp',
                                                        dataIndex: 'fixedClassName',
                                                        width: 200,
                                                        align: 'center',
                                                        type: 'input',
                                                        render: (_, record) =>
                                                            record.student?.fixedClass?.name ||
                                                            'Chưa có lớp',
                                                    },
                                                    // #region Điểm CC
                                                    {
                                                        title: 'Điểm CC',
                                                        dataIndex: 'attendanceScore',
                                                        width: 100,
                                                        align: 'center',
                                                        type: 'order',
                                                        render: (_, record, index: number) => {
                                                            return (
                                                                <Form.Item
                                                                    className="w-full mb-0"
                                                                    name={[
                                                                        'list',
                                                                        index,
                                                                        'attendanceScore',
                                                                    ]}
                                                                    label=""
                                                                    validateTrigger="onBlur"
                                                                    rules={[
                                                                        {
                                                                            validator: (
                                                                                _,
                                                                                value
                                                                            ) => {
                                                                                if (
                                                                                    value == null ||
                                                                                    value === ''
                                                                                )
                                                                                    return Promise.resolve()
                                                                                if (value > 10) {
                                                                                    message.error(
                                                                                        'Điểm phải là nhỏ hơn 10!'
                                                                                    )
                                                                                    return Promise.reject()
                                                                                }
                                                                                if (
                                                                                    value % 0.5 !==
                                                                                    0
                                                                                ) {
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
                                                                                listChange.includes(
                                                                                    `${index}-cc`
                                                                                )
                                                                                    ? '#e2770ce0'
                                                                                    : '',
                                                                        }}
                                                                        step={0}
                                                                        controls={false}
                                                                        onChange={(value) => {
                                                                            const currentList =
                                                                                form.getFieldValue(
                                                                                    'list'
                                                                                ) || []
                                                                            const oldValue =
                                                                                record?.attendanceScore

                                                                            if (
                                                                                Number(value) <=
                                                                                record?.student
                                                                                    ?.fixedClass
                                                                                    ?.trainingCourse
                                                                                    ?.scoreToTakeExam
                                                                            ) {
                                                                                currentList[
                                                                                    index
                                                                                ].examBanned = true
                                                                                form.setFieldsValue(
                                                                                    {
                                                                                        list: [
                                                                                            ...currentList,
                                                                                        ],
                                                                                    }
                                                                                )
                                                                            }

                                                                            setListChange(
                                                                                (prev) => {
                                                                                    const isChanged =
                                                                                        Number(
                                                                                            value
                                                                                        ) !==
                                                                                            Number(
                                                                                                oldValue
                                                                                            ) &&
                                                                                        Number(
                                                                                            value
                                                                                        ) < 10 &&
                                                                                        Number(
                                                                                            value
                                                                                        ) %
                                                                                            0.5 ===
                                                                                            0
                                                                                    if (isChanged) {
                                                                                        return [
                                                                                            ...prev,
                                                                                            `${index}-cc`,
                                                                                        ]
                                                                                    }
                                                                                    return prev.filter(
                                                                                        (i) =>
                                                                                            i !==
                                                                                            `${index}-cc`
                                                                                    )
                                                                                }
                                                                            )
                                                                        }}
                                                                        // status={isInvalid ? 'error' : undefined}
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
                                                        render: (_, record, index: number) => {
                                                            return (
                                                                <Form.Item
                                                                    className="w-full mb-0"
                                                                    name={[
                                                                        'list',
                                                                        index,
                                                                        'midtermScore',
                                                                    ]}
                                                                    label=""
                                                                    rules={[
                                                                        {
                                                                            validator: (
                                                                                _,
                                                                                value
                                                                            ) => {
                                                                                if (
                                                                                    value == null ||
                                                                                    value === ''
                                                                                )
                                                                                    return Promise.resolve()
                                                                                if (value > 10) {
                                                                                    message.error(
                                                                                        'Điểm phải là nhỏ hơn 10!'
                                                                                    )
                                                                                    return Promise.reject()
                                                                                }
                                                                                if (
                                                                                    value % 0.5 !==
                                                                                    0
                                                                                ) {
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
                                                                                listChange.includes(
                                                                                    `${index}-tx`
                                                                                )
                                                                                    ? '#e2770ce0'
                                                                                    : '',
                                                                        }}
                                                                        step={0}
                                                                        controls={false}
                                                                        onChange={(value) => {
                                                                            const currentList =
                                                                                form.getFieldValue(
                                                                                    'list'
                                                                                ) || []
                                                                            const oldValue =
                                                                                record?.attendanceScore

                                                                            if (
                                                                                Number(value) <=
                                                                                record?.student
                                                                                    ?.fixedClass
                                                                                    ?.trainingCourse
                                                                                    ?.scoreToTakeExam
                                                                            ) {
                                                                                currentList[
                                                                                    index
                                                                                ].examBanned = true
                                                                                form.setFieldsValue(
                                                                                    {
                                                                                        list: [
                                                                                            ...currentList,
                                                                                        ],
                                                                                    }
                                                                                )
                                                                            }

                                                                            setListChange(
                                                                                (prev) => {
                                                                                    const isChanged =
                                                                                        Number(
                                                                                            value
                                                                                        ) !==
                                                                                            Number(
                                                                                                oldValue
                                                                                            ) &&
                                                                                        Number(
                                                                                            value
                                                                                        ) < 10 &&
                                                                                        Number(
                                                                                            value
                                                                                        ) %
                                                                                            0.5 ===
                                                                                            0
                                                                                    if (isChanged) {
                                                                                        return [
                                                                                            ...prev,
                                                                                            `${index}-tx`,
                                                                                        ]
                                                                                    }
                                                                                    return prev.filter(
                                                                                        (i) =>
                                                                                            i !==
                                                                                            `${index}-tx`
                                                                                    )
                                                                                }
                                                                            )
                                                                        }}
                                                                        // status={(listChange.includes(`${index}-tx`))?'warning':undefined}
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
                                                            // return Score !== null ? <span>{Score}</span> : null
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
                                                            return (
                                                                record?.examScore || ''
                                                                // <Form.Item
                                                                //     className="w-full mb-0"
                                                                //     name={[
                                                                //         'list',
                                                                //         index,
                                                                //         'examScore',
                                                                //     ]}
                                                                //     label=""
                                                                //     rules={[]}
                                                                // >
                                                                //     <InputNumber
                                                                //         disabled={true}
                                                                //         min={0}
                                                                //         id={`score-thi-${record.id}`}
                                                                //         style={{ width: '100%' }}
                                                                //         step={0}
                                                                //         controls={false}
                                                                //     />
                                                                // </Form.Item>
                                                            )
                                                        },
                                                    },
                                                    // {
                                                    //     title: 'Điểm cộng',
                                                    //     align: 'center',
                                                    //     width: 120,
                                                    //     render: (_, record) =>
                                                    //         record.awards.reduce(
                                                    //             (
                                                    //                 acc: number,
                                                    //                 curr: {
                                                    //                     archivedAward: ArchivedAward
                                                    //                 }
                                                    //             ) =>
                                                    //                 acc +
                                                    //                 (curr?.archivedAward
                                                    //                     ?.bonusScore ?? 0),
                                                    //             0
                                                    //         ),
                                                    // },
                                                    {
                                                        title: 'Điểm HP',
                                                        width: 80,
                                                        align: 'center',
                                                        render: (
                                                            __,
                                                            record: any,
                                                            index: number
                                                        ) => {
                                                            return (
                                                                <Form.Item
                                                                    noStyle
                                                                    shouldUpdate={(prev, cur) =>
                                                                        prev.list?.[index]
                                                                            ?.midtermScore !==
                                                                            cur.list?.[index]
                                                                                ?.midtermScore ||
                                                                        prev.list?.[index]
                                                                            ?.attendanceScore !==
                                                                            cur.list?.[index]
                                                                                ?.attendanceScore
                                                                    }
                                                                >
                                                                    {({ getFieldValue }) => {
                                                                        const recordForm: any =
                                                                            getFieldValue([
                                                                                'list',
                                                                                index,
                                                                            ])
                                                                        const finalScore =
                                                                            calcFinalScore(
                                                                                record?.student
                                                                                    ?.fixedClass
                                                                                    ?.trainingCourse,
                                                                                {
                                                                                    ...record,
                                                                                    attendanceScore:
                                                                                        recordForm?.attendanceScore,
                                                                                    midtermScore:
                                                                                        recordForm?.midtermScore,
                                                                                    examScore:
                                                                                        recordForm?.examScore,
                                                                                }
                                                                            )?.toFixed(1)

                                                                        return (
                                                                            <div>{finalScore}</div>
                                                                        )
                                                                    }}
                                                                </Form.Item>
                                                            )
                                                        },
                                                    },
                                                    // #region Cấm thi/Hoãn thi/Đình chỉ
                                                    {
                                                        title: 'Cấm thi',
                                                        dataIndex: 'examBanned',
                                                        width: 80,
                                                        align: 'center',
                                                        render: (value, record, index: number) => {
                                                            return (
                                                                <Form.Item
                                                                    className="w-full mb-0"
                                                                    name={[
                                                                        'list',
                                                                        index,
                                                                        'examBanned',
                                                                    ]}
                                                                    label=""
                                                                    valuePropName="checked"
                                                                >
                                                                    <Checkbox
                                                                        disabled={disabledForm}
                                                                    />
                                                                </Form.Item>
                                                            )
                                                        },
                                                    },
                                                    {
                                                        title: 'Lý do cấm thi',
                                                        dataIndex: 'examBannedReason',
                                                        width: 150,
                                                        render: (value, record, index: number) => {
                                                            // const isBanned = Form.useWatch(['list', index, 'examBanned'], form);
                                                            return (
                                                                <Form.Item
                                                                    noStyle
                                                                    shouldUpdate={(prev, cur) =>
                                                                        prev.list?.[index]
                                                                            ?.examBanned !==
                                                                        cur.list?.[index]
                                                                            ?.examBanned
                                                                    }
                                                                >
                                                                    {({ getFieldValue }) => {
                                                                        const isBanned =
                                                                            getFieldValue([
                                                                                'list',
                                                                                index,
                                                                                'examBanned',
                                                                            ])
                                                                        return (
                                                                            <Form.Item
                                                                                name={[
                                                                                    'list',
                                                                                    index,
                                                                                    'examBannedReason',
                                                                                ]}
                                                                                style={{
                                                                                    margin: 0,
                                                                                }}
                                                                            >
                                                                                <Input
                                                                                    disabled={
                                                                                        !isBanned
                                                                                    }
                                                                                    placeholder="Nhập lý do cấm thi"
                                                                                />
                                                                            </Form.Item>
                                                                        )
                                                                    }}
                                                                </Form.Item>
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
                                                                <Form.Item
                                                                    className="w-full mb-0"
                                                                    name={[
                                                                        'list',
                                                                        index,
                                                                        'examPostponed',
                                                                    ]}
                                                                    label=""
                                                                    valuePropName="checked"
                                                                >
                                                                    <Checkbox
                                                                        disabled={disabledForm}
                                                                    />
                                                                </Form.Item>
                                                            )
                                                        },
                                                    },

                                                    {
                                                        title: 'Lý do hoãn thi',
                                                        dataIndex: 'repeatedReason',
                                                        width: 200,
                                                        render: (value, record, index: number) => {
                                                            return (
                                                                <Form.Item
                                                                    noStyle
                                                                    shouldUpdate={(prev, cur) =>
                                                                        prev.list?.[index]
                                                                            ?.examPostponed !==
                                                                        cur.list?.[index]
                                                                            ?.examPostponed
                                                                    }
                                                                >
                                                                    {({ getFieldValue }) => {
                                                                        const isBanned =
                                                                            getFieldValue([
                                                                                'list',
                                                                                index,
                                                                                'examPostponed',
                                                                            ])
                                                                        return (
                                                                            <Form.Item
                                                                                name={[
                                                                                    'list',
                                                                                    index,
                                                                                    'repeatedReason',
                                                                                ]}
                                                                                style={{
                                                                                    margin: 0,
                                                                                }}
                                                                            >
                                                                                <Input
                                                                                    disabled={
                                                                                        !isBanned
                                                                                    }
                                                                                    placeholder="Nhập lý do hoãn thi"
                                                                                />
                                                                            </Form.Item>
                                                                        )
                                                                    }}
                                                                </Form.Item>
                                                            )
                                                        },
                                                    },

                                                    {
                                                        title: 'Đình chỉ',
                                                        dataIndex: 'suspended',
                                                        width: 80,
                                                        align: 'center',
                                                        render: (value, record, index: number) => {
                                                            return (
                                                                <Checkbox
                                                                        checked={
                                                                            record?.suspended
                                                                        }
                                                                    />
                                                            )
                                                        },
                                                    },

                                                    {
                                                        title: 'Lý do đình chỉ',
                                                        dataIndex: 'suspendedReason',
                                                        width: 200,
                                                        render: (value, record, index: number) => {
                                                                  return (
                                                                            <Form.Item
                                                                                name={[
                                                                                    'list',
                                                                                    index,
                                                                                    'suspendedReason',
                                                                                ]}
                                                                                style={{
                                                                                    margin: 0,
                                                                                }}
                                                                            >
                                                                                <Input
                                                                                    disabled={
                                                                                       true
                                                                                    }
                                                                                    placeholder="Nhập lý do đình chỉ"
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
                                                        render: (value, record, index: number) => {
                                                            return (
                                                                <Form.Item
                                                                    className="w-full mb-0"
                                                                    name={[
                                                                        'list',
                                                                        index,
                                                                        'description',
                                                                    ]}
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
                                        </FormItem>
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
