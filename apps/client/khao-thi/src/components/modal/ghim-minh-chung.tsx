import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import { useFindManyEvidence } from '@workspace/db/hooks'
import type { ItemProps } from '@workspace/libs/utils'
import { Col, Form, message } from 'antd'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutEvidenceType = {
    evidences: string
}

const PinEvidenceToPeriod = () => {
    const [form] = Form.useForm<PutEvidenceType>()
    const { isOpen, onClose, input } = useDisclosure<{
        id: string
        changeValue: (value: { value: string; label: string }) => void
    }>({
        tag: 'PinEvidenceToPeriod',
        onClose: form.resetFields,
    })

    const { showSpinner, hideSpinner } = useSpinner()
    const [items, setItems] = useState<ItemProps>({ value: '', label: '' })
    async function onOk(output?: PutEvidenceType) {
        if (!output) return
        try {
            showSpinner()

            if (input?.id) {
                input.changeValue(items)
            }
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
    const { data: listEvidence } = useFindManyEvidence({
        where: {
            analysisFormEvidence: {
                some: {
                    requirementCriterion: {
                        analysisCriterion: {
                            criterionPeriod: {
                                evaluationStandard: {
                                    periodId: 's4ekrtol3huj0nd5x94tc0pw',
                                },
                            },
                        },
                    },
                },
            },
        },
        include: {
            analysisFormEvidence: {
                include: {
                    requirementCriterion: {
                        include: {
                            analysisCriterion: {
                                include: {
                                    criterionPeriod: {
                                        include: {
                                            evaluationStandard: {
                                                include: {
                                                    period: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    })

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={'Thêm minh chứng cho tiêu chí'}
            className="w-[700px]"
        >
            <Col span={24}>
                <Form.Item name="evidences" label="Minh chứng" required>
                    <Select
                        placeholder="Chọn minh chứng"
                        options={listEvidence?.map((i) => {
                            return {
                                label: i.name,
                                value: i.id,
                                key: i.id,
                            }
                        })}
                        onChange={(value, option: any) => {
                            setItems(option)
                        }}
                    />
                </Form.Item>
            </Col>
        </PutFormModal>
    )
}

export default PinEvidenceToPeriod
