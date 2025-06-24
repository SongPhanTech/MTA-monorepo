import { queryClient } from '@api/index'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { ArchivedCertificate } from '@workspace/db'
import {
    useCountArchivedAward,
    useCreateArchivedCertificate,
    useFindManyArchivedAward,
    useUpdateArchivedCertificate,
} from '@workspace/db/hooks'
import { Col, Form, message } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import _ from 'lodash'
export type PutArchivedCertificate = ArchivedCertificate
dayjs.locale('vi')

const PutAddOlympicScoreModal = () => {
    const [form] = Form.useForm<PutArchivedCertificate>()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const { isOpen, onClose, input } = useDisclosure<any>({
        tag: PutAddOlympicScoreModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createArchivedCertificate } =
        useCreateArchivedCertificate()
    const { mutateAsync: updateArchivedCertificate } =
        useUpdateArchivedCertificate()
    async function onOk({ ...rest }: PutArchivedCertificate) {
        try {
            showSpinner()
            // if (id) {
            //     await updateArchivedCertificate({
            //         data: {
            //             name: rest.name,
            //             finalScore: rest.finalScore,
            //         },
            //         where: { id },
            //     })
            //     message.success('Cập nhật thành công')
            // } else {
            //     await createArchivedCertificate({
            //         data: rest,
            //     })
            //     message.success('Thêm mới thành công')
            // }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['ArchivedCertificate'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: dataTable = [], refetch } = useFindManyArchivedAward({})

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

    const { data: count } = useCountArchivedAward({})

    // const { data: level } = useFindUniqueArchivedCertificate(
    //     {
    //         where: { id },
    //     },
    //     { enabled: !!id }
    // )

    // // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    // useEffect(() => {
    //     if (level) {
    //         setTargetDisabled(false)
    //         form.setFieldsValue({
    //             ...level,
    //         })
    //     } else {
    //         form.setFieldsValue({
    //             active: true,
    //         })
    //     }
    // }, [level])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={'Thêm điểm cộng cho sinh viên'}
            className="w-[1000px]"
        >
            <Col span={24}>
                <Table
                    rowKey="id"
                    rowSelection={{
                        selectedRowKeys,
                        onChange: (selectedKeys) =>
                            setSelectedRowKeys(selectedKeys),
                    }}
                    id="training-category"
                    columns={[
                        {
                            title: 'STT',
                            width: 50,
                            align: 'center',
                            fixed: 'left',
                            render: (_, __, index) =>
                                index +
                                1 +
                                (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                        },
                        {
                            title: 'Tên chứng chỉ',
                            dataIndex: 'name',
                            align: 'center',
                        },
                        {
                            title: 'Điểm cộng',
                            dataIndex: 'bonusScore',
                            width: 200,
                            align: 'center',
                        },
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
        </PutFormModal>
    )
}

export default PutAddOlympicScoreModal
