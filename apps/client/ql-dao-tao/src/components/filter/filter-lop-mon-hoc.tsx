import React, { useEffect, useState } from 'react'
import {
    Button,
    Flex,
    Input,
    Popover,
    //   Select,
    Space,
    Typography,
    Divider,
    Row,
    Col,
    Form,
} from 'antd'
import {
    FilterOutlined,
    CloseOutlined,
    SearchOutlined,
    ControlOutlined,
} from '@ant-design/icons'
import { X, Search } from 'lucide-react'
import Select from '@components/commons/select'
import TreeSelectFixClassMulti from '@components/commons/fix-class-select/TreeSelectFixClassMulti'
import TreeSelectLecture from '@components/commons/lecture-select-multi/TreeSelectLecture'
import {
    useFindManySchoolYear,
    useFindManySemester,
    useFindManyOrganizationType,
    useFindManyOrganization,
    useFindManyTrainingObjectType,
    useFindManyLecturer,
} from '@workspace/db/hooks'
import { buildOrgTree } from '@lib/utils'
import TreeSelectSemester from '@components/commons/semester-select/TreeSelectSemester'
import TreeSelectDepartment from '@components/commons/department-select/TreeSelectDepartment'



const { Text } = Typography

export type FilterProps = {
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
    fixedClassId: string | null //Lớp quản lý
}

interface Props {
    onFilterChange: any

    filters: FilterProps
    onApply: (filters: FilterProps) => void
}

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
    const { onFilterChange, filters, onApply,  } = props
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
            LectureId: null,
            fixedClassId: null,
        });
        console.log('Reset filters', form.getFieldsValue())
        onApply(form.getFieldsValue());
    }

    const handleApply = () => {
        console.log('Applying filters', form.getFieldsValue())
        const formValues = form.getFieldsValue();
        onApply(formValues);
        setOpen(false)
        setIsActive(true)
    }

    const handleCancel = () => {
        form.resetFields()
        setOpen(false)
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
            LectureId: filters.LectureId || null,
            fixedClassId: filters.fixedClassId || null,
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
                                        dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                                        defaultValue={form.getFieldValue('semesterId') || undefined}
                                        onChange={(value) => {
                                            form.setFieldsValue({ semesterId: value })
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
                                    label="Lớp quản lý"
                                    name="fixedClassId"
                                    labelCol={{ span: 7 }}
                                    wrapperCol={{ span: 17 }}
                                    labelAlign="left"
                                >
                                    <TreeSelectFixClassMulti
                                        schoolYearId={
                                            form.getFieldValue('KhoaId') ||
                                            undefined
                                        }
                                        placeholder="Chọn lớp quản lý"
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
                                        dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                                        defaultValue={filters.BoMonId || undefined}
                                        onChange={(value) => {
                                            form.setFieldsValue({ BoMonId: value })
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
                                    name="LectureId"
                                    labelCol={{ span: 7 }}
                                    wrapperCol={{ span: 17 }}
                                    labelAlign="left"
                                >
                                    <TreeSelectLecture placeholder="Chọn giảng viên" />
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
                    offset: [100, 0], // Di chuyển popup sang trái 300px
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
                    }}
                />
            </Popover>
        </Flex>
    )
}

export default FilterSubjectClass
