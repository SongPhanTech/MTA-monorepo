import ImportScoreModal from '@components/commons/print/nhap-diem-tu-file'
import ExportScoreTemplate from '@components/commons/print/xuat-mau-nhap-diem'
import Table from '@components/commons/table'
import { type DataTable, EnumInPhieuDiem } from '@components/modal/modal-in-phieu-diem'
import ExportTemplateExam from '@components/ui/in-phieu-danh-sach-thi'
import type { FilterProps } from '@constants/type'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { formatDate } from '@lib/utils'
import { useSession } from '@workspace/auth/react'
import type { ArchivedAward, StudentSubjectScore } from '@workspace/db'
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
import { Ellipsis, FileUp, Printer, Save, Search } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

interface Item {
    code?: string
    name: string
    id: string
    lecture?: string
    count?: number
}

interface FlatListProps {
    data: Item[]
    renderItem: (item: Item) => JSX.Element
}

const FlatList: React.FC<FlatListProps> = ({ data, renderItem }) => {
    return (
        <div>
            {data.map((item) => (
                <div key={item.code}>{renderItem(item)}</div>
            ))}
        </div>
    )
}

interface LopMonHocItemProps {
    dataTable: Array<{
        code?: string
        id: string
        name: string
        mainLecturer: { userProfile: { firstName: string; lastName: string } }
        lecture?: string
        count?: number
    }>
    onChangeSelected?: (selected: string) => void
    selectedItem?: string
    isFetching: boolean
}

const LopMonHocItem: React.FC<LopMonHocItemProps> = ({
    dataTable,
    onChangeSelected,
    selectedItem,
    isFetching,
}) => {
    const data: Item[] = dataTable.map((item) => ({
        code: item.code === null ? undefined : item.code,
        name: item.name,
        lecture: item.mainLecturer?.userProfile
            ? `${item.mainLecturer.userProfile.lastName} ${item.mainLecturer.userProfile.firstName}`
            : 'Chưa có giảng viên',
        id: item.id,
        count: item.count,
    }))

    const renderItem = (item: Item) => (
        <div
            onClick={() => {
                onChangeSelected?.(item.id)
            }}
            style={{
                padding: '8px',
                borderRadius: '8px',
                marginBottom: '2px',
                width: '100%',
                cursor: 'pointer',
                backgroundColor: selectedItem === item.id ? '#daf2ed' : 'transparent',
            }}
        >
            <h3>
                <strong>{item.name}</strong>
            </h3>
            <p>{item.code}</p>
            <p>{item.lecture}</p>
            {item.count ? (
                <p>Số SV/HV: {item.count}</p>
            ) : (
                <p className="text-red-500">Không có SV/HV</p>
            )}
        </div>
    )

    return (
        <div
            style={{
                width: '100%',
                padding: '16px',
                borderRadius: '8px',
            }}
        >
            <h2 className="text-lg font-semibold px-[6]" style={{ marginBottom: '12px' }}>
                Danh sách lớp
            </h2>
            {isFetching ? <Skeleton /> : <FlatList data={data} renderItem={renderItem} />}
        </div>
    )
}
interface FilterPropsClassClass {
    KhoaId: string | null //Khoa
    BoMonId: string | null //Bộ môn
    examTypeId: string | null //Hình thức thi
    LectureIds: string[] //Giảng viên
    searchText: string | null
    subjectClassId: string | null
    fixedClassIds: string[]
    examDateRange?: [string, string] | null // Khoảng thời gian thi
}

type FilterTable = FilterProps & {
    fullname?: string
    fixedClassName?: string
    attendanceScore?: 'asc' | 'desc'
    midtermScore?: 'asc' | 'desc'
    examScore?: 'asc' | 'desc'
}

type FormType = {
    isLockScore?: boolean
    isLockExamScore?: boolean
    scoreSubmitted?: boolean
    scoreChecked?: boolean
    enteredScore?: boolean
    enteredExamScore?: boolean
}

type PutStudentSubjectScore = StudentSubjectScore

export default function SubjectClassScore() {
    const { can } = useAbility()
    const canReadAll = can(
        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DS_LOP_MON_HOC,
        'XEM_TAT_CA'
    )
    const [form] = Form.useForm<FormType>()
    const [formTable] = Form.useForm<PutStudentSubjectScore>()
    const { data: session } = useSession()
    const profileId = session?.sDM_NhanVienId || ''
    const router = useRouter()
    const [selectedFixedClass, setSelectedFixedClass] = useState<string | undefined>(undefined)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

    const { subjectId } = router.query

    const [open, setOpen] = useState(false)
    const [importModalVisible, setImportModalVisible] = useState(false)
    const { id: semesterId } = useSemesterStore()
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
    }

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

    useEffect(() => {
        if (subjectId) {
            setSelectedFixedClass(subjectId as string)
        }
    }, [subjectId])

    const [filters, setFilters] = useState<FilterPropsClassClass>({
        searchText: '',
        subjectClassId: null,
        KhoaId: null,
        BoMonId: null,
        examTypeId: null,
        LectureIds: [],
        fixedClassIds: [],
        examDateRange: undefined,
    })

    const [filterTable, setFilterTable] = useState<FilterTable>({
        fullname: '',
        fixedClassName: '',
        dateOfBirth: undefined,
        attendanceScore: undefined,
        midtermScore: undefined,
        examScore: undefined,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    //#region Mới
    /* Mới */
    const { data: subjectClassData = [], isFetching } = useFindManySubjectClass(
        {
            where: {
                ...(filters.searchText && filters.searchText !== ''
                    ? {
                          OR: [
                              {
                                  name: {
                                      contains: filters.searchText,
                                      mode: 'insensitive',
                                  },
                              },
                              {
                                  code: {
                                      contains: filters.searchText,
                                      mode: 'insensitive',
                                  },
                              },
                          ],
                      }
                    : {}),
                ...(semesterId ? { semesterId } : {}),
                ...(filters.subjectClassId ? { id: filters.subjectClassId } : {}),
                trainingObjectTypeId,
                ...(filters.LectureIds.length > 0
                    ? {
                          OR: filters.LectureIds.map((id) => ({
                              mainLecturer: { id },
                          })),
                      }
                    : {}),
                ...(filters.BoMonId
                    ? {
                          subject: {
                              managementOrganizationId: filters.BoMonId,
                          },
                      }
                    : {}),
                ...(filters.examDateRange
                    ? {
                          examDate: {
                              gte: filters.examDateRange[0],
                              lte: filters.examDateRange[1],
                          },
                      }
                    : {}),
                // ...(!canReadAll
                //     ? {
                //           mainLecturer: {
                //               userProfileId: profileId,
                //           },
                //       } //Nếu không có quyền xem tất cả thì chỉ được xem lớp do mình giảng dạy
                //     : {}),
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
        data: dataTable = [],
        refetch,
        isFetching: loadingTable,
    } = useFindManyStudentSubjectScore(
        {
            where: {
                subjectClassId: selectedFixedClass || '',
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
    const { data: dataDetailSubjectClass, refetch: refetchSubjectClass } =
        useFindUniqueSubjectClass(
            {
                where: {
                    id: selectedFixedClass,
                },
            },
            { refetchOnWindowFocus: false, enabled: !!selectedFixedClass }
        )

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

    const handleChangeFixedClass = async (id: string) => {
        try {
            if (hasUnsavedChanges) {
                const shouldProceed = confirm(
                    'Bạn có thay đổi chưa được lưu. Bạn có chắc muốn rời đi?'
                )
                if (!shouldProceed) {
                    setHasUnsavedChanges(false)
                    return
                }
            }

            showSpinner()
            setSelectedFixedClass(id)
            await refetch()
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const handleFilterApply = (newFilters: Partial<FilterPropsClassClass>) => {
        setFilters((prev) => {
            const updatedFilters = { ...prev, ...newFilters }
            debouncedRefetch()
            return updatedFilters
        })
    }
    // #region Lưu điểm
    const [scoreCC, setScoreCC] = useState<{ id: string; value: number }[]>([])
    const [scoreTX, setScoreTX] = useState<{ id: string; value: number }[]>([])
    const [scoreThi, setScoreThi] = useState<{ id: string; value: number }[]>([])
    const [scoreCamThi, setScoreCamThi] = useState<{ id: string; value: boolean }[]>([])
    const [scoreHoanThi, setScoreHoanThi] = useState<{ id: string; value: boolean }[]>([])
    const [scoreDinhChi, setscoreDinhChi] = useState<{ id: string; value: boolean }[]>([])
    const [scoreLyDo, setScoreLyDo] = useState<{ id: string; value: string }[]>([])
    const [lyDoDinhChi, setLyDoDinhChi] = useState<{ id: string; value: string }[]>([])
    const [lyDoHoanThi, setLyDoHoanThi] = useState<{ id: string; value: string }[]>([])
    const [lyDoCamThi, setLyDoCamThi] = useState<{ id: string; value: string }[]>([])
    const statistics = getScoreStatistics(dataTable)

    const renderFinalScore = (record: any) => {
        const attendanceScore =
            scoreCC.find((item) => item.id === record.id)?.value ??
            (record.attendanceScore !== undefined ? Number(record?.attendanceScore) : null)

        const midtermScore =
            scoreTX.find((item) => item.id === record.id)?.value ??
            (record.midtermScore !== undefined ? Number(record?.midtermScore) : null)

        const examScore =
            scoreThi.find((item) => item.id === record.id)?.value ??
            (record.examScore !== undefined ? Number(record?.examScore) : null)

        const finalScore = calcFinalScore(record?.student?.fixedClass?.trainingCourse, {
            ...record,
            attendanceScore,
            midtermScore,
            examScore,
        })?.toFixed(1)

        return {
            finalScore,
        }
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

    const handleSaveScores = async () => {
        try {
            showSpinner()
            const dataSubmit = form.getFieldsValue()
            let listSqlTransaction: any = []
            if (selectedFixedClass) {
                listSqlTransaction = [
                    ...listSqlTransaction,
                    {
                        model: 'SubjectClass',
                        operation: 'update',
                        data: {
                            where: {
                                id: selectedFixedClass,
                            },
                            data: { ...dataSubmit },
                        },
                    },
                ]
                if (profileId !== listUser?.lecturer) {
                    await sqlTransaction(listSqlTransaction)
                    message.success('Đã cập nhật trạng thái thành công!')
                    debouncedRefetch()
                    return
                }
            }

            const error = [...scoreCC, ...scoreTX, ...scoreThi].find((i) => i?.value > 10)
            if (error) {
                message.error('Bạn chưa nhập đúng điểm số')
                return
            }
            const parseScoreValue = (value: number | string) => {
                if (value === undefined || value === null || value === '' || Number.isNaN(value)) {
                    return null
                }
                return Number(value)
            }
            const scoresToUpdate = dataTable
                .map((record) => {
                    const ccScore = scoreCC.find((s) => s.id === record.id)
                    const txScore = scoreTX.find((s) => s.id === record.id)
                    const thiScore = scoreThi.find((s) => s.id === record.id)
                    const camThiScore = scoreCamThi.find((s) => s.id === record.id)
                    const hoanThiScore = scoreHoanThi.find((s) => s.id === record.id)
                    const dinhChiScore = scoreDinhChi.find((s) => s.id === record.id)
                    const lyDoScore = scoreLyDo.find((s) => s.id === record.id)
                    const LyDoHoanThi = lyDoHoanThi.find((s) => s.id === record.id)
                    const LyDoCamThi = lyDoCamThi.find((s) => s.id === record.id)
                    const LyDoDinhChi = lyDoDinhChi.find((s) => s.id === record.id)
                    const finalScore = Number(renderFinalScore(record).finalScore)

                    const attendanceScore = ccScore ? parseScoreValue(ccScore.value) : null
                    const midtermScore = txScore ? parseScoreValue(txScore.value) : null

                    const examScore =
                        attendanceScore === null || midtermScore === null
                            ? null
                            : thiScore
                              ? parseScoreValue(thiScore.value)
                              : null

                    const newData = {
                        attendanceScore,
                        midtermScore,
                        examScore,
                        examBanned: camThiScore ? camThiScore.value : false,
                        examPostponed: hoanThiScore ? hoanThiScore.value : false,
                        suspended: dinhChiScore ? dinhChiScore.value : false,
                        description: lyDoScore ? lyDoScore.value : '',
                        finalScore: finalScore ? finalScore : null,
                        examBannedReason: LyDoCamThi ? LyDoCamThi.value : '',
                        suspendedReason: LyDoDinhChi ? LyDoDinhChi.value : '',
                        repeatedReason: LyDoHoanThi ? LyDoHoanThi.value : '',
                    }

                    return {
                        id: record.id,
                        originalData: record,
                        newData: newData,
                    }
                })
                .filter(({ originalData, newData }) => {
                    return (
                        originalData.attendanceScore !== newData.attendanceScore ||
                        originalData.midtermScore !== newData.midtermScore ||
                        originalData.examScore !== newData.examScore ||
                        originalData.examBanned !== newData.examBanned ||
                        originalData.examPostponed !== newData.examPostponed ||
                        originalData.suspended !== newData.suspended ||
                        originalData.description !== newData.description ||
                        originalData.finalScore !== newData.finalScore ||
                        originalData.examBannedReason !== newData.examBannedReason ||
                        originalData.suspendedReason !== newData.suspendedReason ||
                        originalData.repeatedReason !== newData.repeatedReason
                    )
                })

            if (scoresToUpdate.length > 0) {
                listSqlTransaction = [
                    ...listSqlTransaction,
                    ...scoresToUpdate.map(({ id, newData }) => {
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
                if (listSqlTransaction?.length > 0) {
                    await sqlTransaction(listSqlTransaction)
                    message.success(`Đã cập nhật ${scoresToUpdate.length} bản ghi thành công!`)
                    debouncedRefetch()
                }
                setHasUnsavedChanges(false)
            } else {
                message.info('Không có thay đổi nào để cập nhật')
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

    useEffect(() => {
        if (selectedFixedClass) {
            const newScoreCC = dataTable.map((item) => ({
                id: item.id,
                value: item.attendanceScore !== null ? item.attendanceScore : 0,
            }))
            const newScoreTX = dataTable.map((item) => ({
                id: item.id,
                value: item.midtermScore != null ? item.midtermScore : 0,
            }))
            const newScoreThi = dataTable.map((item) => ({
                id: item.id,
                value: item.examScore != null ? item.examScore : 0,
            }))
            const newScoreCamThi = dataTable.map((item) => ({
                id: item.id,
                value: item.examBanned || false,
            }))
            const newScoreHoanThi = dataTable.map((item) => ({
                id: item.id,
                value: item.examPostponed || false,
            }))
            const newscoreDinhChi = dataTable.map((item) => ({
                id: item.id,
                value: item.suspended || false,
            }))
            const newScoreLyDo = dataTable.map((item) => ({
                id: item.id,
                value: item.description || '',
            }))
            const newLyDoHoanThi = dataTable.map((item) => ({
                id: item.id,
                value: item.repeatedReason || '',
            }))
            const newLyDoDinhChi = dataTable.map((item) => ({
                id: item.id,
                value: item.suspendedReason || '',
            }))
            const newLyDoCamThi = dataTable.map((item) => ({
                id: item.id,
                value: item.examBannedReason || '',
            }))
            setScoreCC(newScoreCC)
            setScoreTX(newScoreTX)
            setScoreThi(newScoreThi)
            setScoreCamThi(newScoreCamThi)
            setScoreHoanThi(newScoreHoanThi)
            setscoreDinhChi(newscoreDinhChi)
            setScoreLyDo(newScoreLyDo)
            setLyDoHoanThi(newLyDoHoanThi)
            setLyDoDinhChi(newLyDoDinhChi)
            setLyDoCamThi(newLyDoCamThi)
        }
    }, [dataTable, selectedFixedClass])

    //#region Upload file nhập điểm
    const handleImportConfirm = (importedData: any[]) => {
        showSpinner()

        try {
            const updatedScores = dataTable.map((record) => {
                const importedScore = importedData.find(
                    (item) => item.studentCode === record.student?.code
                )

                if (importedScore) {
                    return {
                        id: record.id,
                        attendanceScore: importedScore.attendanceScore,
                        midtermScore: importedScore.midtermScore,
                        examScore: importedScore.examScore,
                    }
                }
                return record
            })

            // Cập nhật state
            const newScoreCC = updatedScores.map((item) => ({
                id: item.id,
                value: item.attendanceScore || 0,
            }))
            const newScoreTX = updatedScores.map((item) => ({
                id: item.id,
                value: item.midtermScore || 0,
            }))
            const newScoreThi = updatedScores.map((item) => ({
                id: item.id,
                value: item.examScore || 0,
            }))

            setScoreCC(newScoreCC)
            setScoreTX(newScoreTX)
            setScoreThi(newScoreThi)

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

    const selectedClassInfo = subjectClassData.find((item) => item.id === selectedFixedClass)

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

    const roundToNearestHalf = (num: number) => {
        return Math.round(num * 2) / 2
    }

    const roundToNearestTenth = (num: number) => {
        return Math.round(num * 10) / 10
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        form.setFieldsValue({ ...dataDetailSubjectClass })
    }, [dataDetailSubjectClass])

    useEffect(() => {
        if (!hasUnsavedChanges) return

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
    }, [
        hasUnsavedChanges,
        router.events.emit,
        router.events.off,
        router.events.on,
        router.pathname,
    ])

    const disabledEnteredScore = useMemo(() => {
        if (
            dayjs().isAfter(dataDetailSubjectClass?.scoreDeadline) ||
            !!dataDetailSubjectClass?.isLockScore ||
            profileId !== listUser?.lecturer
        ) {
            return true
        }
        return false
    }, [profileId, dataDetailSubjectClass])

    const disabledEnteredExamScore = useMemo(() => {
        if (
            dayjs().isBefore(dataDetailSubjectClass?.scoreDeadline) ||
            dayjs().isAfter(dataDetailSubjectClass?.examScoreDeadline) ||
            !!dataDetailSubjectClass?.isLockExamScore ||
            profileId !== listUser?.lecturer
        ) {
            return true
        }
        return false
    }, [profileId, dataDetailSubjectClass])

    return (
        <div className="flex gap-2 pr-2">
            <Col span={4} className="min-h-[calc(100vh-64px-24px)] bg-white rounded-lg shadow-sm">
                <LopMonHocItem
                    dataTable={subjectClassData.map((item) => ({
                        id: item.id,
                        name: item.name,
                        code: item.code === null ? undefined : item.code,
                        mainLecturer: item.mainLecturer
                            ? {
                                  userProfile: {
                                      firstName: item.mainLecturer.userProfile.firstName,
                                      lastName: item.mainLecturer.userProfile.lastName,
                                  },
                              }
                            : {
                                  userProfile: {
                                      firstName: '',
                                      lastName: '',
                                  },
                              },
                        count: item._count.subjectClassStudent,
                    }))}
                    onChangeSelected={handleChangeFixedClass}
                    selectedItem={selectedFixedClass}
                    isFetching={isFetching}
                />
            </Col>

            <Col
                span={20}
                className="min-h-[calc(100vh-64px-24px)] bg-white rounded-lg shadow-sm p-4"
            >
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={24}>
                            <Flex gap={4}>
                                <Col span={8}>
                                    <Form.Item name="searchText">
                                        <Input
                                            id="search"
                                            onChange={(e) =>
                                                handleFilterChange('searchText', e.target.value)
                                            }
                                            placeholder="Nhập tên lớp..."
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
                            </Flex>
                        </Col>
                    </Row>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
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
                                                        <Button
                                                            onClick={() =>
                                                                setImportModalVisible(true)
                                                            }
                                                            disabled={!selectedFixedClass}
                                                            className="w-full flex justify-start"
                                                        >
                                                            <FileUp />
                                                            Nhập điểm từ file
                                                        </Button>
                                                        <ImportScoreModal
                                                            visible={importModalVisible}
                                                            onCancel={() =>
                                                                setImportModalVisible(false)
                                                            }
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
                                                        selectedFixedClass={selectedFixedClass}
                                                        dataTable={dataTable}
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
                                        <Button disabled={!selectedFixedClass}>
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
                                            selectedFixedClass={selectedFixedClass}
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
                                                disabled={!selectedFixedClass}
                                                onClick={() => handlePrint()}
                                            >
                                                <Printer />
                                                In phiếu điểm và khoá
                                            </Button>
                                        )}

                                        <Button
                                            disabled={!selectedFixedClass}
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

                        {dataDetailSubjectClass && (
                            <>
                                <Col span={24}>
                                    <Flex justify="" align="center">
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
                                        <div>
                                            Hạn nhập điểm thi:
                                            <span
                                                className={`ml-1 ${dayjs().isBefore(dataDetailSubjectClass?.examScoreDeadline) ? '' : 'text-red-500'}`}
                                            >
                                                {dataDetailSubjectClass?.examScoreDeadline &&
                                                    formatDate(
                                                        dataDetailSubjectClass?.examScoreDeadline
                                                    )}
                                            </span>
                                        </div>
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
                                                name="enteredScore"
                                                valuePropName="checked"
                                            >
                                                <Checkbox disabled={disabledEnteredScore}>
                                                    Đã nhập điểm CC/TX
                                                </Checkbox>
                                            </Form.Item>
                                            <Form.Item
                                                className="mb-0"
                                                name="enteredExamScore"
                                                valuePropName="checked"
                                            >
                                                <Checkbox disabled={disabledEnteredExamScore}>
                                                    Đã nhập điểm thi điểm thi
                                                </Checkbox>
                                            </Form.Item>
                                            <Form.Item
                                                className="mb-0"
                                                name="isLockScore"
                                                valuePropName="checked"
                                            >
                                                <Checkbox disabled={profileId !== listUser?.P13}>
                                                    Khóa điểm CC/TX
                                                </Checkbox>
                                            </Form.Item>

                                            <Form.Item
                                                className="mb-0"
                                                name="isLockExamScore"
                                                valuePropName="checked"
                                            >
                                                <Checkbox disabled={profileId !== listUser?.P13}>
                                                    Khóa điểm thi
                                                </Checkbox>
                                            </Form.Item>

                                            <Form.Item
                                                className="mb-0"
                                                name="scoreSubmitted"
                                                valuePropName="checked"
                                            >
                                                <Checkbox disabled={profileId !== listUser?.P13}>
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
                    </Row>
                </Col>
                {loadingTable ? (
                    <Col span={24}>
                        <Skeleton />
                    </Col>
                ) : (
                    <Col span={24}>
                        {selectedFixedClass && (
                            <div className="flex flex-row gap-2">
                                <div className="font-bold">Tổng hợp kết quả thi:</div>
                                {Object.entries(statistics).map(([type, { count, percentage }]) => (
                                    <p key={type}>
                                        {type}: {count}= {percentage}%
                                    </p>
                                ))}
                            </div>
                        )}
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
                                    render: (_, record) =>
                                        record?.student?.userProfile?.fullname || '',
                                },
                                {
                                    title: 'Ngày sinh',
                                    dataIndex: 'dateOfBirth',
                                    width: 125,
                                    type: 'date',
                                    render: (_, record) =>
                                        record?.student?.userProfile.dateOfBirth
                                            ? dayjs(
                                                  record?.student?.userProfile.dateOfBirth
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
                                        record.student?.fixedClass?.name || 'Chưa có lớp',
                                },
                                // #region Điểm CC
                                {
                                    title: 'Điểm CC',
                                    dataIndex: 'attendanceScore',
                                    width: 100,
                                    align: 'center',
                                    type: 'order',
                                    render: (_, record) => {
                                        const isEditable =
                                            can(
                                                QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC,
                                                'NHAP_DIEM'
                                            ) &&
                                            record.subjectClass?.scoreDeadline &&
                                            dayjs().isBefore(record.subjectClass.scoreDeadline)
                                        const openClock = record.subjectClass?.isLockScore
                                        const Score =
                                            scoreCC.find((item) => item.id === record.id)?.value ??
                                            (record.attendanceScore !== undefined
                                                ? Number(record.attendanceScore)
                                                : null)

                                        if (isEditable && !openClock) {
                                            const currentScore =
                                                Score !== null && Score !== undefined ? Score : ''
                                            const isInvalid =
                                                typeof currentScore === 'number' &&
                                                (currentScore < 0 || currentScore > 10)
                                            return (
                                                <InputNumber
                                                    min={0}
                                                    id={`score-cc-${record.id}`}
                                                    style={{ width: '100%' }}
                                                    step={0.5}
                                                    controls={false}
                                                    value={currentScore}
                                                    status={isInvalid ? 'error' : undefined}
                                                    onChange={(value) => {
                                                        if (!value) return
                                                        let newScore = +value
                                                        if (newScore > 99) newScore = 99
                                                        if (newScore < 0) newScore = 0

                                                        setScoreCC((prevScores) => {
                                                            const index = prevScores.findIndex(
                                                                (item) => item.id === record.id
                                                            )
                                                            if (index > -1) {
                                                                const updated = [...prevScores]
                                                                updated[index] = {
                                                                    ...updated[index],
                                                                    value: roundToNearestHalf(
                                                                        newScore
                                                                    ),
                                                                }
                                                                return updated
                                                            }
                                                            return [
                                                                ...prevScores,
                                                                {
                                                                    id: record.id,
                                                                    value: roundToNearestHalf(
                                                                        newScore
                                                                    ),
                                                                },
                                                            ]
                                                        })
                                                        setHasUnsavedChanges(true)
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
                                            )
                                        }
                                        return Score !== null ? <span>{Score}</span> : null
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
                                        const isEditable =
                                            can(
                                                QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC,
                                                'NHAP_DIEM'
                                            ) &&
                                            record.subjectClass?.scoreDeadline &&
                                            dayjs().isBefore(record.subjectClass.scoreDeadline)
                                        const openClock = record.subjectClass?.isLockScore
                                        const Score =
                                            scoreTX.find((item) => item.id === record.id)?.value ??
                                            (record.midtermScore !== undefined
                                                ? Number(record.midtermScore)
                                                : null)

                                        if (isEditable && !openClock) {
                                            const currentScore =
                                                Score !== null && Score !== undefined ? Score : ''
                                            const isInvalid =
                                                typeof currentScore === 'number' &&
                                                (currentScore < 0 || currentScore > 10)
                                            return (
                                                <InputNumber
                                                    min={0}
                                                    id={`score-tx-${record.id}`}
                                                    style={{ width: '100%' }}
                                                    step={0.5}
                                                    controls={false}
                                                    value={currentScore}
                                                    status={isInvalid ? 'error' : undefined}
                                                    onChange={(value) => {
                                                        let newScore = +(value || 0)
                                                        if (newScore > 99) newScore = 99
                                                        if (newScore < 0) newScore = 0

                                                        setScoreTX((prevScores) => {
                                                            const index = prevScores.findIndex(
                                                                (item) => item.id === record.id
                                                            )
                                                            if (index > -1) {
                                                                const updated = [...prevScores]
                                                                updated[index] = {
                                                                    ...updated[index],
                                                                    value: roundToNearestHalf(
                                                                        newScore
                                                                    ),
                                                                }
                                                                return updated
                                                            }
                                                            return [
                                                                ...prevScores,
                                                                {
                                                                    id: record.id,
                                                                    value: roundToNearestHalf(
                                                                        newScore
                                                                    ),
                                                                },
                                                            ]
                                                        })
                                                        setHasUnsavedChanges(true)
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
                                            )
                                        }
                                        return Score !== null ? <span>{Score}</span> : null
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
                                        const isEditable =
                                            can(
                                                QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC,
                                                'NHAP_DIEM'
                                            ) &&
                                            record.subjectClass?.examScoreDeadline &&
                                            record.subjectClass?.scoreDeadline &&
                                            dayjs().isAfter(record.subjectClass?.scoreDeadline) &&
                                            dayjs().isBefore(record.subjectClass?.examScoreDeadline)

                                        const Score =
                                            scoreThi.find((item) => item.id === record.id)?.value ??
                                            (record.examScore !== undefined
                                                ? Number(record.examScore)
                                                : null)

                                        if (
                                            isEditable &&
                                            record.attendanceScore &&
                                            record.midtermScore &&
                                            !record.subjectClass.isLockExamScore
                                        ) {
                                            const currentScore =
                                                Score !== null && Score !== undefined ? Score : ''
                                            const isInvalid =
                                                typeof currentScore === 'number' &&
                                                (currentScore < 0 || currentScore > 10)
                                            return (
                                                <InputNumber
                                                    min={0}
                                                    id={`score-thi-${record.id}`}
                                                    style={{ width: '100%' }}
                                                    step={0.1}
                                                    controls={false}
                                                    value={currentScore}
                                                    status={isInvalid ? 'error' : undefined}
                                                    onChange={(value) => {
                                                        let newScore = +(value || 0)
                                                        if (newScore > 99) newScore = 99
                                                        if (newScore < 0) newScore = 0

                                                        setScoreThi((prevScores) => {
                                                            const index = prevScores.findIndex(
                                                                (item) => item.id === record.id
                                                            )
                                                            if (index > -1) {
                                                                const updated = [...prevScores]
                                                                updated[index] = {
                                                                    ...updated[index],
                                                                    value: roundToNearestTenth(
                                                                        newScore
                                                                    ),
                                                                }
                                                                return updated
                                                            }
                                                            return [
                                                                ...prevScores,
                                                                {
                                                                    id: record.id,
                                                                    value: roundToNearestTenth(
                                                                        newScore
                                                                    ),
                                                                },
                                                            ]
                                                        })
                                                        setHasUnsavedChanges(true)
                                                    }}
                                                    onKeyDown={(e) =>
                                                        handleScoreInputKeyDown(
                                                            e,
                                                            record.id,
                                                            'thi',
                                                            dataTable
                                                        )
                                                    }
                                                />
                                            )
                                        }
                                        return Score !== null ? <span>{Score}</span> : null
                                    },
                                },
                                {
                                    title: 'Điểm cộng',
                                    align: 'center',
                                    width: 120,
                                    render: (_, record) =>
                                        record.awards.reduce(
                                            (
                                                acc: number,
                                                curr: {
                                                    archivedAward: ArchivedAward
                                                }
                                            ) => acc + (curr?.archivedAward?.bonusScore ?? 0),
                                            0
                                        ),
                                },
                                {
                                    title: 'Điểm HP',
                                    width: 80,
                                    align: 'center',
                                    render: (record) => {
                                        const { finalScore } = renderFinalScore(record)
                                        return finalScore
                                    },
                                },
                                // #region Cấm thi/Hoãn thi/Đình chỉ
                                {
                                    title: 'Lý do cấm thi',
                                    dataIndex: 'examBannedReason',
                                    width: 150,
                                    render: (value, record) => {
                                        return (
                                            <Input
                                                placeholder="Nhập lý do cấm thi"
                                                style={{
                                                    width: '100%',
                                                }}
                                                defaultValue={value || ''}
                                                onChange={(e) => {
                                                    // Handle input change for bonus score
                                                    const newNote = e.target.value
                                                    setLyDoCamThi((prevScores) => {
                                                        const index = prevScores.findIndex(
                                                            (item) => item.id === record.id
                                                        )
                                                        if (index > -1) {
                                                            const updated = [...prevScores]
                                                            updated[index] = {
                                                                id: record.id,
                                                                value: newNote,
                                                            }
                                                            return updated
                                                        }
                                                        return [
                                                            ...prevScores,
                                                            {
                                                                id: record.id,
                                                                value: newNote,
                                                            },
                                                        ]
                                                    })
                                                }}
                                            />
                                        )
                                    },
                                },
                                {
                                    title: 'Cấm thi',
                                    dataIndex: 'examBanned',
                                    width: 80,
                                    align: 'center',
                                    render: (value, record) => {
                                        return (
                                            <Checkbox
                                                defaultChecked={value}
                                                onChange={(e) => {
                                                    const newValue = e.target.checked
                                                    setScoreCamThi((prevScores) => {
                                                        const index = prevScores.findIndex(
                                                            (item) => item.id === record.id
                                                        )
                                                        if (index > -1) {
                                                            const updated = [...prevScores]
                                                            updated[index] = {
                                                                id: record.id,
                                                                value: newValue,
                                                            }
                                                            return updated
                                                        }
                                                        return [
                                                            ...prevScores,
                                                            {
                                                                id: record.id,
                                                                value: newValue,
                                                            },
                                                        ]
                                                    })
                                                    // Handle checkbox change for exam prohibition reason
                                                }}
                                            />
                                        )
                                    },
                                },
                                {
                                    title: 'Lý do hoãn thi',
                                    dataIndex: 'repeatedReason',
                                    width: 200,
                                    render: (value, record) => {
                                        return (
                                            <Input
                                                placeholder="Nhập lý do hoãn thi"
                                                style={{
                                                    width: '100%',
                                                }}
                                                defaultValue={value || ''}
                                                onChange={(e) => {
                                                    // Handle input change for bonus score
                                                    const newNote = e.target.value
                                                    setLyDoHoanThi((prevScores) => {
                                                        const index = prevScores.findIndex(
                                                            (item) => item.id === record.id
                                                        )
                                                        if (index > -1) {
                                                            const updated = [...prevScores]
                                                            updated[index] = {
                                                                id: record.id,
                                                                value: newNote,
                                                            }
                                                            return updated
                                                        }
                                                        return [
                                                            ...prevScores,
                                                            {
                                                                id: record.id,
                                                                value: newNote,
                                                            },
                                                        ]
                                                    })
                                                }}
                                            />
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
                                            <Checkbox
                                                defaultChecked={value}
                                                onChange={(e) => {
                                                    const newValue = e.target.checked
                                                    setScoreHoanThi((prevScores) => {
                                                        const index = prevScores.findIndex(
                                                            (item) => item.id === record.id
                                                        )
                                                        if (index > -1) {
                                                            const updated = [...prevScores]
                                                            updated[index] = {
                                                                id: record.id,
                                                                value: newValue,
                                                            }
                                                            return updated
                                                        }
                                                        return [
                                                            ...prevScores,
                                                            {
                                                                id: record.id,
                                                                value: newValue,
                                                            },
                                                        ]
                                                    })
                                                    // Handle checkbox change for exam prohibition reason
                                                }}
                                            />
                                        )
                                    },
                                },
                                {
                                    title: 'Lý do đình chỉ',
                                    dataIndex: 'suspendedReason',
                                    width: 200,
                                    render: (value, record) => {
                                        return (
                                            <Input
                                                placeholder="Nhập lý do đình chỉ"
                                                style={{
                                                    width: '100%',
                                                }}
                                                defaultValue={value || ''}
                                                onChange={(e) => {
                                                    // Handle input change for bonus score
                                                    const newNote = e.target.value
                                                    setLyDoDinhChi((prevScores) => {
                                                        const index = prevScores.findIndex(
                                                            (item) => item.id === record.id
                                                        )
                                                        if (index > -1) {
                                                            const updated = [...prevScores]
                                                            updated[index] = {
                                                                id: record.id,
                                                                value: newNote,
                                                            }
                                                            return updated
                                                        }
                                                        return [
                                                            ...prevScores,
                                                            {
                                                                id: record.id,
                                                                value: newNote,
                                                            },
                                                        ]
                                                    })
                                                }}
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
                                            <Checkbox
                                                defaultChecked={value}
                                                onChange={(e) => {
                                                    const newValue = e.target.checked
                                                    setscoreDinhChi((prevScores) => {
                                                        const index = prevScores.findIndex(
                                                            (item) => item.id === record.id
                                                        )
                                                        if (index > -1) {
                                                            const updated = [...prevScores]
                                                            updated[index] = {
                                                                id: record.id,
                                                                value: newValue,
                                                            }
                                                            return updated
                                                        }
                                                        return [
                                                            ...prevScores,
                                                            {
                                                                id: record.id,
                                                                value: newValue,
                                                            },
                                                        ]
                                                    })
                                                    // Handle checkbox change for exam prohibition reason
                                                }}
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
                                            <Input
                                                placeholder="Nhập ghi chú lý do"
                                                style={{
                                                    width: '100%',
                                                }}
                                                defaultValue={value || ''}
                                                onChange={(e) => {
                                                    // Handle input change for bonus score
                                                    const newNote = e.target.value
                                                    setScoreLyDo((prevScores) => {
                                                        const index = prevScores.findIndex(
                                                            (item) => item.id === record.id
                                                        )
                                                        if (index > -1) {
                                                            const updated = [...prevScores]
                                                            updated[index] = {
                                                                id: record.id,
                                                                value: newNote,
                                                            }
                                                            return updated
                                                        }
                                                        return [
                                                            ...prevScores,
                                                            {
                                                                id: record.id,
                                                                value: newNote,
                                                            },
                                                        ]
                                                    })
                                                }}
                                            />
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
                    </Col>
                )}
            </Col>
        </div>
    )
}

SubjectClassScore.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout unLayout={true}>{page}</DefaultLayout>
}
