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
import { Form, Modal, message } from 'antd'

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
                      ...(input?.data?.diplomaNumber
                          ? {
                                diplomaNumber: {
                                    contains: input?.data?.diplomaNumber,
                                    mode: 'insensitive',
                                },
                            }
                          : {}),
                      ...(input?.data?.originalDiplomaNumber
                          ? {
                                originalDiplomaNumber: {
                                    contains: input?.data?.originalDiplomaNumber,
                                    mode: 'insensitive',
                                },
                            }
                          : {}),
                      student: {
                          userProfile: {
                              ...(input?.data?.fullname
                                  ? {
                                        fullname: {
                                            contains: input?.data?.fullname,
                                            mode: 'insensitive',
                                        },
                                    }
                                  : {}),
                              ...(input?.data?.idCardNumber
                                  ? {
                                        idCardNumber: {
                                            contains: input?.data.idCardNumber,
                                            mode: 'insensitive',
                                        },
                                    }
                                  : {}),
                              //   ...(input?.data?.dateOfBirth
                              //       ? {
                              //             dateOfBirth: dayjs(
                              //                 input?.data?.dateOfBirth,
                              //                 'DD/MM/YYYY'
                              //             ).toDate(),
                              //         }
                              //       : {}),
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

    const handleUpdateRejected = async (record: DiplomaVerificationApplication) => {
        try {
            showSpinner()
            await updateDiplomaVerificationApplication({
                where: { id: record?.id },
                data: { status: DiplomaVerificationStatus.REJECTED },
            })
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const handleUpdateApproved = async (record: DiplomaVerificationApplication) => {
        try {
            showSpinner()
            await updateDiplomaVerificationApplication({
                where: { id: record?.id },
                data: { status: DiplomaVerificationStatus.APPROVED },
            })
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    return (
        <Modal
            title="Tra cứu"
            open={isOpen}
            onCancel={onClose}
            width="80vw"
            style={{ maxWidth: '1200px' }}
            okText="Xác nhận"
            cancelText="Hủy"
        >
            qwe
        </Modal>
    )
}

export default ModalTraCuuVanBang
