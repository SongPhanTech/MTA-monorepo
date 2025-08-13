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
import { Col, Form, Image, Modal, message, Row } from 'antd'
import { useMemo } from 'react'
import { env } from '@/env'

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
            include: {
                student: {
                    include: {
                        userProfile: true,
                        fixedClass: {
                            include: {
                                trainingCourse: true,
                            },
                        },
                    },
                },
                diplomaFront: true,
                diplomaBack: true,
            },
        },
        { enabled: !!input?.data }
    )

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
                searchData?.map((item) => (
                    <Row gutter={16} key={item.id}>
                        <Col span={24}>
                            <div className="flex items-center">
                                <Col span={9}>
                                    <div className="border border-solid border-primary rounded p-2">
                                        <Row gutter={16} className="flex items-center">
                                            <Col span={7}>
                                                <Image
                                                    src={`${env.NEXT_PUBLIC_MINIO_ENDPOINT}/${item?.student?.userProfile?.avatar}`}
                                                    alt={item?.student?.code}
                                                    className="h-28 w-20 border border-primary object-contain"
                                                />
                                            </Col>
                                            <Col span={17}>
                                                <div className="flex flex-col gap-1">
                                                    <span>
                                                        Họ và tên:{' '}
                                                        <span className="uppercase font-bold">
                                                            {item?.student?.userProfile?.fullname}
                                                        </span>
                                                    </span>
                                                    <span>
                                                        MSSV:{' '}
                                                        <span className="uppercase font-bold">
                                                            {item?.student?.code}
                                                        </span>
                                                    </span>
                                                    <span>
                                                        Ngày sinh:{' '}
                                                        <span className="uppercase font-bold">
                                                            {item?.student?.userProfile?.dateOfBirth
                                                                ? dayjs(
                                                                      item?.student?.userProfile
                                                                          ?.dateOfBirth
                                                                  ).format('DD/MM/YYYY')
                                                                : ''}
                                                        </span>
                                                    </span>
                                                    <span>
                                                        Số CMND:{' '}
                                                        <span className="uppercase font-bold">
                                                            {
                                                                item?.student?.userProfile
                                                                    ?.idCardNumber
                                                            }
                                                        </span>
                                                    </span>
                                                    <span>
                                                        Lớp:{' '}
                                                        <span className="font-bold">
                                                            {item?.student?.fixedClass?.name}
                                                        </span>
                                                    </span>
                                                    <span>
                                                        Niên khóa:{' '}
                                                        <span className="font-bold">
                                                            {
                                                                item?.student?.fixedClass
                                                                    ?.trainingCourse?.name
                                                            }
                                                        </span>
                                                    </span>
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>
                                </Col>
                                <Col span={15}>
                                    <div className="flex w-full gap-4">
                                        <Image
                                            src={`${env.NEXT_PUBLIC_MINIO_ENDPOINT}/${item?.diplomaFront?.path}`}
                                            className="w-full object-contain"
                                        />
                                        <Image
                                            src={`${env.NEXT_PUBLIC_MINIO_ENDPOINT}/${item?.diplomaBack?.path}`}
                                            className="w-full object-contain"
                                        />
                                    </div>
                                </Col>
                            </div>
                        </Col>
                    </Row>
                ))
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
