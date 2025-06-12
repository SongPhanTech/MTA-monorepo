import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {

    useFindManySubjectClassStudent,
    useUpdateTrainingCourse,
    useFindManyTrainingObjectType,
    useFindManyTrainingCourse,
    useFindManySemester,
    useFindManySubjectClass,
    useCountSubjectClass,
    useFindManyFixedClass,
    useFindManyStudent,
    useFindFirstSemester
} from '@workspace/db/hooks'
import type { TrainingObjectType, Semester } from '@workspace/db'
import { CalendarPlus, Search, Save } from 'lucide-react'
import { Button, Checkbox, Col, Flex, Form, Input, Row, Tag, message } from 'antd'
import type { CheckboxChangeEvent } from 'antd'
import _, { includes } from 'lodash'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import Select from '@components/commons/select'
import EditIcon from '@components/icons/edit'
import { CalendarOutlined } from '@ant-design/icons'
import { PutOpenClassModal } from '@components/modal'
import { useDisclosure } from 'react-hook-disclosure-modal'
import FilterSubjectClass from '@components/filter/filter-lop-mon-hoc'
import LopBienCheItem from './lop-bien-che'
// const { Option } = Select;
interface FilterProps {
    searchText: string | null
    semesterId: string | null
    trainingObjectTypeId: string | null
    subjectClassId: string | null
}

export default function SubjectClassScore() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const [selectedFixedClass, setSelectedFixedClass] = useState<string | undefined>(undefined)
    const [selectedSemesterId, setSelectedSemesterId] = useState<string | undefined>(undefined)
    const [selectedSemester, setSelectedSemester] = useState<Semester | undefined>(undefined)
    const [arrMonth, setArrMonth] = useState<any[]>([])
    const [suaDiemCu, setSuaDiemCu] = useState<boolean>(false)
    const [nhapDiemMoi, setNhapDiemMoi] = useState<boolean>(false)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        semesterId: null,
        trainingObjectTypeId: null,
        subjectClassId: null,
    })

    const handleChangeSuaDiemCu = (e: CheckboxChangeEvent) => {
        setSuaDiemCu(e.target.checked)
    }
    const handleChangeNhapDiemMoi = (e: CheckboxChangeEvent) => {
        setNhapDiemMoi(e.target.checked)
    }
    const { showSpinner, hideSpinner } = useSpinner()

    const { onOpen, onClose } = useDisclosure<string>({
        tag: PutOpenClassModal.name,
    })

    const handleModal = () => {
        onOpen()
    }

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    const { data: trainingObjectTypeData = [] } = useFindManyTrainingObjectType()

    const { data: semesterData = [] } = useFindManySemester(
        {
            where: {
                deletedAt: null,
            },
        }
    )

    const { data: subjectClassData = [] } = useFindManyFixedClass({
        where: {
            ...(
                filters.searchText && filters.searchText !== '' ? {
                    OR: [
                        { name: { contains: filters.searchText } },
                        { code: { contains: filters.searchText } },
                    ],
                } : {}
            ),
            // ...(filters.semesterId ? { semesterId: filters.semesterId } : {}),
            // ...(filters.subjectClassId ? { id: filters.subjectClassId } : {}),
            deletedAt: null,
        },

        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: dataTable = [], refetch } = useFindManyStudent({
        where: {
            // ...(
            //     filters.searchText && filters.searchText !== '' ? {
            //         OR: [
            //             // { name: { contains: filters.searchText } },
            //             { code: { contains: filters.searchText } },
            //         ],
            //     } : {}
            // ),
            fixedClassId: selectedFixedClass || "",
            deletedAt: null,
        },
        include: {
            userProfile: true,
            fixedClass: true,
        },
        orderBy: {
           userProfile: {
                // lastName: 'asc',
                firstName: 'asc',
            },
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,

    })



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
            showSpinner()
            console.log('Selected Fixed Class ID:', id)
            if (id[0].includes('class-')) {
                console.log('Selected Fixed Class ID:', id[0].replace('class-', ''))
                setSelectedFixedClass(id[0].replace('class-', ''))
            }
            await refetch()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const handleChangeSemester = async (id: string) => {
        try {
            showSpinner()
            console.log('Selected Semester ID:', id)
            setSelectedSemesterId(id)
            const semester = semesterData.find((sem: Semester) => sem.id === id)
            setSelectedSemester(semester)

            
            await refetch()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    // #endregion
    const rowSelection = {
        selectedRowKeys,
        onChange: (selectedKeys: any) => {
            setSelectedRowKeys(selectedKeys)
            console.log(selectedKeys)
        },
    }
useEffect(() => {
    if (selectedSemester) {
      const startDate = new Date(selectedSemester.startDate);
      const endDate = selectedSemester.endDate ? new Date(selectedSemester.endDate) : new Date();
      const months = [];
      
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        months.push({
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear(),
        });
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      
      setArrMonth(months);
    } else {
      setArrMonth([]);
    }
  }, [selectedSemester]);
    // Hàm tạo tên tháng
  // Hàm tạo tiêu đề cột tháng
  const getMonthName = ({ month, year }: { month: number; year: number }) =>
    `Tháng ${month.toString().padStart(2, '0')}/${year}`;

  // Tạo cột động cho các tháng
  const monthColumns = arrMonth.map((month) => ({
    title: getMonthName(month),
    dataIndex: `month_${month.month}_${month.year}`,
    width: 100,
    align: 'center' as const,
    render: (_: any, record: any) => {
      // Placeholder: Thay bằng logic thực tế, ví dụ: record.monthData?.[`${month}_${year}`]
      if(nhapDiemMoi) {
        return <Input placeholder="Nhập điểm" />;
      }
      else
      {
        return record.monthData?.[`${month.month}_${month.year}`] || 'N/A';

      }
    },
  }));

    return (
        <div>
            {/* Từ ngày {selectedSemester?.startDate ? new Date(selectedSemester.startDate).toLocaleDateString('vi-VN') : ''} đến ngày {selectedSemester?.endDate ? new Date(selectedSemester.endDate).toLocaleDateString('vi-VN') : ''} */}
            <Row>
                <Col span={4} className="flex">
                    <LopBienCheItem
                        dataTable={subjectClassData}
                        onChangeSelected={handleChangeFixedClass}
                        selectedItem={selectedFixedClass}
                    />
                </Col>
                <Col span={20} className="flex justify-end">
                    <Row>
                        <Col span={24}>
                            <Row gutter={[16, 16]} align="top" justify="space-between">
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
                                                <Select
                                                    placeholder="Học kỳ"
                                                    options={semesterData.map(
                                                        (i: TrainingObjectType) => ({
                                                            value: i.id,
                                                            label: i.name,
                                                        })
                                                    )}
                                                    style={{
                                                        height: 40,
                                                    }}
                                                    onChange={(val) =>
                                                        handleChangeSemester(val)
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
                                                        (i: TrainingObjectType) => ({
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
                                                onFilterChange={handleFilterChange} onSearchChange={undefined} />
                                        </Col>
                                    </Flex>
                                </Col>

                                <Col span={6}>
                                    <Flex justify="end" gap={4}>
                                        <Button type="primary" className="h-[40px]">
                                            <Save stroke="white" />
                                            Lưu
                                        </Button>
                                        <Button type="primary" className="h-[40px]">
                                            <EditIcon stroke="white" />
                                            Nhập từ file danh sách
                                        </Button>
                                    </Flex>
                                </Col>
                            </Row>
  <Row className="mt-4">
                                <Col span={20} className="flex">
                                    <Checkbox checked={nhapDiemMoi} onChange={handleChangeNhapDiemMoi} className="text-sm">
                                        Nhập tháng mới
                                    </Checkbox>
                                    <Checkbox checked={suaDiemCu} onChange={handleChangeSuaDiemCu} className="text-sm">
                                        Nhập sửa điểm tháng cũ
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
                                // rowSelection={rowSelection}
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
                                            record.code || '',
                                    },
                                    {
                                        title: 'Họ và tên',
                                        dataIndex: 'name',
                                        width: 150,
                                        render: (text, record) =>
                                            <>
                                                {record.userProfile?.lastName || ''} {record.userProfile?.firstName || ''} <br />
                                                {record.userProfile?.dateOfBirth
                                                    ? new Date(record.userProfile.dateOfBirth).toLocaleDateString('vi-VN')
                                                    : ''}
                                            </>
                                    },
                                    {
                                        title: 'Tên lớp',
                                        dataIndex: 'stc',
                                        width: 150,
                                        align: 'center',
                                        render: (text, record) =>
                                            record.fixedClass?.name || 'Chưa có lớp',
                                    },
                                    ...monthColumns
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
