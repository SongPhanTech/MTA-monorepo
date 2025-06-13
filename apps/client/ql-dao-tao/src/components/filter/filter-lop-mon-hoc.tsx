import React, { useState } from 'react'
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
import TreeSelectFixClassMulti from '@components/commons/fix-class-selected/TreeSelectFixClassMulti'
import TreeSelectLecture from '@components/commons/lecture-selected-multi/TreeSelectLecture'
import {
    useFindManySchoolYear,
    useFindManySemester,
    useFindManyOrganizationType,
    useFindManyOrganization,
    useFindManyTrainingObjectType,
    useFindManyLecturer
} from '@workspace/db/hooks'
import { buildOrgTree } from '@lib/utils'
const { Text } = Typography

export type FilterProps = {
    schoolYearId: string | null //Năm học
    semesterId: string | null //Học kỳ
    KhoaId: string | null //Khoa
    BoMonId: string | null //Bộ môn
    trainingObjectId: string | null //Đối tượng đào tạo
    examTypeId: string | null //Hình thức thi
    LectureId: string | null //Giảng viên
}

interface Props {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    onFilterChange: any
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    onSearchChange: any
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
];

const FilterSubjectClass = (props: Props) => {
    const { onFilterChange, onSearchChange } = props
    const [form] = Form.useForm<FilterProps>()
    const [open, setOpen] = useState(false)

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
    }

    const handleReset = () => {
        form.resetFields()
    }

    const handleApply = () => {
        console.log('filters', form.getFieldsValue())
        onFilterChange(form.getFieldsValue())
        setOpen(false)
    }

    const handleCancel = () => {
        form.resetFields()
        setOpen(false)
    }

    const { data: schoolYearData = [], refetch: refetchSchoolYear } =
        useFindManySchoolYear({
            orderBy: {
                startDate: 'desc',
            },
        })
    const { data: semesterData = [], refetch: refetchSemester } =
        useFindManySemester({
            where: {
                schoolYearId: form.getFieldValue('schoolYearId') || undefined,
            },
            orderBy: {
                startDate: 'desc',
            },
        })
    const { data: organizationTypeData = [], refetch: refetchOrganizationType } =
        useFindManyOrganizationType()
    const { data: organizationDataKhoa = [], refetch: refetchOrganizationKhoa } =
        useFindManyOrganization(
            {
                include: {
                    type: true,
                },
                where: {
                    type: {
                        code: 'KHOA',
                    },
                },
            }
        )
    const { data: organizationDataBoMon = [], refetch: refetchOrganizationBoMon } =
        useFindManyOrganization(
            {
                include: {
                    type: true,
                },
                where: {
                    parentId: form.getFieldValue('KhoaId') || undefined,
                    type: {
                        code: 'BOMON',
                    },
                },
            }
        )
    const { data: trainingObjectTypeData = [], refetch: refetchTrainingTypeObject } =
        useFindManyTrainingObjectType({
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
                                    label="Năm học"
                                    name="schoolYearId"
                                    labelCol={{ span: 7 }}
                                    wrapperCol={{ span: 17 }}
                                    labelAlign="left"
                                >
                                    <Select
                                        placeholder="Chọn năm học"
                                        options={schoolYearData.map((item) => {
                                            return {
                                                value: item.id,
                                                label: item.name,
                                            }
                                        })}
                                        onChange={(value) => {
                                            form.setFieldsValue({
                                                semesterId: undefined,
                                            })
                                            refetchSemester()
                                        }}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    label="Khoa"
                                    name="KhoaId"
                                    labelCol={{ span: 7 }}
                                    wrapperCol={{ span: 17 }}
                                    labelAlign="left"
                                >
                                    <Select
                                        placeholder="Chọn khoa"
                                        options={organizationDataKhoa.map((item) => {
                                            return {
                                                value: item.id,
                                                label: item.name,
                                            }
                                        })}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    label="Đối tượng đào tạo"
                                    name="trainingObjectId"
                                    labelCol={{ span: 7 }}
                                    wrapperCol={{ span: 17 }}
                                    labelAlign="left"
                                >
                                    <Select
                                        placeholder="Chọn đối tượng đào tạo"
                                        options={trainingObjectTypeData.map((item) => {
                                            return {
                                                value: item.id,
                                                label: item.name,
                                            }
                                        })}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    label="Lớp quản lý"
                                    name="trainingObjectId"
                                    labelCol={{ span: 7 }}
                                    wrapperCol={{ span: 17 }}
                                    labelAlign="left"
                                >
                                    <TreeSelectFixClassMulti
                                        schoolYearId={form.getFieldValue('KhoaId') || undefined}
                                        placeholder='Chọn lớp quản lý'
                                    />
                                </Form.Item>
                            </Col>
                        </Col>
                        <Col span={12}>
                            <Col span={24}>
                                <Form.Item
                                    label="Kỳ học"
                                    name="semesterId"
                                    labelCol={{ span: 7 }}
                                    wrapperCol={{ span: 17 }}
                                    labelAlign="left"
                                >
                                    <Select
                                        placeholder="Chọn kỳ học"
                                        options={semesterData.map((item) => {
                                            return {
                                                value: item.id,
                                                label: item.name,
                                            }
                                        })}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    label="Bộ môn"
                                    name="BoMonId"
                                    labelCol={{ span: 7 }}
                                    wrapperCol={{ span: 17 }}
                                    labelAlign="left"
                                >
                                    <Select
                                        placeholder="Chọn bộ môn"
                                        options={organizationDataBoMon.map((item) => {
                                            return {
                                                value: item.id,
                                                label: item.name,
                                            }
                                        })}
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
                                    <TreeSelectLecture
                                        placeholder='Chọn giảng viên'
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
                    offset: [100, 0], // Di chuyển popup sang trái 300px
                }}
            >
                <Button
                    icon={<FilterOutlined />}
                    style={{
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
