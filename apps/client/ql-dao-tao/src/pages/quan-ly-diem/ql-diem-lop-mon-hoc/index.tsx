import ImportScoreModal from '@components/commons/print/nhap-diem-tu-file'
import ExportScoreTemplate from '@components/commons/print/xuat-mau-nhap-diem'
import Select from '@components/commons/select'
import TreeSelectSemester from '@components/commons/semester-select/TreeSelectSemester'
import Table from '@components/commons/table'
import FilterSubjectClass from '@components/filter/filter-lop-mon-hoc'
import { ExportTemplateExam, ModalPrintStudentSubjectScore } from '@components/modal'
import { EnumInPhieuDiem } from '@components/modal/modal-in-phieu-diem'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useScoreConverter } from '@hooks/scoreConverter'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { ArchivedAward, TrainingObjectType } from '@workspace/db'
import {
    useCountStudentSubjectScore,
    useFindManyStudentSubjectScore,
    useFindManySubjectClass,
    useFindManyTrainingObjectType,
    useUpdateStudentSubjectScore,
} from '@workspace/db/hooks'
import { calcFinalScore } from '@workspace/libs/utils'
import {
    Button,
    Checkbox,
    type CheckboxChangeEvent,
    Col,
    Flex,
    Form,
    Input,
    message,
    Popover,
    Row,
} from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import { Ellipsis, FileUp, Printer, Save, Search } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import LopMonHocItem from './lop-mon-hoc'

// const { Option } = Select;
interface FilterProps {
    schoolYearId: string | null //Năm học
    semesterId: string | null //Học kỳ
    KhoaId: string | null //Khoa
    BoMonId: string | null //Bộ môn
    trainingObjectId: string | null //Đối tượng đào tạo
    examTypeId: string | null //Hình thức thi
    LectureIds: string[] //Giảng viên
    searchText: string | null
    trainingObjectTypeId: string | null
    subjectClassId: string | null
    fixedClassIds: string[]
    examDateRange?: [string, string] | null // Khoảng thời gian thi
}

export default function SubjectClassScore() {
    const router = useRouter()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const [selectedFixedClass, setSelectedFixedClass] = useState<string | undefined>(undefined)
    const [subjectClassFullData, setSubjectClassFullData] = useState<any[]>([])

    const [_nhapDiemCC, setNhapDiemCC] = useState<boolean>(false)
    const [_nhapDiemTX, setNhapDiemTX] = useState<boolean>(false)
    const [_nhapDiemThi, setNhapDiemThi] = useState<boolean>(false)
    const [_nhapDiemCong, _setNhapDiemCong] = useState<boolean>(false)
    const [camThi, setCamThi] = useState<boolean>(false)
    const { subjectId } = router.query

    const [open, setOpen] = useState(false)
    const [importModalVisible, setImportModalVisible] = useState(false)

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
    }

    const { onOpen, onClose } = useDisclosure<{
        dataTable: any
        type: number // 1: In phiếu điểm và khóa, 0: In phiếu điểm nháp
    }>({
        tag: ModalPrintStudentSubjectScore.name,
    })

    useEffect(() => {
        if (subjectId) {
            setSelectedFixedClass(subjectId as string)
        }
    }, [subjectId])

    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        semesterId: null,
        trainingObjectTypeId: null,
        subjectClassId: null,
        schoolYearId: null,
        KhoaId: null,
        BoMonId: null,
        trainingObjectId: null,
        examTypeId: null,
        LectureIds: [],
        fixedClassIds: [],
        examDateRange: undefined, // Khoảng thời gian thi
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: updateStudentSubjectScore } = useUpdateStudentSubjectScore()

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    const { data: trainingObjectTypeData = [] } = useFindManyTrainingObjectType()

    //#region Mới
    /* Mới */

    const { data: subjectClassData = [] } = useFindManySubjectClass({
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
            ...(filters.semesterId ? { semesterId: filters.semesterId } : {}),
            ...(filters.subjectClassId ? { id: filters.subjectClassId } : {}),
            ...(filters.trainingObjectTypeId
                ? {
                      subjectClassStudent: {
                          some: {
                              student: {
                                  trainingObjectTypeId: filters.trainingObjectTypeId,
                              },
                          },
                      },
                  }
                : {}),
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
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: dataTable = [], refetch } = useFindManyStudentSubjectScore({
        where: {
            // ...(
            //     filters.searchText && filters.searchText !== '' ? {
            //         OR: [
            //             // { name: { contains: filters.searchText } },
            //             { code: { contains: filters.searchText } },
            //         ],
            //     } : {}
            // ),
            subjectClassId: selectedFixedClass || '',
            deletedAt: null,
        },
        include: {
            student: {
                include: {
                    userProfile: true,
                    fixedClass: true,
                },
            },
            subjectClass: {
                include: {
                    subject: true,
                    semester: {
                        include: {
                            schoolYear: true,
                            trainingCoursesStart: {
                                include: {
                                    scoreConverts: true,
                                },
                            },
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
        orderBy: {
            student: {
                userProfile: {
                    firstName: 'asc',
                },
            },
        },
        // take: numberOfPages,
        // skip: (currentPage - 1) * numberOfPages,
    })

    const { convertScore } = useScoreConverter(
        dataTable?.[0]?.subjectClass?.semester?.trainingCoursesStart?.[0]?.scoreConverts
    )

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

    const { data: count } = useCountStudentSubjectScore({
        where: {
            subjectClassId: selectedFixedClass || '',
        },
    })

    const handleChangeFixedClass = async (id: string) => {
        try {
            showSpinner()
            setSelectedFixedClass(id)
            await refetch()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }
    // const handleChangeNhapDiemCong = (e: CheckboxChangeEvent) => {
    //     setNhapDiemCong(e.target.checked)
    // }
    const _handleChangeCamThi = (e: CheckboxChangeEvent) => {
        setCamThi(e.target.checked)
    }
    const handleFilterApply = (newFilters: Partial<FilterProps>) => {
        setFilters((prev) => {
            const updatedFilters = { ...prev, ...newFilters }
            debouncedRefetch()
            return updatedFilters
        })
    }
    // #endregion
    const rowSelection = {
        selectedRowKeys,
        onChange: (selectedKeys: any) => {
            setSelectedRowKeys(selectedKeys)
        },
    }
    // #region Lưu điểm
    const [scoreCC, setScoreCC] = useState<{ id: string; value: number }[]>([])
    const [scoreTX, setScoreTX] = useState<{ id: string; value: number }[]>([])
    const [scoreThi, setScoreThi] = useState<{ id: string; value: number }[]>([])
    const [scoreCamThi, setScoreCamThi] = useState<{ id: string; value: boolean }[]>([])
    const [scoreHoanThi, setScoreHoanThi] = useState<{ id: string; value: boolean }[]>([])
    const [scoreDinhChi, setscoreDinhChi] = useState<{ id: string; value: boolean }[]>([])
    const [scoreLyDo, setScoreLyDo] = useState<{ id: string; value: string }[]>([])

    const renderFinalScore = (record: any) => {
        const attendanceScore =
            scoreCC.find((item) => item.id === record.id)?.value ??
            (record.attendanceScore !== undefined ? Number(record.attendanceScore) : null)

        const midtermScore =
            scoreTX.find((item) => item.id === record.id)?.value ??
            (record.midtermScore !== undefined ? Number(record.midtermScore) : null)

        const examScore =
            scoreThi.find((item) => item.id === record.id)?.value ??
            (record.examScore !== undefined ? Number(record.examScore) : null)

        const finalScore = calcFinalScore(record.subjectClass.semester.trainingCoursesStart[0], {
            ...record,
            attendanceScore,
            midtermScore,
            examScore,
        })?.toFixed(1)

        const converted = convertScore(Number(finalScore))

        return {
            finalScore,
            base4: converted?.base4,
            letter: converted?.letter,
        }
    }

    const clearCheckbox = () => {
        setNhapDiemCC(false)
        setNhapDiemTX(false)
        setNhapDiemThi(false)
        setCamThi(false)
    }

    const handleSaveScores = async () => {
        try {
            showSpinner()

            const scoresToUpdate = dataTable
                .map((record) => {
                    const ccScore = scoreCC.find((s) => s.id === record.id)
                    const txScore = scoreTX.find((s) => s.id === record.id)
                    const thiScore = scoreThi.find((s) => s.id === record.id)
                    const camThiScore = scoreCamThi.find((s) => s.id === record.id)
                    const hoanThiScore = scoreHoanThi.find((s) => s.id === record.id)
                    const dinhChiScore = scoreDinhChi.find((s) => s.id === record.id)
                    const lyDoScore = scoreLyDo.find((s) => s.id === record.id)
                    const finalScore = Number(renderFinalScore(record).finalScore)

                    const newData = {
                        attendanceScore: ccScore ? ccScore.value : null,
                        midtermScore: txScore ? txScore.value : null,
                        examScore: thiScore ? thiScore.value : null,
                        examBanned: camThiScore ? camThiScore.value : false,
                        examPostponed: hoanThiScore ? hoanThiScore.value : false,
                        suspended: dinhChiScore ? dinhChiScore.value : false,
                        description: lyDoScore ? lyDoScore.value : '',
                        finalScore: finalScore ? finalScore : null,
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
                        originalData.finalScore !== newData.finalScore
                    )
                })

            if (scoresToUpdate.length > 0) {
                await Promise.all(
                    scoresToUpdate.map(({ id, newData }) =>
                        updateStudentSubjectScore({
                            where: { id },
                            data: newData,
                        })
                    )
                )
                message.success(`Đã cập nhật ${scoresToUpdate.length} bản ghi thành công!`)
            } else {
                message.info('Không có thay đổi nào để cập nhật')
            }

            clearCheckbox()
        } catch (_error) {
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
            setScoreCC(newScoreCC)
            setScoreTX(newScoreTX)
            setScoreThi(newScoreThi)
            setScoreCamThi(newScoreCamThi)
            setScoreHoanThi(newScoreHoanThi)
            setscoreDinhChi(newscoreDinhChi)
            setScoreLyDo(newScoreLyDo)
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
        } catch (_error) {
            message.error('Có lỗi xảy ra khi nhập điểm từ file')
        } finally {
            hideSpinner()
        }
    }

    useEffect(() => {
        setSubjectClassFullData(subjectClassData)
    }, [subjectClassData])

    const selectedClassInfo = subjectClassFullData.find((item) => item.id === selectedFixedClass)

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
                    }))}
                    onChangeSelected={handleChangeFixedClass}
                    selectedItem={selectedFixedClass}
                />
            </Col>

            <Col
                span={20}
                className="min-h-[calc(100vh-64px-24px)] bg-white rounded-lg shadow-sm p-4"
            >
                <Col span={24}>
                    <Row gutter={[0, 16]} align="top" justify="space-between">
                        <Col span={12}>
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

                                <Col span={8}>
                                    <Form.Item
                                        className="mb-0"
                                        name="semesterId"
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
                                        labelAlign="left"
                                    >
                                        <TreeSelectSemester
                                            placeholder="Học kỳ"
                                            onChange={(val) =>
                                                handleFilterChange('semesterId', val)
                                            }
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        className="mb-0"
                                        name="trainingObjectId"
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
                                        labelAlign="left"
                                    >
                                        <Select
                                            placeholder="Chọn đối tượng đào tạo"
                                            options={trainingObjectTypeData.map(
                                                (i: TrainingObjectType) => ({
                                                    value: i.id,
                                                    label: i.name,
                                                })
                                            )}
                                            onChange={(val) =>
                                                handleFilterChange('trainingObjectTypeId', val)
                                            }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={4} className="flex">
                                    <FilterSubjectClass
                                        onFilterChange={handleFilterChange}
                                        filters={filters}
                                        onApply={handleFilterApply}
                                    />
                                </Col>
                            </Flex>
                        </Col>
                    </Row>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={24} className="flex justify-end">
                            <Flex gap={4}>
                                <Popover
                                    content={
                                        <Flex vertical align="flex-start" gap={4}>
                                            <Button
                                                onClick={() => setImportModalVisible(true)}
                                                disabled={!selectedFixedClass}
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
                                            <ExportScoreTemplate
                                                selectedFixedClass={selectedFixedClass}
                                                dataTable={dataTable}
                                            />
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

                                <ExportTemplateExam
                                    selectedFixedClass={selectedFixedClass}
                                    dataClass={selectedClassInfo}
                                    dataTable={dataTable}
                                />
                                <Button
                                    disabled={!selectedFixedClass}
                                    onClick={() =>
                                        onOpen({
                                            dataTable,
                                            type: EnumInPhieuDiem.PHIEU_DIEM_KHOA,
                                        })
                                    }
                                >
                                    <Printer />
                                    In phiếu điểm và khóa
                                </Button>
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
                                <Button type="primary" onClick={handleSaveScores}>
                                    <Save stroke="white" />
                                    Lưu
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Table
                        rowKey="id"
                        id="training-category"
                        rowSelection={rowSelection}
                        columns={[
                            {
                                title: 'STT',
                                width: 60,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Mã sinh viên',
                                align: 'center',
                                width: 150,
                                render: (_, record) => record.student?.code || '',
                            },
                            {
                                title: 'Họ và tên',
                                dataIndex: 'name',
                                width: 150,
                                render: (text, record) =>
                                    `${record.student?.userProfile?.firstName || ''} ${record.student?.userProfile?.lastName || ''}`,
                            },
                            {
                                title: 'Ngày sinh',
                                dataIndex: 'tenMonHoc',
                                width: 150,
                                render: (record: string) =>
                                    record ? dayjs(record).format('DD/MM/YYYY') : '',
                            },
                            {
                                title: 'Tên lớp',
                                dataIndex: 'stc',
                                width: 150,
                                align: 'center',
                                render: (text, record) =>
                                    record.student?.fixedClass?.name || 'Chưa có lớp',
                            },
                            // #region Điểm CC
                            {
                                title: 'Điểm CC',
                                dataIndex: 'attendanceScore',
                                width: 80,
                                align: 'center',
                                render: (_: any, record: any) => {
                                    const isEditable = record.subjectClass?.scoreDeadline
                                        ? dayjs().isBefore(record.subjectClass.scoreDeadline)
                                        : false

                                    const Score =
                                        scoreCC.find((item) => item.id === record.id)?.value ??
                                        (record.attendanceScore !== undefined
                                            ? Number(record.attendanceScore)
                                            : null)

                                    if (isEditable) {
                                        return (
                                            <Input
                                                type="number"
                                                id={`score-cc-${record.id}`}
                                                style={{ width: '100%' }}
                                                step={0.5}
                                                value={
                                                    Score !== null && Score !== undefined
                                                        ? Score
                                                        : ''
                                                }
                                                onChange={(e) => {
                                                    const value = e.target.value
                                                    let newScore = Number.parseFloat(value)
                                                    if (newScore > 10) newScore = 10
                                                    if (newScore < 0) newScore = 0

                                                    setScoreCC((prevScores) => {
                                                        const index = prevScores.findIndex(
                                                            (item) => item.id === record.id
                                                        )
                                                        if (index > -1) {
                                                            const updated = [...prevScores]
                                                            updated[index] = {
                                                                ...updated[index],
                                                                value: newScore,
                                                            }
                                                            return updated
                                                        }
                                                        return [
                                                            ...prevScores,
                                                            {
                                                                id: record.id,
                                                                value: newScore,
                                                            },
                                                        ]
                                                    })
                                                }}
                                                onKeyDown={(e) => {
                                                    const currentRowIndex = dataTable.findIndex(
                                                        (item) => item.id === record.id
                                                    )

                                                    if (
                                                        e.key === 'ArrowUp' ||
                                                        e.key === 'ArrowDown'
                                                    ) {
                                                        e.preventDefault()
                                                        const direction =
                                                            e.key === 'ArrowDown' ? 1 : -1
                                                        const targetRow =
                                                            dataTable[currentRowIndex + direction]
                                                        if (targetRow) {
                                                            const nextInput =
                                                                document.getElementById(
                                                                    `score-cc-${targetRow.id}`
                                                                )
                                                            if (nextInput) {
                                                                ;(nextInput as HTMLElement).focus()
                                                            }
                                                        }
                                                    }
                                                }}
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
                                width: 80,
                                align: 'center',
                                render: (_: any, record: any) => {
                                    const isEditable = record.subjectClass?.scoreDeadline
                                        ? dayjs().isBefore(record.subjectClass.scoreDeadline)
                                        : false

                                    const Score =
                                        scoreTX.find((item) => item.id === record.id)?.value ??
                                        (record.midtermScore !== undefined
                                            ? Number(record.midtermScore)
                                            : null)

                                    if (isEditable) {
                                        return (
                                            <Input
                                                type="number"
                                                id={`score-tx-${record.id}`}
                                                style={{ width: '100%' }}
                                                step={0.5}
                                                value={
                                                    Score !== null && Score !== undefined
                                                        ? Score
                                                        : ''
                                                }
                                                onChange={(e) => {
                                                    const value = e.target.value
                                                    let newScore = Number.parseFloat(value)
                                                    if (newScore > 10) newScore = 10
                                                    if (newScore < 0) newScore = 0

                                                    setScoreTX((prevScores) => {
                                                        const index = prevScores.findIndex(
                                                            (item) => item.id === record.id
                                                        )
                                                        if (index > -1) {
                                                            const updated = [...prevScores]
                                                            updated[index] = {
                                                                ...updated[index],
                                                                value: newScore,
                                                            }
                                                            return updated
                                                        }
                                                        return [
                                                            ...prevScores,
                                                            {
                                                                id: record.id,
                                                                value: newScore,
                                                            },
                                                        ]
                                                    })
                                                }}
                                                onKeyDown={(e) => {
                                                    const currentRowIndex = dataTable.findIndex(
                                                        (item) => item.id === record.id
                                                    )

                                                    if (
                                                        e.key === 'ArrowUp' ||
                                                        e.key === 'ArrowDown'
                                                    ) {
                                                        e.preventDefault()
                                                        const direction =
                                                            e.key === 'ArrowDown' ? 1 : -1
                                                        const targetRow =
                                                            dataTable[currentRowIndex + direction]
                                                        if (targetRow) {
                                                            const nextInput =
                                                                document.getElementById(
                                                                    `score-tx-${targetRow.id}`
                                                                )
                                                            if (nextInput) {
                                                                ;(nextInput as HTMLElement).focus()
                                                            }
                                                        }
                                                    }
                                                }}
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
                                width: 80,
                                align: 'center',
                                render: (_: any, record: any) => {
                                    const isEditable = record.subjectClass?.examScoreDeadline
                                        ? dayjs().isBefore(record.subjectClass.examScoreDeadline)
                                        : false

                                    const Score =
                                        scoreThi.find((item) => item.id === record.id)?.value ??
                                        (record.examScore !== undefined
                                            ? Number(record.examScore)
                                            : null)

                                    if (isEditable) {
                                        return (
                                            <Input
                                                type="number"
                                                id={`score-thi-${record.id}`}
                                                style={{ width: '100%' }}
                                                step={0.5}
                                                value={
                                                    Score !== null && Score !== undefined
                                                        ? Score
                                                        : ''
                                                }
                                                onChange={(e) => {
                                                    const value = e.target.value
                                                    let newScore = Number.parseFloat(value)
                                                    if (newScore > 10) newScore = 10
                                                    if (newScore < 0) newScore = 0

                                                    setScoreThi((prevScores) => {
                                                        const index = prevScores.findIndex(
                                                            (item) => item.id === record.id
                                                        )
                                                        if (index > -1) {
                                                            const updated = [...prevScores]
                                                            updated[index] = {
                                                                ...updated[index],
                                                                value: newScore,
                                                            }
                                                            return updated
                                                        }
                                                        return [
                                                            ...prevScores,
                                                            {
                                                                id: record.id,
                                                                value: newScore,
                                                            },
                                                        ]
                                                    })
                                                }}
                                                onKeyDown={(e) => {
                                                    const currentRowIndex = dataTable.findIndex(
                                                        (item) => item.id === record.id
                                                    )

                                                    if (
                                                        e.key === 'ArrowUp' ||
                                                        e.key === 'ArrowDown'
                                                    ) {
                                                        e.preventDefault()
                                                        const direction =
                                                            e.key === 'ArrowDown' ? 1 : -1
                                                        const targetRow =
                                                            dataTable[currentRowIndex + direction]
                                                        if (targetRow) {
                                                            const nextInput =
                                                                document.getElementById(
                                                                    `score-thi-${targetRow.id}`
                                                                )
                                                            if (nextInput) {
                                                                ;(nextInput as HTMLElement).focus()
                                                            }
                                                        }
                                                    }
                                                }}
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
                            {
                                title: 'Điểm hệ 4',
                                width: 100,
                                align: 'center',
                                render: (record) => {
                                    const { base4 } = renderFinalScore(record)
                                    return base4
                                },
                            },
                            {
                                title: 'Điểm chữ',
                                width: 100,
                                align: 'center',
                                render: (record) => {
                                    const { letter } = renderFinalScore(record)
                                    return letter
                                },
                            },
                            // #region Cấm thi/Hoãn thi/Đình chỉ
                            {
                                title: 'Lý do cấm thi',
                                dataIndex: '',
                                width: 150,
                            },
                            {
                                title: 'Cấm thi',
                                dataIndex: 'code',
                                width: 80,
                                align: 'center',
                                render: (text, record) => {
                                    const isCheck =
                                        scoreCamThi.find((item) => item.id === record.id)?.value ??
                                        record.examBanned ??
                                        false
                                    return (
                                        <Checkbox
                                            checked={isCheck}
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
                                            disabled={!camThi}
                                        />
                                    )
                                },
                            },
                            {
                                title: 'Lý do hoãn thi',
                                dataIndex: '',
                                width: 150,
                            },
                            {
                                title: 'Hoãn thi',
                                dataIndex: 'code',
                                width: 80,
                                align: 'center',
                                render: (text, record) => {
                                    const isCheck =
                                        scoreHoanThi.find((item) => item.id === record.id)?.value ??
                                        record.examPostponed ??
                                        false
                                    return (
                                        <Checkbox
                                            checked={isCheck}
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
                                            disabled={!camThi}
                                        />
                                    )
                                },
                            },
                            {
                                title: 'Lý do đình chỉ',
                                dataIndex: '',
                                width: 150,
                            },
                            {
                                title: 'Đình chỉ',
                                dataIndex: 'code',
                                width: 80,
                                align: 'center',
                                render: (text, record) => {
                                    const isCheck =
                                        scoreDinhChi.find((item) => item.id === record.id)?.value ??
                                        record.examPostponed ??
                                        false
                                    return (
                                        <Checkbox
                                            checked={isCheck}
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
                                            disabled={!camThi}
                                        />
                                    )
                                },
                            },
                            {
                                title: 'Ghi chú',
                                dataIndex: 'code',
                                width: 150,
                                align: 'center',
                                render: (text, record) => {
                                    if (camThi) {
                                        const note =
                                            scoreLyDo.find((item) => item.id === record.id)
                                                ?.value ??
                                            record.description ??
                                            ''
                                        return (
                                            <Input
                                                placeholder="Nhập ghi chú lý do"
                                                style={{
                                                    width: '100%',
                                                }}
                                                value={note}
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
                                    }
                                    return record.description || ''
                                },
                            },
                        ]}
                        data={dataTable}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            total: count,
                            onChange: setCurrentPage,
                            onShowSizeChange: setNumberOfPages,
                            showTotal: (total, range) =>
                                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                        }}
                    />
                </Col>
            </Col>
        </div>
    )
}

SubjectClassScore.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout unLayout={true}>{page}</DefaultLayout>
}
