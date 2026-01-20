import PutFormModal from '@components/commons/put-modal'
import Table from '@components/commons/table'
import {
    DEFAULT_PAGINATE_SIZE,
    FIXED_CLASS_STUDENT_STATUS,
    GENDER_MEAN,
} from '@constants/constants'
import useSpinner from '@hooks/spinner'
import type { Prisma } from '@workspace/db/client'
import {
    useCountStudent,
    useFindManyFixedClass,
    useFindManyStudent,
    useFindManySubjectClass,
    useUpdateManyStudent,
} from '@workspace/db/hooks'
import { FormItem, Select } from '@workspace/ui'
import { Button, Col, Flex, Form, Input, message, Row, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import { ArrowBigLeftDash, ArrowBigRightDash } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

const ModalChuyenDiemLopMonHoc = () => {
    const { isOpen, onClose } = useDisclosure({
        tag: 'ModalChuyenDiemLopMonHoc',
    })
    const [form] = Form.useForm()
    const { data: subjectClasses } = useFindManySubjectClass()
    const [filter, setFilter] = useState<{
        fixedClassId: string
        search: string
    }>({
        fixedClassId: '',
        search: '',
    })
    const onOk = () => {
        console.log('onOk')
    }
    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            maskClosable={true}
            onCancel={onClose}
            title="Chuyển điểm sang lớp môn học"
            className="w-[70vw]"
        >
            <div className="py-4">
                <FormItem  name="subjectClassIds" label="Lớp môn học luận văn/đề án" required className="w-[300px]">
                    <Select
                        mode="multiple"
                        className="w-full"
                        options={subjectClasses?.map((item) => ({
                            label: `${item.code} - ${item.name}`,
                            value: item.id,
                        }))}
                        placeholder="Chọn lớp môn học luận văn/đề án"
                    />
                </FormItem>
            </div>
        </PutFormModal>
    )
}

export default ModalChuyenDiemLopMonHoc
