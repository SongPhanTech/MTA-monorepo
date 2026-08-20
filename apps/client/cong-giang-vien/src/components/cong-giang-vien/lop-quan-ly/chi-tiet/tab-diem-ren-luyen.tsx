import BoLocDiemRenLuyen from "@components/cong-giang-vien/lop-quan-ly/chi-tiet/bo-loc-diem-ren-luyen"
import BangDiemRenLuyen from "@components/cong-giang-vien/lop-quan-ly/chi-tiet/bang-diem-ren-luyen"
import PhanTrangSinhVien from "@components/cong-giang-vien/lop-quan-ly/chi-tiet/phan-trang-sinh-vien"
import TheThongKeDiemRenLuyen from "@components/cong-giang-vien/lop-quan-ly/chi-tiet/the-thong-ke-diem-ren-luyen"
import type { DiemRenLuyenForm } from "@components/cong-giang-vien/lop-quan-ly/types"
import { useDiemRenLuyenLopQuanLy } from "@hooks/use-diem-ren-luyen-lop-quan-ly"
import { Button, Flex, Form, Typography } from "antd"
import { Save } from "lucide-react"
import { useEffect } from "react"

interface TabDiemRenLuyenProps {
  fixedClassId: string
  enabled: boolean
  coQuyenNhap?: boolean
}

const TabDiemRenLuyen = ({ fixedClassId, enabled, coQuyenNhap = false }: TabDiemRenLuyenProps) => {
  const [form] = Form.useForm<DiemRenLuyenForm>()

  const {
    schoolYearId,
    semesterId,
    theoKy,
    apDungBoLoc,
    locDiem,
    chonLocDiem,
    danhSach,
    thongKe,
    tongSo,
    trang,
    setTrang,
    soTrang,
    setSoTrang,
    giaTriFormMacDinh,
    luuDiemRenLuyen,
    dangLuu,
    dangTai,
  } = useDiemRenLuyenLopQuanLy(fixedClassId, enabled, coQuyenNhap)

  useEffect(() => {
    form.setFieldsValue({ list: giaTriFormMacDinh })
  }, [form, giaTriFormMacDinh])

  const handleLuu = async () => {
    try {
      const values = await form.validateFields()
      await luuDiemRenLuyen(values)
    } catch {
      // validation errors shown by form
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <BoLocDiemRenLuyen
        schoolYearId={schoolYearId}
        semesterId={semesterId}
        onApDung={apDungBoLoc}
      />

      {coQuyenNhap ? (
        <Flex
          align="center"
          justify="space-between"
          className="shrink-0 border-b border-gray-100 px-4 py-2"
        >
          <Typography.Text type="secondary" className="text-xs">
            {theoKy
              ? "Nhập điểm rèn luyện theo học kỳ đã chọn"
              : "Nhập điểm rèn luyện theo năm học (bỏ chọn học kỳ để nhập theo năm)"}
          </Typography.Text>
          <Button
            type="primary"
            icon={<Save size={14} />}
            loading={dangLuu}
            onClick={handleLuu}
          >
            Lưu điểm rèn luyện
          </Button>
        </Flex>
      ) : null}

      <TheThongKeDiemRenLuyen thongKe={thongKe} locDiem={locDiem} onChonLocDiem={chonLocDiem} />

      <Form form={form} component={false}>
        <BangDiemRenLuyen
          danhSach={danhSach}
          loading={dangTai}
          trang={trang}
          soTrang={soTrang}
          coQuyenNhap={coQuyenNhap}
        />
      </Form>

      <PhanTrangSinhVien
        trang={trang}
        soTrang={soTrang}
        tongSo={tongSo}
        onDoiTrang={setTrang}
        onDoiSoTrang={setSoTrang}
      />
    </div>
  )
}

export default TabDiemRenLuyen
