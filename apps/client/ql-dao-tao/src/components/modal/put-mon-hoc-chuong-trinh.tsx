// import { UploadOutlined } from '@ant-design/icons'
// import { queryClient } from '@api/index'
// import { fetchGeneratePresignedUrl } from '@api/model/modelComponents'
// import FormItem from '@components/commons/form-item'
// import PutFormModal from '@components/commons/put-modal'
// import Select from '@components/commons/select'
// import MonHocSongHanhPage from '@components/sub-pages/mon-hoc-song-hanh'
// import MonHocTienQuyetPage from '@components/sub-pages/mon-hoc-tien-quyet'
// import { LOAI_MON_HOC_CTDT } from '@constants/constants'
// import useSpinner from '@hooks/spinner'
// import { buildOrgTree } from '@lib/utils'
// import type {
//     CurriculumVersionSubject,
//     SubjectVersion,
//     Subject,
//     TrainingBlock,
// } from '@workspace/db'
// import {
//     useCreateCurriculumVersionSubject,
//     useFindManyOrganization,
//     useFindManySubjectVersion,
//     useFindManySubject,
//     useFindManyTrainingBlock,
//     useFindUniqueCurriculumVersionSubject,
//     useUpdateCurriculumVersionSubject,
// } from '@workspace/db/hooks'
// import { Button, Col, Form, Input, Steps, Upload, message } from 'antd'
// import axios from 'axios'
// import dayjs from 'dayjs'
// import 'dayjs/locale/vi'
// import { useEffect, useState } from 'react'
// import { useDisclosure } from 'react-hook-disclosure-modal'
// export type PutCurriculumVersionSubject = CurriculumVersionSubject

// dayjs.locale('vi')
// type PutCurriculumVersionSubjectFile = PutCurriculumVersionSubject & {
//     file: File[]
// }
// const PutMonHocChuongTrinhModal = () => {
//     const [form] = Form.useForm<PutCurriculumVersionSubjectFile>()
//     const { isOpen, onClose, input } = useDisclosure<{
//         curriculumVersionId?: string | null | undefined
//         id?: string | null
//     }>({
//         tag: PutMonHocChuongTrinhModal.name,
//         onClose: form.resetFields,
//     })
//     let curriculumVersionId: string | null | undefined
//     let id: string | null | undefined

//     if (input) {
//         curriculumVersionId = input.curriculumVersionId
//         id = input.id
//     }
//     const { showSpinner, hideSpinner } = useSpinner()

//     const { mutateAsync: createCurriculumVersionSubject } =
//         useCreateCurriculumVersionSubject()
//     const { mutateAsync: updateCurrriculumVersionSubject } =
//         useUpdateCurriculumVersionSubject()
//     const { data: subjectData, refetch: refetchSubject } =
//         useFindManySubjectVersion()
//     const { data: trainingBlockData, refetch: refetchTrainingBlockData } =
//         useFindManyTrainingBlock()
//     async function onOk(output?: PutCurriculumVersionSubjectFile) {
//         if (!output) return
//         try {
//             showSpinner()
//             if (id) {
//                 await updateCurrriculumVersionSubject({
//                     data: {
//                         curriculumVersionId: curriculumVersionId || undefined,
//                         subjectId: output.subjectId,
//                         trainingBlockId: output.trainingBlockId,
//                         type: output.type,
//                         information: output.information,
//                         documentPath: output.documentPath,
//                         renderPath: output.renderPath,
//                     },
//                     where: {
//                         id,
//                     },
//                 })
//                 message.success('Cập nhật thành công')
//             } else {
//                 await createCurriculumVersionSubject({
//                     data: {
//                         // biome-ignore lint/style/noNonNullAssertion: <explanation>
//                         curriculumVersionId: curriculumVersionId!,
//                         subjectId: output.subjectId,
//                         trainingBlockId: output.trainingBlockId,
//                         type: output.type,
//                         information: output.information,
//                         documentPath: output.documentPath,
//                         renderPath: output.renderPath,
//                     },
//                 })
//                 message.success('Thêm mới thành công')
//             }
//             // refetch() lại danh sách level
//             queryClient.invalidateQueries({
//                 queryKey: ['CurriculumnVersionSubject'],
//             })
//             onClose()
//         } catch (error) {
//             message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
//         }
//         hideSpinner()
//     }

//     const { data: level } = useFindUniqueCurriculumVersionSubject({
//         where: { id: id || '' },
//     })
//     // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
//     useEffect(() => {
//         if (level) {
//             form.setFieldsValue(level)
//         }
//     }, [level])
//     const { data: manageOrgData = [], refetch: refetchManageOrg } =
//         useFindManyOrganization()
//     const treeData = buildOrgTree(manageOrgData)
//     const { data: subjectGroupData = [], refetch: refetchSGroup } =
//         useFindManySubjectVersion()
//     const [current, setCurrent] = useState(0)

//     const next = () => setCurrent(current + 1)
//     const prev = () => setCurrent(current - 1)
//     const steps = [
//         {
//             title: 'Thông tin chung',
//             content: 'First-content',
//         },
//         {
//             title: 'Môn học tiên quyết',
//             content: 'Second-content',
//         },
//         {
//             title: 'Môn học song hành',
//             content: 'Third-content',
//         },
//     ]
//     const onChange = (value: number) => {
//         setCurrent(value)
//     }
//     const items = steps.map((item) => ({ key: item.title, title: item.title }))

//     return (
//         <PutFormModal
//             open={isOpen}
//             form={form}
//             onFinish={onOk}
//             onCancel={onClose}
//             maskClosable={true}
//             title={
//                 id
//                     ? 'Chỉnh sửa môn học chương trình'
//                     : 'Thêm mới môn học chương trình'
//             }
//             className="w-[40vw]"
//         >
//             {id && (
//                 <Steps
//                     current={current}
//                     onChange={onChange}
//                     items={items}
//                     className="mb-4"
//                 />
//             )}
//             {(!id || current === 0) && (
//                 <>
//                     <Col span={24}>
//                         <FormItem
//                             form={form}
//                             name="subjectId"
//                             label="Môn học"
//                             normalize={(value) =>
//                                 value === undefined ? null : value
//                             }
//                             required
//                         >
//                             <Select
//                                 allowClear
//                                 placeholder="Chọn môn học"
//                                 options={subjectData?.map(
//                                     (item: SubjectVersion) => {
//                                         return {
//                                             value: item.id,
//                                             label: item.name,
//                                         }
//                                     }
//                                 )}
//                             />
//                         </FormItem>
//                     </Col>
//                     <Col span={24}>
//                         <FormItem
//                             form={form}
//                             name="type"
//                             label="Loại môn học"
//                             normalize={(value) =>
//                                 value === undefined ? null : value
//                             }
//                             required
//                         >
//                             <Select
//                                 allowClear
//                                 placeholder="Chọn loại môn học"
//                                 options={Object.entries(LOAI_MON_HOC_CTDT).map(
//                                     ([key, value_]) => {
//                                         return {
//                                             label: value_,
//                                             value: key,
//                                         }
//                                     }
//                                 )}
//                             />
//                         </FormItem>
//                     </Col>
//                     <Col span={24}>
//                         <FormItem
//                             form={form}
//                             name="trainingBlockId"
//                             label="Khối kiến thức"
//                             normalize={(value) =>
//                                 value === undefined ? null : value
//                             }
//                             // required
//                         >
//                             <Select
//                                 allowClear
//                                 placeholder="Chọn khối kiến thức"
//                                 options={trainingBlockData?.map(
//                                     (item: TrainingBlock) => {
//                                         return {
//                                             value: item.id,
//                                             label: item.name,
//                                         }
//                                     }
//                                 )}
//                             />
//                         </FormItem>
//                     </Col>
//                     <Col span={24}>
//                         <FormItem
//                             form={form}
//                             name="information"
//                             label="Thông tin"
//                             // required
//                         >
//                             <Input placeholder="Nhập thông tin" />
//                         </FormItem>
//                     </Col>
//                     <FormItem form={form} name="documentPath">
//                         <Input type="hidden" />
//                     </FormItem>
//                     <FormItem form={form} name="renderPath">
//                         <Input type="hidden" />
//                     </FormItem>
//                     <Col span={24}>
//                         <FormItem
//                             form={form}
//                             name="file"
//                             label="Tệp tài liệu"
//                             // required
//                             valuePropName="fileList"
//                             getValueFromEvent={(e) =>
//                                 Array.isArray(e) ? e : e?.fileList
//                             }
//                         >
//                             <Upload
//                                 maxCount={1}
//                                 accept=".doc,.docx,.pdf"
//                                 customRequest={async ({
//                                     file,
//                                     onSuccess,
//                                     onError,
//                                     onProgress,
//                                 }) => {
//                                     try {
//                                         const extension = ''
//                                         // file.name.split('.').pop() || ''
//                                         const id = crypto.randomUUID()

//                                         // Gọi API lấy presigned URL
//                                         const resPresignedUrl =
//                                             await fetchGeneratePresignedUrl({
//                                                 body: {
//                                                     path: 'mon-hoc-chuong-trinh',
//                                                     extension,
//                                                 },
//                                             })

//                                         // Upload file lên MinIO
//                                         await axios.put(
//                                             resPresignedUrl.url,
//                                             file,
//                                             {
//                                                 headers: {
//                                                     // 'Content-Type': file.type,
//                                                 },
//                                                 onUploadProgress: (
//                                                     progressEvent
//                                                 ) => {
//                                                     const {
//                                                         loaded,
//                                                         total = 1,
//                                                     } = progressEvent
//                                                     const percent = Math.floor(
//                                                         (loaded * 100) / total
//                                                     )
//                                                     onProgress?.({ percent })
//                                                 },
//                                             }
//                                         )
//                                         form.setFieldsValue({
//                                             documentPath:
//                                                 resPresignedUrl.fileName,
//                                             renderPath: resPresignedUrl.url,
//                                         })
//                                         console.log(
//                                             resPresignedUrl.fileName,
//                                             'nè'
//                                         )
//                                         onSuccess?.('OK')
//                                     } catch (err) {
//                                         console.error('Upload thất bại:', err)
//                                         message.error('Tải tệp lên thất bại')
//                                         // onError?.(err)
//                                     }
//                                 }}
//                                 beforeUpload={(file) => {
//                                     const isAcceptedType =
//                                         file.type ===
//                                             'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || // .docx
//                                         file.type === 'application/msword' || // .doc
//                                         file.type === 'application/pdf' // .pdf

//                                     if (!isAcceptedType) {
//                                         message.error(
//                                             'Chỉ được phép tải lên file Word hoặc PDF (.doc, .docx, .pdf)'
//                                         )
//                                         return Upload.LIST_IGNORE
//                                     }

//                                     return true // Cho phép upload tiếp
//                                 }}
//                             >
//                                 <Button icon={<UploadOutlined />}>
//                                     Chọn file Word/PDF
//                                 </Button>
//                             </Upload>
//                         </FormItem>
//                     </Col>
//                 </>
//             )}
//             {id && current === 1 && (
//                 <div className="w-full">
//                     <MonHocTienQuyetPage curriculumVersionSubjectId={id} />
//                 </div>
//             )}
//             {id && current === 2 && (
//                 <div className="w-full">
//                     <MonHocSongHanhPage curriculumVersionSubjectId={id} />
//                 </div>
//             )}
//         </PutFormModal>
//     )
// }

// export default PutMonHocChuongTrinhModal
