import Select from '@components/commons/select'
import Table from '@components/commons/table'
import FilterSubjectClass from '@components/filter/filter-lop-mon-hoc'
import { PutOpenClassModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { TrainingObjectType } from '@workspace/db'
import {
    useCountStudentSubjectScore,
    useFindManySchoolYear,
    useFindManySemester,
    useFindManyStudentSubjectScore,
    useFindManySubjectClass, useFindManyTrainingObjectType,
    useUpdateTrainingCourse,
    useUpdateStudentSubjectScore
} from '@workspace/db/hooks'
import {
    Button,
    Checkbox,
    type CheckboxChangeEvent,
    Col,
    Flex,
    Form,
    Input,
    Row,
    message
} from 'antd'
import _ from 'lodash'
import { Download, Printer, Save, Search, Upload } from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import LopMonHocItem from './lop-mon-hoc'
import TreeSelectSemester from '@components/commons/semester-select/TreeSelectSemester'

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

    const { onOpen, onClose } = useDisclosure<string>({
        tag: PutOpenClassModal.name,
    })

    const handleModal = () => {
        onOpen()
    }

    const { mutateAsync: updateTrainingCourse } = useUpdateTrainingCourse()
    const { mutateAsync: updateStudentSubjectScore } = useUpdateStudentSubjectScore()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateTrainingCourse({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    const { data: trainingObjectTypeData = [] } =
        useFindManyTrainingObjectType()


    const { data: schoolYearData = [] } = useFindManySchoolYear({
        orderBy: {
            startDate: 'desc',
        },
    })
    const { data: semesterData = [], refetch: refetchSemester } =
        useFindManySemester({
            where: {
                schoolYearId: filters.schoolYearId || undefined,
            },
            orderBy: {
                startDate: 'desc',
            },
        })

    //#region Mới
    /* Mới */

    const { data: subjectClassData = [] } = useFindManySubjectClass({
        where: {
            ...(filters.searchText && filters.searchText !== ''
                ? {
                    OR: [
                        { name: { contains: filters.searchText } },
                        { code: { contains: filters.searchText } },
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

    // console.log('subjectClassData', subjectClassData)
    // console.log('dataTable', selectedFixedClass, dataTable)

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

    const { data: count } = useCountStudentSubjectScore({
        where: {
            subjectClassId: selectedFixedClass || ''
        },
    })

    const handleChangeFixedClass = async (id: string) => {
        try {
            console.log('Selected Fixed Class ID:', id)
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
            console.log('Filters applied:', updatedFilters)
            debouncedRefetch()
            return updatedFilters
        })
    }
    // #endregion
    const rowSelection = {
        selectedRowKeys,
        onChange: (selectedKeys: any) => {
            setSelectedRowKeys(selectedKeys)
            console.log(selectedKeys)
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
                const hoanThiScore = scoreHoanThi.find((s) => s.id === record.id)
                const dinhChiScore = scoreDinhChi.find((s) => s.id === record.id)
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
            console.error('Error saving scores:', error)
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
            console.log('newScoreCC', newScoreCC)
            console.log('newScoreTX', newScoreTX)
            console.log('newScoreThi', newScoreThi)
        }
    }, [dataTable, selectedFixedClass])

    //#region Upload file nhập điểm
    const handleUploadFile = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                throw new Error('Upload failed');
            }
            const data = await response.json();
            message.success('File uploaded successfully');
            console.log('Upload result:', data);
        } catch (error) {
            console.error(error);
            message.error('Có lỗi xảy ra khi upload file');
        }
    }

    return (
        <div>
            <Row>
                <Col span={4} className="flex">
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
                
                <Col span={20} className="flex justify-end">
                    <Row>
                        <Col span={24}>
                            <Row
                                gutter={[16, 16]}
                                align="top"
                                justify="space-between"
                            >
                                <Col span={12}>
                                    <Flex>
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
                                                    style={{
                                                        height: 40,
                                                    }}
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
                                                    style={{
                                                        height: 40,
                                                    }}
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
                                                        (
                                                            i: TrainingObjectType
                                                        ) => ({
                                                            value: i.id,
                                                            label: i.name,
                                                        })
                                                    )}
                                                    style={{
                                                        height: 40,
                                                    }}
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
                                                onFilterChange={
                                                    handleFilterChange
                                                }
                                                filters={filters}
                                                onApply={handleFilterApply}
                                            />
                                        </Col>
                                    </Flex>
                                </Col>
                            </Row>
                            <Row
                                gutter={[16, 16]}
                                align="top"
                                justify="space-between">
                                <Col span={24} className="flex justify-end">
                                    <Flex>
                                        <Button
                                            // className="h-[40px]"
                                            disabled={!selectedFixedClass}
                                        >
                                            <Download stroke="black" 
                                            />
                                            Tải danh sách
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                const fileInput = document.createElement('input');
                                                fileInput.type = 'file';
                                                fileInput.accept = '.xls,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel';
                                                fileInput.onchange = (e: any) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        handleUploadFile(e.target.files[0]);
                                                    }
                                                };
                                                fileInput.click();
                                            }}
                                             disabled={!selectedFixedClass}
                                        >
                                            <Upload stroke="black" />
                                            Nhập file
                                        </Button>
                                        <Button
                                            // className="h-[40px]"
                                             disabled={!selectedFixedClass}
                                        >
                                            <Printer stroke="black" />
                                            In phiếu điểm và khóa
                                        </Button>
                                        <Button
                                            // className="h-[40px]"
                                             disabled={!selectedFixedClass}
                                        >
                                            <Printer stroke="black" />
                                            In phiếu điểm nháp
                                        </Button>
                                        <Button
                                            type="primary"
                                            // className="h-[40px]"
                                            onClick={handleSaveScores}
                                        >
                                            <Save stroke="white" />
                                            Lưu
                                        </Button>
                                    </Flex>
                                </Col>
                            </Row>
                            <Row className="mt-4">
                                <Col span={20} className="flex">
                                    <Checkbox
                                        checked={nhapDiemCC}
                                        onChange={handleChangeNhapDiemCC}
                                        className="text-sm"
                                    >
                                        Nhập điểm CC
                                    </Checkbox>
                                    <Checkbox
                                        checked={nhapDiemTX}
                                        onChange={handleChangeNhapDiemTX}
                                        className="text-sm"
                                    >
                                        Nhập điểm TX
                                    </Checkbox>
                                    <Checkbox
                                        checked={nhapDiemThi}
                                        onChange={handleChangeNhapDiemThi}
                                        className="text-sm"
                                    >
                                        Nhập điểm thi
                                    </Checkbox>
                                    {/* <Checkbox
                                        checked={nhapDiemCong}
                                        onChange={handleChangeNhapDiemCong}
                                        className="text-sm"
                                    >
                                        Nhập điểm cộng
                                    </Checkbox> */}
                                    <Checkbox
                                        checked={camThi}
                                        onChange={handleChangeCamThi}
                                        className="text-sm"
                                    >
                                        Cấm thi/Hoãn thi/Đình chỉ
                                    </Checkbox>
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
                                            (currentPage - 1) *
                                            DEFAULT_PAGINATE_SIZE,
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
                                            record.student?.userProfile
                                                ?.dateOfBirth
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
                                        render: (text, record) => {
                                            if (nhapDiemCC) {
                                                const Score =
                                                    scoreCC.find((item) => item.id === record.id)?.value ?? record.attendanceScore ?? '';
                                                return (
                                                    <Input
                                                        type="number"
                                                        style={{
                                                            width: '100%',
                                                        }}
                                                        value={Score}
                                                        onChange={(e) => {
                                                            const newScore = e.target.value
                                                            setScoreCC((prevScores) => {
                                                                const index = prevScores.findIndex((item) => item.id === record.id)
                                                                if (index > -1) {
                                                                    const updated = [...prevScores]
                                                                    updated[index] = { ...updated[index], value: Number(newScore) }
                                                                    return updated
                                                                }
                                                                return [...prevScores, { id: record.id, value: Number(newScore) }]
                                                            })
                                                        }}
                                                        onBlur={(e) => {
                                                            const { value } = e.target
                                                            const numericValue = Number.parseFloat(value)
                                                            const regex = /^(\d{1,2}(\.\d)?|10)$/
                                                            if (
                                                                !regex.test(value) ||
                                                                Number.isNaN(numericValue) ||
                                                                numericValue < 0 ||
                                                                numericValue > 10
                                                            ) {
                                                                e.target.style.borderColor = 'red'
                                                                message.error(
                                                                    'Điểm phải là số từ 0 đến 10 với tối đa 1 chữ số sau dấu .'
                                                                )
                                                            } else {
                                                                e.target.style.borderColor = ''
                                                            }
                                                        }}
                                                    />
                                                )
                                            }
                                            return record.attendanceScore || ''
                                        },
                                    },
                                    // #region Điểm TX
                                    {
                                        title: 'Điểm TX',
                                        dataIndex: 'midtermScore',
                                        width: 80,
                                        align: 'center',
                                        render: (text, record) => {
                                            if (nhapDiemTX) {
                                                {
                                                    const Score =
                                                        scoreTX.find((item) => item.id === record.id)?.value ?? record.midtermScore ?? '';
                                                    return (
                                                        <Input
                                                            type="number"
                                                            style={{
                                                                width: '100%',
                                                            }}

                                                            value={Score}
                                                            onChange={(e) => {
                                                                // Handle input change for TX score
                                                                const newScore = e.target.value;
                                                                setScoreTX((prevScores) => {
                                                                    const index = prevScores.findIndex((item) => item.id === record.id);
                                                                    if (index > -1) {
                                                                        const updated = [...prevScores];
                                                                        updated[index] = { id: record.id, value: Number(newScore) };
                                                                        return updated;
                                                                    }
                                                                    return [...prevScores, { id: record.id, value: Number(newScore) }];
                                                                });
                                                            }}
                                                            onBlur={(e) => {
                                                                const { value } = e.target;
                                                                const numericValue = Number.parseFloat(value);
                                                                const regex = /^(\d{1,2}(\.\d)?|10)$/;
                                                                if (
                                                                    !regex.test(value) ||
                                                                    Number.isNaN(numericValue) ||
                                                                    numericValue < 0 ||
                                                                    numericValue > 10
                                                                ) {
                                                                    e.target.style.borderColor = 'red';
                                                                    message.error('Điểm phải là số từ 0 đến 10 với tối đa 1 chữ số sau dấu .');
                                                                } else {
                                                                    e.target.style.borderColor = '';
                                                                }
                                                            }}
                                                        />
                                                    );
                                                }
                                            }
                                            return record.midtermScore || ''
                                        },
                                    },
                                    // #region Điểm Thi
                                    {
                                        title: 'Điểm thi',
                                        dataIndex: 'examScore',
                                        width: 80,
                                        align: 'center',
                                        render: (text, record) => {
                                            if (nhapDiemThi) {
                                                const Score =
                                                    scoreThi.find((item) => item.id === record.id)?.value ?? record.examScore ?? '';
                                                return (
                                                    <Input
                                                        type="number"
                                                        style={{
                                                            width: '100%',
                                                        }}

                                                        value={Score}
                                                        onChange={(e) => {
                                                            const newScore = e.target.value
                                                            setScoreThi((prevScores) => {
                                                                const index = prevScores.findIndex((item) => item.id === record.id)
                                                                if (index > -1) {
                                                                    const updated = [...prevScores]
                                                                    updated[index] = { ...updated[index], value: Number(newScore) }
                                                                    return updated
                                                                }
                                                                return [...prevScores, { id: record.id, value: Number(newScore) }]
                                                            })
                                                        }}
                                                        onBlur={(e) => {
                                                            const { value } =
                                                                e.target
                                                            const numericValue =
                                                                Number.parseFloat(
                                                                    value
                                                                )
                                                            const regex =
                                                                /^(\d{1,2}(\.\d)?|10)$/
                                                            if (
                                                                !regex.test(
                                                                    value
                                                                ) ||
                                                                Number.isNaN(
                                                                    numericValue
                                                                ) ||
                                                                numericValue <
                                                                0 ||
                                                                numericValue >
                                                                10
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
                                            return record.finalScore || ''
                                        },
                                    },
                                    {
                                        title: 'Điểm cộng',
                                        dataIndex: 'code',
                                        width: 80,
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
                                                            const { value } =
                                                                e.target
                                                            const numericValue =
                                                                Number.parseFloat(
                                                                    value
                                                                )
                                                            const regex =
                                                                /^(\d{1,2}(\.\d)?|10)$/
                                                            if (
                                                                !regex.test(
                                                                    value
                                                                ) ||
                                                                Number.isNaN(
                                                                    numericValue
                                                                ) ||
                                                                numericValue <
                                                                0 ||
                                                                numericValue >
                                                                10
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
                                            else {
                                                return ''
                                            }
                                        },
                                    },
                                    {
                                        title: 'Điểm HP',
                                        dataIndex: 'code',
                                        width: 80,
                                        align: 'center',
                                    },
                                    // #region Cấm thi/Hoãn thi/Đình chỉ
                                    {
                                        title: 'Cấm thi',
                                        dataIndex: 'code',
                                        width: 80,
                                        align: 'center',
                                        render: (text, record) => {
                                            const isCheck =
                                                scoreCamThi.find((item) => item.id === record.id)?.value ?? record.examBanned ?? false;
                                            return (
                                                <Checkbox
                                                    checked={isCheck}
                                                    onChange={(e) => {
                                                        const newValue = e.target.checked;
                                                        setScoreCamThi((prevScores) => {
                                                            const index = prevScores.findIndex((item) => item.id === record.id);
                                                            if (index > -1) {
                                                                const updated = [...prevScores];
                                                                updated[index] = { id: record.id, value: newValue };
                                                                return updated;
                                                            }
                                                            return [...prevScores, { id: record.id, value: newValue }];
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
                                        title: 'Hoãn thi',
                                        dataIndex: 'code',
                                        width: 80,
                                        align: 'center',
                                        render: (text, record) => {
                                            const isCheck =
                                                scoreHoanThi.find((item) => item.id === record.id)?.value ?? record.examPostponed ?? false;
                                            return (
                                                <Checkbox
                                                    checked={isCheck}
                                                    onChange={(e) => {
                                                        const newValue = e.target.checked;
                                                        setScoreHoanThi((prevScores) => {
                                                            const index = prevScores.findIndex((item) => item.id === record.id);
                                                            if (index > -1) {
                                                                const updated = [...prevScores];
                                                                updated[index] = { id: record.id, value: newValue };
                                                                return updated;
                                                            }
                                                            return [...prevScores, { id: record.id, value: newValue }];
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
                                        title: 'Đình chỉ',
                                        dataIndex: 'code',
                                        width: 80,
                                        align: 'center',
                                        render: (text, record) => {
                                            const isCheck =
                                                scoreDinhChi.find((item) => item.id === record.id)?.value ?? record.examPostponed ?? false;
                                            return (
                                                <Checkbox
                                                    checked={isCheck}
                                                    onChange={(e) => {
                                                        const newValue = e.target.checked;
                                                        setscoreDinhChi((prevScores) => {
                                                            const index = prevScores.findIndex((item) => item.id === record.id);
                                                            if (index > -1) {
                                                                const updated = [...prevScores];
                                                                updated[index] = { id: record.id, value: newValue };
                                                                return updated;
                                                            }
                                                            return [...prevScores, { id: record.id, value: newValue }];
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
                                        title: 'Ghi chú lý do',
                                        dataIndex: 'code',
                                        width: 150,
                                        align: 'center',
                                        render: (text, record) => {
                                            if (camThi) {
                                                const note =
                                                    scoreLyDo.find((item) => item.id === record.id)?.value ?? record.description ?? '';
                                                return (
                                                    <Input
                                                        placeholder="Nhập ghi chú lý do"
                                                        style={{
                                                            width: '100%',
                                                        }}
                                                        value={note}
                                                        onChange={(e) => {
                                                            // Handle input change for bonus score
                                                            const newNote = e.target.value;
                                                            setScoreLyDo((prevScores) => {
                                                                const index = prevScores.findIndex((item) => item.id === record.id);
                                                                if (index > -1) {
                                                                    const updated = [...prevScores];
                                                                    updated[index] = { id: record.id, value: newNote };
                                                                    return updated;
                                                                }
                                                                return [...prevScores, { id: record.id, value: newNote }];
                                                            }
                                                            )
                                                        }
                                                        }

                                                    />
                                                )
                                            }
                                            else {
                                                return record.description || ''
                                            }
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
                    </Row>
                </Col>
            </Row>
        </div>
    )
}

SubjectClassScore.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
