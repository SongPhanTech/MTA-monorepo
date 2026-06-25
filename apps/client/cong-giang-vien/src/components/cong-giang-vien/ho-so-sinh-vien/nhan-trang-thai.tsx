interface NhanTrangThaiProps {
  label: string
}

const NhanTrangThai = ({ label }: NhanTrangThaiProps) => (
  <span className="inline-block rounded-full bg-cgv-green/20 px-3 py-0.5 text-xs font-medium text-cgv-green-dark">
    {label}
  </span>
)

export default NhanTrangThai
