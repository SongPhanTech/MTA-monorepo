import { queryClient } from '@api/index'
import ImportScoreModal, { type ImportScoreData } from '@components/commons/print/nhap-diem-tu-file'
import ExportScoreTemplate from '@components/commons/print/xuat-mau-nhap-diem'
import Table from '@components/commons/table'
import { type DataTable, EnumInPhieuDiem } from '@components/modal/modal-in-phieu-diem'
import ExportTemplateExam from '@components/ui/in-phieu-danh-sach-thi'
import { examBanReason, examPostponeReason, examSuspendedReason } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import useSpinner from '@hooks/spinner'
import { validateExamScore, validateScore } from '@lib/utils'
import {
    type DiemLopMonHocProps,
    diemLopMonHocStore,
} from '@pages/quan-ly-diem/ql-diem-lop-mon-hoc'
import { useStore } from '@tanstack/react-store'
import { useSession } from '@workspace/auth/react'
import { $Enums, type StudentSubjectScore } from '@workspace/db/client'
import { useFindManyStudentSubjectScore, useFindUniqueSubjectClass } from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import type { SqlTransactionBodyItem } from '@workspace/libs/api/schemas/sqlTransactionBodyItem'
import { calcFinalScore, fastIsEqual } from '@workspace/libs/utils'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION } from '@workspace/router'
import { cn } from '@workspace/ui/lib/utils'
import {
    AutoComplete,
    Button,
    Checkbox,
    Col,
    Flex,
    Form,
    Input,
    InputNumber,
    Modal,
    message,
    Row,
    Tag,
} from 'antd'
import dayjs from 'dayjs'
import type Decimal from 'decimal.js'
import _ from 'lodash'
import { FileUp, Printer, Save } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { scoreConvert } from '@hooks/scoreConverter'

type FilterTable = FilterProps & {
    fullname?: string
    fixedClassName?: string
    attendanceScore?: 'asc' | 'desc'
    midtermScore?: 'asc' | 'desc'
    examScore?: 'asc' | 'desc'
}
type SubjectClassScoreForm = {
    list: Record<
        string,
        {
            attendanceScore?: number | null
            midtermScore?: number | null
            examScore?: number | null
            description?: string | null
            examBanned?: boolean | null
            examBannedReason?: string | null
            examPostponed?: boolean | null
            examPostponedReason?: string | null
            scoreToTakeExam?: number | null
            suspended?: boolean | null
            suspendedReason?: string | null
            finalScore?: Decimal | null
            isChanged?: boolean
        }
    >
}
export default function NhapDiem({
    role,
    score,
    loadData,
}: DiemLopMonHocProps & {
    loadData: boolean
}) {
    const { can } = useAbility()
    const { showSpinner, hideSpinner } = useSpinner()
    const [form] = Form.useForm<SubjectClassScoreForm>()
    const listForm = Form.useWatch('list', form) || {}
    const { selectedSubjectClassId } = useStore(diemLopMonHocStore)

    const { data: session } = useSession()
    const profileId = session?.sDM_NhanVienId
    const [importModalVisible, setImportModalVisible] = useState(false)
    const [filterTable, setFilterTable] = useState<FilterTable>({
        fullname: '',
        fixedClassName: '',
        dateOfBirth: undefined,
        attendanceScore: undefined,
        midtermScore: undefined,
        examScore: undefined,
    })
    const { onOpen: onOpenDetailStudent } = useDisclosure<string>({
        tag: 'ModalChiTietSinhVien',
    })

    const { data: dataTable = [], refetch } = useFindManyStudentSubjectScore(
        {
            where: {
                subjectClassId: selectedSubjectClassId || '',
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
        {
            refetchOnWindowFocus: false,
            enabled: loadData && !!selectedSubjectClassId,
        }
    )

    const enteredScore = useMemo(
        () =>
            dataTable.every(({ id, attendanceScore, midtermScore }) => {
                const f = listForm?.[id]
                return (
                    (attendanceScore !== undefined &&
                        attendanceScore !== null &&
                        attendanceScore <= 1 &&
                        !f?.examBanned) ||
                    (midtermScore !== undefined &&
                        midtermScore !== null &&
                        midtermScore <= 1 &&
                        !f?.examBanned) ||
                    (f?.examBanned && f?.examBannedReason) ||
                    (f?.attendanceScore && f?.midtermScore)
                )
            }),
        [dataTable, listForm]
    )
    const enteredExamScore = useMemo(
        () =>
            dataTable.every(({ id }) => {
                const f = listForm?.[id]
                return (
                    (f?.examBanned && f?.examBannedReason) ||
                    (f?.examPostponed && f?.examPostponedReason) ||
                    f?.examScore
                )
            }),
        [dataTable, listForm]
    )

    const handleSave = async () => {
        for (const [_, value] of Object.entries(listForm)) {
            try {
                await validateScore(value.attendanceScore)
                await validateScore(value.midtermScore)
                await validateExamScore(value.examScore)
                if (value.examBanned && !value.examBannedReason) {
                    message.error('Vui lòng nhập lý do cấm thi')
                    return
                }
                if (value.examPostponed && !value.examPostponedReason) {
                    message.error('Vui lòng nhập lý do hoãn thi')
                    return
                }
            } catch (_) {
                message.warning('Vui lòng kiểm tra lại điểm')
                return
            }
        }
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
            queryClient.invalidateQueries({
                queryKey: ['zenstack', 'SubjectClass'],
            })
        }, 500),
        []
    )

    const handleSaveScores = async () => {
        try {
            showSpinner()

            const listChange = Object.entries(listForm)
                .map(([key, value]) => {
                    return { id: key, ...value }
                })
                .filter((e) => e.isChanged)

            const listSqlTransaction: SqlTransactionBodyItem[] = []
            if (selectedSubjectClassId) {
                listSqlTransaction.push({
                    model: 'SubjectClass',
                    operation: 'update',
                    data: {
                        where: { id: selectedSubjectClassId },
                        data: { enteredScore, enteredExamScore },
                    },
                })
            }
            if (listChange.length > 0) {
                const dataWithFinalScore = listChange.map((item) => {
                    return {
                        attendanceScore: item.attendanceScore,
                        midtermScore: item.midtermScore,
                        examScore: item.examScore,
                        finalScore: item.finalScore,
                        description: item?.description,
                        examPostponed: item?.examPostponed,
                        examPostponedReason: item?.examPostponedReason,
                        examBanned: !!item?.examBanned,
                        examBannedReason: item?.examBannedReason,
                        suspended: !!item?.suspended,
                        suspendedReason: item?.suspendedReason,
                        id: item.id,
                    }
                })

                listSqlTransaction.push(
                    ...dataWithFinalScore.map(({ id, ...item }) => {
                        return {
                            model: 'StudentSubjectScore' as const,
                            operation: 'update',
                            data: {
                                where: { id },
                                data: item,
                            },
                        }
                    }),
                    {
                        model: 'StudentSubjectScoreHistory' as const,
                        operation: 'createMany',
                        data: {
                            data: dataWithFinalScore.map(({ id, ...item }) => {
                                return {
                                    ...item,
                                    studentSubjectScoreId: id,
                                    updatedById: profileId,
                                }
                            }),
                        },
                    }
                )
            }

            if (listSqlTransaction?.length > 0) {
                const res = await sqlTransaction(listSqlTransaction)
                if (res?.status === 200) {
                    form.resetFields()
                    message.success('Đã cập nhật điểm thi thành công!')
                    debouncedRefetch()
                }
            }
        } catch (error: any) {
            console.error(error)
            message.error('Đã xảy ra lỗi khi lưu điểm, vui lòng thử lại.')
        } finally {
            hideSpinner()
        }
    }

    const handleImportConfirm = (importedData: ImportScoreData[]) => {
        const changedData = Object.fromEntries(
            importedData.map((item) => {
                const scoreToTakeExam = listForm[item.id]?.scoreToTakeExam
                // TODO: fix not work if directly uncheck exam banned
                const isExamBanned =
                    !!listForm[item.id]?.examBannedReason ||
                    (item.attendanceScore !== null &&
                        scoreToTakeExam !== null &&
                        scoreToTakeExam !== undefined &&
                        item.attendanceScore < scoreToTakeExam) ||
                    (item.midtermScore !== null &&
                        scoreToTakeExam !== null &&
                        scoreToTakeExam !== undefined &&
                        item.midtermScore < scoreToTakeExam)
                return [
                    item.id,
                    {
                        attendanceScore: item.attendanceScore,
                        midtermScore: item.midtermScore,
                        examScore: item.examScore,
                        isChanged:
                            listForm[item.id].attendanceScore !== item.attendanceScore ||
                            listForm[item.id].midtermScore !== item.midtermScore ||
                            listForm[item.id].examScore !== item.examScore,
                        examBanned: isExamBanned,
                    },
                ]
            })
        )

        form.setFieldsValue({ list: { ...listForm, ...changedData } })
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

    const { data: dataDetailSubjectClass } = useFindUniqueSubjectClass(
        {
            where: {
                id: selectedSubjectClassId,
            },
            select: {
                scoreDeadLineStart: true,
                scoreDeadline: true,
                examScoreDeadline: true,
                isLockScore: true,
                isLockExamScore: true,
                enteredScore: true,
                type: true,
                enteredExamScore: true,
                subject: {
                    select: {
                        onePoint: true,
                        credit: true,
                        managementOrganization: {
                            select: {
                                sTen: true,
                            },
                        },
                    },
                },
                subjectClassStudent: true,
                semester: {
                    select: {
                        name: true,
                        schoolYear: true,
                    },
                },
                code: true,
                name: true,
                mainLecturer: {
                    select: {
                        userProfile: {
                            select: {
                                fullname: true,
                            },
                        },
                    },
                },
                extraLecturer: {
                    select: {
                        userProfile: {
                            select: {
                                fullname: true,
                            },
                        },
                    },
                },
                examDate: true,
                examType: true,
            },
        },
        {
            enabled: !!selectedSubjectClassId,
            refetchOnWindowFocus: false,
        }
    )

    const onlyNumberPress = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (
            !/[0-9]/.test(e.key) &&
            e.key !== 'Backspace' &&
            e.key !== 'Delete' &&
            e.key !== 'Tab' &&
            e.key !== '.' &&
            e.key !== ','
        ) {
            e.preventDefault()
        }
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
        onlyNumberPress(e)
    }

    const disabledForm: boolean = useMemo(() => {
        if (score === 'CC/TX') {
            return !(
                can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_CC_TX, 'NHAP_DIEM') &&
                dataDetailSubjectClass?.scoreDeadLineStart &&
                dayjs().isAfter(dataDetailSubjectClass?.scoreDeadLineStart) &&
                dataDetailSubjectClass?.scoreDeadline &&
                dayjs().isBefore(dataDetailSubjectClass?.scoreDeadline) &&
                !dataDetailSubjectClass?.isLockScore &&
                !dataDetailSubjectClass?.isLockExamScore &&
                !dataDetailSubjectClass?.subject.onePoint &&
                dataDetailSubjectClass?.type !== $Enums.SubjectClassType.REEXAM
            )
        }
        return !(
            can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_THI, 'NHAP_DIEM') &&
            dataDetailSubjectClass?.examScoreDeadline &&
            dayjs().isBefore(dataDetailSubjectClass?.examScoreDeadline) &&
            !dataDetailSubjectClass?.isLockExamScore
        )
    }, [dataDetailSubjectClass, can, score])

    const { onOpen: openStudentSubjectScore } = useDisclosure<{
        dataTable: DataTable[]
        type: number // 1: In phiếu điểm và khoá, 0: In phiếu điểm nháp
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
                openStudentSubjectScore({
                    dataTable,
                    type: EnumInPhieuDiem.PHIEU_DIEM_KHOA,
                })
            },
        })
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: <form>
    useEffect(() => {
        if (dataTable) {
            form.setFieldsValue({
                list: dataTable.reduce(
                    (acc, cur) => {
                        if (!acc) {
                            return {}
                        }
                        acc[cur.id] = {
                            attendanceScore: cur.attendanceScore,
                            midtermScore: cur.midtermScore,
                            examScore: cur.examScore,
                            description: cur.description,
                            examBanned: cur.examBanned,
                            examBannedReason: cur.examBannedReason,
                            examPostponed: cur.examPostponed,
                            examPostponedReason: cur.examPostponedReason,
                            scoreToTakeExam:
                                cur.student?.fixedClass?.trainingCourse?.scoreToTakeExam,
                            finalScore: cur.finalScore,
                            suspended: cur.suspended,
                            suspendedReason: cur.suspendedReason,
                            isChanged: false,
                        }
                        return acc
                    },
                    {} as SubjectClassScoreForm['list']
                ),
            })
        }
    }, [dataTable])

    return (
        <Row gutter={[8, 8]}>
            <Col span={8}>
                {score === 'CC/TX' && (
                    <Tag color={enteredScore ? 'green' : 'yellow'}>
                        {enteredScore ? 'Đã hoàn thiện' : 'Chưa hoàn thiện'}
                    </Tag>
                )}
                {score === 'THI' && (
                    <Tag color={enteredExamScore ? 'green' : 'yellow'}>
                        {enteredExamScore ? 'Đã hoàn thiện' : 'Chưa hoàn thiện'}
                    </Tag>
                )}
            </Col>
            <Col span={16} className="flex justify-end">
                <Flex gap={4}>
                    {(can(
                        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_CC_TX,
                        'NHAP_EXCEL'
                    ) ||
                        can(
                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_THI,
                            'NHAP_EXCEL'
                        )) && (
                        <>
                            <Button
                                onClick={() => setImportModalVisible(true)}
                                disabled={!selectedSubjectClassId || role !== 'GV' || disabledForm}
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
                    {(can(
                        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC_P13,
                        'XUAT_EXCEL'
                    ) ||
                        can(
                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC,
                            'XUAT_EXCEL'
                        ) ||
                        can(
                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_CC_TX,
                            'XUAT_EXCEL'
                        ) ||
                        can(
                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_THI,
                            'XUAT_EXCEL'
                        )) && (
                        <ExportScoreTemplate
                            selectedSubjectClass={selectedSubjectClassId}
                            dataTable={dataTable}
                            type={score}
                        />
                    )}
                    {score !== 'CC/TX' &&
                        (can(
                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC_P13,
                            'IN_DS_THI'
                        ) ||
                            can(
                                QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC,
                                'IN_DS_THI'
                            ) ||
                            can(
                                QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_THI,
                                'IN_DS_THI'
                            )) && (
                            <ExportTemplateExam
                                dataClass={dataDetailSubjectClass}
                                dataTable={dataTable}
                                disabled={
                                    !dataDetailSubjectClass?.enteredScore || !selectedSubjectClassId
                                }
                            />
                        )}
                    {score !== 'CC/TX' &&
                        (can(
                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC_P13,
                            'IN_PHIEU_DIEM'
                        ) ||
                            can(
                                QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC,
                                'IN_PHIEU_DIEM'
                            ) ||
                            can(
                                QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_THI,
                                'IN_PHIEU_DIEM'
                            )) && (
                            <>
                                <Button
                                    disabled={
                                        !selectedSubjectClassId ||
                                        !dataDetailSubjectClass?.enteredExamScore
                                    }
                                    onClick={() => handlePrint()}
                                >
                                    <Printer />
                                    In phiếu điểm và khoá
                                </Button>
                                <Button
                                    disabled={!selectedSubjectClassId}
                                    onClick={() =>
                                        openStudentSubjectScore({
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
                    <Button type="primary" disabled={disabledForm} onClick={handleSave}>
                        <Save stroke="white" />
                        Lưu
                    </Button>
                </Flex>
            </Col>
            <Col span={24} className="mb-16">
                <Form
                    form={form}
                    onValuesChange={(changedValues) => {
                        const changedId = Object.keys(changedValues.list || {})?.[0]
                        if (changedId) {
                            const examScore =
                                changedValues.list[changedId]?.examScore ??
                                listForm[changedId].examScore ??
                                0
                            const attendanceScore = dataDetailSubjectClass?.subject.onePoint
                                ? examScore
                                : changedValues.list[changedId]?.attendanceScore !== undefined
                                  ? changedValues.list[changedId]?.attendanceScore
                                  : listForm[changedId].attendanceScore
                            const midtermScore = dataDetailSubjectClass?.subject.onePoint
                                ? examScore
                                : changedValues.list[changedId]?.midtermScore !== undefined
                                  ? changedValues.list[changedId]?.midtermScore
                                  : listForm[changedId].midtermScore

                            const scoreToTakeExam = listForm[changedId]?.scoreToTakeExam
                            // TODO: fix not work if directly uncheck exam banned
                            const isExamBanned =
                                !!changedValues.list[changedId]?.examBannedReason ||
                                !!listForm[changedId]?.examBannedReason ||
                                (attendanceScore !== null &&
                                    scoreToTakeExam !== null &&
                                    scoreToTakeExam !== undefined &&
                                    attendanceScore < scoreToTakeExam) ||
                                (midtermScore !== null &&
                                    scoreToTakeExam !== null &&
                                    scoreToTakeExam !== undefined &&
                                    midtermScore < scoreToTakeExam)

                            const dataForCalc = dataTable.find((i) => i.id === changedId)
                            if (!dataForCalc) return

                            const defaultCoef = {
                                coef_1: 0.1,
                                coef_2: 0.3,
                                coef_3: 0.6,
                                scoreToTakeExam: 1,
                                scoreToPass: 4,
                                maxReExamScore: 10,
                                reduceReExamScore: 0,
                            }
                            const finalScore = calcFinalScore(
                                dataForCalc?.student?.fixedClass?.trainingCourse || defaultCoef,
                                {
                                    attendanceScore,
                                    midtermScore,
                                    examScore,
                                    awards:
                                        dataForCalc?.awards?.map?.((a) => ({
                                            archivedAward: {
                                                bonusScore: a.archivedAward.bonusScore ?? 0,
                                            },
                                        })) || [],
                                    certificates:
                                        dataForCalc?.certificates?.map?.((c) => ({
                                            archivedCertificate: {
                                                finalScore: c.archivedCertificate.finalScore ?? 0,
                                            },
                                        })) || [],
                                },
                                dataForCalc.subjectClass?.type || 'NORMAL'
                            )?.toNumber()

                            form.setFieldsValue({
                                list: {
                                    ...listForm,
                                    ...changedValues.list,
                                    [changedId]: {
                                        ...listForm[changedId],
                                        examBanned: isExamBanned,
                                        ...changedValues.list[changedId],
                                        isChanged: !fastIsEqual(listForm[changedId], {
                                            ...listForm[changedId],
                                            ...changedValues.list[changedId],
                                        }),
                                        finalScore: changedValues.list[changedId]?.examBanned
                                            ? 0
                                            : finalScore,
                                    },
                                },
                            })
                        }
                    }}
                >
                    <Form.Item className="w-full m-0" name={'list'} hidden />
                    <Table
                        rowKey="id"
                        className="m-0"
                        filters={filterTable}
                        setFilters={setFilterTable}
                        onRow={(record) => ({
                            className: cn(!!listForm?.[record.id]?.isChanged && 'bg-yellow-100'),
                        })}
                        columns={[
                            {
                                title: 'STT',
                                width: 35,
                                align: 'center',
                                render: (_, __, index) => index + 1,
                            },
                            {
                                title: 'Mã sinh viên',
                                dataIndex: 'code',
                                align: 'center',
                                width: 150,
                                type: 'input',
                                render: (_, record) => (
                                    <span
                                        className="cursor-pointer hover:text-primary"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            onOpenDetailStudent(record.student?.id)
                                        }}
                                    >
                                        {record.student?.code || ''}
                                    </span>
                                ),
                            },
                            {
                                title: 'Họ và tên',
                                dataIndex: 'fullname',
                                width: 150,
                                type: 'input',
                                render: (_, record) => (
                                    <span
                                        className="cursor-pointer hover:text-primary"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            onOpenDetailStudent(record.student?.id)
                                        }}
                                    >
                                        {record?.student?.userProfile?.fullname || ''}
                                    </span>
                                ),
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
                                width: 90,
                                align: 'center',
                                type: 'order',
                                render: (_, record) => {
                                    if (role !== 'GV' || score === 'THI') {
                                        return record.attendanceScore ?? ''
                                    }
                                    return (
                                        <Form.Item
                                            className="w-full m-0"
                                            name={['list', record.id, 'attendanceScore']}
                                            label=""
                                            rules={[
                                                {
                                                    validator: (_, value) => validateScore(value),
                                                },
                                            ]}
                                        >
                                            <InputNumber
                                                readOnly={disabledForm}
                                                variant={disabledForm ? 'underlined' : 'outlined'}
                                                id={`score-cc-${record.id}`}
                                                style={{ width: '100%' }}
                                                step={0.5}
                                                controls={false}
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
                                width: 90,
                                align: 'center',
                                type: 'order',
                                render: (_, record) => {
                                    if (role !== 'GV' || score === 'THI') {
                                        return record.midtermScore ?? ''
                                    }
                                    return (
                                        <Form.Item
                                            className="w-full mb-0"
                                            name={['list', record.id, 'midtermScore']}
                                            label=""
                                            rules={[
                                                {
                                                    validator: (_, value) => validateScore(value),
                                                },
                                            ]}
                                        >
                                            <InputNumber
                                                readOnly={disabledForm}
                                                variant={disabledForm ? 'underlined' : 'outlined'}
                                                id={`score-tx-${record.id}`}
                                                style={{
                                                    width: '100%',
                                                }}
                                                step={0.5}
                                                controls={false}
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
                                width: 90,
                                type: 'order',
                                align: 'center',
                                render: (_, record) => {
                                    if (role !== 'GV' || score === 'CC/TX' || !!record.examBanned) {
                                        return record.examScore ?? ''
                                    }
                                    return (
                                        <Form.Item
                                            className="w-full m-0"
                                            name={['list', record.id, 'examScore']}
                                            label=""
                                            rules={[
                                                {
                                                    validator: (_, value) =>
                                                        validateExamScore(
                                                            value,
                                                            record?.subjectClass?.subject?.onePoint
                                                        ),
                                                },
                                            ]}
                                        >
                                            <InputNumber
                                                readOnly={disabledForm}
                                                variant={disabledForm ? 'underlined' : 'outlined'}
                                                disabled={disabledForm}
                                                id={`score-thi-${record.id}`}
                                                style={{
                                                    width: '100%',
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
                                title: 'Điểm hệ 10',
                                width: 90,
                                align: 'center',
                                render: (_, record) => {
                                    const recordForm = listForm?.[record.id]
                                    const examBanned = recordForm?.examBanned ?? record?.examBanned
                                    const finalScore = examBanned
                                        ? 0
                                        : calcFinalScore(
                                              record?.student?.fixedClass?.trainingCourse,
                                              {
                                                  attendanceScore:
                                                      score === 'CC/TX'
                                                          ? recordForm?.attendanceScore
                                                          : record?.attendanceScore,
                                                  midtermScore:
                                                      score === 'CC/TX'
                                                          ? recordForm?.midtermScore
                                                          : record?.midtermScore,
                                                  examScore:
                                                      score === 'THI'
                                                          ? recordForm?.examScore
                                                          : record?.examScore,
                                                  awards: [],
                                                  certificates: [],
                                              },
                                              record.subjectClass?.type || 'NORMAL'
                                          )?.toNumber()
                                    return <div className="text-red-500">{finalScore}</div>
                                },
                            },
                            {
                                title: 'Điểm hệ 4',
                                align: 'center',
                                width: 90,
                                render: (_, record) => {
                                    const recordForm = listForm?.[record.id]
                                    const examBanned = recordForm?.examBanned ?? record?.examBanned
                                    const finalScore = examBanned
                                        ? 0
                                        : calcFinalScore(
                                              record?.student?.fixedClass?.trainingCourse,
                                              {
                                                  attendanceScore:
                                                      score === 'CC/TX'
                                                          ? recordForm?.attendanceScore
                                                          : record?.attendanceScore,
                                                  midtermScore:
                                                      score === 'CC/TX'
                                                          ? recordForm?.midtermScore
                                                          : record?.midtermScore,
                                                  examScore:
                                                      score === 'THI'
                                                          ? recordForm?.examScore
                                                          : record?.examScore,
                                                  awards: [],
                                                  certificates: [],
                                              },
                                              record.subjectClass?.type || 'NORMAL'
                                          )?.toNumber()
                                    if (finalScore === undefined || finalScore === null) return null
                                    return finalScore !== undefined ? (
                                        <div className="text-blue-500">
                                            {
                                                scoreConvert(
                                                    finalScore,
                                                    record?.student?.fixedClass?.trainingCourse
                                                        ?.scoreConverts || []
                                                ).base4
                                            }
                                        </div>
                                    ) : (
                                        ''
                                    )
                                },
                            },
                            {
                                title: 'Điểm chữ',
                                align: 'center',
                                width: 80,
                                render: (_, record) => {
                                    const recordForm = listForm?.[record.id]
                                    const examBanned = recordForm?.examBanned ?? record?.examBanned
                                    const finalScore = examBanned
                                        ? 0
                                        : calcFinalScore(
                                              record?.student?.fixedClass?.trainingCourse,
                                              {
                                                  attendanceScore:
                                                      score === 'CC/TX'
                                                          ? recordForm?.attendanceScore
                                                          : record?.attendanceScore,
                                                  midtermScore:
                                                      score === 'CC/TX'
                                                          ? recordForm?.midtermScore
                                                          : record?.midtermScore,
                                                  examScore:
                                                      score === 'THI'
                                                          ? recordForm?.examScore
                                                          : record?.examScore,
                                                  awards: [],
                                                  certificates: [],
                                              },
                                              record.subjectClass?.type || 'NORMAL'
                                          )?.toNumber()
                                    if (finalScore === undefined || finalScore === null) return null
                                    return finalScore !== undefined ? (
                                        <div className="text-yellow-600">
                                            {
                                                scoreConvert(
                                                    finalScore,
                                                    record?.student?.fixedClass?.trainingCourse
                                                        ?.scoreConverts || []
                                                ).letter
                                            }
                                        </div>
                                    ) : (
                                        ''
                                    )
                                },
                            },
                            {
                                title: 'Cấm thi',
                                dataIndex: 'examBanned',
                                width: 80,
                                align: 'center',
                                render: (_, record) => {
                                    return (
                                        <Form.Item
                                            className="w-full mb-0"
                                            name={['list', record.id, 'examBanned']}
                                            label=""
                                            valuePropName="checked"
                                        >
                                            <Checkbox disabled={score === 'THI' || disabledForm} />
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
                                            required={!!examBanned}
                                        >
                                            {disabledForm ? (
                                                <Input readOnly variant="underlined" />
                                            ) : (
                                                <AutoComplete
                                                    placeholder="Nhập lý do cấm thi"
                                                    options={examBanReason.map((s) => ({
                                                        label: s,
                                                        value: s,
                                                    }))}
                                                    styles={{ popup: { root: { width: 'fit' } } }}
                                                    disabled={!examBanned}
                                                />
                                            )}
                                        </Form.Item>
                                    )
                                },
                            },
                            {
                                title: 'Hoãn thi',
                                dataIndex: 'examPostponed',
                                width: 80,
                                align: 'center',
                                render: (_, record) => {
                                    return (
                                        <Form.Item
                                            className="w-full mb-0"
                                            name={['list', record.id, 'examPostponed']}
                                            label=""
                                            valuePropName="checked"
                                        >
                                            <Checkbox disabled={score === 'THI' || disabledForm} />
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
                                            required={!!examPostponed}
                                        >
                                            {disabledForm ? (
                                                <Input readOnly variant="underlined" />
                                            ) : (
                                                <AutoComplete
                                                    placeholder="Nhập lý do hoãn thi"
                                                    options={examPostponeReason.map((s) => ({
                                                        label: s,
                                                        value: s,
                                                    }))}
                                                    styles={{ popup: { root: { width: 'fit' } } }}
                                                    disabled={!examPostponed}
                                                />
                                            )}
                                        </Form.Item>
                                    )
                                },
                            },
                            {
                                title: 'Đình chỉ',
                                dataIndex: 'suspended',
                                width: 80,
                                align: 'center',
                                render: (_, record) => {
                                    return (
                                        <Form.Item
                                            className="w-full mb-0"
                                            name={['list', record.id, 'suspended']}
                                            label=""
                                            valuePropName="checked"
                                        >
                                            <Checkbox
                                                disabled={
                                                    (dataDetailSubjectClass?.examType ===
                                                        'OfflineWritten' &&
                                                        role !== 'P13') ||
                                                    score === 'CC/TX' ||
                                                    disabledForm
                                                }
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
                                            required={!!suspended}
                                        >
                                            {disabledForm ? (
                                                <Input readOnly variant="underlined" />
                                            ) : (
                                                <AutoComplete
                                                    placeholder="Nhập lý do hoãn thi"
                                                    options={examSuspendedReason.map((s) => ({
                                                        label: s,
                                                        value: s,
                                                    }))}
                                                    styles={{
                                                        popup: { root: { width: 'fit' } },
                                                    }}
                                                    disabled={!suspended}
                                                />
                                            )}
                                        </Form.Item>
                                    )
                                },
                            },
                            {
                                title: 'Ghi chú',
                                dataIndex: 'description',
                                width: 150,
                                align: 'center',
                                render: (_, record) => {
                                    return (
                                        <Form.Item
                                            className="w-full mb-0"
                                            name={[record.id, 'description']}
                                            label=""
                                        >
                                            <Input
                                                readOnly={disabledForm}
                                                variant={disabledForm ? 'underlined' : 'outlined'}
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
            <div className="fixed p-3 z-[10] bottom-[30px] left-0 right-0 w-[100vw] bg-white ">
                <div>
                    Bấm Tab: Chuyển ô theo hàng ngang, Mũi tên xuống: Chuyển ô theo hàng dọc, và
                    hàng ngang
                </div>
                <div className="text-red-500 font-bold uppercase text-lg">
                    Giảng viên nhập Lý do "Cấm thi", "Ghi chú" với trường hợp điểm 0 hoặc không cho
                    điểm
                </div>
            </div>
        </Row>
    )
}
