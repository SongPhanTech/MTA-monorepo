import { queryClient } from "@api/index"
import DatePicker from "@components/commons/date-picker"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
import {
  useFindManyDM_ChucDanh,
  useFindManyDM_ChucVu,
  useFindManyDM_DonVi,
  useFindManyDM_GioiTinh,
  useFindManyDM_HocHam,
  useFindManyDM_HocVi,
  useFindManyDM_LoaiHinhCongTac,
  useFindManyDM_QuocGia,
  useFindManyDM_TrangThaiLamViec,
  useFindManyDM_TruongDaoTaoBacDH,
  useFindUniqueUserProfile,
  useUpdateUserProfile,
} from "@workspace/db/hooks"
import { Button, Col, Form, Input, InputNumber, message, Row, Tabs } from "antd"
import dayjs from "dayjs"
import { Plus, Trash2 } from "lucide-react"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

type HocViRow = {
  academicDegreeTypeId?: string | null
  nationalityId?: string | null
  linhVuc?: string | null
  tenLuanAn?: string | null
  truongId?: string | null
  year?: number | null
}

type HocHamRow = {
  academicRankTypeId?: string | null
  noiCap?: string | null
  soQuyetDinh?: string | null
  from?: dayjs.Dayjs | null
  to?: dayjs.Dayjs | null
  year?: number | null
}

type QuaTrinhCongTacRow = {
  tuThangNam?: dayjs.Dayjs | null
  denThangNam?: dayjs.Dayjs | null
  loaiHinhCongTacId?: string | null
  donVi?: string | null
  chucVuId?: string | null
  chucDanh?: string | null
  chucVuDangDoan?: string | null
  soQuyetDinh?: string | null
  diaChi?: string | null
}

// Các trường giảng viên được tự cập nhật (cột trực tiếp UserProfile + 3 danh sách quan hệ).
type PutThongTinCaNhan = {
  fullname?: string | null
  genderId?: string | null
  dateOfBirth?: dayjs.Dayjs | null
  idCardNumber?: string | null
  lectureCode?: string | null
  organizationId?: string | null
  email?: string | null
  phoneNumber?: string | null
  officePhone?: string | null
  contactAddress?: string | null
  permanentAddress?: string | null
  chucVuChinhQuyenId?: string | null
  levelId?: string | null
  trangThaiLamViecId?: string | null
  recruitmentDate?: dayjs.Dayjs | null
  hocVi?: HocViRow[]
  hocHam?: HocHamRow[]
  quaTrinhCongTac?: QuaTrinhCongTacRow[]
}

const toISO = (value?: dayjs.Dayjs | null) => (value ? value.toISOString() : null)

const PutThongTinCaNhanModal = () => {
  const [form] = Form.useForm<PutThongTinCaNhan>()
  const { isOpen, onClose, input } = useDisclosure<{ id: string }>({
    tag: "PutThongTinCaNhanModal",
    onClose: form.resetFields,
  })

  const id = input?.id
  const { showSpinner, hideSpinner } = useSpinner()

  const { data: dsGioiTinh } = useFindManyDM_GioiTinh()
  const { data: dsChucVu } = useFindManyDM_ChucVu()
  const { data: dsChucDanh } = useFindManyDM_ChucDanh()
  const { data: dsTrangThai } = useFindManyDM_TrangThaiLamViec()
  const { data: dsHocVi } = useFindManyDM_HocVi()
  const { data: dsHocHam } = useFindManyDM_HocHam()
  const { data: dsQuocGia } = useFindManyDM_QuocGia()
  const { data: dsTruong } = useFindManyDM_TruongDaoTaoBacDH()
  const { data: dsLoaiHinhCongTac } = useFindManyDM_LoaiHinhCongTac()
  const { data: dsDonVi } = useFindManyDM_DonVi()

  const { mutateAsync: update } = useUpdateUserProfile()

  const { data } = useFindUniqueUserProfile(
    {
      where: { id: id ?? "" },
      include: { hocVi: true, hocHam: true, quaTrinhCongTac: true, lecturer: true },
    },
    { enabled: !!id }
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: chỉ đổ form khi data thay đổi
  useEffect(() => {
    if (!data) return
    form.setFieldsValue({
      fullname: data.fullname,
      genderId: data.genderId,
      dateOfBirth: data.dateOfBirth ? dayjs(data.dateOfBirth) : null,
      idCardNumber: data.idCardNumber,
      lectureCode: data.code,
      organizationId: data.sDM_DonViId,
      email: data.email,
      phoneNumber: data.phoneNumber,
      officePhone: data.officePhone,
      contactAddress: data.contactAddress,
      permanentAddress: data.permanentAddress,
      chucVuChinhQuyenId: data.chucVuChinhQuyenId,
      levelId: data.levelId,
      trangThaiLamViecId: data.trangThaiLamViecId,
      recruitmentDate: data.recruitmentDate ? dayjs(data.recruitmentDate) : null,
      hocVi: (data.hocVi ?? []).map((h) => ({
        academicDegreeTypeId: h.academicDegreeTypeId,
        nationalityId: h.nationalityId,
        linhVuc: h.linhVuc,
        tenLuanAn: h.tenLuanAn,
        truongId: h.truongId,
        year: h.year,
      })),
      hocHam: (data.hocHam ?? []).map((h) => ({
        academicRankTypeId: h.academicRankTypeId,
        noiCap: h.noiCap,
        soQuyetDinh: h.soQuyetDinh,
        from: h.from ? dayjs(h.from) : null,
        to: h.to ? dayjs(h.to) : null,
        year: h.year,
      })),
      quaTrinhCongTac: (data.quaTrinhCongTac ?? []).map((q) => ({
        tuThangNam: q.tuThangNam ? dayjs(q.tuThangNam) : null,
        denThangNam: q.denThangNam ? dayjs(q.denThangNam) : null,
        loaiHinhCongTacId: q.loaiHinhCongTacId,
        donVi: q.donVi,
        chucVuId: q.chucVuId,
        chucDanh: q.chucDanh,
        chucVuDangDoan: q.chucVuDangDoan,
        soQuyetDinh: q.soQuyetDinh,
        diaChi: q.diaChi,
      })),
    })
  }, [data])

  async function onFinish(value: PutThongTinCaNhan) {
    if (!id) return
    try {
      showSpinner()
      await update({
        where: { id },
        data: {
          fullname: value.fullname,
          genderId: value.genderId || null,
          dateOfBirth: toISO(value.dateOfBirth),
          idCardNumber: value.idCardNumber || undefined,
          email: value.email,
          phoneNumber: value.phoneNumber,
          officePhone: value.officePhone,
          contactAddress: value.contactAddress,
          permanentAddress: value.permanentAddress,
          chucVuChinhQuyenId: value.chucVuChinhQuyenId || null,
          levelId: value.levelId || null,
          trangThaiLamViecId: value.trangThaiLamViecId || null,
          recruitmentDate: toISO(value.recruitmentDate),
          // Mã người dùng thuộc UserProfile.code.
          code: value.lectureCode || undefined,
          sDM_DonViId: value.organizationId || null,
          // Thay thế toàn bộ danh sách quan hệ bằng dữ liệu mới trên form.
          hocVi: {
            deleteMany: {},
            create: (value.hocVi ?? []).map((h) => ({
              academicDegreeTypeId: h.academicDegreeTypeId || null,
              nationalityId: h.nationalityId || null,
              linhVuc: h.linhVuc,
              tenLuanAn: h.tenLuanAn,
              truongId: h.truongId || null,
              year: h.year ?? null,
            })),
          },
          hocHam: {
            deleteMany: {},
            create: (value.hocHam ?? []).map((h) => ({
              academicRankTypeId: h.academicRankTypeId || null,
              noiCap: h.noiCap,
              soQuyetDinh: h.soQuyetDinh,
              from: toISO(h.from),
              to: toISO(h.to),
              year: h.year ?? null,
            })),
          },
          quaTrinhCongTac: {
            deleteMany: {},
            create: (value.quaTrinhCongTac ?? []).map((q) => ({
              tuThangNam: toISO(q.tuThangNam),
              denThangNam: toISO(q.denThangNam),
              loaiHinhCongTacId: q.loaiHinhCongTacId || null,
              donVi: q.donVi,
              chucVuId: q.chucVuId || null,
              chucDanh: q.chucDanh,
              chucVuDangDoan: q.chucVuDangDoan,
              soQuyetDinh: q.soQuyetDinh,
              diaChi: q.diaChi,
            })),
          },
        },
      })
      message.success("Cập nhật thành công")
      queryClient.invalidateQueries({ queryKey: ["UserProfile"] })
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

  const optGioiTinh = (dsGioiTinh ?? []).map((i) => ({ value: i.Id, label: i.sTen }))
  const optChucVu = (dsChucVu ?? []).map((i) => ({ value: i.Id, label: i.sTen }))
  const optChucDanh = (dsChucDanh ?? []).map((i) => ({ value: i.Id, label: i.sTen }))
  const optTrangThai = (dsTrangThai ?? []).map((i) => ({ value: i.id, label: i.name }))
  const optHocVi = (dsHocVi ?? []).map((i) => ({ value: i.Id, label: i.sTen }))
  const optHocHam = (dsHocHam ?? []).map((i) => ({ value: i.Id, label: i.sTen }))
  const optQuocGia = (dsQuocGia ?? []).map((i) => ({ value: i.Id, label: i.sTen }))
  const optTruong = (dsTruong ?? []).map((i) => ({ value: i.id, label: i.name }))
  const optLoaiHinhCongTac = (dsLoaiHinhCongTac ?? []).map((i) => ({ value: i.id, label: i.name }))
  const optDonVi = (dsDonVi ?? []).map((i) => ({ value: i.Id, label: i.sTen }))

  const namNay = dayjs().year()

  const tabThongTinCoBan = (
    <Row gutter={[12, 0]}>
      <Col span={12}>
        <Form.Item name="fullname" label="Họ và tên" rules={[{ required: true }]}>
          <Input placeholder="Nhập họ và tên" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="genderId" label="Giới tính">
          <Select allowClear placeholder="Chọn giới tính" options={optGioiTinh} />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="dateOfBirth" label="Ngày sinh">
          <DatePicker
            format="DD/MM/YYYY"
            className="w-full"
            placeholder="Chọn ngày sinh"
            disabledDate={(d) => d.isAfter(dayjs().endOf("day"))}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="idCardNumber" label="CMND/CCCD">
          <Input placeholder="Nhập số CMND/CCCD" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="lectureCode" label="Mã định danh">
          <Input placeholder="Nhập Mã định danh" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="organizationId" label="Đơn vị công tác">
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Chọn đơn vị công tác"
            options={optDonVi}
          />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item name="chucVuChinhQuyenId" label="Chức vụ">
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Chọn chức vụ"
            options={optChucVu}
          />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item name="levelId" label="Chức danh">
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Chọn chức danh"
            options={optChucDanh}
          />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item name="trangThaiLamViecId" label="Tình trạng">
          <Select allowClear placeholder="Chọn tình trạng" options={optTrangThai} />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="recruitmentDate" label="Ngày vào trường">
          <DatePicker format="DD/MM/YYYY" className="w-full" placeholder="Chọn ngày vào trường" />
        </Form.Item>
      </Col>
    </Row>
  )

  const tabLienHe = (
    <Row gutter={[12, 0]}>
      <Col span={12}>
        <Form.Item name="email" label="Email cá nhân">
          <Input placeholder="Nhập email" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="phoneNumber" label="Điện thoại di động">
          <Input placeholder="Nhập số điện thoại" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="officePhone" label="Điện thoại cơ quan">
          <Input placeholder="Nhập điện thoại cơ quan" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="contactAddress" label="Địa chỉ liên hệ">
          <Input placeholder="Nhập địa chỉ liên hệ" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="permanentAddress" label="Địa chỉ thường trú">
          <Input placeholder="Nhập địa chỉ thường trú" />
        </Form.Item>
      </Col>
    </Row>
  )

  const tabHocVi = (
    <Form.List name="hocVi">
      {(fields, { add, remove }) => (
        <div className="flex flex-col gap-3">
          {fields.map((field) => (
            <div key={field.key} className="rounded-lg border border-solid border-gray-200 p-3">
              <Row gutter={[12, 0]}>
                <Col span={12}>
                  <Form.Item name={[field.name, "academicDegreeTypeId"]} label="Học vị">
                    <Select
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      placeholder="Chọn học vị"
                      options={optHocVi}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name={[field.name, "linhVuc"]} label="Lĩnh vực / chuyên ngành">
                    <Input placeholder="Nhập lĩnh vực" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name={[field.name, "truongId"]} label="Nơi đào tạo">
                    <Select
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      placeholder="Chọn trường"
                      options={optTruong}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name={[field.name, "nationalityId"]} label="Quốc gia">
                    <Select
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      placeholder="Chọn quốc gia"
                      options={optQuocGia}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name={[field.name, "year"]} label="Năm cấp bằng">
                    <InputNumber
                      min={0}
                      max={namNay}
                      precision={0}
                      className="w-full"
                      placeholder="Năm"
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name={[field.name, "tenLuanAn"]} label="Tên luận văn / đề tài">
                    <Input placeholder="Nhập tên luận văn / đề tài" />
                  </Form.Item>
                </Col>
              </Row>
              <Button
                danger
                size="small"
                icon={<Trash2 size={14} />}
                onClick={() => remove(field.name)}
              >
                Xoá
              </Button>
            </div>
          ))}
          <Button type="dashed" block icon={<Plus size={16} />} onClick={() => add()}>
            Thêm học vị
          </Button>
        </div>
      )}
    </Form.List>
  )

  const tabHocHam = (
    <Form.List name="hocHam">
      {(fields, { add, remove }) => (
        <div className="flex flex-col gap-3">
          {fields.map((field) => (
            <div key={field.key} className="rounded-lg border border-solid border-gray-200 p-3">
              <Row gutter={[12, 0]}>
                <Col span={12}>
                  <Form.Item name={[field.name, "academicRankTypeId"]} label="Học hàm">
                    <Select
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      placeholder="Chọn học hàm"
                      options={optHocHam}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name={[field.name, "year"]} label="Năm phong">
                    <InputNumber
                      min={0}
                      max={namNay}
                      precision={0}
                      className="w-full"
                      placeholder="Năm"
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name={[field.name, "soQuyetDinh"]} label="Số quyết định">
                    <Input placeholder="Số QĐ" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name={[field.name, "noiCap"]} label="Nơi cấp">
                    <Input placeholder="Nhập nơi cấp" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name={[field.name, "from"]} label="Từ ngày">
                    <DatePicker format="DD/MM/YYYY" className="w-full" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name={[field.name, "to"]} label="Đến ngày">
                    <DatePicker format="DD/MM/YYYY" className="w-full" />
                  </Form.Item>
                </Col>
              </Row>
              <Button
                danger
                size="small"
                icon={<Trash2 size={14} />}
                onClick={() => remove(field.name)}
              >
                Xoá
              </Button>
            </div>
          ))}
          <Button type="dashed" block icon={<Plus size={16} />} onClick={() => add()}>
            Thêm học hàm
          </Button>
        </div>
      )}
    </Form.List>
  )

  const tabQuaTrinhCongTac = (
    <Form.List name="quaTrinhCongTac">
      {(fields, { add, remove }) => (
        <div className="flex flex-col gap-3">
          {fields.map((field) => (
            <div key={field.key} className="rounded-lg border border-solid border-gray-200 p-3">
              <Row gutter={[12, 0]}>
                <Col span={6}>
                  <Form.Item name={[field.name, "tuThangNam"]} label="Từ tháng năm">
                    <DatePicker format="DD/MM/YYYY" className="w-full" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name={[field.name, "denThangNam"]} label="Đến tháng năm">
                    <DatePicker format="DD/MM/YYYY" className="w-full" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name={[field.name, "loaiHinhCongTacId"]} label="Loại hình công tác">
                    <Select
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      placeholder="Chọn loại hình"
                      options={optLoaiHinhCongTac}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name={[field.name, "donVi"]} label="Đơn vị công tác">
                    <Input placeholder="Nhập đơn vị" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name={[field.name, "chucVuId"]} label="Chức vụ">
                    <Select
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      placeholder="Chọn chức vụ"
                      options={optChucVu}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name={[field.name, "chucDanh"]} label="Chức danh / vị trí">
                    <Input placeholder="Nhập chức danh" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name={[field.name, "soQuyetDinh"]} label="Số quyết định">
                    <Input placeholder="Số QĐ" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name={[field.name, "diaChi"]} label="Địa chỉ">
                    <Input placeholder="Nhập địa chỉ" />
                  </Form.Item>
                </Col>
              </Row>
              <Button
                danger
                size="small"
                icon={<Trash2 size={14} />}
                onClick={() => remove(field.name)}
              >
                Xoá
              </Button>
            </div>
          ))}
          <Button type="dashed" block icon={<Plus size={16} />} onClick={() => add()}>
            Thêm quá trình công tác
          </Button>
        </div>
      )}
    </Form.List>
  )

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onFinish}
      onCancel={onClose}
      maskClosable={false}
      title="Cập nhật thông tin cá nhân"
      width={900}
    >
      <Tabs
        items={[
          {
            key: "co-ban",
            label: "Thông tin cơ bản",
            children: tabThongTinCoBan,
            forceRender: true,
          },
          { key: "lien-he", label: "Liên hệ", children: tabLienHe, forceRender: true },
          { key: "hoc-vi", label: "Học vị", children: tabHocVi, forceRender: true },
          { key: "hoc-ham", label: "Học hàm", children: tabHocHam, forceRender: true },
          {
            key: "qua-trinh",
            label: "Quá trình công tác",
            children: tabQuaTrinhCongTac,
            forceRender: true,
          },
        ]}
      />
    </PutFormModal>
  )
}

export default PutThongTinCaNhanModal
