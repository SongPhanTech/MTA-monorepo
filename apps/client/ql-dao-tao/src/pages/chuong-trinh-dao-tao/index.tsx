import {
    CloudDownloadOutlined,
    EyeOutlined,
    SearchOutlined,
} from '@ant-design/icons'
import { fetchUpdateUser } from '@api/open-api/appComponents'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import { PutCurriculumModal } from '@components/modal'
import { CTDT_STATUS, DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountCurriculum,
    useFindManyCurriculum,
    useUpdateCurriculum,
} from '@workspace/db/hooks'
import type {
    Curriculum,
    TrainingObjectType,
    CurriculumStatus,
    TrainingTime,
    TrainingMajor,
    Organization,
    TrainingLevel,
} from '@workspace/db'

import {
    Button,
    Col,
    Divider,
    Flex,
    Form,
    Input,
    Row,
    Space,
    Tag,
    Tooltip,
    message,
} from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { TRAINING_COURSE_STATUS } from '@constants/constants'
import Select from '@components/commons/select'
import FixedClassPage from '@pages/lop-bien-che'
import { buildOrgTree } from '@lib/utils'
import CurriculumVersionPage from '@pages/phien-ban-ctdt'
import { FilterChuongTrinhDT } from '@components/filter'
import { getMinioUrl } from '@workspace/constant'
import EditIcon from '@components/icons/edit'

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
export default function CurriculumPage() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        managementOrganizationId: undefined,
        trainingObjectTypeId: undefined,
        trainingTimeId: undefined,
        trainingLevelId: undefined,
        status: undefined,
        startDate: undefined,
        endDate: undefined,
        trainingMajorId: undefined,
        schoolYearId: undefined,
    })

    const { data = [], refetch } = useFindManyCurriculum({
        where: {
            ...(filters.searchText && filters.searchText !== ''
                ? { name: { contains: filters.searchText } }
                : {}),
            ...(filters.searchText && filters.searchText !== ''
                ? { infomation: { contains: filters.searchText } }
                : {}),
            ...(filters.managementOrganizationId
                ? { managementOrganizationId: filters.managementOrganizationId }
                : {}),
            ...(filters.trainingTimeId
                ? { trainingTimeId: filters.trainingTimeId }
                : {}),
            ...(filters.trainingLevelId
                ? { trainingLevelId: filters.trainingLevelId }
                : {}),
            ...(filters.trainingObjectTypeId
                ? { trainingObjectTypeId: filters.trainingObjectTypeId }
                : {}),
            ...(filters.trainingMajorId
                ? { trainingMajorId: filters.trainingMajorId }
                : {}),
            ...(filters.status
                ? { status: filters.status as CurriculumStatus }
                : {}),
            ...(filters.startDate && filters.endDate
                ? {
                      startDate: {
                          gte: new Date(filters.startDate),
                          lte: new Date(filters.endDate),
                      },
                  }
                : {}),
        },
        include: {
            managementOrganization: true,
            trainingLevel: true,
            trainingObjectType: true,
            trainingTime: true,
            trainingMajor: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountCurriculum({
        where: {
            ...(filters.searchText && filters.searchText !== ''
                ? { name: { contains: filters.searchText } }
                : {}),
            ...(filters.searchText && filters.searchText !== ''
                ? { infomation: { contains: filters.searchText } }
                : {}),
            ...(filters.managementOrganizationId
                ? { managementOrganizationId: filters.managementOrganizationId }
                : {}),
            ...(filters.trainingTimeId
                ? { trainingTimeId: filters.trainingTimeId }
                : {}),
            ...(filters.trainingLevelId
                ? { trainingLevelId: filters.trainingLevelId }
                : {}),
            ...(filters.trainingObjectTypeId
                ? { trainingObjectTypeId: filters.trainingObjectTypeId }
                : {}),
            ...(filters.trainingMajorId
                ? { trainingMajorId: filters.trainingMajorId }
                : {}),
            ...(filters.status
                ? { status: filters.status as CurriculumStatus }
                : {}),
            ...(filters.startDate && filters.endDate
                ? {
                      startDate: {
                          gte: new Date(filters.startDate),
                          lte: new Date(filters.endDate),
                      },
                  }
                : {}),
        },
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const { onOpen, onClose } = useDisclosure<string>({
        tag: PutCurriculumModal.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const { mutateAsync: updateCurriculum } = useUpdateCurriculum()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateCurriculum({
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

    async function handleStatusChange(id: string, newStatus: CurriculumStatus) {
        try {
            showSpinner()
            await updateCurriculum({
                where: {
                    id,
                },
                data: {
                    status: newStatus,
                },
            })
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }
    const options = Object.entries(CTDT_STATUS).map(
        ([value, { label, color }]) => ({
            value,
            label: <Tag color={color}>{label}</Tag>, // hiển thị trong dropdown
        })
    )
    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                Chương trình đào tạo
            </Divider>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={6}>
                            {/* <Form.Item label="Năm học" name="schoolYearId" value={filters.schoolYearId}> */}
                            <Flex justify="space-between" align="center">
                                <FilterChuongTrinhDT
                                    filters={filters}
                                    setFilters={setFilters}
                                    debouncedRefetch={debouncedRefetch}
                                />
                            </Flex>

                            {/* </Form.Item> */}
                        </Col>
                        <Col span={6}>
                            <Flex justify="end">
                                <Button onClick={handleModal} type="primary">
                                    Thêm mới
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <Table
                        rowKey="id"
                        id="training-course"
                        columns={[
                            {
                                title: 'STT',
                                width: 20,
                                align: 'center',
                                render: (_, record, index) =>
                                    index +
                                    1 +
                                    (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Nội dung',
                                dataIndex: 'name',
                                align: 'center',
                                // width: 250,
                            },
                            {
                                title: 'Đơn vị phụ trách',
                                dataIndex: 'managementOrganization',
                                // width: 150,
                                render: (value: Organization) =>
                                    value?.name ? value?.name : '',
                            },
                            {
                                title: 'Đối tượng đào tạo',
                                dataIndex: 'trainingObjectType',
                                // width: 120,
                                render: (value: TrainingObjectType) =>
                                    value?.name ? value?.name : '',
                            },
                            {
                                title: 'Bậc đào tạo',
                                dataIndex: 'trainingLevel',
                                // width: 120,
                                render: (value: TrainingLevel) =>
                                    value?.name ? value?.name : '',
                            },
                            // {
                            //     title: 'Thời gian',
                            //     dataIndex: 'trainingTime',
                            //     render: (value: TrainingTime) =>
                            //         value?.name ? value?.name : '',
                            // },
                            {
                                title: 'Chuyên ngành',
                                dataIndex: 'trainingMajor',
                                render: (value: TrainingMajor) =>
                                    value?.name ? value?.name : '',
                            },
                            // {
                            //     title: 'Ngày bắt đầu',
                            //     render: ({ startDate }) =>
                            //         startDate
                            //             ? dayjs(startDate).format('DD/MM/YYYY')
                            //             : '',
                            // },
                            // {
                            //     title: 'Ngày kết thúc',
                            //     render: ({ endDate }) =>
                            //         endDate
                            //             ? dayjs(endDate).format('DD/MM/YYYY')
                            //             : '',
                            // },
                            // {
                            //     title: 'Thông tin',
                            //     dataIndex: 'infomation',
                            //     width: 100,
                            // },
                            {
                                title: 'Trạng thái',
                                width: 130,
                                render: (record: Curriculum) => {
                                    return (
                                        <Select
                                            className="w-[155px]"
                                            value={record.status}
                                            onChange={(newStatus) =>
                                                handleStatusChange(
                                                    record.id,
                                                    newStatus as CurriculumStatus
                                                )
                                            }
                                            options={options}
                                            optionLabelProp="label"
                                            // style={{ width: 180 }}
                                            bordered={false}
                                            showSearch={false}
                                        />
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                render: (_, { id, documentPath }) => {
                                    if (id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                <Tooltip
                                                    title="Tải file"
                                                    placement="leftTop"
                                                >
                                                    <a
                                                        href={
                                                            documentPath
                                                                ? getMinioUrl(
                                                                      documentPath
                                                                  )
                                                                : '#'
                                                        }
                                                        // target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={
                                                            documentPath
                                                                ? 'text-sm text-blue-700 cursor-pointer'
                                                                : 'text-sm text-gray-400 cursor-not-allowed'
                                                        }
                                                        style={
                                                            documentPath
                                                                ? {}
                                                                : {
                                                                      pointerEvents:
                                                                          'none',
                                                                  }
                                                        }
                                                    >
                                                        <CloudDownloadOutlined />
                                                    </a>
                                                </Tooltip>
                                                {/* <Tooltip
                                                    title="Xem chi tiết"
                                                    placement="leftTop"
                                                >
                                                    <EyeOutlined
                                                        onClick={onOpen.bind(
                                                            null,
                                                            id
                                                        )}
                                                        className="text-sm text-blue-700 cursor-pointer"
                                                    />
                                                </Tooltip> */}
                                                <EditIcon
                                                    onClick={onOpen.bind(
                                                        null,
                                                        id
                                                    )}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () =>
                                                            handleDelete(id),
                                                    }}
                                                />
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
                            },
                        ]}
                        data={data}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            total: count,
                            onChange: setCurrentPage,
                            onShowSizeChange: setNumberOfPages,
                            showTotal: (total, range) =>
                                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                        }}
                        expandable={{
                            expandedRowRender: (record) => (
                                // <div
                                //     style={{
                                //         maxWidth: '100vw',
                                //         overflowX: 'auto',
                                //         whiteSpace: 'nowrap',
                                //     }}
                                // >
                                <CurriculumVersionPage
                                    key={record.id}
                                    curriculumInfo={record}
                                />
                                // </div>
                            ),
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

CurriculumPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
