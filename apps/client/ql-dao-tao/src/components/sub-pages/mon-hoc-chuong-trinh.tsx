import { CloudDownloadOutlined, EyeOutlined } from '@ant-design/icons'
import { fetchUpdateUser } from '@api/open-api/appComponents'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import { DEFAULT_PAGINATE_SIZE, LOAI_MON_HOC_CTDT } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountSchoolYear,
    useFindManySchoolYear,
    useUpdateSchoolYear,
} from '@workspace/db/hooks'
import {
    Button,
    Col,
    Divider,
    Flex,
    Form,
    Input,
    Row,
    Tooltip,
    message,
} from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import type React from 'react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

type Props = {
    // data?: CurriculumVersionSubject[]
    curriculumVersionId?: string
}
export default function MonHocChuongTrinhPage({
    // data,
    curriculumVersionId,
}: Props) {
    return <></>
    // const [currentPage, setCurrentPage] = useState(1)
    // const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    // const [searchText, setSearchText] = useState<string>('')

    // const debouncedSearchText = _.debounce(setSearchText, 500)
    // const { data = [], refetch } = useFindManyCurriculumVersionSubject({
    //     where: {
    //         curriculumVersionId: {
    //             // biome-ignore lint/style/noNonNullAssertion: <explanation>
    //             equals: curriculumVersionId!,
    //         },
    //     },
    //     include: {
    //         trainingBlock: true,
    //         subject: true,
    //     },
    //     orderBy: {
    //         createdAt: 'desc',
    //     },
    //     take: numberOfPages,
    //     skip: (currentPage - 1) * numberOfPages,
    // })

    // const { data: count } = useCountCurriculumVersionSubject({
    //     where: {
    //         curriculumVersionId: {
    //             // biome-ignore lint/style/noNonNullAssertion: <explanation>
    //             equals: curriculumVersionId!,
    //         },
    //     },
    // })

    // const { onOpen, onClose } = useDisclosure<{
    //     curriculumVersionId?: string | null
    //     id?: string | null
    // }>({
    //     tag: PutMonHocChuongTrinhModal.name,
    // })

    // const { showSpinner, hideSpinner } = useSpinner()

    // const handleModal = () => {
    //     onOpen({
    //         curriculumVersionId: curriculumVersionId || null,
    //         id: null,
    //     })
    // }
    // const { mutateAsync: updateCurrriculumVersionSubject } =
    //     useUpdateCurriculumVersionSubject()
    // async function handleDelete(id: string) {
    //     try {
    //         showSpinner()
    //         await updateCurrriculumVersionSubject({
    //             where: {
    //                 id,
    //             },
    //             data: {
    //                 deletedAt: new Date(),
    //             },
    //         })
    //     } catch (error) {
    //         message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
    //     }
    //     hideSpinner()
    // }

    // return (
    //     <div>
    //         <Divider orientation="left" orientationMargin={0}>
    //             Danh sách môn học chương trình
    //         </Divider>
    //         <Row gutter={[16, 0]}>
    //             <Col span={24}>
    //                 <Row gutter={[16, 16]} align="top">
    //                     {/* Tìm kiếm */}
    //                     <Col span={12}>
    //                         <Form.Item label="Tìm kiếm" name="search">
    //                             <Input
    //                                 id="search"
    //                                 onChange={(e) =>
    //                                     debouncedSearchText(e.target.value)
    //                                 }
    //                                 placeholder="Tìm kiếm"
    //                             />
    //                         </Form.Item>
    //                     </Col>

    //                     {/* Thêm mới */}
    //                     <Col span={12}>
    //                         <Flex justify="end">
    //                             <Button onClick={handleModal} type="primary">
    //                                 Thêm mới
    //                             </Button>
    //                         </Flex>
    //                     </Col>
    //                 </Row>
    //             </Col>
    //             <Col span={24}>
    //                 <Table
    //                     columns={[
    //                         {
    //                             title: 'STT',
    //                             width: 20,
    //                             align: 'center',
    //                             render: (_, __, index) =>
    //                                 index +
    //                                 1 +
    //                                 (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
    //                         },
    //                         {
    //                             title: 'Tên môn học',
    //                             dataIndex: 'subject',
    //                             render: (value) =>
    //                                 value?.name ? value?.name : '',
    //                         },
    //                         {
    //                             title: 'Loại môn học',
    //                             dataIndex: 'type',
    //                             render: (value) =>
    //                                 LOAI_MON_HOC_CTDT[
    //                                     value as keyof typeof LOAI_MON_HOC_CTDT
    //                                 ],
    //                         },
    //                         {
    //                             title: 'Khối kiến thức',
    //                             dataIndex: 'trainingBlock',
    //                             render: (value) =>
    //                                 value?.name ? value?.name : '',
    //                         },

    //                         {
    //                             title: 'Thông tin',
    //                             dataIndex: 'information',
    //                             // width: 100,
    //                         },
    //                         {
    //                             title: 'Thao tác',
    //                             width: 100,
    //                             align: 'center',
    //                             render: (_, { id, documentPath }) => (
    //                                 <Row className="justify-center gap-2">
    //                                     <Tooltip
    //                                         title="Tải file"
    //                                         placement="leftTop"
    //                                     >
    //                                         <a
    //                                             href={
    //                                                 documentPath
    //                                                     ? getMinioUrl(
    //                                                           documentPath
    //                                                       )
    //                                                     : '#'
    //                                             }
    //                                             // target="_blank"
    //                                             rel="noopener noreferrer"
    //                                             className={
    //                                                 documentPath
    //                                                     ? 'text-sm text-blue-700 cursor-pointer'
    //                                                     : 'text-sm text-gray-400 cursor-not-allowed'
    //                                             }
    //                                             style={
    //                                                 documentPath
    //                                                     ? {}
    //                                                     : {
    //                                                           pointerEvents:
    //                                                               'none',
    //                                                       }
    //                                             }
    //                                         >
    //                                             <CloudDownloadOutlined />
    //                                         </a>
    //                                     </Tooltip>
    //                                     {/* <Tooltip
    //                                         title="Xem chi tiết"
    //                                         placement="leftTop"
    //                                     >
    //                                         <EyeOutlined
    //                                             onClick={() =>
    //                                                 onOpen({
    //                                                     curriculumVersionId:
    //                                                         curriculumVersionId ||
    //                                                         null,
    //                                                     id: id,
    //                                                 })
    //                                             }
    //                                             className="text-sm text-blue-700 cursor-pointer"
    //                                         />
    //                                     </Tooltip> */}
    //                                     <EditIcon
    //                                         onClick={() =>
    //                                             onOpen({
    //                                                 curriculumVersionId:
    //                                                     curriculumVersionId ||
    //                                                     null,
    //                                                 id: id,
    //                                             })
    //                                         }
    //                                         className="text-sm text-blue-700 cursor-pointer"
    //                                     />
    //                                     <DeleteIcon
    //                                         popConfirm={{
    //                                             onConfirm: () =>
    //                                                 handleDelete(id),
    //                                         }}
    //                                     />
    //                                 </Row>
    //                             ),
    //                         },
    //                     ]}
    //                     data={data}
    //                     pagination={{
    //                         current: currentPage,
    //                         pageSize: numberOfPages,
    //                         total: count,
    //                         onChange: setCurrentPage,
    //                         onShowSizeChange: setNumberOfPages,
    //                         showTotal: (total, range) =>
    //                             `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
    //                     }}
    //                 />
    //             </Col>
    //         </Row>
    //     </div>
    // )
}

MonHocChuongTrinhPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
