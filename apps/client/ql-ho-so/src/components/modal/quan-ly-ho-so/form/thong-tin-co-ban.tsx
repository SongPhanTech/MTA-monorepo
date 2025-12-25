import { CaretRightOutlined } from '@ant-design/icons'
import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import Select from '@components/commons/select'
import type { DomProps } from '@constants/type'
import { buildOrgTree } from '@lib/utils'
import type { SubmitForm } from '@pages/quan-ly-ho-so/tao-moi'
import {
    useFindManyDM_ChucDanhCMNVGiangVien,
    useFindManyDM_ChucDanhCMNVKySu,
    useFindManyDM_ChucDanhCMNVNghienCuuVien,
    useFindManyDM_DanToc,
    useFindManyDM_DonVi,
    useFindManyDM_GioiTinh,
    useFindManyDM_HinhThucKhenThuongChinhQuyen,
    useFindManyDM_NhomMau,
    useFindManyDM_QuocGia,
    useFindManyDM_TinhTrangHonNhan,
    useFindManyDM_TonGiao,
    useFindManyDM_TrangThaiLamViec,
    useFindManyDM_TrinhDoHocVan,
    useFindManyDM_XepLoaiDanhGiaCanBo,
    useFindManyLecturerType,
} from '@workspace/db/hooks'
import { Checkbox, Col, Collapse, Flex, Form, Input, InputNumber, Row, Typography } from 'antd'
import dayjs from 'dayjs'
import TreeSelect from '@/components/commons/tree-select'

dayjs.locale('vi')
const { Title, Text } = Typography
const { TextArea } = Input

export default function ThongTinCoBan({ expland, setExpland }: DomProps) {
    const form = Form.useFormInstance<SubmitForm>()

    const { data: nationalityData = [] } = useFindManyDM_QuocGia()
    const { data: religionData = [] } = useFindManyDM_TonGiao()
    const { data: ethnicityData = [] } = useFindManyDM_DanToc()
    const { data: genderData = [] } = useFindManyDM_GioiTinh()
    const { data: bloodType = [] } = useFindManyDM_NhomMau()
    const { data: trinhDoHocVan = [] } = useFindManyDM_TrinhDoHocVan()
    const { data: organizations = [] } = useFindManyDM_DonVi()
    const { data: trangThaiLamViec = [] } = useFindManyDM_TrangThaiLamViec()
    const { data: tinhTrangHonNhan = [] } = useFindManyDM_TinhTrangHonNhan()
    const { data: chucDanhGiangVienData = [] } = useFindManyDM_ChucDanhCMNVGiangVien()
    const { data: chucDanhNghienCuuVienData = [] } = useFindManyDM_ChucDanhCMNVNghienCuuVien()
    const { data: chucDanhKySuData = [] } = useFindManyDM_ChucDanhCMNVKySu()
    const { data: hinhThucKhenThuongChinhQuyenData = [] } =
        useFindManyDM_HinhThucKhenThuongChinhQuyen()
    const { data: xepLoaiDanhGiaCanBoData = [] } = useFindManyDM_XepLoaiDanhGiaCanBo()

    const treeData = buildOrgTree(organizations)
    const bLaGiangVien = Form.useWatch('bLaGiangVien', form) || false
    // const bLaCanBoNhanVien = Form.useWatch('bLaCanBoNhanVien', form)
    const { data: lecturerTypeData = [] } = useFindManyLecturerType({}, { enabled: bLaGiangVien })
    // const { data: staffTypeData = [] } = useFindManyStaffType({}, { enabled: !!bLaCanBoNhanVien })
    // const { data: staffPositionData = [] } = useFindManyStaffPosition(
    //     {},
    //     { enabled: !!bLaCanBoNhanVien }
    // )
    const renderContent = () => {
        return (
            <div className="px-6">
                <div className="mb-6 font-semibold text-base">Thông tin chung</div>
                <Row className="mb-6" gutter={[16, 16]}>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="lastName"
                            label="Họ và tên đệm"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập họ và tên đệm!',
                                },
                            ]}
                            className="mb-0"
                        >
                            <Input placeholder="Nhập họ và tên đệm" className="h-9" />
                        </FormItem>
                    </Col>

                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="firstName"
                            label="Tên"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập họ và tên đệm!',
                                },
                            ]}
                            className="mb-0"
                        >
                            <Input placeholder="Nhập họ và tên đệm" className="h-9" />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="code"
                            label="Mã"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập mã!',
                                },
                            ]}
                            className="mb-0"
                        >
                            <Input placeholder="Nhập mã" className="h-9" />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="genderId"
                            label="Giới tính"
                            className="mb-0"
                            required
                        >
                            <Select
                                allowClear
                                placeholder="Chọn giới tính"
                                className="h-9"
                                options={genderData.map((i) => {
                                    return {
                                        value: i.Id,
                                        label: i.sTen,
                                    }
                                })}
                            />
                        </FormItem>
                    </Col>

                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="officerNumber"
                            label="Số hiệu sĩ quan"
                            className="mb-0"
                        >
                            <Input placeholder="Nhập số hiệu sĩ quan" className="h-9" />
                        </FormItem>
                    </Col>

                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="hoTenThuongDung"
                            label="Họ tên khác"
                            className="mb-0"
                        >
                            <Input placeholder="Nhập họ tên khác" className="h-9" />
                        </FormItem>
                    </Col>

                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="nationalityId"
                            label="Quốc tịch"
                            className="mb-0 w-full"
                            normalize={(value) => (value === undefined ? null : value)}
                        >
                            <Select
                                allowClear
                                placeholder="Chọn quốc tịch"
                                className="h-9"
                                options={nationalityData.map((i) => {
                                    return {
                                        value: i.Id,
                                        label: i.sTen,
                                    }
                                })}
                            />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="religionId"
                            label="Tôn giáo"
                            className="mb-0"
                            normalize={(value) => (value === undefined ? null : value)}
                        >
                            <Select
                                allowClear
                                placeholder="Chọn tôn giáo"
                                className="h-9 !w-full"
                                options={religionData.map((i) => {
                                    return {
                                        value: i.Id,
                                        label: i.sTen,
                                    }
                                })}
                            />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="ethnicityId"
                            label="Dân tộc"
                            className="mb-0"
                            normalize={(value) => (value === undefined ? null : value)}
                        >
                            <Select
                                allowClear
                                placeholder="Chọn dân tộc"
                                className="h-9"
                                options={ethnicityData.map((i) => {
                                    return {
                                        value: i.Id,
                                        label: i.sTen,
                                    }
                                })}
                            />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="originalPlace"
                            label="Nguyên quán"
                            className="mb-0"
                        >
                            <Input placeholder="Nhập nguyên quán" className="h-9" />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="tinhTrangHonNhanId"
                            label="Tình trạng hôn nhân"
                            className="mb-0"
                        >
                            <Select
                                placeholder="Chọn tình trạng hôn nhân"
                                options={tinhTrangHonNhan.map((i) => {
                                    return {
                                        value: i.id,
                                        label: i.name,
                                    }
                                })}
                            />
                        </FormItem>
                    </Col>

                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="dateOfBirth"
                            label="Ngày sinh"
                            className="mb-0"
                            required
                        >
                            <DatePicker
                                format={{
                                    format: 'DD/MM/YYYY',
                                    type: 'mask',
                                }}
                                className="w-full h-9"
                                disabledDate={(date) => date && date > dayjs().endOf('day')}
                            />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem form={form} name="placeOfBirth" label="Nơi sinh" className="mb-0">
                            <Input placeholder="Nhập nơi sinh" className="h-9" />
                        </FormItem>
                    </Col>

                    <Col span={12}>
                        <FormItem form={form} name="soTruong" label="Sở trường" className="mb-0">
                            <Input placeholder="Nhập số trường" className="h-9" />
                        </FormItem>
                    </Col>

                    <Col span={12}>
                        <FormItem form={form} name="nhomMauId" label="Nhóm máu" className="mb-0">
                            <Select
                                allowClear
                                placeholder="Chọn nhóm máu"
                                className="h-9"
                                options={bloodType.map((i) => {
                                    return {
                                        value: i.id,
                                        label: i.name,
                                    }
                                })}
                            />
                        </FormItem>
                    </Col>

                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="trinhDoHocVanId"
                            label="Trình độ học vấn"
                            className="mb-0"
                        >
                            <Select
                                allowClear
                                placeholder="Chọn trình độ học vấn"
                                className="h-9"
                                options={trinhDoHocVan.map((i) => {
                                    return {
                                        value: i.id,
                                        label: i.name,
                                    }
                                })}
                            />
                        </FormItem>
                    </Col>

                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="dM_ChucDanhCMNVGiangVienId"
                            label="Chức danh CMNV ngạch Giảng viên"
                            className="mb-0"
                        >
                            <Select
                                allowClear
                                placeholder="Chọn chức danh CMNV ngạch Giảng viên"
                                className="h-9"
                                options={chucDanhGiangVienData.map((i) => {
                                    return {
                                        value: i.id,
                                        label: i.name,
                                    }
                                })}
                            />
                        </FormItem>
                    </Col>

                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="dM_ChucDanhCMNVNghienCuuVienId"
                            label="Chức danh CMNV ngạch Nghiên cứu viên"
                            className="mb-0"
                        >
                            <Select
                                allowClear
                                placeholder="Chọn chức danh CMNV ngạch Nghiên cứu viên"
                                className="h-9"
                                options={chucDanhNghienCuuVienData.map((i) => {
                                    return {
                                        value: i.id,
                                        label: i.name,
                                    }
                                })}
                            />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="sDM_DonViId"
                            label="Đơn vị quản lý"
                            className="mb-2"
                        >
                            <TreeSelect
                                allowClear
                                showSearch
                                placeholder="Chọn đơn vị quản lý"
                                treeDefaultExpandAll
                                treeData={treeData}
                            />
                        </FormItem>
                    </Col>

                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="dM_XepLoaiDanhGiaCanBoId"
                            label="Xếp loại cán bộ"
                            className="mb-2"
                        >
                            <Select
                                allowClear
                                placeholder="Chọn xếp loại cán bộ"
                                className="h-9"
                                options={xepLoaiDanhGiaCanBoData.map((i) => {
                                    return {
                                        value: i.id,
                                        label: i.name,
                                    }
                                })}
                            />
                        </FormItem>
                    </Col>

                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="dM_HinhThucKhenThuongChinhQuyenId"
                            label="Hình thức khen thưởng chính quyền"
                            className="mb-2"
                        >
                            <Select
                                allowClear
                                placeholder="Chọn hình thức khen thưởng chính quyền"
                                className="h-9"
                                options={hinhThucKhenThuongChinhQuyenData.map((i) => {
                                    return {
                                        value: i.id,
                                        label: i.name,
                                    }
                                })}
                            />
                        </FormItem>
                    </Col>

                    <Col span={24}>
                        <Flex>
                            <FormItem
                                form={form}
                                name="bLaHocVien"
                                label=""
                                valuePropName="checked"
                                className="mb-0 mr-4"
                            >
                                <Checkbox>Bạn là học viên</Checkbox>
                            </FormItem>
                            <FormItem
                                form={form}
                                name="bLaGiangVien"
                                label=""
                                valuePropName="checked"
                                className="mb-0 mr-4"
                            >
                                <Checkbox>Bạn là giảng viên</Checkbox>
                            </FormItem>
                            <FormItem
                                form={form}
                                name="bLaCanBoNhanVien"
                                label=""
                                valuePropName="checked"
                                className="mb-0"
                            >
                                <Checkbox>Bạn là cán bộ, nhân viên</Checkbox>
                            </FormItem>
                        </Flex>
                    </Col>
                    {bLaGiangVien && (
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="lecturerTypeId"
                                label="Loại giảng viên"
                                className="mb-0"
                                required={bLaGiangVien}
                            >
                                <Select
                                    placeholder="Chọn loại giảng viên"
                                    options={lecturerTypeData.map((i) => ({
                                        value: i.id,
                                        label: i.name,
                                    }))}
                                />
                            </FormItem>
                        </Col>
                    )}
                    {/* {bLaCanBoNhanVien && (
                        <>
                            <Col span={12}>
                                <FormItem
                                    form={form}
                                    name="staffTypeId"
                                    label="Loại cán bộ"
                                    className="mb-0"
                                    required={bLaCanBoNhanVien}
                                >
                                    <Select
                                        placeholder="Chọn loại cán bộ"
                                        options={staffTypeData.map((i) => ({
                                            value: i.id,
                                            label: i.name,
                                        }))}
                                    />
                                </FormItem>
                            </Col>
                            <Col span={12}>
                                <FormItem
                                    form={form}
                                    name="staffPositionId"
                                    label="Chức vụ cán bộ"
                                    className="mb-0"
                                    required={bLaCanBoNhanVien}
                                >
                                    <Select
                                        placeholder="Chọn loại cán bộ"
                                        options={staffPositionData.map((i) => ({
                                            value: i.id,
                                            label: i.name,
                                        }))}
                                    />
                                </FormItem>
                            </Col>
                        </>
                    )} */}
                </Row>
                <div className="mb-6 font-semibold text-base">CCCD/CMND</div>
                <Row className="mb-6" gutter={[16, 16]}>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="idCardNumber"
                            label="CCCD/CMND"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập CCCD/CMND!',
                                },
                            ]}
                            className="mb-0"
                        >
                            <Input placeholder="Nhập CCCD/CMND" className="h-9" />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="idCardDate"
                            label="Ngày cấp CCCD"
                            className="mb-0"
                        >
                            <DatePicker
                                format={{
                                    format: 'DD/MM/YYYY',
                                    type: 'mask',
                                }}
                                className="w-full h-9"
                                disabledDate={(date) => date && date > dayjs().endOf('day')}
                            />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="placeOfIdCardNumber"
                            label="Nơi cấp CCCD"
                            className="mb-0"
                        >
                            <Input placeholder="Nhập nơi cấp" className="h-9" />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="idCardExpirationDate"
                            label="Ngày hết hạn CCCD"
                            className="mb-0"
                        >
                            <DatePicker
                                format={{
                                    format: 'DD/MM/YYYY',
                                    type: 'mask',
                                }}
                                className="w-full h-9"
                            />
                        </FormItem>
                    </Col>
                </Row>
                {/* Thông tin bản thân */}
                <div className="mb-6 font-semibold text-base">Thông tin bản thân</div>
                <Row className="mb-8" gutter={[16, 16]}>
                    <Col span={12}>
                        <FormItem form={form} name="conThuMay" label="Con thứ mấy" className="mb-0">
                            <InputNumber
                                type="number"
                                placeholder="Nhập số thứ tự"
                                className="w-full h-9"
                                min={1}
                                max={20}
                            />
                        </FormItem>
                    </Col>

                    <Col span={12}>
                        <FormItem form={form} name="soACE" label="Số anh chị em" className="mb-0">
                            <InputNumber
                                type="number"
                                placeholder="Nhập số anh chị em"
                                className="w-full h-9"
                                min={0}
                                max={20}
                            />
                        </FormItem>
                    </Col>

                    <Col span={24}>
                        <FormItem
                            form={form}
                            name="lichSuBanThan"
                            label="Lịch sử bản thân"
                            className="mb-0"
                        >
                            <TextArea rows={3} placeholder="Nhập lịch sử bản thân" />
                        </FormItem>
                    </Col>

                    <Col span={24}>
                        <FormItem
                            form={form}
                            name="truocKhiNhapNgu"
                            label="Trước khi nhập ngũ"
                            className="mb-0"
                        >
                            <TextArea rows={2} placeholder="Nhập thông tin trước khi nhập ngũ" />
                        </FormItem>
                    </Col>

                    <Col span={24}>
                        <FormItem form={form} name="benh" label="Bệnh tật" className="mb-0">
                            <TextArea rows={2} placeholder="Nhập thông tin về bệnh tật (nếu có)" />
                        </FormItem>
                    </Col>

                    <Col span={24}>
                        <FormItem
                            form={form}
                            name="tinhHinhNhaO"
                            label="Tình hình nhà ở"
                            className="mb-0"
                        >
                            <TextArea rows={2} placeholder="Mô tả tình hình nhà ở" />
                        </FormItem>
                    </Col>
                </Row>

                {/* Thông tin gia đình */}
                <div className="mb-6 font-semibold text-base">Thông tin gia đình</div>
                <Row className="mb-8" gutter={[16, 16]}>
                    <Col span={24}>
                        <FormItem
                            form={form}
                            name="thanhPhanGiaDinh"
                            label="Thành phần gia đình"
                            className="mb-0"
                        >
                            <TextArea rows={3} placeholder="Mô tả thành phần gia đình" />
                        </FormItem>
                    </Col>

                    <Col span={24}>
                        <FormItem
                            form={form}
                            name="kinhTeGiaDinh"
                            label="Kinh tế gia đình"
                            className="mb-0"
                        >
                            <TextArea rows={2} placeholder="Mô tả tình hình kinh tế gia đình" />
                        </FormItem>
                    </Col>

                    <Col span={24}>
                        <FormItem
                            form={form}
                            name="chinhTriGiaDinh"
                            label="Chính trị gia đình"
                            className="mb-0"
                        >
                            <TextArea rows={2} placeholder="Mô tả tình hình chính trị gia đình" />
                        </FormItem>
                    </Col>
                </Row>

                {/* Thông tin gia đình vợ/chồng */}
                <div className="mb-6 font-semibold text-base">Thông tin gia đình vợ/chồng</div>
                <Row className="mb-8" gutter={[16, 16]}>
                    <Col span={24}>
                        <FormItem
                            form={form}
                            name="fSoACE"
                            label="Số anh chị em (vợ/chồng)"
                            className="mb-0"
                        >
                            <InputNumber
                                type="number"
                                placeholder="Nhập số anh chị em"
                                className="w-full h-9"
                                min={0}
                                max={20}
                            />
                        </FormItem>
                    </Col>

                    <Col span={24}>
                        <FormItem
                            form={form}
                            name="fBanThan"
                            label="Bản thân (vợ/chồng)"
                            className="mb-0"
                        >
                            <Input placeholder="Nhập thông tin bản thân vợ/chồng" className="h-9" />
                        </FormItem>
                    </Col>

                    <Col span={24}>
                        <FormItem
                            form={form}
                            name="fKinhTeGiaDinh"
                            label="Kinh tế gia đình (vợ/chồng)"
                            className="mb-0"
                        >
                            <TextArea
                                rows={2}
                                placeholder="Mô tả tình hình kinh tế gia đình vợ/chồng"
                            />
                        </FormItem>
                    </Col>

                    <Col span={24}>
                        <FormItem
                            form={form}
                            name="fChinhTriGiaDinh"
                            label="Chính trị gia đình (vợ/chồng)"
                            className="mb-0"
                        >
                            <TextArea
                                rows={2}
                                placeholder="Mô tả tình hình chính trị gia đình vợ/chồng"
                            />
                        </FormItem>
                    </Col>
                </Row>
            </div>
        )
    }
    return (
        <div>
            <Collapse
                items={[
                    {
                        key: 'thongTinCoBan',
                        label: (
                            <Title level={4} className="mb-0">
                                Thông tin cơ bản
                            </Title>
                        ),
                        children: renderContent(),
                    },
                ]}
                expandIcon={({ isActive }) => (
                    <CaretRightOutlined style={{ fontSize: 16 }} rotate={isActive ? 90 : 0} />
                )}
                bordered={false}
                expandIconPosition="end"
                activeKey={expland}
                onChange={(value) => {
                    setExpland([...value])
                }}
                className="bg-transparent"
            />
        </div>
    )
}
