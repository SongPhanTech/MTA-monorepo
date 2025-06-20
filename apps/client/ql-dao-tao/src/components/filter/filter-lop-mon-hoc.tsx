import { FilterOutlined } from '@ant-design/icons'
import TreeSelectDepartment from '@components/commons/department-select/TreeSelectDepartment'
import TreeSelectLecture from '@components/commons/lecture-select-multi/TreeSelectLecture'
import Select from '@components/commons/select'
import TreeSelectSemester from '@components/commons/semester-select/TreeSelectSemester'
import {
    useFindManyOrganization,
    useFindManyOrganizationType,
    useFindManyTrainingObjectType,
} from '@workspace/db/hooks'
import {
    Button,
    Col,
    DatePicker,
    Divider,
    Flex,
    Form,
    Popover,
    Row,
    //   Select,
    Space,
    Typography,
} from 'antd'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

import dayjs from 'dayjs'
import 'dayjs/locale/vi' // Import Vietnamese locale for dayjs
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

const { Text } = Typography

export type FilterProps = {
    schoolYearId: string | null //Năm học
    semesterId: string | null //Học kỳ
    KhoaId: string | null //Khoa
    BoMonId: string | null //Bộ môn
    trainingObjectId: string | null //Đối tượng đào tạo
    examTypeId: string | null //Hình thức thi
    LectureIds: string[]
    searchText: string | null
    trainingObjectTypeId: string | null
    subjectClassId: string | null
    fixedClassIds: string[]
    examDateRange?: [string, string] | null // Khoảng thời gian thi
}

interface Props {
    onFilterChange: any

    filters: FilterProps
    onApply: (filters: FilterProps) => void
}

// TODO: use useExamTypeOptions instead
const ExamType = [
    {
        value: 'OfflineWritten',
        label: 'Thi viết',
    },
    {
        value: 'OnlineWritten',
        label: 'Thi viết trực tuyến',
    },
    {
        value: 'OfflineChoices',
        label: 'Thi trắc nghiệm',
    },
    {
        value: 'OnlineChoices',
        label: 'Thi trắc nghiệm trực tuyến',
    },
    {
        value: 'Oral',
        label: 'Thi vấn đáp',
    },
    {
        value: 'Practice',
        label: 'Thi thực hành',
    },
    {
        value: 'Project',
        label: 'Thi đồ án',
    },
    {
        value: 'Other',
        label: 'Loại khác',
    },
]

const FilterSubjectClass = (props: Props) => {
    const { onFilterChange, filters, onApply } = props
    const [form] = Form.useForm<FilterProps>()
    const [open, setOpen] = useState(false)
    const [isActive, setIsActive] = useState(false)
    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
    }

    const handleReset = () => {
        form.setFieldsValue({
            schoolYearId: null,
            semesterId: null,
            KhoaId: null,
            BoMonId: null,
            trainingObjectTypeId: null,
            examTypeId: null,
            LectureIds: [],
            fixedClassIds: [],
            examDateRange: undefined,
        })

        console.log('Reset filters', form.getFieldsValue())
        onApply(form.getFieldsValue())
        setOpen(false)
        setIsActive(false)
    }

    const handleApply = () => {
        console.log('Applying filters', form.getFieldsValue())
        const formValues = form.getFieldsValue()
        onApply(formValues)
        setOpen(false)
        setIsActive(true)
    }

    const handleCancel = () => {
        form.resetFields()
        setOpen(false)
        setIsActive(false)
    }

    useEffect(() => {
        console.log('Filter values updated:', filters)
        form.setFieldsValue({
            schoolYearId: filters.schoolYearId || null,
            semesterId: filters.semesterId || null,
            KhoaId: filters.KhoaId || null,
            BoMonId: filters.BoMonId || null,
            trainingObjectTypeId: filters.trainingObjectTypeId || null,
            examTypeId: filters.examTypeId || null,
            LectureIds: filters.LectureIds || [],
            fixedClassIds: filters.fixedClassIds || [],
        })
    }, [filters, form])

    const {
        data: organizationTypeData = [],
        refetch: refetchOrganizationType,
    } = useFindManyOrganizationType()
    const {
        data: organizationDataKhoa = [],
        refetch: refetchOrganizationKhoa,
    } = useFindManyOrganization({
        include: {
            type: true,
        },
        where: {
            type: {
                code: 'KHOA',
            },
        },
    })
    const {
        data: organizationDataBoMon = [],
        refetch: refetchOrganizationBoMon,
    } = useFindManyOrganization({
        include: {
            type: true,
        },
        where: {
            parentId: form.getFieldValue('KhoaId') || undefined,
            type: {
                code: 'BOMON',
            },
        },
    })
    const {
        data: trainingObjectTypeData = [],
        refetch: refetchTrainingTypeObject,
    } = useFindManyTrainingObjectType({
        orderBy: {
            name: 'asc',
        },
    })

    const ApplyFilterExamDate = (examDateRange: [string, string] | null) => {
        if (examDateRange && examDateRange.length === 2) {
            const [startDate, endDate] = examDateRange
            return {
                examDateRange: [
                    dayjs(startDate, 'DD/MM/YYYY').format('YYYY-MM-DD'),
                    dayjs(endDate, 'DD/MM/YYYY').format('YYYY-MM-DD'),
                ],
            }
        }
        return {
            examDateRange: null,
        }
    }

    const customViVNLocale = {
        lang: {
            locale: 'vi_VN',
            placeholder: 'Chọn ngày',
            rangePlaceholder: ['Từ ngày', 'Đến ngày'] as [string, string],
            today: 'Hôm nay',
            now: 'Bây giờ',
            backToToday: 'Về hôm nay',
            ok: 'Đồng ý',
            clear: 'Xóa',
            month: 'Tháng',
            year: 'Năm',
            timeSelect: 'Chọn giờ',
            dateSelect: 'Chọn ngày',
            monthSelect: 'Chọn tháng',
            yearSelect: 'Chọn năm',
            decadeSelect: 'Chọn thập kỷ',
            yearFormat: 'YYYY',
            dateFormat: 'DD/MM/YYYY',
            dayFormat: 'D',
            dateTimeFormat: 'DD/MM/YYYY HH:mm:ss',
            monthBeforeYear: true,
            previousMonth: 'Tháng trước',
            nextMonth: 'Tháng sau',
            previousYear: 'Năm trước',
            nextYear: 'Năm sau',
            previousDecade: 'Thập kỷ trước',
            nextDecade: 'Thập kỷ sau',
            previousCentury: 'Thế kỷ trước',
            nextCentury: 'Thế kỷ sau',
        },
        timePickerLocale: {
            placeholder: 'Chọn giờ',
        },
    }
    const filterContent = (
        <div style={{ width: '100%', borderRadius: '10px' }}>
            <div
                style={{
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    backgroundColor: '#E5E7EB',
                    borderTopLeftRadius: '10px',
                    borderTopRightRadius: '10px',
                }}
            >
                <Text style={{ fontSize: '1rem' }}>Bộ lọc</Text>
                <Button
                    type="text"
                    icon={<X size={20} />}
                    onClick={() => setOpen(false)}
                    size="small"
                    style={{ marginRight: -8 }}
                />
            </div>

            <div style={{ padding: '0 16px' }}>
                <Form form={form} layout="horizontal" className="mt-4">
                    <Row gutter={[10, 0]}>
                        <Col span={12}>
                            <Col span={24}>
                                <Form.Item
                                    label="Kỳ học"
                                    labelCol={{ span: 7 }}
                                    wrapperCol={{ span: 17 }}
                                    labelAlign="left"
                                >
                                    <TreeSelectSemester
                                        placeholder="Chọn kỳ học"
                                        style={{ width: '100%' }}
                                        dropdownStyle={{
                                            maxHeight: 400,
                                            overflow: 'auto',
                                        }}
                                        defaultValue={
                                            form.getFieldValue('semesterId') ||
                                            undefined
                                        }
                                        onChange={(value) => {
                                            form.setFieldsValue({
                                                semesterId: value,
                                            })
                                        }}
                                        disabled={true}
                                    />
                                </Form.Item>
                            </Col>

                            <Col span={24}>
                                <Form.Item
                                    label="Đối tượng đào tạo"
                                    name="trainingObjectTypeId"
                                    labelCol={{ span: 7 }}
                                    wrapperCol={{ span: 17 }}
                                    labelAlign="left"
                                >
                                    <Select
                                        disabled={true}
                                        placeholder="Chọn đối tượng đào tạo"
                                        options={trainingObjectTypeData.map(
                                            (item) => {
                                                return {
                                                    value: item.id,
                                                    label: item.name,
                                                }
                                            }
                                        )}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    label="Thời gian thi"
                                    name="examDateRange"
                                    labelCol={{ span: 7 }}
                                    wrapperCol={{ span: 17 }}
                                    labelAlign="left"
                                >
                                    <DatePicker.RangePicker
                                        placeholder={['Từ ngày', 'Đến ngày']}
                                        style={{ width: '100%' }}
                                        allowClear
                                        onChange={(dates, dateStrings) => {
                                            ApplyFilterExamDate(
                                                dates
                                                    ? [
                                                          dateStrings[0],
                                                          dateStrings[1],
                                                      ]
                                                    : null
                                            )
                                        }}
                                        locale={customViVNLocale}
                                        format="DD/MM/YYYY"
                                    />
                                </Form.Item>
                            </Col>
                        </Col>
                        <Col span={12}>
                            <Col span={24}>
                                <Form.Item
                                    label="Đơn vị đào tạo"
                                    name="BoMonId"
                                    labelCol={{ span: 7 }}
                                    wrapperCol={{ span: 17 }}
                                    labelAlign="left"
                                >
                                    <TreeSelectDepartment
                                        placeholder="Chọn bộ môn"
                                        style={{ width: '100%' }}
                                        dropdownStyle={{
                                            maxHeight: 400,
                                            overflow: 'auto',
                                        }}
                                        defaultValue={
                                            filters.BoMonId || undefined
                                        }
                                        onChange={(value) => {
                                            form.setFieldsValue({
                                                BoMonId: value,
                                            })
                                            refetchOrganizationBoMon()
                                        }}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    label="Hình thức thi"
                                    name="examTypeId"
                                    labelCol={{ span: 7 }}
                                    wrapperCol={{ span: 17 }}
                                    labelAlign="left"
                                >
                                    <Select
                                        placeholder="Chọn hình thức thi"
                                        options={ExamType.map((item) => {
                                            return {
                                                value: item.value,
                                                label: item.label,
                                            }
                                        })}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    label="Giảng viên"
                                    name="LectureIds"
                                    labelCol={{ span: 7 }}
                                    wrapperCol={{ span: 17 }}
                                    labelAlign="left"
                                >
                                    <TreeSelectLecture
                                        placeholder="Chọn giảng viên"
                                        defaultValue={filters.LectureIds}
                                    />
                                </Form.Item>
                            </Col>
                        </Col>
                    </Row>
                </Form>
            </div>

            <Divider style={{ margin: '8px 0' }} />

            <div
                style={{
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                }}
            >
                <Button onClick={handleReset} style={{ background: '#f5f5f5' }}>
                    Bỏ lọc
                </Button>
                <Space>
                    <Button onClick={handleCancel}>Hủy</Button>
                    <Button type="primary" onClick={handleApply}>
                        Áp dụng
                    </Button>
                </Space>
            </div>
        </div>
    )

    return (
        <Flex>
            <Popover
                content={filterContent}
                trigger="click"
                open={open}
                onOpenChange={handleOpenChange}
                placement="bottomRight"
                arrow={false}
                overlayStyle={{
                    width: 900,
                }}
                overlayInnerStyle={{
                    padding: 0,
                }}
                destroyTooltipOnHide
                align={{
                    offset: [100, 0],
                }}
            >
                <Button
                    icon={<FilterOutlined />}
                    style={{
                        height: '40px',
                        width: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isActive ? '#4caf50' : '#ffffff',
                    }}
                />
            </Popover>
        </Flex>
    )
}

export default FilterSubjectClass
