export interface PutOrganizationUserProps {
    id: string
    action: string
}
const PutOrganizationUser = () => {
    return <></>
    // const [form] = Form.useForm<OrganizationUser>()
    // const {
    //     isOpen,
    //     onClose,
    //     input: input,
    // } = useDisclosure<PutOrganizationUserProps>({
    //     tag: PutOrganizationUser.name,
    //     onClose: form.resetFields,
    // })
    // const { id, action } = input || {}
    // const { showSpinner, hideSpinner } = useSpinner()

    // const { data: positions, refetch: refetchPositions } = useFindManyPosition()
    // const { data: organizations, refetch: refetchOrganizations } =
    //     useFindManyDM_DonVi()

    // const { mutateAsync: createOrganizationUser } = useCreateOrganizationUser()
    // const { mutateAsync: updateOrganizationUserevel } =
    //     useUpdateOrganizationUser()
    // async function onOk(output?: OrganizationUser) {
    //     console.log(output)
    //     if (!output) return
    //     if (!id) return
    //     try {
    //         showSpinner()
    //         if (action === 'edit') {
    //             await updateOrganizationUserevel({
    //                 data: {
    //                     userProfileId: id,
    //                     organizationId: output.organizationId,
    //                     positionId: output.positionId,
    //                     status: output.status,
    //                 },
    //                 where: {
    //                     id,
    //                 },
    //             })
    //             message.success('Cập nhật thành công')
    //         } else {
    //             await createOrganizationUser({
    //                 data: {
    //                     userProfileId: id,
    //                     organizationId: output.organizationId,
    //                     positionId: output.positionId,
    //                 },
    //             })
    //             message.success('Thêm mới thành công')
    //         }
    //         // refetch() lại danh sách level
    //         queryClient.invalidateQueries({
    //             queryKey: ['OrganizationUser'],
    //         })
    //         onClose()
    //     } catch (error) {
    //         message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
    //     }
    //     hideSpinner()
    // }

    // const { data: level } = useFindUniqueOrganizationUser(
    //     id
    //         ? {
    //               where: {
    //                   id: id,
    //               },
    //           }
    //         : {
    //               where: {
    //                   id: '',
    //               },
    //           }
    // )
    // // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    // useEffect(() => {
    //     if (level) {
    //         form.setFieldsValue(level)
    //     }
    // }, [level])

    // return (
    //     <PutFormModal
    //         open={isOpen}
    //         form={form}
    //         onFinish={onOk}
    //         onCancel={onClose}
    //         maskClosable={true}
    //         title={
    //             action === 'edit'
    //                 ? 'Chỉnh sửa đơn vị công tác'
    //                 : 'Thêm mới đơn vị công tác'
    //         }
    //         className="w-[25vw]"
    //     >
    //         <Col span={24}>
    //             <FormItem
    //                 form={form}
    //                 required
    //                 name="organizationId"
    //                 label="Chọn đơn vị"
    //                 className="mb-2"
    //             >
    //                 <TreeSelect
    //                     placeholder="Chọn đơn vị"
    //                     treeData={convertToTreeSelect(organizations || [])}
    //                 />
    //             </FormItem>
    //         </Col>
    //         <Col span={24}>
    //             <FormItem
    //                 required
    //                 form={form}
    //                 name="positionId"
    //                 label="Chọn vị trí công tác"
    //                 className="mb-0"
    //             >
    //                 <Select
    //                     allowClear
    //                     placeholder="Chọn vị trí công tác"
    //                     options={positions?.map((item) => {
    //                         return {
    //                             value: item.id,
    //                             label: item.name,
    //                         }
    //                     })}
    //                 />
    //             </FormItem>
    //         </Col>
    //         <Col span={24}>
    //             {!id ? (
    //                 <FormItem
    //                     form={form}
    //                     name="status"
    //                     label="Chọn trạng thái"
    //                     className="mb-0"
    //                 >
    //                     <Select
    //                         allowClear
    //                         placeholder="Chọn trạng thái"
    //                         options={[
    //                             {
    //                                 value: OrganizationUserStatus.ACTIVE,
    //                                 label: 'Đang hoạt động',
    //                             },
    //                             {
    //                                 value: OrganizationUserStatus.ACTIVE,
    //                                 label: 'Không hoạt động',
    //                             },
    //                             {
    //                                 value: OrganizationUserStatus.ACTIVE,
    //                                 label: 'Tạm dừng do công tác khác',
    //                             },
    //                             {
    //                                 value: OrganizationUserStatus.ACTIVE,
    //                                 label: 'Kết thúc hợp đồng',
    //                             },
    //                         ]}
    //                     />
    //                 </FormItem>
    //             ) : (
    //                 ''
    //             )}
    //         </Col>
    //     </PutFormModal>
    // )
}

export default PutOrganizationUser
