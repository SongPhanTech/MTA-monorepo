import Table from "@components/commons/table"
// import DeleteIcon from '@components/icons/delete'
// import EditIcon from '@components/icons/edit'
import { useArchivedCertificateStatusOptions } from "@hooks/paymentStatus"
import useSpinner from "@hooks/spinner"
import { formatDate } from "@lib/utils"
import { useUpdateArchivedCertificate } from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
// import { QL_DAO_TAO_PERMISSION } from '@workspace/router'
import { Modal, message, Tag } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

interface StudentCertificatesInput {
  studentId: string
  studentName: string
  certificates: any[]
}

const ModalDanhSachChungChi = () => {
  const { can, canSome } = useAbility()
  const { showSpinner, hideSpinner } = useSpinner()

  const {
    archivedCertificateStatusOptions,
    getArchivedCertificateStatusStatusLabel,
    getArchivedCertificateStatusColor,
  } = useArchivedCertificateStatusOptions()

  const { isOpen, onClose, input } = useDisclosure<StudentCertificatesInput>({
    tag: "ModalDanhSachChungChi",
  })

  const { onOpen: onOpenEdit } = useDisclosure<string>({
    tag: "PutCertificateArchivedModal",
  })

  const { mutateAsync: updateArchivedCertificate } = useUpdateArchivedCertificate()

  async function handleDelete(id: string) {
    try {
      showSpinner()
      await updateArchivedCertificate({
        where: {
          id,
        },
        data: {
          status: "CANCEL",
        },
      })
      message.success("Xóa chứng chỉ thành công")
      onClose()
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const certificates = input?.certificates || []

  return (
    <Modal
      title={`Danh sách chứng chỉ - ${input?.studentName || ""}`}
      open={isOpen}
      onCancel={onClose}
      width={1200}
      footer={null}
      destroyOnClose
    >
      <Table
        rowKey="id"
        dataSource={certificates}
        pagination={false}
        columns={[
          {
            title: "STT",
            width: 50,
            align: "center",
            render: (_, __, index) => index + 1,
          },
          {
            title: "Tên chứng chỉ",
            dataIndex: "name",
            align: "center",
            render: (__, cert) => cert?.certificate?.name || "",
          },
          {
            title: "Điểm TX",
            dataIndex: "score",
            align: "center",
            width: 100,
          },
          {
            title: "Điểm quy đổi",
            dataIndex: "finalScore",
            align: "center",
            width: 140,
          },
          {
            title: "Ngày cấp",
            dataIndex: "issuedDate",
            align: "center",
            width: 150,
            render: (date) => (date ? formatDate(date) : ""),
          },
          {
            title: "Ngày hết hạn",
            dataIndex: "expiredDate",
            align: "center",
            width: 150,
            render: (date) => (date ? formatDate(date) : ""),
          },
          {
            title: "Trạng thái",
            dataIndex: "status",
            width: 150,
            align: "center",
            render: (status) => {
              const label = getArchivedCertificateStatusStatusLabel(status)
              const color = getArchivedCertificateStatusColor(status)
              return <Tag color={color}>{label}</Tag>
            },
          },
          // {
          //     title: 'Thao tác',
          //     width: 150,
          //     align: 'center',
          //     hidden: !canSome(
          //         QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_QL_DIEM_CONG,
          //         'SUA',
          //         'XOA'
          //     ),
          //     render: (_, cert) => {
          //         return (
          //             <Row className="justify-center gap-2">
          //                 {can(
          //                     QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_QL_DIEM_CONG,
          //                     'SUA'
          //                 ) &&
          //                     cert.status === 'PENDING' && (
          //                         <EditIcon
          //                             onClick={() => {
          //                                 onOpenEdit(cert.id)
          //                                 // onClose()
          //                             }}
          //                             className="text-sm text-blue-700 cursor-pointer"
          //                         />
          //                     )}
          //                 {can(
          //                     QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_QL_DIEM_CONG,
          //                     'XOA'
          //                 ) &&
          //                     cert.status === 'PENDING' && (
          //                         <DeleteIcon
          //                             popConfirm={{
          //                                 onConfirm: () => handleDelete(cert.id),
          //                             }}
          //                         />
          //                     )}
          //             </Row>
          //         )
          //     },
          // },
        ]}
      />
    </Modal>
  )
}

export default ModalDanhSachChungChi
