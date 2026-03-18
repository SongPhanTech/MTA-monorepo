import { queryClient } from '@api/index'
import ImportScoreModal, { type ImportScoreData } from '@components/commons/print/nhap-diem-tu-file'
import ExportScoreTemplate from '@components/commons/print/xuat-mau-nhap-diem'
import Table from '@components/commons/table'
import type { DataTable } from '@components/modal/modal-in-phieu-diem'
import { examBanReason, examPostponeReason, examSuspendedReason } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import { scoreConvert } from '@hooks/scoreConverter'
import useSpinner from '@hooks/spinner'
import { validateExamScore, validateScore } from '@lib/utils'
import {
    type DiemLopMonHocProps,
    diemLopMonHocStore,
} from '@pages/quan-ly-diem/ql-diem-lop-mon-hoc'
import { useStore } from '@tanstack/react-store'
import { useSession } from '@workspace/auth/react'
import { $Enums, type StudentSubjectScore } from '@workspace/db/client'
import {
    useFindManyStudentSubjectScore,
    useFindUniqueSubjectClass,
    useUpdateSubjectClass,
} from '@workspace/db/hooks'
import { getUrl } from '@workspace/libs/api/custom-instance'
import { sqlTransaction } from '@workspace/libs/api/model'
import type { SqlTransactionBodyItem } from '@workspace/libs/api/schemas/sqlTransactionBodyItem'
import { getExportSubjectClassScoreUrl } from '@workspace/libs/api/training'
import { calcFinalScore, fastIsEqual, getRuntimeEnv, isNullish } from '@workspace/libs/utils'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION } from '@workspace/router'
import { cn } from '@workspace/ui/lib/utils'
import {
    AutoComplete,
    Button,
    Checkbox,
    Col,
    Empty,
    Flex,
    Form,
    Input,
    InputNumber,
    Modal,
    message,
    Row,
    Tag,
    Tooltip,
} from 'antd'
import dayjs from 'dayjs'
import type Decimal from 'decimal.js'
import _ from 'lodash'
import { FileUp, Printer, Save } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

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
            finalScoreBase4?: number | string | null
            letter?: string | null
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
                    where: {
                        status: $Enums.ArchivedCertificateStatus.APPROVED,
                    },
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
        if (!dataDetailSubjectClass?.subject) {
            message.error('Không tìm thấy thông tin môn học')
            return
        }
        for (const [_, value] of Object.entries(listForm)) {
            try {
                await validateScore(value.attendanceScore, dataDetailSubjectClass?.subject.onePoint)
                await validateScore(value.midtermScore, dataDetailSubjectClass?.subject.onePoint)
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
                        finalScore: isNullish(item.finalScore) ? null : item.finalScore,
                        description: item?.description,
                        examPostponed: isNullish(item.examPostponed) ? null : item.examPostponed,
                        examPostponedReason: isNullish(item.examPostponedReason)
                            ? null
                            : item.examPostponedReason,
                        examBanned: isNullish(item.examBanned) ? null : item.examBanned,
                        examBannedReason: isNullish(item.examBannedReason)
                            ? null
                            : item.examBannedReason,
                        suspended: isNullish(item.suspended) ? null : item.suspended,
                        suspendedReason: isNullish(item.suspendedReason)
                            ? null
                            : item.suspendedReason,
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
                    message.success('Đã cập nhật điểm quá trình thành công!')
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

                if (dataDetailSubjectClass?.subject.onePoint) {
                    item.attendanceScore = item.examScore
                    item.midtermScore = item.examScore
                }

                const dataForCalc = dataTable.find((i) => i.id === item.id)

                const defaultCoef = {
                    coef_1: 0.1,
                    coef_2: 0.3,
                    coef_3: 0.6,
                    scoreToTakeExam: 1,
                    scoreToPass: 4,
                    maxReExamScore: 10,
                    reduceReExamScore: 0,
                    examScoreToPass: 5,
                }
                const finalScore = calcFinalScore(
                    dataForCalc?.student?.fixedClass?.trainingCourse || defaultCoef,
                    {
                        attendanceScore: item.attendanceScore,
                        midtermScore: item.midtermScore,
                        examScore: item.examScore,
                        awards:
                            dataForCalc?.awards?.map?.((a) => ({
                                status: a.status,
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
                    dataForCalc?.subjectClass?.type || 'NORMAL'
                )?.toNumber()

                const scoreConvertResult =
                    finalScore !== null && finalScore !== undefined
                        ? scoreConvert(
                              finalScore,
                              dataForCalc?.student?.fixedClass?.trainingCourse?.scoreConverts || []
                          )
                        : null

                const finalScoreBase4 = scoreConvertResult?.base4
                const letter = scoreConvertResult?.letter

                const scoreInfo = !score
                    ? {
                          attendanceScore: item.attendanceScore,
                          midtermScore: item.midtermScore,
                          examScore: item.examScore,
                      }
                    : score === 'TX/ĐK'
                      ? {
                            attendanceScore: item.attendanceScore,
                            midtermScore: item.midtermScore,
                        }
                      : { examScore: item.examScore }

                return [
                    item.id,
                    {
                        isChanged:
                            listForm[item.id].attendanceScore !== item.attendanceScore ||
                            listForm[item.id].midtermScore !== item.midtermScore ||
                            listForm[item.id].examScore !== item.examScore,
                        finalScore: isExamBanned ? 0 : finalScore,
                        finalScoreBase4,
                        letter,
                        ...scoreInfo,
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
                scoreSubmitted: true,
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
                exam: {
                    select: {
                        lockExamSessions: true,
                    }
                }
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
        if (score === 'TX/ĐK') {
            return !(
                can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_CC_TX, 'NHAP_DIEM') &&
                dataDetailSubjectClass?.scoreDeadLineStart &&
                dayjs().isAfter(dataDetailSubjectClass?.scoreDeadLineStart) &&
                dataDetailSubjectClass?.scoreDeadline &&
                dayjs().isBefore(dataDetailSubjectClass?.scoreDeadline) &&
                !dataDetailSubjectClass?.isLockScore &&
                !dataDetailSubjectClass?.isLockExamScore &&
                !dataDetailSubjectClass?.scoreSubmitted &&
                !dataDetailSubjectClass?.subject.onePoint &&
                dataDetailSubjectClass?.type !== $Enums.SubjectClassType.REEXAM
            )
        }
        return !(
            can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_THI, 'NHAP_DIEM') &&
            dataDetailSubjectClass?.examScoreDeadline &&
            dayjs().isBefore(dataDetailSubjectClass?.examScoreDeadline) &&
            !dataDetailSubjectClass?.isLockExamScore &&
            !dataDetailSubjectClass?.scoreSubmitted && 
            dataDetailSubjectClass?.exam?.lockExamSessions
        )
    }, [dataDetailSubjectClass, can, score])

    const { onOpen: openXemTaiLieu } = useDisclosure<{
        uri: string
        name?: string
        mimeType?: string
        mode?: 'view' | 'edit'
        convertTo?: string
    }>({
        tag: 'XemTaiLieu',
    })

    const { onOpen: openStudentSubjectScore } = useDisclosure<{
        dataTable: DataTable[]
        type: number // 1: Khoá và in phiếu điểm, 0: In phiếu điểm nháp
    }>({
        tag: 'ModalPrintStudentSubjectScore',
    })
    const { mutateAsync: updateSubjectClass } = useUpdateSubjectClass()

    const lockExam = async (subjectClassId?: string) => {
        if (!subjectClassId) {
            message.warning('Không tìm thấy ID lớp học')
            return false
        }

        try {
            await updateSubjectClass({
                where: { id: subjectClassId },
                data: {
                    isLockScore: true,
                    isLockExamScore: true,
                    subjectClassHistory: {
                        create: {
                            isLockExamScore: true,
                            isLockScore: true,
                            updatedById: profileId,
                        },
                    },
                },
            })
            message.success('Khóa điểm thành công')
            return true
        } catch (error) {
            message.error('Có lỗi xảy ra khi khóa điểm')
            console.error(error)
            return false
        }
    }
    const handlePrint = () => {
        if (!selectedSubjectClassId) {
            return message.warning('Vui lòng chọn lớp học trước khi in')
        }

        Modal.confirm({
            title: 'Xác nhận',
            content: 'Bạn có chắc chắn muốn in phiếu điểm và khóa nhập điểm lại không?',
            okText: 'Xác nhận',
            cancelText: 'Hủy',
            onOk: async () => {
                const isSuccess = await lockExam(selectedSubjectClassId)
                if (isSuccess) {
                    const baseUrl =
                        getRuntimeEnv('NEXT_PUBLIC_API_LMS_BASE_URL') ||
                        'https://api.daotao.mta.swantech.vn'
                    const exportUrl = getExportSubjectClassScoreUrl({ id: selectedSubjectClassId })

                    openXemTaiLieu({
                        uri: getUrl(baseUrl, exportUrl),
                        name: 'Phiếu điểm',
                        mimeType: 'xlsx',
                        convertTo: 'pdf',
                    })
                }
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
                        const scoreConvertResult =
                            cur.finalScore !== null && cur.finalScore !== undefined
                                ? scoreConvert(
                                      Number(cur.finalScore),
                                      cur.student?.fixedClass?.trainingCourse?.scoreConverts || []
                                  )
                                : null
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
                            finalScoreBase4: scoreConvertResult?.base4,
                            letter: scoreConvertResult?.letter,
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

    if (!selectedSubjectClassId) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-300px)]">
                <Empty description="Vui lòng chọn lớp học phần để nhập điểm" />
            </div>
        )
    }

    return (
        <Row gutter={[8, 8]}>
            <Col span={8} className="flex items-center gap-1">
                {score === 'TX/ĐK' && (
                    <Tag color={enteredScore ? 'green' : 'yellow'} className="w-fit border-none px-2 py-1 text-[12px]">
                        {enteredScore ? 'Đã hoàn thiện' : 'Chưa hoàn thiện'}
                    </Tag>
                )}
                {score === 'THI' && (
                    <Tag color={enteredExamScore ? 'green' : 'yellow'} className="w-fit border-none px-2 py-1 text-[12px]">
                        {enteredExamScore ? 'Đã hoàn thiện' : 'Chưa hoàn thiện'}
                    </Tag>
                )}
                {!!dataDetailSubjectClass?.subject?.onePoint && (
                    <Tag color={'green'} className="w-fit border-none px-2 py-1 text-[12px]">
                        Ba đầu điểm bằng nhau. Chỉ nhập điểm thi.
                    </Tag>
                )}
                {dataDetailSubjectClass?.type === $Enums.SubjectClassType.REEXAM && (
                    <Tag color={'red'} className="w-fit border-none px-2 py-1 text-[12px]">
                        Lớp học phần thi lại
                    </Tag>
                )}
                <Tag className=" w-fit border-none px-2 py-1 text-[12px] bg-red-100">
                        Cấm thi
                </Tag>
                <Tag className=" w-fit border-none px-2 py-1 text-[12px] bg-yellow-100">
                        Hoãn thi
                </Tag>

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
                    {score !== 'THI' &&
                        (can(
                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC_P13,
                            'IN_DS_THI'
                        ) ||
                            can(
                                QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC,
                                'IN_DS_THI'
                            ) ||
                            can(
                                QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_CC_TX,
                                'IN_DS_THI'
                            )) && (
                            // <ExportTemplateExam
                            //     dataClass={dataDetailSubjectClass}
                            //     dataTable={dataTable}
                            //     disabled={
                            //         !dataDetailSubjectClass?.enteredScore || !selectedSubjectClassId
                            //     }
                            // />
                            <Button
                                // onClick={exportTemplate}
                                onClick={() => {
                                    openXemTaiLieu({
                                        uri: getUrl(
                                            getRuntimeEnv('NEXT_PUBLIC_API_LMS_BASE_URL') ||
                                                'https://api.daotao.mta.swantech.vn',
                                            `${getExportSubjectClassScoreUrl({
                                                id: selectedSubjectClassId ?? '',
                                                type: 'DANH-SACH-THI',
                                            })}`
                                        ),
                                        name: 'Danh sách thi',
                                        mimeType: 'xlsx',
                                        convertTo: 'pdf',
                                    })
                                }}
                                disabled={
                                    !dataDetailSubjectClass?.enteredScore || !selectedSubjectClassId
                                }
                            >
                                <Printer />
                                Danh sách thi
                            </Button>
                        )}
                    {score !== 'TX/ĐK' &&
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
                                        !dataDetailSubjectClass?.enteredExamScore ||
                                        dataDetailSubjectClass?.isLockExamScore ||
                                        dataDetailSubjectClass?.scoreSubmitted
                                    }
                                    onClick={() => handlePrint()}
                                >
                                    <Printer />
                                    Khoá và in phiếu điểm
                                </Button>
                                <Button
                                    disabled={!selectedSubjectClassId}
                                    onClick={() =>
                                        // openStudentSubjectScore({
                                        //     dataTable,
                                        //     type: EnumInPhieuDiem.PHIEU_DIEM_NHAP,
                                        // })
                                        openXemTaiLieu({
                                            uri: getUrl(
                                                getRuntimeEnv('NEXT_PUBLIC_API_LMS_BASE_URL') ||
                                                    'https://api.daotao.mta.swantech.vn',
                                                `${getExportSubjectClassScoreUrl({
                                                    id: selectedSubjectClassId ?? '',
                                                    type: 'NHAP',
                                                })}`
                                            ),
                                            name: 'Phiếu điểm nháp',
                                            mimeType: 'xlsx',
                                            convertTo: 'pdf',
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
                            const examScore: number | null =
                                changedValues.list[changedId]?.examScore !== undefined
                                    ? changedValues.list[changedId]?.examScore
                                    : (listForm[changedId].examScore ?? null)
                            const attendanceScore: number | null = dataDetailSubjectClass?.subject
                                .onePoint
                                ? examScore
                                : changedValues.list[changedId]?.attendanceScore !== undefined
                                  ? changedValues.list[changedId]?.attendanceScore
                                  : (listForm[changedId].attendanceScore ?? null)
                            const midtermScore: number | null = dataDetailSubjectClass?.subject
                                .onePoint
                                ? examScore
                                : changedValues.list[changedId]?.midtermScore !== undefined
                                  ? changedValues.list[changedId]?.midtermScore
                                  : (listForm[changedId].midtermScore ?? null)

                            const scoreToTakeExam = listForm[changedId]?.scoreToTakeExam ?? null
                            // TODO: fix not work if directly uncheck exam banned
                            const isExamBanned =
                                !!changedValues.list[changedId]?.examBannedReason ||
                                !!listForm[changedId]?.examBannedReason ||
                                (attendanceScore !== null &&
                                    scoreToTakeExam !== null &&
                                    attendanceScore < scoreToTakeExam) ||
                                (midtermScore !== null &&
                                    scoreToTakeExam !== null &&
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
                                examScoreToPass: 5,
                            }
                            const finalScore = calcFinalScore(
                                dataForCalc?.student?.fixedClass?.trainingCourse || defaultCoef,
                                {
                                    attendanceScore,
                                    midtermScore,
                                    examScore,
                                    awards:
                                        dataForCalc?.awards?.map?.((a) => ({
                                            status: a.status,
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

                            const scoreConvertResult =
                                finalScore !== null && finalScore !== undefined
                                    ? scoreConvert(
                                          finalScore,
                                          dataForCalc?.student?.fixedClass?.trainingCourse
                                              ?.scoreConverts || []
                                      )
                                    : null

                            const finalScoreBase4 = scoreConvertResult?.base4
                            const letter = scoreConvertResult?.letter

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
                                        attendanceScore,
                                        midtermScore,
                                        finalScore: changedValues.list[changedId]?.examBanned
                                            ? 0
                                            : finalScore,
                                        finalScoreBase4,
                                        letter,
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
                            className: cn(
                                (!!listForm?.[record.id]?.isChanged && 
                                !listForm?.[record.id]?.examBanned && 
                                !listForm?.[record.id]?.examPostponed) && 'bg-yellow-50',

                                !!listForm?.[record.id]?.examPostponed && '!bg-yellow-100',
                                !!listForm?.[record.id]?.examBanned && '!bg-red-100',
                            )
                        })}
                        scrollable
                        maxHeight={'calc(100vh - 460px)'}
                        columns={[
                            {
                                title: 'TT',
                                width: 35,
                                align: 'center',
                                render: (_, __, index) => index + 1,
                            },
                            {
                                title: <Tooltip title="Mã sinh viên">MSV</Tooltip>,
                                dataIndex: 'code',
                                align: 'center',
                                width: 80,
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
                                width: 90,
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
                                width: 100,
                                align: 'center',
                                type: 'input',
                                render: (_, record) => record.student?.fixedClass?.code || '',
                            },
                            // #region Điểm TX
                            {
                                title: 'Điểm TX',
                                dataIndex: 'attendanceScore',
                                width: 65,
                                align: 'center',
                                // type: 'order',
                                render: (_, record) => {
                                    // if (role !== 'GV' || score === 'THI') {
                                    //     return record.attendanceScore ?? ''
                                    // }
                                    const readOnly =
                                        role !== 'GV' || score === 'THI' || disabledForm
                                    return (
                                        <Form.Item
                                            className="w-full m-0"
                                            name={['list', record.id, 'attendanceScore']}
                                            label=""
                                            rules={[
                                                {
                                                    validator: (_, value) =>
                                                        validateScore(
                                                            value,
                                                            dataDetailSubjectClass?.subject
                                                                .onePoint || false
                                                        ),
                                                },
                                            ]}
                                        >
                                            <InputNumber
                                                readOnly={readOnly}
                                                variant={readOnly ? 'underlined' : 'outlined'}
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
                                                className='bg-transparent'
                                            />
                                        </Form.Item>
                                    )
                                },
                            },
                            // #region Điểm ĐK
                            {
                                title: 'Điểm ĐK',
                                dataIndex: 'midtermScore',
                                width: 65,
                                align: 'center',
                                // type: 'order',
                                render: (_, record) => {
                                    // if (role !== 'GV' || score === 'THI') {
                                    //     return record.midtermScore ?? ''
                                    // }
                                    const readOnly =
                                        role !== 'GV' || score === 'THI' || disabledForm
                                    return (
                                        <Form.Item
                                            className="w-full mb-0"
                                            name={['list', record.id, 'midtermScore']}
                                            label=""
                                            rules={[
                                                {
                                                    validator: (_, value) =>
                                                        validateScore(
                                                            value,
                                                            dataDetailSubjectClass?.subject
                                                                .onePoint || false
                                                        ),
                                                },
                                            ]}
                                        >
                                            <InputNumber
                                                readOnly={readOnly}
                                                variant={readOnly ? 'underlined' : 'outlined'}
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
                                                className='bg-transparent'
                                            />
                                        </Form.Item>
                                    )
                                },
                            },
                            // #region Điểm Thi
                            {
                                title: 'Điểm thi',
                                dataIndex: 'examScore',
                                width: 65,
                                align: 'center',
                                render: (
                                    _,
                                    {
                                        id,
                                        attendanceScore,
                                        midtermScore,
                                        examBanned,
                                        subjectClass,
                                        examScore,
                                    }
                                ) => {
                                    const isMissingScore =
                                        (attendanceScore == null || midtermScore == null) &&
                                        !subjectClass?.subject?.onePoint
                                    if (
                                        role !== 'GV' ||
                                        score === 'TX/ĐK' ||
                                        !!examBanned ||
                                        isMissingScore
                                    ) {
                                        return examScore ?? ''
                                    }

                                    return (
                                        <Form.Item
                                            className="w-full m-0"
                                            name={['list', id, 'examScore']}
                                            rules={[
                                                {
                                                    validator: (_, value) =>
                                                        validateExamScore(value),
                                                },
                                            ]}
                                        >
                                            <InputNumber
                                                disabled={disabledForm}
                                                readOnly={disabledForm}
                                                variant={disabledForm ? 'underlined' : 'outlined'}
                                                id={`score-thi-${id}`}
                                                style={{ width: '100%' }}
                                                controls={false}
                                                onKeyDown={(e) =>
                                                    handleScoreInputKeyDown(e, id, 'thi', dataTable)
                                                }
                                            />
                                        </Form.Item>
                                    )
                                },
                            },
                            {
                                title: 'Điểm HP',
                                width: 65,
                                align: 'center',
                                render: (_, { id }) => {
                                    return (
                                        <Form.Item
                                            className="w-full m-0"
                                            name={['list', id, 'finalScore']}
                                        >
                                            <Input
                                                className="text-center"
                                                readOnly
                                                variant="borderless"
                                                id={`score-hp-${id}`}
                                                style={{ width: '100%' }}
                                            />
                                        </Form.Item>
                                    )
                                },
                            },
                            {
                                title: 'Điểm hệ 4',
                                align: 'center',
                                width: 70,
                                render: (_, { id }) => {
                                    return (
                                        <Form.Item
                                            className="w-full m-0"
                                            name={['list', id, 'finalScoreBase4']}
                                        >
                                            <Input
                                                className="text-center text-blue-500"
                                                readOnly
                                                variant="borderless"
                                                id={`score-hp4-${id}`}
                                                style={{ width: '100%' }}
                                            />
                                        </Form.Item>
                                    )
                                },
                            },
                            {
                                title: 'Điểm chữ',
                                align: 'center',
                                width: 70,
                                render: (_, { id }) => {
                                    return (
                                        <Form.Item
                                            className="w-full m-0"
                                            name={['list', id, 'letter']}
                                        >
                                            <Input
                                                className="text-center text-yellow-600"
                                                readOnly
                                                variant="borderless"
                                                id={`letter-${id}`}
                                                style={{ width: '100%' }}
                                            />
                                        </Form.Item>
                                    )
                                },
                            },
                            {
                                title: 'Cấm thi',
                                dataIndex: 'examBanned',
                                width: 65,
                                align: 'center',
                                render: (_, record) => {
                                    return (
                                        <Form.Item
                                            className="w-full mb-0"
                                            name={['list', record.id, 'examBanned']}
                                            label=""
                                            valuePropName="checked"
                                        >
                                            <Checkbox
                                                disabled={score === 'THI' || disabledForm}
                                                onChange={(e) => {
                                                    if (!e.target.checked) {
                                                        form.setFieldValue(
                                                            ['list', record.id, 'examBannedReason'],
                                                            undefined
                                                        )
                                                    }
                                                }}
                                            />
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
                                                <Input.TextArea
                                                    readOnly
                                                    autoSize
                                                    variant="underlined"
                                                    className='bg-transparent'
                                                />
                                            ) : (
                                                <AutoComplete
                                                    placeholder="Nhập lý do cấm thi"
                                                    options={examBanReason.map((s) => ({
                                                        label: s,
                                                        value: s,
                                                    }))}
                                                    styles={{ popup: { root: { width: 'fit' } } }}
                                                    disabled={!examBanned}
                                                >
                                                    <Input.TextArea
                                                        readOnly
                                                        autoSize
                                                        variant="underlined"
                                                        className='bg-transparent'
                                                    />
                                                </AutoComplete>
                                            )}
                                        </Form.Item>
                                    )
                                },
                            },
                            {
                                title: 'Hoãn thi',
                                dataIndex: 'examPostponed',
                                width: 65,
                                align: 'center',
                                render: (_, record) => {
                                    return (
                                        <Form.Item
                                            className="w-full mb-0"
                                            name={['list', record.id, 'examPostponed']}
                                            label=""
                                            valuePropName="checked"
                                        >
                                            <Checkbox
                                                disabled={score === 'THI' || disabledForm}
                                                onChange={(e) => {
                                                    if (!e.target.checked) {
                                                        form.setFieldValue(
                                                            ['list', record.id, 'examPostponed'],
                                                            undefined
                                                        )
                                                    }
                                                }}
                                            />
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
                                                <Input.TextArea
                                                    readOnly
                                                    autoSize
                                                    variant="underlined"
                                                    className='bg-transparent'
                                                />
                                            ) : (
                                                <AutoComplete
                                                    placeholder="Nhập lý do hoãn thi"
                                                    options={examPostponeReason.map((s) => ({
                                                        label: s,
                                                        value: s,
                                                    }))}
                                                    styles={{ popup: { root: { width: 'fit' } } }}
                                                    disabled={!examPostponed}
                                                >
                                                    <Input.TextArea
                                                        readOnly
                                                        autoSize
                                                        variant="underlined"
                                                        className='bg-transparent'
                                                    />
                                                </AutoComplete>
                                            )}
                                        </Form.Item>
                                    )
                                },
                            },
                            {
                                title: 'Đình chỉ',
                                dataIndex: 'suspended',
                                width: 65,
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
                                                    score === 'TX/ĐK' ||
                                                    disabledForm
                                                }
                                                onChange={(e) => {
                                                    if (!e.target.checked) {
                                                        form.setFieldValue(
                                                            ['list', record.id, 'suspendedReason'],
                                                            undefined
                                                        )
                                                    }
                                                }}
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
                                                <Input.TextArea
                                                    readOnly
                                                    autoSize
                                                    variant="underlined"
                                                    className='bg-transparent'
                                                />
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
                                                >
                                                    <Input.TextArea
                                                        readOnly
                                                        autoSize
                                                        variant="underlined"
                                                        className='bg-transparent'
                                                    />
                                                </AutoComplete>
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
                                                variant={disabledForm ? 'borderless' : 'underlined'}
                                                placeholder="Nhập ghi chú"
                                                style={{
                                                    width: '100%',
                                                }}
                                                className='bg-transparent'
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
