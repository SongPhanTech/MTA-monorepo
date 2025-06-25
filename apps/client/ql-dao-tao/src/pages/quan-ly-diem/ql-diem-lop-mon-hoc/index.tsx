import ExportScoreTemplate from '@components/commons/print/xuat-mau-nhap-diem'
import Select from '@components/commons/select'
import Table from '@components/commons/table'
import FilterSubjectClass from '@components/filter/filter-lop-mon-hoc'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { TrainingObjectType } from '@workspace/db'
import {
    useCountStudentSubjectScore,
    useFindManyStudentSubjectScore,
    useFindManySubjectClass,
    useFindManyTrainingObjectType,
    useUpdateStudentSubjectScore,
} from '@workspace/db/hooks'
import {
    Button,
    Checkbox,
    type CheckboxChangeEvent,
    Col,
    Flex,
    Form,
    Input,
    Popover,
    Row,
    message,
} from 'antd'
import _ from 'lodash'
import { Ellipsis, FileUp, Printer, Save, Search } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import LopMonHocItem from './lop-mon-hoc'
import TreeSelectSemester from '@components/commons/semester-select/TreeSelectSemester'
import dayjs from 'dayjs'

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
    const [selectedFixedClass, setSelectedFixedClass] = useState<
        string | undefined
    >(undefined)

    const [nhapDiemCC, setNhapDiemCC] = useState<boolean>(false)
    const [nhapDiemTX, setNhapDiemTX] = useState<boolean>(false)
    const [nhapDiemThi, setNhapDiemThi] = useState<boolean>(false)
    const [nhapDiemCong, setNhapDiemCong] = useState<boolean>(false)
    const [camThi, setCamThi] = useState<boolean>(false)
    const { subjectId } = router.query

    const [open, setOpen] = useState(false)

    const hide = () => {
        setOpen(false)
    }

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
    }

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

    const { mutateAsync: updateStudentSubjectScore } =
        useUpdateStudentSubjectScore()

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    const { data: trainingObjectTypeData = [] } =
        useFindManyTrainingObjectType()

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
                                  trainingObjectTypeId:
                                      filters.trainingObjectTypeId,
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
            // subject: {
            //     include: {
            //         managementOrganization: true, // Bao gồm thông tin khoa/bộ môn
            //     },
            // },
            mainLecturer: {
                include: { userProfile: true },
            },
            extraLecturer: {
                include: { userProfile: true },
            },
            subjectClassStudent: {
                include: {
                    student: { include: { userProfile: true } },
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
        },
        orderBy: {
            student: {
                userProfile: {
                    firstName: 'asc',
                    // lastName: 'asc',
                },
            },
        },
        // take: numberOfPages,
        // skip: (currentPage - 1) * numberOfPages,
    })

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
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }
    const handleChangeNhapDiemCC = (e: CheckboxChangeEvent) => {
        setNhapDiemCC(e.target.checked)
    }
    const handleChangeNhapDiemTX = (e: CheckboxChangeEvent) => {
        setNhapDiemTX(e.target.checked)
    }
    const handleChangeNhapDiemThi = (e: CheckboxChangeEvent) => {
        setNhapDiemThi(e.target.checked)
    }
    // const handleChangeNhapDiemCong = (e: CheckboxChangeEvent) => {
    //     setNhapDiemCong(e.target.checked)
    // }
    const handleChangeCamThi = (e: CheckboxChangeEvent) => {
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
    const [scoreThi, setScoreThi] = useState<{ id: string; value: number }[]>(
        []
    )
    const [scoreCamThi, setScoreCamThi] = useState<
        { id: string; value: boolean }[]
    >([])
    const [scoreHoanThi, setScoreHoanThi] = useState<
        { id: string; value: boolean }[]
    >([])
    const [scoreDinhChi, setscoreDinhChi] = useState<
        { id: string; value: boolean }[]
    >([])
    const [scoreLyDo, setScoreLyDo] = useState<{ id: string; value: string }[]>(
        []
    )

    const clearCheckbox = () => {
        setNhapDiemCC(false)
        setNhapDiemTX(false)
        setNhapDiemThi(false)
        setCamThi(false)
    }

    const handleSaveScores = async () => {
        try {
            showSpinner()
            const scoresToUpdate = dataTable.map((record) => {
                const ccScore = scoreCC.find((s) => s.id === record.id)
                const txScore = scoreTX.find((s) => s.id === record.id)
                const thiScore = scoreThi.find((s) => s.id === record.id)
                const camThiScore = scoreCamThi.find((s) => s.id === record.id)
                const hoanThiScore = scoreHoanThi.find(
                    (s) => s.id === record.id
                )
                const dinhChiScore = scoreDinhChi.find(
                    (s) => s.id === record.id
                )
                const lyDoScore = scoreLyDo.find((s) => s.id === record.id)
                return {
                    id: record.id,
                    attendanceScore: ccScore ? ccScore.value : null,
                    midtermScore: txScore ? txScore.value : null,
                    finalScore: thiScore ? thiScore.value : null,
                    examBanned: camThiScore ? camThiScore.value : false,
                    examPostponed: hoanThiScore ? hoanThiScore.value : false,
                    suspended: dinhChiScore ? dinhChiScore.value : false,
                    description: lyDoScore ? lyDoScore.value : '',
                }
            })
            await Promise.all(
                scoresToUpdate.map((score) =>
                    updateStudentSubjectScore({
                        where: { id: score.id },
                        data: {
                            attendanceScore: score.attendanceScore,
                            midtermScore: score.midtermScore,
                            finalScore: score.finalScore,
                            examBanned: score.examBanned,
                            examPostponed: score.examPostponed,
                            suspended: score.suspended,
                            description: score.description,
                        },
                    })
                )
            )
            message.success('Điểm đã được lưu thành công!')
            clearCheckbox()
        } catch (error) {
            message.error('Đã xảy ra lỗi khi lưu điểm, vui lòng thử lại.')
        }
        hideSpinner()
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
    const handleUploadFile = async (file: File) => {
        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })
            if (!response.ok) {
                throw new Error('Upload failed')
            }
            const data = await response.json()
            message.success('File uploaded successfully')
        } catch (error) {
            message.error('Có lỗi xảy ra khi upload file')
        }
    }

    return (
        <div className="flex gap-2 pr-2">
            <Col
                span={4}
                className="min-h-[calc(100vh-64px-24px)] bg-white rounded-lg shadow-sm"
            >
                <LopMonHocItem
                    dataTable={subjectClassData.map((item) => ({
                        id: item.id,
                        name: item.name,
                        code: item.code === null ? undefined : item.code,
                        mainLecturer: item.mainLecturer
                            ? {
                                  userProfile: {
                                      firstName:
                                          item.mainLecturer.userProfile
                                              .firstName,
                                      lastName:
                                          item.mainLecturer.userProfile
                                              .lastName,
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
                                                handleFilterChange(
                                                    'searchText',
                                                    e.target.value
                                                )
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
                                                handleFilterChange(
                                                    'semesterId',
                                                    val
                                                )
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
                                                handleFilterChange(
                                                    'trainingObjectTypeId',
                                                    val
                                                )
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
                                        <Flex
                                            vertical
                                            align="flex-start"
                                            gap={4}
                                        >
                                            <Button
                                                onClick={() => {
                                                    const fileInput =
                                                        document.createElement(
                                                            'input'
                                                        )
                                                    fileInput.type = 'file'
                                                    fileInput.accept =
                                                        '.xls,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel'
                                                    fileInput.onchange = (
                                                        e: any
                                                    ) => {
                                                        if (
                                                            e.target.files?.[0]
                                                        ) {
                                                            handleUploadFile(
                                                                e.target
                                                                    .files[0]
                                                            )
                                                        }
                                                    }
                                                    fileInput.click()
                                                }}
                                                disabled={!selectedFixedClass}
                                                className="w-full flex justify-start"
                                            >
                                                <FileUp />
                                                Nhập điểm từ file
                                            </Button>
                                            <ExportScoreTemplate
                                                selectedFixedClass={
                                                    selectedFixedClass
                                                }
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

                                <Button disabled={!selectedFixedClass}>
                                    <Printer stroke="black" />
                                    In phiếu danh sách thi
                                </Button>
                                <Button disabled={!selectedFixedClass}>
                                    <Printer stroke="black" />
                                    In phiếu điểm và khóa
                                </Button>
                                <Button disabled={!selectedFixedClass}>
                                    <Printer stroke="black" />
                                    In phiếu điểm nháp
                                </Button>
                                <Button
                                    type="primary"
                                    onClick={handleSaveScores}
                                >
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
                                    index +
                                    1 +
                                    (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Mã sinh viên',
                                align: 'center',
                                width: 150,
                                render: (_, record) =>
                                    record.student?.code || '',
                            },
                            {
                                title: 'Họ và tên',
                                dataIndex: 'name',
                                width: 150,
                                render: (text, record) =>
                                    `${record.student?.userProfile?.lastName || ''} ${record.student?.userProfile?.firstName || ''}`,
                            },
                            {
                                title: 'Ngày sinh',
                                dataIndex: 'tenMonHoc',
                                width: 150,
                                render: (text, record) =>
                                    record.student?.userProfile?.dateOfBirth
                                        ? new Date(
                                              record.student.userProfile
                                                  .dateOfBirth
                                          ).toLocaleDateString('vi-VN')
                                        : '',
                            },
                            {
                                title: 'Tên lớp',
                                dataIndex: 'stc',
                                width: 150,
                                align: 'center',
                                render: (text, record) =>
                                    record.student?.fixedClass?.name ||
                                    'Chưa có lớp',
                            },
                            // #region Điểm CC
                            {
                                title: 'Điểm CC',
                                dataIndex: 'attendanceScore',
                                width: 80,
                                align: 'center',
                                render: (_: any, record: any) => {
                                    const isEditable = record.subjectClass
                                        ?.scoreDeadline
                                        ? dayjs().isBefore(
                                              record.subjectClass.scoreDeadline
                                          )
                                        : false

                                    const Score =
                                        scoreCC.find(
                                            (item) => item.id === record.id
                                        )?.value ??
                                        (record.attendanceScore !== undefined
                                            ? Number(record.attendanceScore)
                                            : null)

                                    if (isEditable) {
                                        return (
                                            <Input
                                                type="number"
                                                id={`score-cc-${record.id}`}
                                                style={{ width: '100%' }}
                                                step={0.1}
                                                value={Score || ''}
                                                onChange={(e) => {
                                                    const value = e.target.value
                                                    let newScore =
                                                        Number.parseFloat(value)
                                                    if (newScore > 10)
                                                        newScore = 10
                                                    if (newScore < 0)
                                                        newScore = 0

                                                    setScoreCC((prevScores) => {
                                                        const index =
                                                            prevScores.findIndex(
                                                                (item) =>
                                                                    item.id ===
                                                                    record.id
                                                            )
                                                        if (index > -1) {
                                                            const updated = [
                                                                ...prevScores,
                                                            ]
                                                            updated[index] = {
                                                                ...updated[
                                                                    index
                                                                ],
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
                                                    const currentRowIndex =
                                                        dataTable.findIndex(
                                                            (item) =>
                                                                item.id ===
                                                                record.id
                                                        )

                                                    if (
                                                        e.key === 'ArrowUp' ||
                                                        e.key === 'ArrowDown'
                                                    ) {
                                                        e.preventDefault()
                                                        const direction =
                                                            e.key ===
                                                            'ArrowDown'
                                                                ? 1
                                                                : -1
                                                        const targetRow =
                                                            dataTable[
                                                                currentRowIndex +
                                                                    direction
                                                            ]
                                                        if (targetRow) {
                                                            const nextInput =
                                                                document.getElementById(
                                                                    `score-cc-${targetRow.id}`
                                                                )
                                                            if (nextInput) {
                                                                ;(
                                                                    nextInput as HTMLElement
                                                                ).focus()
                                                            }
                                                        }
                                                    }
                                                }}
                                            />
                                        )
                                    }
                                    return Score !== null ? (
                                        <span>{Score}</span>
                                    ) : null
                                },
                            },
                            // #region Điểm TX
                            {
                                title: 'Điểm TX',
                                dataIndex: 'midtermScore',
                                width: 80,
                                align: 'center',
                                render: (_: any, record: any) => {
                                    const isEditable = record.subjectClass
                                        ?.scoreDeadline
                                        ? dayjs().isBefore(
                                              record.subjectClass.scoreDeadline
                                          )
                                        : false

                                    const Score =
                                        scoreTX.find(
                                            (item) => item.id === record.id
                                        )?.value ??
                                        (record.midtermScore !== undefined
                                            ? Number(record.midtermScore)
                                            : null)

                                    if (isEditable) {
                                        return (
                                            <Input
                                                type="number"
                                                id={`score-tx-${record.id}`}
                                                style={{ width: '100%' }}
                                                step={0.1}
                                                value={Score || ''}
                                                onChange={(e) => {
                                                    const value = e.target.value
                                                    let newScore =
                                                        Number.parseFloat(value)
                                                    if (newScore > 10)
                                                        newScore = 10
                                                    if (newScore < 0)
                                                        newScore = 0

                                                    setScoreTX((prevScores) => {
                                                        const index =
                                                            prevScores.findIndex(
                                                                (item) =>
                                                                    item.id ===
                                                                    record.id
                                                            )
                                                        if (index > -1) {
                                                            const updated = [
                                                                ...prevScores,
                                                            ]
                                                            updated[index] = {
                                                                ...updated[
                                                                    index
                                                                ],
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
                                                    const currentRowIndex =
                                                        dataTable.findIndex(
                                                            (item) =>
                                                                item.id ===
                                                                record.id
                                                        )

                                                    if (
                                                        e.key === 'ArrowUp' ||
                                                        e.key === 'ArrowDown'
                                                    ) {
                                                        e.preventDefault()
                                                        const direction =
                                                            e.key ===
                                                            'ArrowDown'
                                                                ? 1
                                                                : -1
                                                        const targetRow =
                                                            dataTable[
                                                                currentRowIndex +
                                                                    direction
                                                            ]
                                                        if (targetRow) {
                                                            const nextInput =
                                                                document.getElementById(
                                                                    `score-tx-${targetRow.id}`
                                                                )
                                                            if (nextInput) {
                                                                ;(
                                                                    nextInput as HTMLElement
                                                                ).focus()
                                                            }
                                                        }
                                                    }
                                                }}
                                            />
                                        )
                                    }
                                    return Score !== null ? (
                                        <span>{Score}</span>
                                    ) : null
                                },
                            },
                            // #region Điểm Thi
                            {
                                title: 'Điểm thi',
                                dataIndex: 'examScore',
                                width: 80,
                                align: 'center',
                                render: (_: any, record: any) => {
                                    const isEditable = record.subjectClass
                                        ?.examScoreDeadline
                                        ? dayjs().isBefore(
                                              record.subjectClass
                                                  .examScoreDeadline
                                          )
                                        : false

                                    const Score =
                                        scoreThi.find(
                                            (item) => item.id === record.id
                                        )?.value ??
                                        (record.examScore !== undefined
                                            ? Number(record.examScore)
                                            : null)

                                    if (isEditable) {
                                        return (
                                            <Input
                                                type="number"
                                                id={`score-thi-${record.id}`}
                                                style={{ width: '100%' }}
                                                step={0.1}
                                                value={Score || ''}
                                                onChange={(e) => {
                                                    const value = e.target.value
                                                    let newScore =
                                                        Number.parseFloat(value)
                                                    if (newScore > 10)
                                                        newScore = 10
                                                    if (newScore < 0)
                                                        newScore = 0

                                                    setScoreThi(
                                                        (prevScores) => {
                                                            const index =
                                                                prevScores.findIndex(
                                                                    (item) =>
                                                                        item.id ===
                                                                        record.id
                                                                )
                                                            if (index > -1) {
                                                                const updated =
                                                                    [
                                                                        ...prevScores,
                                                                    ]
                                                                updated[index] =
                                                                    {
                                                                        ...updated[
                                                                            index
                                                                        ],
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
                                                        }
                                                    )
                                                }}
                                                onKeyDown={(e) => {
                                                    const currentRowIndex =
                                                        dataTable.findIndex(
                                                            (item) =>
                                                                item.id ===
                                                                record.id
                                                        )

                                                    if (
                                                        e.key === 'ArrowUp' ||
                                                        e.key === 'ArrowDown'
                                                    ) {
                                                        e.preventDefault()
                                                        const direction =
                                                            e.key ===
                                                            'ArrowDown'
                                                                ? 1
                                                                : -1
                                                        const targetRow =
                                                            dataTable[
                                                                currentRowIndex +
                                                                    direction
                                                            ]
                                                        if (targetRow) {
                                                            const nextInput =
                                                                document.getElementById(
                                                                    `score-thi-${targetRow.id}`
                                                                )
                                                            if (nextInput) {
                                                                ;(
                                                                    nextInput as HTMLElement
                                                                ).focus()
                                                            }
                                                        }
                                                    }
                                                }}
                                            />
                                        )
                                    }
                                    return Score !== null ? (
                                        <span>{Score}</span>
                                    ) : null
                                },
                            },
                            {
                                title: 'Điểm cộng',
                                dataIndex: 'code',
                                width: 100,
                                align: 'center',
                                render: (text, record) => {
                                    if (nhapDiemCong) {
                                        return (
                                            <Input
                                                type="number"
                                                style={{
                                                    width: '100%',
                                                }}
                                                onChange={(e) => {
                                                    // Handle input change for bonus score
                                                }}
                                                onBlur={(e) => {
                                                    const { value } = e.target
                                                    const numericValue =
                                                        Number.parseFloat(value)
                                                    const regex =
                                                        /^(\d{1,2}(\.\d)?|10)$/
                                                    if (
                                                        !regex.test(value) ||
                                                        Number.isNaN(
                                                            numericValue
                                                        ) ||
                                                        numericValue < 0 ||
                                                        numericValue > 10
                                                    ) {
                                                        e.target.style.borderColor =
                                                            'red'
                                                        message.error(
                                                            'Điểm phải là số từ 0 đến 10 với tối đa 1 chữ số sau dấu .'
                                                        )
                                                    } else {
                                                        e.target.style.borderColor =
                                                            ''
                                                    }
                                                }}
                                            />
                                        )
                                    }
                                    return ''
                                },
                            },
                            {
                                title: 'Điểm HP',
                                dataIndex: 'finalScore',
                                width: 80,
                                align: 'center',
                            },
                            {
                                title: 'Điểm hệ 4',
                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'Điểm chữ',
                                dataIndex: '',
                                width: 100,
                                align: 'center',
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
                                        scoreCamThi.find(
                                            (item) => item.id === record.id
                                        )?.value ??
                                        record.examBanned ??
                                        false
                                    return (
                                        <Checkbox
                                            checked={isCheck}
                                            onChange={(e) => {
                                                const newValue =
                                                    e.target.checked
                                                setScoreCamThi((prevScores) => {
                                                    const index =
                                                        prevScores.findIndex(
                                                            (item) =>
                                                                item.id ===
                                                                record.id
                                                        )
                                                    if (index > -1) {
                                                        const updated = [
                                                            ...prevScores,
                                                        ]
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
                                        scoreHoanThi.find(
                                            (item) => item.id === record.id
                                        )?.value ??
                                        record.examPostponed ??
                                        false
                                    return (
                                        <Checkbox
                                            checked={isCheck}
                                            onChange={(e) => {
                                                const newValue =
                                                    e.target.checked
                                                setScoreHoanThi(
                                                    (prevScores) => {
                                                        const index =
                                                            prevScores.findIndex(
                                                                (item) =>
                                                                    item.id ===
                                                                    record.id
                                                            )
                                                        if (index > -1) {
                                                            const updated = [
                                                                ...prevScores,
                                                            ]
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
                                                    }
                                                )
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
                                        scoreDinhChi.find(
                                            (item) => item.id === record.id
                                        )?.value ??
                                        record.examPostponed ??
                                        false
                                    return (
                                        <Checkbox
                                            checked={isCheck}
                                            onChange={(e) => {
                                                const newValue =
                                                    e.target.checked
                                                setscoreDinhChi(
                                                    (prevScores) => {
                                                        const index =
                                                            prevScores.findIndex(
                                                                (item) =>
                                                                    item.id ===
                                                                    record.id
                                                            )
                                                        if (index > -1) {
                                                            const updated = [
                                                                ...prevScores,
                                                            ]
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
                                                    }
                                                )
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
                                            scoreLyDo.find(
                                                (item) => item.id === record.id
                                            )?.value ??
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
                                                    const newNote =
                                                        e.target.value
                                                    setScoreLyDo(
                                                        (prevScores) => {
                                                            const index =
                                                                prevScores.findIndex(
                                                                    (item) =>
                                                                        item.id ===
                                                                        record.id
                                                                )
                                                            if (index > -1) {
                                                                const updated =
                                                                    [
                                                                        ...prevScores,
                                                                    ]
                                                                updated[index] =
                                                                    {
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
                                                        }
                                                    )
                                                }}
                                            />
                                        )
                                    }
                                    return record.description || ''
                                },
                            },
                            // {
                            //     title: 'Thao tác',
                            //     width: 100,
                            //     align: 'center',
                            //     fixed: 'right',
                            //     render: (_, { id }) => {
                            //         if (id) {
                            //             return (
                            //                 <Row
                            //                     className="flex justify-center items-center gap-2 text-[#028850]"
                            //                     onClick={handleModal}
                            //                 >
                            //                     <CalendarPlus
                            //                         size={16}
                            //                         strokeWidth={2}
                            //                     />
                            //                     Nhập điểm
                            //                 </Row>
                            //             )
                            //         }
                            //         return ''
                            //     },
                            // },
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
