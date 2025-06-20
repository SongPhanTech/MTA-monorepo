import { FilterOutlined } from '@ant-design/icons'
import Select from '@components/commons/select'
import { CTDT_STATUS } from '@constants/constants'
import { buildOrgTree } from '@lib/utils'
import type {
    SchoolYear,
    TrainingLevel,
    TrainingMajor,
    TrainingObjectType,
    TrainingTime,
} from '@workspace/db'
import {
    useFindManyOrganization,
    useFindManySchoolYear,
    useFindManyTrainingLevel,
    useFindManyTrainingMajor,
    useFindManyTrainingObjectType,
    useFindManyTrainingType,
} from '@workspace/db/hooks'
import {
    Button,
    Col,
    Divider,
    Flex,
    Form,
    Input,
    Popover,
    Row,
    //   Select,
    Space,
    Tag,
    TreeSelect,
    Typography,
} from 'antd'
import { Search, X } from 'lucide-react'
import { useState } from 'react'
const { Text } = Typography

interface FilterProps {
    searchText: string
    managementOrganizationId: string | undefined
    trainingObjectTypeId: string | undefined
    trainingTimeId: string | undefined
    trainingLevelId: string | undefined
    status: string | undefined
    startDate: string | undefined
    endDate: string | undefined
    trainingMajorId: string | undefined
    schoolYearId: string | undefined
}

interface Props {
    filters: FilterProps

    setFilters: any

    debouncedRefetch: any
}

const FilterChuongTrinhDT = (props: Props) => {
    const { filters, setFilters, debouncedRefetch } = props
    const [form] = Form.useForm<FilterProps>()
    const [open, setOpen] = useState(false)

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
    }

    const handleReset = () => {
        form.resetFields()
    }

    const handleCancel = () => {
        form.resetFields()
        setOpen(false)
    }

    const handleApply = () => {
        console.log('filters', form.getFieldsValue())
        const values = form.getFieldsValue()
        const schoolYearId = values.schoolYearId
        const selectedSchool = dataSchoolYear.find(
            (item: SchoolYear) => item.id === schoolYearId
        )
        const newFilters = {
            ...filters,
            ...values,
            startDate: selectedSchool?.startDate,
            endDate: selectedSchool?.endDate,
        }
        setFilters(newFilters)
        setOpen(false)
    }
    const options = Object.entries(CTDT_STATUS).map(
        ([value, { label, color }]) => ({
            value,
            label: <Tag color={color}>{label}</Tag>, // hiển thị trong dropdown
        })
    )
    const { data: trainingTimeData = [], refetch: refetchTime } =
        useFindManyTrainingType()
    const { data: trainingLevelData = [], refetch: refetchLevel } =
        useFindManyTrainingLevel()
    const { data: trainingObjectTypeData = [], refetch: refetchObjectType } =
        useFindManyTrainingObjectType()
    const { data: trainingMajorData = [], refetch: refetchObjectMajor } =
        useFindManyTrainingMajor()
    const { data: dataSchoolYear = [], refetch: refetchSchoolYear } =
        useFindManySchoolYear()
    const { data: manageOrgData = [], refetch: refetchManageOrg } =
        useFindManyOrganization()
    const treeData = buildOrgTree(manageOrgData)

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
                            <Form.Item
                                label="Năm học"
                                name="schoolYearId"
                                labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                                labelAlign="left"
                                className="mb-0"
                            >
                                <Select
                                    placeholder="Chọn năm học"
                                    allowClear
                                    options={dataSchoolYear.map(
                                        (i: SchoolYear) => {
                                            return {
                                                value: i.id,
                                                label: i.name,
                                                startDate: i.startDate,
                                                endDate: i.endDate,
                                            }
                                        }
                                    )}
                                    // value={filters.schoolYearId}
                                    // onChange={(
                                    //     value: number | null,
                                    //     option: any
                                    // ) => {
                                    //     handleFilterChange(
                                    //         'time',
                                    //         option ?? undefined
                                    //     )
                                    // }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Đơn vị phụ trách"
                                name="managementOrganizationId"
                                labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                                labelAlign="left"
                                className="mb-0"
                            >
                                <TreeSelect
                                    allowClear
                                    placeholder="Chọn đơn vị phụ trách"
                                    showSearch
                                    treeDefaultExpandAll
                                    treeData={treeData}
                                    filterTreeNode={(input, node) =>
                                        (node.title as string)
                                            .toLowerCase()
                                            .includes(input.toLowerCase())
                                    }
                                    // onChange={(val) =>
                                    //     handleFilterChange(
                                    //         'managementOrganizationId',
                                    //         val
                                    //     )
                                    // }
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                className="mb-0"
                                label="Đối tượng đào tạo"
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
                                    // onChange={(val) =>
                                    //     handleFilterChange(
                                    //         'trainingObjectTypeId',
                                    //         val
                                    //     )
                                    // }
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                className="mb-0"
                                label="Bậc đào tạo"
                                name="trainingLevelId"
                                labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                                labelAlign="left"
                            >
                                <Select
                                    placeholder="Chọn bậc đào tạo"
                                    options={trainingLevelData.map(
                                        (i: TrainingLevel) => ({
                                            value: i.id,
                                            label: i.name,
                                        })
                                    )}
                                    // onChange={(val) =>
                                    //     handleFilterChange(
                                    //         'trainingObjectTypeId',
                                    //         val
                                    //     )
                                    // }
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                className="mb-0"
                                label="Thời gian đào tạo"
                                name="trainingFormId"
                                labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                                labelAlign="left"
                            >
                                <Select
                                    placeholder="Chọn thời gian đào tạo"
                                    options={trainingTimeData.map(
                                        (i: TrainingTime) => ({
                                            value: i.id,
                                            label: i.name,
                                        })
                                    )}
                                    // onChange={(val) =>
                                    //     handleFilterChange(
                                    //         'trainingFormId',
                                    //         val
                                    //     )
                                    // }
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                className="mb-0"
                                label="Chuyên ngành đào tạo"
                                name="trainingLevelId"
                                labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                                labelAlign="left"
                            >
                                <Select
                                    placeholder="Chọn chuyên ngành đào tạo"
                                    options={trainingMajorData.map(
                                        (i: TrainingMajor) => ({
                                            value: i.id,
                                            label: i.name,
                                        })
                                    )}
                                    // onChange={(val) =>
                                    //     handleFilterChange(
                                    //         'trainingLevelId',
                                    //         val
                                    //     )
                                    // }
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                className="mb-0"
                                label="Trạng thái"
                                name="ethnicityId"
                                labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                                labelAlign="left"
                            >
                                <Select
                                    // onChange={(val) =>
                                    //     handleFilterChange('status', val)
                                    // }
                                    placeholder="Chọn trạng thái"
                                    options={Object.entries(CTDT_STATUS).map(
                                        ([value, { label, color }]) => ({
                                            value,
                                            label, // hiển thị trong dropdown
                                        })
                                    )}
                                    allowClear
                                />
                            </Form.Item>
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
            <Form.Item name="searchText">
                <Input
                    id="search"
                    // onChange={(e) =>
                    //     handleFilterChange('searchText', e.target.value)
                    // }
                    placeholder="Tìm kiếm"
                    style={{
                        width: 300,
                        marginRight: 8,
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
            <Popover
                content={filterContent}
                trigger="click"
                open={open}
                onOpenChange={handleOpenChange}
                placement="bottomRight"
                align={{
                    offset: [100, 0],
                }}
                arrow={false}
                overlayStyle={{
                    width: 450,
                }}
                overlayInnerStyle={{
                    padding: 0,
                }}
                destroyTooltipOnHide
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

export default FilterChuongTrinhDT
