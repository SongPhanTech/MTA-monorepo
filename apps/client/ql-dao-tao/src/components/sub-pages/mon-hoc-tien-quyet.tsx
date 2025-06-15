import { EyeOutlined } from '@ant-design/icons'
import { fetchUpdateUser } from '@api/open-api/appComponents'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutSemesterModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountSemester,
    useFindManySemester,
    useUpdateSemester,
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
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

type Props = {
    curriculumVersionSubjectId: string
}
export default function MonHocTienQuyetPage({
    curriculumVersionSubjectId,
}: Props) {
    return <></>
    // const [currentPage, setCurrentPage] = useState(1)
    // const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    // const [searchText, setSearchText] = useState<string>('')

    // const { data = [], refetch } = useFindManyPrerequisiteSubject({
    //     where: {
    //         // name: {
    //         //     contains: searchText,
    //         // },
    //         curriculumVersionSubjectId: {
    //             equals: curriculumVersionSubjectId,
    //         },
    //     },
    //     include: {
    //         curriculumVersionSubject: true,
    //         subject: true,
    //     },
    //     orderBy: {
    //         createdAt: 'desc',
    //     },
    //     take: numberOfPages,
    //     skip: (currentPage - 1) * numberOfPages,
    // })
    // const { data: count } = useCountPrerequisiteSubject({
    //     where: {
    //         // name: {
    //         //     contains: searchText,
    //         // },
    //         curriculumVersionSubjectId: {
    //             equals: curriculumVersionSubjectId,
    //         },
    //     },
    // })

    // const debouncedSearchText = _.debounce(setSearchText, 500)
    // const { onOpen, onClose } = useDisclosure<{
    //     curriculumVersionSubjectId?: string | null | undefined // môn học chương trình
    //     id?: string | null
    // }>({
    //     tag: PutMonHocTienQuyetModal.name,
    // })

    // const { showSpinner, hideSpinner } = useSpinner()

    // const handleModal = () => {
    //     onOpen({
    //         curriculumVersionSubjectId,
    //     })
    // }
    // const { mutateAsync: updatePrerequisiteSubject } =
    //     useUpdatePrerequisiteSubject()
    // async function handleDelete(id: string) {
    //     try {
    //         showSpinner()
    //         await updatePrerequisiteSubject({
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
    //             Môn học tiên quyết
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
    //                             title: 'Tên môn học tiên quyết',
    //                             dataIndex: 'subject',
    //                             render: (value) =>
    //                                 value?.name ? value?.name : '',
    //                         },
    //                         {
    //                             title: 'Thao tác',
    //                             width: 100,
    //                             align: 'center',
    //                             render: (_, { id }) => (
    //                                 <Row className="justify-center gap-2">
    //                                     {/* <Tooltip
    //                                         title="Xem chi tiết"
    //                                         placement="leftTop"
    //                                     >
    //                                         <EyeOutlined
    //                                             onClick={onOpen.bind(
    //                                                 curriculumVersionSubjectId,
    //                                                 id
    //                                             )}
    //                                             className="text-sm text-blue-700 cursor-pointer"
    //                                         />
    //                                     </Tooltip> */}
    //                                     <EditIcon
    //                                         onClick={onOpen.bind(
    //                                             curriculumVersionSubjectId,
    //                                             id
    //                                         )}
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

MonHocTienQuyetPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
