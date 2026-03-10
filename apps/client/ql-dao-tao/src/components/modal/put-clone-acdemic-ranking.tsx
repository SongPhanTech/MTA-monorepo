import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import { useCreateManyAcademicRankingConvert, useFindManyTrainingCourse } from '@workspace/db/hooks'
import { Col, Form, message } from 'antd'
import dayjs from 'dayjs'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import Select from '@components/commons/select'
import type { AcademicRankingConvert, TrainingCourse } from '@workspace/db/client'
import { useTrainingObjectTypeStore } from '@workspace/ui'
export type PutCloneAcademicRankingFormType = { trainingCourseId: string }
dayjs.locale('vi')

const PutCloneAcademicRanking = () => {
    const [form] = Form.useForm<PutCloneAcademicRankingFormType>()
    const { isOpen, onClose, input } = useDisclosure<{
        record: TrainingCourse & { academicRankingConvert: AcademicRankingConvert[] }
    }>({
        tag: 'PutCloneAcademicRanking',
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createManyAcademicRanking } = useCreateManyAcademicRankingConvert()
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const { data: trainingCourses } = useFindManyTrainingCourse({
        where: {
            active: true,
            academicRankingConvert: {
                none: {},
            },
            trainingObjectTypeId,
        },
        orderBy: {
            semesterStart: {
                startDate: 'desc',
            },
        },
    })

    async function onOk(output?: PutCloneAcademicRankingFormType) {
        if (!output) return
        try {
            showSpinner()
            if (!input?.record.academicRankingConvert?.length) return
            type Item = AcademicRankingConvert & { $type?: string; key?: string }
            await createManyAcademicRanking({
                data: input?.record?.academicRankingConvert.map(
                    ({ id, createdAt, updatedAt, $type, key, ...rest }: Item) => ({
                        ...rest,
                        trainingCourseId: output.trainingCourseId,
                    })
                ),
            })
            message.success('Thêm mới thành công')
            queryClient.invalidateQueries({
                queryKey: ['SchoolYear'],
            })
            onClose()
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={'Nhân bản xếp loại học lực'}
            className="w-[400px]"
        >
            <Col span={24}>
                <FormItem form={form} name="trainingCourseId" label="Khoá học" required>
                    <Select
                        options={trainingCourses?.map(({ id, name }) => ({
                            value: id,
                            label: name,
                        }))}
                        placeholder="Chọn khoá học"
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutCloneAcademicRanking
