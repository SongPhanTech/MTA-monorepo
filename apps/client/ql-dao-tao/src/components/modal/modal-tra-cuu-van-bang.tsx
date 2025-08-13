import {
    type DiplomaVerificationApplication,
    DiplomaVerificationStatus,
    type RankingCondition,
} from '@workspace/db'
import dayjs from 'dayjs'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import useSpinner from '@hooks/spinner'
import {
    useFindManyGraduationDecision,
    useUpdateDiplomaVerificationApplication,
} from '@workspace/db/hooks'
import { Col, Form, Modal, message, Row } from 'antd'
import { useMemo } from 'react'

export type GraduationCriteria = RankingCondition
dayjs.locale('vi')

const ModalTraCuuVanBang = () => {
    const [form] = Form.useForm<GraduationCriteria>()
    const { showSpinner, hideSpinner } = useSpinner()
    const { isOpen, onClose, input } = useDisclosure<{
        data: DiplomaVerificationApplication
    }>({
        tag: ModalTraCuuVanBang.name,
        onClose: form.resetFields,
    })

    const { data: searchData } = useFindManyGraduationDecision(
        {
            where: input?.data
                ? {
                      ...(input?.data?.diplomaNumber && {
                          diplomaNumber: {
                              contains: input?.data?.diplomaNumber,
                              mode: 'insensitive',
                          },
                      }),
                      ...(input?.data?.originalDiplomaNumber && {
                          originalDiplomaNumber: {
                              contains: input?.data?.originalDiplomaNumber,
                              mode: 'insensitive',
                          },
                      }),
                      student: {
                          userProfile: {
                              ...(input?.data?.fullname && {
                                  fullname: {
                                      contains: input?.data?.fullname,
                                      mode: 'insensitive',
                                  },
                              }),
                              ...(input?.data?.idCardNumber && {
                                  idCardNumber: {
                                      contains: input?.data.idCardNumber,
                                      mode: 'insensitive',
                                  },
                              }),
                              //   ...(input?.data?.dateOfBirth && {
                              //       dateOfBirth: dayjs(
                              //           input?.data?.dateOfBirth,
                              //           'DD/MM/YYYY'
                              //       ).toDate(),
                              //   }),
                          },
                      },
                  }
                : undefined,
        },
        { enabled: !!input?.data }
    )

    console.log(searchData)

    const { mutateAsync: updateDiplomaVerificationApplication } =
        useUpdateDiplomaVerificationApplication()

    const handleUpdateStatus = async (
        record: DiplomaVerificationApplication,
        status: DiplomaVerificationStatus
    ) => {
        try {
            showSpinner()
            await updateDiplomaVerificationApplication({
                where: { id: record?.id },
                data: { status },
            })
            message.success('Cập nhật trạng thái thành công')
        } catch {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const isFound = useMemo(() => {
        return searchData && searchData.length > 0
    }, [searchData])

    return (
        <Modal
            title={'Tra cứu văn bằng'}
            open={isOpen}
            onCancel={onClose}
            okText="Xác nhận"
            cancelText="Hủy"
            width="80vw"
            style={{ maxWidth: '1200px' }}
            onOk={async () => {
                if (!input?.data) return
                await handleUpdateStatus(
                    input.data,
                    isFound
                        ? DiplomaVerificationStatus.APPROVED
                        : DiplomaVerificationStatus.REJECTED
                )
                onClose()
            }}
        >
            {isFound ? (
                <Row gutter={16}>
                    <Col span={12}>
                        <div className="flex flex-col gap-1">
                            <span className="font-medium">Họ và tên</span>
                            <span>1231</span>
                        </div>
                    </Col>
                </Row>
            ) : (
                <div className="flex flex-col gap-2">
                    <span>Không tìm thấy học viên, sinh viên phù hợp.</span>
                    <span className="text-red-500"> Bạn có muốn từ chối?</span>
                </div>
            )}
        </Modal>
    )
}

export default ModalTraCuuVanBang
