import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useFindManyFixedClass,
    useFindManySubjectClassStudent,
    useUpdateTrainingCourse,
    useFindManyTrainingObjectType,
    useFindManyTrainingCourse,
    useFindManySemester,
    useFindManySubjectClass,
    useCountSubjectClass,
    useFindManySchoolYear,
} from '@workspace/db/hooks'
import type { TrainingObjectType } from '@workspace/db'
import { CalendarPlus, Search, Save } from 'lucide-react'
import {
    Button,
    Checkbox,
    Col,
    Flex,
    Form,
    Input,
    Row,
    Tag,
    message,
} from 'antd'
import type { CheckboxChangeEvent } from 'antd'
import _, { includes } from 'lodash'
import type React from 'react'
import { useCallback, useState } from 'react'
import Select from '@components/commons/select'
import EditIcon from '@components/icons/edit'
import { CalendarOutlined } from '@ant-design/icons'
import { PutOpenClassModal } from '@components/modal'
import { useDisclosure } from 'react-hook-disclosure-modal'
import FilterSubjectClass from '@components/filter/filter-lop-mon-hoc'
import LopMonHocItem from './lop-mon-hoc'
// const { Option } = Select;
interface FilterProps {
    schoolYearId: string | null //Năm học
    semesterId: string | null //Học kỳ
    KhoaId: string | null //Khoa
    BoMonId: string | null //Bộ môn
    trainingObjectId: string | null //Đối tượng đào tạo
    examTypeId: string | null //Hình thức thi
    LectureId: string | null //Giảng viên
    searchText: string | null
    trainingObjectTypeId: string | null
    subjectClassId: string | null
    fixedClassId: string | null
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
        LectureId: null,
        fixedClassId: null,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { onOpen, onClose } = useDisclosure<string>({
        tag: PutOpenClassModal.name,
    })

    const handleModal = () => {
        onOpen()
    }

    const { mutateAsync: updateTrainingCourse } = useUpdateTrainingCourse()
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

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse()

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
            deletedAt: null,
        },
        include: {
            subject: {
                include: {
                    managementOrganization: { include: { parent: true } },
                },
            },
            mainLecturer: {
                include: { userProfile: true },
            },
            extraLecturer: {
                include: { userProfile: true },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: dataTable = [], refetch } = useFindManySubjectClassStudent({
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
        // orderBy: {
        //     student: {
        //         userProfile: {
        //             firstName: 'asc',
        //             lastName: 'asc',
        //         },
        //     },
        // },
        // take: numberOfPages,
        // skip: (currentPage - 1) * numberOfPages,
    })

    console.log('subjectClassData', subjectClassData)
    console.log('dataTable', selectedFixedClass, dataTable)

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        [refetch]
    )

    const { data: count } = useCountSubjectClass({
        where: {
            ...(filters.searchText && filters.searchText !== ''
                ? { name: { contains: filters.searchText } }
                : {}),
            ...(filters.searchText && filters.searchText !== ''
                ? { code: { contains: filters.searchText } }
                : {}),
            deletedAt: null,
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
    const handleChangeNhapDiemCong = (e: CheckboxChangeEvent) => {
        setNhapDiemCong(e.target.checked)
    }
    const handleChangeCamThi = (e: CheckboxChangeEvent) => {
        setCamThi(e.target.checked)
    }
    const handleFilterApply = (newFilters: Partial<FilterProps>) => {
        setFilters((prev) => {
            const updatedFilters = { ...prev, ...newFilters };
            console.log('Filters applied:', updatedFilters);
            debouncedRefetch();
            return updatedFilters;
        });
    };
    // #endregion
    const rowSelection = {
        selectedRowKeys,
        onChange: (selectedKeys: any) => {
            setSelectedRowKeys(selectedKeys)
            console.log(selectedKeys)
        },
    }

    return (
        <div>
            <Row>
                <Col span={4} className="flex">
                    <LopMonHocItem
                        dataTable={subjectClassData.map(item => ({
                            id: item.id,
                            name: item.name,
                            code: item.code === null ? undefined : item.code,
                            mainLecturer: item.mainLecturer 
                                ? { 
                                    userProfile: { 
                                        firstName: item.mainLecturer.userProfile.firstName, 
                                        lastName: item.mainLecturer.userProfile.lastName 
                                    } 
                                  }
                                : { userProfile: { firstName: '', lastName: '' } },
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
                                                name="schoolYearId"
                                                labelCol={{ span: 24 }}
                                                wrapperCol={{ span: 24 }}
                                                labelAlign="left"
                                            >
                                                <Select
                                                    placeholder="Năm học"
                                                    options={schoolYearData.map(
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
                                                    allowClear
                                                    onChange={(val) => {
                                                        handleFilterChange(
                                                            'schoolYearId',
                                                            val
                                                        )
                                                        refetchSemester()
                                                    }}
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
                                                <Select
                                                    placeholder="Học kỳ"
                                                    options={semesterData.map(
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
                                                            'semesterId',
                                                            val
                                                        )
                                                    }
                                                    allowClear
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

                                <Col span={6}>
                                    <Flex justify="end" gap={4}>
                                        <Button
                                            type="primary"
                                            className="h-[40px]"
                                        >
                                            <Save stroke="white" />
                                            Lưu
                                        </Button>
                                        <Button
                                            type="primary"
                                            className="h-[40px]"
                                        >
                                            <EditIcon stroke="white" />
                                            Nhập từ file danh sách
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
                                    <Checkbox
                                        checked={nhapDiemCong}
                                        onChange={handleChangeNhapDiemCong}
                                        className="text-sm"
                                    >
                                        Nhập điểm cộng
                                    </Checkbox>
                                    <Checkbox
                                        checked={camThi}
                                        onChange={handleChangeCamThi}
                                        className="text-sm"
                                    >
                                        Cấm thi/Hoãn thi/Đình chỉ
                                    </Checkbox>
                                </Col>
                                {/* <Col span={4} className="flex justify-end">
                                    <Button
                                        type="primary"
                                        className="h-[40px]"
                                        onClick={handleModal}
                                    >
                                        <CalendarOutlined />
                                        Lưu
                                    </Button>
                                </Col> */}
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
                                    {
                                        title: 'Điểm CC',
                                        dataIndex: 'code',
                                        width: 80,
                                        align: 'center',
                                        render: (text, record) => {
                                            if (nhapDiemCC) {
                                                return (
                                                    <Input
                                                        type="number"
                                                        style={{
                                                            width: '100%',
                                                        }}
                                                        min={0.0}
                                                        max={10}
                                                        step="0.1"
                                                        onChange={(e) => {
                                                            // Handle input change for CC score
                                                        }}
                                                        onBlur={(e) => {
                                                            const { value } =
                                                                e.target
                                                            const numericValue =
                                                                parseFloat(
                                                                    value
                                                                )
                                                            const regex =
                                                                /^(\d{1,2}(\.\d)?|10)$/
                                                            if (
                                                                !regex.test(
                                                                    value
                                                                ) ||
                                                                isNaN(
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
                                            } else {
                                                return (
                                                    record.attendanceScore || ''
                                                )
                                            }
                                        },
                                    },
                                    {
                                        title: 'Điểm TX',
                                        dataIndex: 'code',
                                        width: 80,
                                        align: 'center',
                                        render: (text, record) => {
                                            if (nhapDiemTX) {
                                                return (
                                                    <Input
                                                        type="number"
                                                        style={{
                                                            width: '100%',
                                                        }}
                                                        onChange={(e) => {
                                                            // Handle input change for TX score
                                                        }}
                                                        onBlur={(e) => {
                                                            const { value } =
                                                                e.target
                                                            const numericValue =
                                                                parseFloat(
                                                                    value
                                                                )
                                                            const regex =
                                                                /^(\d{1,2}(\.\d)?|10)$/
                                                            if (
                                                                !regex.test(
                                                                    value
                                                                ) ||
                                                                isNaN(
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
                                            } else {
                                                return record.midtermScore || ''
                                            }
                                        },
                                    },
                                    {
                                        title: 'Điểm thi',
                                        dataIndex: 'code',
                                        width: 80,
                                        align: 'center',
                                        render: (text, record) => {
                                            if (nhapDiemThi) {
                                                return (
                                                    <Input
                                                        type="number"
                                                        style={{
                                                            width: '100%',
                                                        }}
                                                        onChange={(e) => {
                                                            // Handle input change for exam score
                                                        }}
                                                        onBlur={(e) => {
                                                            const { value } =
                                                                e.target
                                                            const numericValue =
                                                                parseFloat(
                                                                    value
                                                                )
                                                            const regex =
                                                                /^(\d{1,2}(\.\d)?|10)$/
                                                            if (
                                                                !regex.test(
                                                                    value
                                                                ) ||
                                                                isNaN(
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
                                            } else {
                                                return record.finalScore || ''
                                            }
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
                                                                parseFloat(
                                                                    value
                                                                )
                                                            const regex =
                                                                /^(\d{1,2}(\.\d)?|10)$/
                                                            if (
                                                                !regex.test(
                                                                    value
                                                                ) ||
                                                                isNaN(
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
                                            } else {
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
                                    {
                                        title: 'Cấm thi',
                                        dataIndex: 'code',
                                        width: 80,
                                        align: 'center',
                                        render: (text, record) => {
                                            return (
                                                <Checkbox
                                                    onChange={(e) => {
                                                        // Handle checkbox change for exam prohibition reason
                                                    }}
                                                    disabled={!camThi}
                                                ></Checkbox>
                                            )
                                        },
                                    },
                                    {
                                        title: 'Hoãn thi',
                                        dataIndex: 'code',
                                        width: 80,
                                        align: 'center',
                                        render: (text, record) => {
                                            return (
                                                <Checkbox
                                                    onChange={(e) => {
                                                        // Handle checkbox change for exam prohibition reason
                                                    }}
                                                    disabled={!camThi}
                                                ></Checkbox>
                                            )
                                        },
                                    },
                                    {
                                        title: 'Đình chỉ',
                                        dataIndex: 'code',
                                        width: 80,
                                        align: 'center',
                                        render: (text, record) => {
                                            return (
                                                <Checkbox
                                                    onChange={(e) => {
                                                        // Handle checkbox change for exam prohibition reason
                                                    }}
                                                    disabled={!camThi}
                                                ></Checkbox>
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
                                                return (
                                                    <Input
                                                        placeholder="Nhập ghi chú lý do"
                                                        style={{
                                                            width: '100%',
                                                        }}
                                                        onChange={(e) => {
                                                            // Handle input change for bonus score
                                                        }}
                                                    />
                                                )
                                            } else {
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
