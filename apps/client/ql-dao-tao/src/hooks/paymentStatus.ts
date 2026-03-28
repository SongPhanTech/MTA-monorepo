import { ArchivedCertificateStatus, PaymentStatus } from "@workspace/db/client"

export type PaymentStatusOption = {
  value: PaymentStatus
  label: string
  color?: string
}

export const usePaymentStatusOptions = () => {
  const paymentStatusOptions: PaymentStatusOption[] = [
    { value: PaymentStatus.PENDING, label: "Chờ thanh toán", color: "blue" },
    { value: PaymentStatus.PROCESSING, label: "Đang xử lý", color: "orange" },
    { value: PaymentStatus.PAID, label: "Đã thanh toán", color: "green" },
    { value: PaymentStatus.FAILED, label: "Thanh toán lỗi", color: "red" },
  ]

  const getPaymentStatusLabel = (value: PaymentStatus | null | undefined): string => {
    return paymentStatusOptions.find((opt) => opt.value === value)?.label || ""
  }

  const getPaymentStatusColor = (value: PaymentStatus | null | undefined): string => {
    return paymentStatusOptions.find((opt) => opt.value === value)?.color || "default"
  }

  return {
    paymentStatusOptions,
    getPaymentStatusLabel,
    getPaymentStatusColor,
  }
}

export const useArchivedCertificateStatusOptions = () => {
  const archivedCertificateStatusOptions = [
    { value: ArchivedCertificateStatus.PENDING, label: "Chờ phê duyệt", color: "orange" },
    { value: ArchivedCertificateStatus.APPROVED, label: "Chấp thuận", color: "green" },
    { value: ArchivedCertificateStatus.REJECTED, label: "Từ chối", color: "red" },
    { value: ArchivedCertificateStatus.CANCEL, label: "Hủy", color: "red" },
  ]

  const getArchivedCertificateStatusStatusLabel = (
    value: ArchivedCertificateStatus | null | undefined
  ): string => {
    return archivedCertificateStatusOptions.find((opt) => opt.value === value)?.label || ""
  }

  const getArchivedCertificateStatusColor = (
    value: ArchivedCertificateStatus | null | undefined
  ): string => {
    return archivedCertificateStatusOptions.find((opt) => opt.value === value)?.color || "default"
  }

  return {
    archivedCertificateStatusOptions,
    getArchivedCertificateStatusStatusLabel,
    getArchivedCertificateStatusColor,
  }
}
