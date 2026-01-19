import { queryClient } from '@api/index'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import { buildOrgTree } from '@lib/utils'
import type { ExamFramework, Subject, SubjectVersion } from '@workspace/db/client'
import {
    useCreateExamFramework,
    useCreateSubject,
    useCreateSubjectVersion,
    useFindManyDM_DonVi,
    useFindManySubjectVersion,
    useFindUniqueExamFramework,
    useUpdateExamFramework,
} from '@workspace/db/hooks'
import { Col, Form, Input, InputNumber, message } from 'antd'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export type CreateExamFrameworkPayload = ExamFramework
export type SubjectVersionItem = SubjectVersion
export type SubjectItem = Subject

export default function ModalTaoKhungDe() {
    const [newSubjectForm] = Form.useForm<SubjectItem>()
    const [form] = Form.useForm<CreateExamFrameworkPayload>()
    const [donViFilter, setDonViFilter] = useState<string | null>(null)

    const { isOpen, onClose, input } = useDisclosure<{
        id?: string
    }>({
        tag: 'ModalTaoKhungDe',
        onClose: form.resetFields,
    })
    const [organization, setOrganization] = useState<string[]>([])
    const id = input?.id

    const { data: subjectVersions = [] } = useFindManySubjectVersion({
        orderBy: { createdAt: 'desc' },
    })

    const filteredSubjectVersions = donViFilter
        ? subjectVersions.filter(
              (sv: SubjectVersionItem) => sv.managementOrganizationId === donViFilter
          )
        : subjectVersions

    const { mutateAsync: createExamFramework } = useCreateExamFramework({
        onError: () => message.error('Không tạo được khung đề'),
    })
    const { mutateAsync: createSubject } = useCreateSubject({
        onError: () => message.error('Không tạo được môn học'),
    })
    const { mutateAsync: updateExamFramework } = useUpdateExamFramework({
        onError: () => message.error('Không cập nhật được khung đề'),
    })
    const { mutateAsync: createSubjectVersion } = useCreateSubjectVersion({
        onError: () => message.error('Không tạo được phiên bản môn học'),
    })
    const { data: organizations = [] } = useFindManyDM_DonVi()

    const treeData = buildOrgTree(organizations)

    const { data: examFrameworkData } = useFindUniqueExamFramework(
        {
            where: {
                id,
            },
        },
        {
            enabled: !!id,
        }
    )

    async function onOk(output?: CreateExamFrameworkPayload) {
        if (!output) return
        try {
            const data = {
                code: output.code?.trim(),
                name: output.name.trim(),
                time: Number(output.time),
                description: output.description?.trim() || null,
                subjectVersionId: output.subjectVersionId,
            }
            if (id) {
                await updateExamFramework({
                    where: {
                        id,
                    },
                    data,
                })
                message.success('Cập nhật thành công')
            } else {
                await createExamFramework({
                    data,
                })
                message.success('Thêm mới thành công')
            }

            queryClient.invalidateQueries({ queryKey: ['examFramework'] })

            onClose()
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
    }

    useEffect(() => {
        if (examFrameworkData && id) {
            form.setFieldsValue({
                name: examFrameworkData.name,
                time: examFrameworkData.time,
                description: examFrameworkData.description,
                subjectVersionId: examFrameworkData.subjectVersionId,
            })
        }
    }, [examFrameworkData, id, form])

    return (
        <PutFormModal
            title={id ? 'Cập nhật khung đề' : 'Tạo khung đề'}
            open={isOpen}
            form={form}
            onCancel={onClose}
            onFinish={onOk}
            maskClosable={true}
            className="w-[60vw] top-2"
        >
            <Col span={24}>
                <Form.Item
                    label="Tên khung đề"
                    name="name"
                    rules={[{ required: true, message: 'Vui lòng nhập tên khung đề' }]}
                >
                    <Input placeholder="Tên khung đề" size="large" />
                </Form.Item>

                <Form.Item
                    label="Thời gian thi (phút)"
                    name="time"
                    rules={[{ required: true, message: 'Vui lòng nhập thời gian' }]}
                >
                    <InputNumber
                        min={1}
                        size="large"
                        style={{ width: '100%' }}
                        placeholder="Thời gian thi"
                        addonAfter="phút"
                    />
                </Form.Item>

                {/* <Form.Item label="Đơn vị">
                    <Select
                        allowClear
                        placeholder="Chọn đơn vị"
                        size="large"
                        options={organizations.map((dv) => ({
                            label: `${dv.sTen || 'Không tên'}${dv.sMa ? ` – ${dv.sMa}` : ''}`,
                            value: dv.Id,
                        }))}
                        onChange={(value) => {
                            setDonViFilter(value || null)
                            form.setFieldValue('subjectVersionId', undefined)
                        }}
                    />
                </Form.Item> */}

                <Form.Item
                    label="Môn học"
                    name="subjectVersionId"
                    rules={[{ required: true, message: 'Vui lòng chọn Môn học' }]}
                >
                    <Select
                        placeholder="Chọn Môn học"
                        size="large"
                        options={filteredSubjectVersions.map((sv) => ({
                            label: `${sv.name}${sv.code ? ` - (${sv.code})` : ''}`,
                            value: sv.id,
                        }))}
                    />
                </Form.Item>

                <Form.Item label="Mô tả" name="description">
                    <Input.TextArea rows={3} placeholder="Mô tả cho khung đề" />
                </Form.Item>

                {/* <Tabs
          defaultActiveKey="chon-mon"
          items={[
            // Tab chọn SubjectVersion

            {
              key: "chon-mon",
              label: "Chọn môn học",
              children: (
                <Form.Item
                  name="subjectVersionId"
                  rules={[{ required: true, message: "Vui lòng chọn Môn học" }]}
                >
                  <Select
                    placeholder="Chọn Môn học"
                    size="large"
                    options={subjectVersions.map((sv) => ({
                      label: sv.name,
                      value: sv.id,
                    }))}
                  />
                </Form.Item>
              ),
            },

            // Tab tạo mới Subject
            // {
            //   key: "them-moi",
            //   label: "Thêm Môn học",
            //   children: (
            //     <Form layout="vertical" form={newSubjectForm}>
            //       <Form.Item
            //         name="Don vi"
            //         label="Tên Đơn Vị"
            //         rules={[{ required: true, message: "Nhập tên đơn vị" }]}
            //       >
            //         <TreeSelect
            //           multiple
            //           maxTagCount="responsive"
            //           allowClear
            //           showSearch
            //           placeholder="Chọn đơn vị"
            //           treeDefaultExpandAll
            //           treeData={treeData}
            //           value={organizations}
            //           className="mr-4 w-[300px]"
            //           onChange={(value) => {
            //             setOrganization(value);
            //           }}
            //         />
            //       </Form.Item>

            //       <Form.Item
            //         name="name"
            //         label="Tên Môn học"
            //         rules={[{ required: true, message: "Nhập tên môn học" }]}
            //       >
            //         <Input placeholder="Nhập tên môn học" />
            //       </Form.Item>

            //       <Form.Item name="information" label="Mô tả">
            //         <Input.TextArea rows={2} placeholder="Thông tin mô tả" />
            //       </Form.Item>

            //       <Button type="primary" onClick={handleAddNewSubject}>
            //         Thêm Môn học
            //       </Button>
            //     </Form>
            //   ),
            // },
          ]}
        /> */}
            </Col>
        </PutFormModal>
    )
}
