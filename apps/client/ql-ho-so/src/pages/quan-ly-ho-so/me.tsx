import { CameraFilled, PrinterOutlined, UserOutlined } from "@ant-design/icons"
import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import BoiDuongQuocPhongAnNinhForm from "@components/modal/quan-ly-ho-so/form/boi-duong-quoc-phong-an-ninh"
import CapBacForm from "@components/modal/quan-ly-ho-so/form/cap-bac"
import DanhHieuForm from "@components/modal/quan-ly-ho-so/form/danh-hieu"
import NuocNgoaiForm from "@components/modal/quan-ly-ho-so/form/di-nuoc-ngoai"
import DoanDang from "@components/modal/quan-ly-ho-so/form/doan-dang"
import DoiTuongChinhSachForm from "@components/modal/quan-ly-ho-so/form/doi-tuong-chinh-sach"
import HocHamForm from "@components/modal/quan-ly-ho-so/form/hoc-ham"
import HocViForm from "@components/modal/quan-ly-ho-so/form/hoc-vi"
import KeKhaiTaiSanForm from "@components/modal/quan-ly-ho-so/form/ke-khai-taI-san"
import NgoaiNguForm from "@components/modal/quan-ly-ho-so/form/ngoai-ngu"
import ChienDauForm from "@components/modal/quan-ly-ho-so/form/phuc-vu-chien-dau"
import QuaTrinhCongTacForm from "@components/modal/quan-ly-ho-so/form/qua-trinh-cong-tac"
import QuaTrinhCuDiCongTacForm from "@components/modal/quan-ly-ho-so/form/qua-trinh-cu-di-cong-tac"
import QuaTrinhDiDaoTaoBoiDuongForm from "@components/modal/quan-ly-ho-so/form/qua-trinh-di-dao-tao-boi-duong"
import QuaTrinhHocTapForm from "@components/modal/quan-ly-ho-so/form/qua-trinh-hoc-tap"
import QuaTrinhLuongForm from "@components/modal/quan-ly-ho-so/form/qua-trinh-luong"
import ThongTinCoBan from "@components/modal/quan-ly-ho-so/form/thong-tin-co-ban"
import ThongTinKhenThuongForm from "@components/modal/quan-ly-ho-so/form/thong-tin-khen-thuong"
import ThongTinKyLuatForm from "@components/modal/quan-ly-ho-so/form/thong-tin-ky-luat"
import ThongTinLienHe from "@components/modal/quan-ly-ho-so/form/thong-tin-lien-he"
import ThongTinThanNhanForm from "@components/modal/quan-ly-ho-so/form/thong-tin-than-nhan"
import ThuongTatForm from "@components/modal/quan-ly-ho-so/form/thuong-tat"
import TiengDanTocForm from "@components/modal/quan-ly-ho-so/form/tieng-dan-toc"
import TinHocForm from "@components/modal/quan-ly-ho-so/form/tin-hoc"
import ToChucXaHoiForm from "@components/modal/quan-ly-ho-so/form/to-chuc-xa-hoi"
import TrinhDoLyLuanChinhTriForm from "@components/modal/quan-ly-ho-so/form/trinh-do-ly-luan-chinh-tri"
import TrinhDoQuanLyNhaNuocForm from "@components/modal/quan-ly-ho-so/form/trinh-do-quan-ly-nha-nuoc"
import useSpinner from "@hooks/spinner"
import CreateLayout from "@layouts/create-layout"
import type { SubmitForm } from "@pages/quan-ly-ho-so/tao-moi"
import { useSession } from "@workspace/auth/react"
import { useFindUniqueUserProfile } from "@workspace/db/hooks"
import { sqlTransaction } from "@workspace/libs/api/model"
import { buildLsbNhanVienPayload, getLsbErrorMessage } from "@lib/lsb-nhan-vien"
import { putDMNhanViens } from "@workspace/libs/api/system"
import { useAbility } from "@workspace/permissions/hooks"
import { ROUTER_PATH } from "@workspace/router"
import {
  Button,
  Divider,
  Dropdown,
  Flex,
  Form,
  Input,
  message,
  Upload,
  type UploadFile,
  type UploadProps,
} from "antd"
import ImgCrop from "antd-img-crop"
import axios from "axios"
import dayjs from "dayjs"
import { useRouter } from "next/router"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import "./tao-moi/index.css"
import ChucVuChinhQuyenForm from "@components/modal/quan-ly-ho-so/form/chuc-vu-chinh-quyen"
import ChucVuDangForm from "@components/modal/quan-ly-ho-so/form/chuc-vu-dang"
import { getRuntimeEnv } from "@workspace/libs/utils"

interface itemType {
  id: string
  render?: JSX.Element
  title: string
}

export default function UpdateUserPage() {
  const { can, canSome } = useAbility()
  const router = useRouter()
  const { data: sessionData } = useSession()

  const id = sessionData?.sDM_NhanVienId || ""
  // const id = router.query.id as string
  const [form] = Form.useForm<SubmitForm>()
  const [search, setSearch] = useState<string>("")
  const [activeKey, setActiveKey] = useState("thongTinCoBan")
  const [expland, setExpland] = useState<string[]>(["thongTinCoBan", "thongTinLienHe"])

  const [fileList, setFileList] = useState<UploadFile[]>([])

  const listTabs: itemType[] = useMemo(() => {
    return [
      {
        title: "Thông tin cơ bản",
        id: "thongTinCoBan",
        render: (
          <Form.Item className="mb-0">
            <ThongTinCoBan expland={expland} setExpland={setExpland} />
          </Form.Item>
        ),
      },
      {
        title: "Thông tin khác",
        id: "thongTinLienHe",
        render: (
          <Form.Item className="mb-0">
            <ThongTinLienHe expland={expland} setExpland={setExpland} />
          </Form.Item>
        ),
      },
      {
        title: "Đoàn - Đảng",
        id: "DoanDang",
        render: (
          <Form.Item className="mb-0">
            <DoanDang expland={expland} setExpland={setExpland} />
          </Form.Item>
        ),
      },
      {
        title: "Thông tin thân nhân",
        id: "thongTinThanNhan",
        render: (
          <Form.Item name="relatives" className="mb-0">
            <ThongTinThanNhanForm expland={expland} setExpland={setExpland} />
          </Form.Item>
        ),
      },
      {
        title: "Học vị",
        id: "hocVi",
        render: (
          <Form.Item name="hocVi" className="mb-0">
            <HocViForm expland={expland} setExpland={setExpland} />
          </Form.Item>
        ),
      },
      {
        title: "Học hàm",
        id: "hocHam",
        render: (
          <Form.Item name="hocHam" className="mb-0">
            <HocHamForm expland={expland} setExpland={setExpland} />
          </Form.Item>
        ),
      },
      {
        title: "Chức vụ chính quyền",
        id: "quaTrinhChucVuChinhQuyen",
        render: (
          <Form.Item name="quaTrinhChucVuChinhQuyen" className="mb-0">
            <ChucVuChinhQuyenForm expland={expland} setExpland={setExpland} />
          </Form.Item>
        ),
      },
      {
        title: "Chức vụ Đảng",
        id: "quaTrinhChucVuDang",
        render: (
          <Form.Item name="quaTrinhChucVuDang" className="mb-0">
            <ChucVuDangForm expland={expland} setExpland={setExpland} />
          </Form.Item>
        ),
      },
      {
        title: "Trình độ lý luận chính trị",
        id: "trinhDoLyLuanChinhTri",
        render: (
          <Form.Item name="trinhDoLyLuanChinhTri" className="mb-0">
            <TrinhDoLyLuanChinhTriForm expland={expland} setExpland={setExpland} />
          </Form.Item>
        ),
      },
      // {
      //     title: 'Trình độ quản lý hành chính',
      //     id: 'trinhDoQuanLyHanhChinh',
      //     render: <TrinhDoQuanLyHanhChinhForm expland={expland} setExpland={setExpland} />,
      // },
      {
        title: "Trình độ quản lý nhà nước",
        id: "trinhDoQuanLyNhaNuoc",
        render: (
          <Form.Item name="trinhDoQuanLyNhaNuoc" className="mb-0">
            <TrinhDoQuanLyNhaNuocForm expland={expland} setExpland={setExpland} />
          </Form.Item>
        ),
      },
      {
        title: "Tiếng dân tộc",
        id: "tiengDanToc",
        render: (
          <Form.Item name="tiengDanToc" className="mb-0">
            <TiengDanTocForm expland={expland} setExpland={setExpland} />
          </Form.Item>
        ),
      },
      {
        title: "Phục vụ chiến đấu",
        id: "phucVuChienDau",
        render: (
          <Form.Item name="chienDau" className="mb-0">
            <ChienDauForm expland={expland} setExpland={setExpland} />
          </Form.Item>
        ),
      },
      {
        title: "Đi nước ngoài",
        id: "diNuocNgoai",
        render: (
          <Form.Item name="diNuocNgoai" className="mb-0">
            <NuocNgoaiForm expland={expland} setExpland={setExpland} />
          </Form.Item>
        ),
      },
      {
        title: "Thương tật",
        id: "thuongTat",
        render: (
          <Form.Item name="thuongTat" className="mb-0">
            <ThuongTatForm expland={expland} setExpland={setExpland} />
          </Form.Item>
        ),
      },
      {
        title: "Danh hiệu",
        id: "danhHieu",
        render: (
          <Form.Item name="danhHieu" className="mb-0">
            <DanhHieuForm expland={expland} setExpland={setExpland} />
          </Form.Item>
        ),
      },
      {
        title: "Tổ chức xã hội",
        id: "toChucXaHoi",
        render: (
          <Form.Item name="ToChucXaHoi" className="mb-0">
            <ToChucXaHoiForm expland={expland} setExpland={setExpland} />
          </Form.Item>
        ),
      },
      {
        title: "Quá trình học tập",
        id: "quaTrinhHocTap",
        render: (
          <Form.Item name="quaTrinhHocTap" className="mb-0">
            <QuaTrinhHocTapForm expland={expland} setExpland={setExpland} />
          </Form.Item>
        ),
      },
      {
        title: "Quá trình lương",
        id: "QuaTrinhLuong",
        render: (
          <Form.Item name="QuaTrinhLuong" className="mb-0">
            <QuaTrinhLuongForm expland={expland} setExpland={setExpland} />
          </Form.Item>
        ),
      },
      {
        title: "Ngoại ngữ",
        id: "ngoaiNgu",
        render: (
          <Form.Item name="ngoaiNgu" className="mb-0">
            <NgoaiNguForm expland={expland} setExpland={setExpland} />
          </Form.Item>
        ),
      },
      {
        title: "Tin học",
        id: "tinHoc",
        render: (
          <Form.Item name="tinHoc" className="mb-0">
            <TinHocForm expland={expland} setExpland={setExpland} />
          </Form.Item>
        ),
      },
      {
        title: "Bồi dưỡng quốc phòng an ninh",
        id: "boiDuongQuocPhongAnNinh",
        render: (
          <Form.Item name="boiDuongQuocPhongAnNinh" className="mb-0">
            <BoiDuongQuocPhongAnNinhForm expland={expland} setExpland={setExpland} />
          </Form.Item>
        ),
      },
      {
        title: "Cấp bậc",
        id: "capBac",
        render: (
          <Form.Item name="capBac" className="mb-0">
            <CapBacForm expland={expland} setExpland={setExpland} />
          </Form.Item>
        ),
      },
      {
        title: "Quá trình công tác",
        id: "quaTrinhCongTac",
        render: (
          <Form.Item name="quaTrinhCongTac" className="mb-0">
            <QuaTrinhCongTacForm expland={expland} setExpland={setExpland} />
          </Form.Item>
        ),
      },
      {
        title: "Quá trình được cử đi công tác",
        id: "quaTrinhCuDiCongTac",
        render: (
          <Form.Item name="quaTrinhCuDiCongTac" className="mb-0">
            <QuaTrinhCuDiCongTacForm expland={expland} setExpland={setExpland} />
          </Form.Item>
        ),
      },
      {
        title: "Quá trình được cử đi đào tạo bồi dưỡng",
        id: "quaTrinhDiDaoTaoBoiDuong",
        render: (
          <Form.Item name="quaTrinhCuDiDaoTao" className="mb-0">
            <QuaTrinhDiDaoTaoBoiDuongForm expland={expland} setExpland={setExpland} />
          </Form.Item>
        ),
      },
      {
        title: "Thông tin khen thưởng",
        id: "thongTinKhenThuong",
        render: (
          <Form.Item name="khenThuong" className="mb-0">
            <ThongTinKhenThuongForm expland={expland} setExpland={setExpland} />
          </Form.Item>
        ),
      },
      {
        title: "Thông tin kỷ luật",
        id: "thongTinKyLuat",
        render: (
          <Form.Item name="kyLuat" className="mb-0">
            <ThongTinKyLuatForm expland={expland} setExpland={setExpland} />
          </Form.Item>
        ),
      },
      {
        title: "Đối tượng chính sách",
        id: "doiTuongChinhSach",
        render: (
          <Form.Item name="doiTuongChinhSach" className="mb-0">
            <DoiTuongChinhSachForm expland={expland} setExpland={setExpland} />
          </Form.Item>
        ),
      },
      {
        title: "Kê khai tài sản",
        id: "keKhaiTaiSan",
        render: (
          <Form.Item name="keKhaiTaiSan" className="mb-0">
            <KeKhaiTaiSanForm expland={expland} setExpland={setExpland} />
          </Form.Item>
        ),
      },
    ]
  }, [expland])

  const onChange: UploadProps["onChange"] = ({ fileList: newFileList }) => {
    setFileList(newFileList.slice(-1))
  }

  const handleScroll = (item: itemType) => {
    setActiveKey(item.id)
    setExpland([...expland, item.id])
    const el = document.getElementById(item.id)
    el?.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "nearest",
    })
  }

  const listTabsRender = useMemo(() => {
    return listTabs.filter((item) => item.title.toLowerCase().includes(search.toLowerCase())) || []
  }, [search, listTabs.filter])

  const { showSpinner, hideSpinner } = useSpinner()

  const { onOpen: onOpenModalTomTatLyLich } = useDisclosure<{
    id: string
  }>({
    tag: "ModalTomTatLyLich",
  })

  const { onOpen: onOpenModalLyLichCanBo } = useDisclosure<{
    id: string
  }>({
    tag: "ModalLyLichCanBo",
  })

  const { onOpen: onOpenModalSoYeuLyLich } = useDisclosure<{
    id: string
  }>({
    tag: "ModalSoYeuLyLich",
  })
  function findLatestQuyetDinh(list: any[]) {
    if (list.length === 0) return null
    return list.reduce((latest, current) =>
      new Date(current.ngayNhanQuyetDinh) >= new Date(latest.ngayNhanQuyetDinh) ? current : latest
    )
  }
  function findLatestHocVi(list: any[]) {
    if (list.length === 0) return null
    return list.reduce((latest, current) => (current.year >= latest.year ? current : latest))
  }
  function findLatestHocHam(list: any[]) {
    if (list.length === 0) return null
    return list.reduce((latest, current) =>
      new Date(current.from) >= new Date(latest.from) ? current : latest
    )
  }

  const handleSubmit = async ({
    genderId,
    sucKhoeId,
    nationalityId,
    religionId,
    trinhDoHocVanId,
    nhomMauId,
    ethnicityId,
    bLaGiangVien,
    lecturerTypeId,
    lectureCode,
    organizationId,
    staffTypeId,
    staffPositionId,
    ...values
  }: SubmitForm) => {
    if (!values) return
    if (fileList?.length > 0) {
      const file: any = fileList[0]
      const formData = new FormData()
      formData.append("file", file?.originFileObj)
      // const tenantCode = getCookie(c, 'x-tenantcode')
      const resPresignedUrl = await axios.post(
        `${getRuntimeEnv("NEXT_PUBLIC_API_UPLOAD_URL")}/Files/single/6?tenantCode=${
          window.tenantCode || "dev"
        }&appCode=${getRuntimeEnv("NEXT_PUBLIC_APP_CODE") || "hrm"}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "K-TenantCode": window.tenantCode || "dev",
            "K-AppCode": getRuntimeEnv("NEXT_PUBLIC_APP_CODE") || "hrm",
          },
        }
      )
      if (resPresignedUrl?.status === 200 && resPresignedUrl?.data?.fileName) {
        form.setFieldsValue({
          avatar: resPresignedUrl?.data?.fileName,
        })
      }
    }

    try {
      showSpinner()
      const profileCode = (bLaGiangVien ? lectureCode || values.code : values.code)?.trim()
      const donViId = values.sDM_DonViId || organizationId || null
      const lsbRes = await putDMNhanViens(
        buildLsbNhanVienPayload({
          id,
          donViId,
          code: profileCode,
          lastName: values.lastName,
          firstName: values.firstName,
          genderId,
          dateOfBirth: values.dateOfBirth ? dayjs(values.dateOfBirth).toISOString() : null,
          idCardNumber: values.idCardNumber,
          phoneNumber: values.phoneNumber,
          email: values.email,
          avatar: form.getFieldValue("avatar"),
          officerNumber: values.officerNumber,
          nationalityId,
          currentAddress: values.currentAddress,
          bLaHocVien: values.bLaHocVien,
          bLaCanBoNhanVien: values.bLaCanBoNhanVien,
          bLaGiangVien,
        })
      )
      if (lsbRes.status !== 200) {
        message.error(getLsbErrorMessage(lsbRes, "Đồng bộ LSB thất bại, hồ sơ chưa được lưu"))
        return
      }
      let rank = null
      let hocvi = null
      let hocham = null
      if (values.capBac?.length > 0) {
        if (values.capBac?.length === 1) {
          rank = values.capBac[0]
        }
        rank = findLatestQuyetDinh(values?.capBac)
      }

      if (values.hocVi?.length > 0) {
        if (values.hocVi?.length === 1) {
          hocvi = values.hocVi[0]
        }
        hocvi = findLatestHocVi(values?.hocVi)
      }
      if (values.hocHam?.length > 0) {
        if (values.hocHam?.length === 1) {
          hocham = values.hocHam[0]
        }
        hocham = findLatestHocHam(values?.hocHam)
      }
      // if (res.status === 200) {
      let listTransaction: any = [
        {
          model: "UserProfile",
          operation: "update",
          data: {
            where: {
              id,
            },
            data: {
              hocVi: { deleteMany: {} },
              hocHam: { deleteMany: {} },
              relatives: { deleteMany: {} },
              trinhDoLyLuanChinhTri: { deleteMany: {} },
              trinhDoQuanLyNhaNuoc: { deleteMany: {} },
              ngoaiNgu: { deleteMany: {} },
              tinHoc: { deleteMany: {} },
              boiDuongQuocPhongAnNinh: { deleteMany: {} },
              capBac: { deleteMany: {} },
              quaTrinhCongTac: { deleteMany: {} },
              quaTrinhCuDiCongTac: { deleteMany: {} },
              quaTrinhCuDiDaoTao: { deleteMany: {} },
              khenThuong: { deleteMany: {} },
              kyLuat: { deleteMany: {} },
              doiTuongChinhSach: { deleteMany: {} },
              keKhaiTaiSan: { deleteMany: {} },
              chienDau: { deleteMany: {} },
              diNuocNgoai: { deleteMany: {} },
              thuongTat: { deleteMany: {} },
              danhHieu: { deleteMany: {} },
              tiengDanToc: { deleteMany: {} },
              ToChucXaHoi: { deleteMany: {} },
              QuaTrinhLuong: { deleteMany: {} },
              quaTrinhHocTap: { deleteMany: {} },
              quaTrinhChucVuChinhQuyen: { deleteMany: {} },
              quaTrinhChucVuDang: { deleteMany: {} },
            },
          },
        },
        {
          model: "UserProfile",
          operation: "update",
          data: {
            where: {
              id,
            },
            data: {
              genderId,
              sucKhoeId,
              nationalityId,
              religionId,
              trinhDoHocVanId,
              nhomMauId,
              ethnicityId,
            },
          },
        },
        {
          model: "UserProfile",
          operation: "update",
          data: {
            where: {
              id,
            },
            data: {
              ...values,
              code: profileCode,
              lastName: values.lastName?.trim(),
              firstName: values.firstName?.trim(),
              bLaHocVien: values.bLaHocVien,
              bLaCanBoNhanVien: values?.bLaCanBoNhanVien,
              sDM_DonViId: donViId,
              bLaGiangVien: bLaGiangVien,
              bLaNguoiDung: values?.bLaNguoiDung,
              fullname: `${values.lastName?.trim() || ""} ${values.firstName?.trim() || ""}`.trim(),
              dateOfBirth: values.dateOfBirth ? dayjs(values.dateOfBirth).toISOString() : null,
              idCardDate: values.idCardDate ? dayjs(values.idCardDate).toISOString() : null,
              unionDate: values.unionDate ? dayjs(values.unionDate).toISOString() : null,
              CPVJoinDate: values.CPVJoinDate ? dayjs(values.CPVJoinDate).toISOString() : null,
              officialCPVDate: values.officialCPVDate
                ? dayjs(values.officialCPVDate).toISOString()
                : null,
              tenureDate: values.tenureDate ? dayjs(values.tenureDate).toISOString() : null,
              avatar: form.getFieldValue("avatar"),
              rankId: rank?.capBacId ?? null,
              academicRankTypeId: hocham?.academicRankTypeId ?? null,
              academicDegreeTypeId: hocvi?.academicDegreeTypeId ?? null,
              hocVi:
                values.hocVi && values.hocVi.length > 0
                  ? {
                      createMany: {
                        data: values.hocVi.map((item) => {
                          const { id, userProfileId, ...itemWithoutId } = item
                          return itemWithoutId
                        }),
                        skipDuplicates: true,
                      },
                    }
                  : undefined,

              hocHam:
                values.hocHam && values.hocHam.length > 0
                  ? {
                      createMany: {
                        data: values.hocHam.map((item) => {
                          const { id, userProfileId, ...itemWithoutId } = item
                          return itemWithoutId
                        }),
                        skipDuplicates: true,
                      },
                    }
                  : undefined,

              relatives:
                values.relatives && values.relatives.length > 0
                  ? {
                      createMany: {
                        data: values.relatives.map((item) => {
                          const { id, userProfileId, ...itemWithoutId } = item
                          return itemWithoutId
                        }),
                        skipDuplicates: true,
                      },
                    }
                  : undefined,

              trinhDoLyLuanChinhTri:
                values.trinhDoLyLuanChinhTri && values.trinhDoLyLuanChinhTri.length > 0
                  ? {
                      createMany: {
                        data: values.trinhDoLyLuanChinhTri.map((item) => {
                          const { id, userProfileId, ...itemWithoutId } = item
                          return itemWithoutId
                        }),
                        skipDuplicates: true,
                      },
                    }
                  : undefined,

              trinhDoQuanLyNhaNuoc:
                values.trinhDoQuanLyNhaNuoc && values.trinhDoQuanLyNhaNuoc.length > 0
                  ? {
                      createMany: {
                        data: values.trinhDoQuanLyNhaNuoc.map((item) => {
                          const { id, userProfileId, ...itemWithoutId } = item
                          return itemWithoutId
                        }),
                        skipDuplicates: true,
                      },
                    }
                  : undefined,

              ngoaiNgu:
                values.ngoaiNgu && values.ngoaiNgu.length > 0
                  ? {
                      createMany: {
                        data: values.ngoaiNgu.map((item) => {
                          const { id, userProfileId, ...itemWithoutId } = item
                          return itemWithoutId
                        }),
                        skipDuplicates: true,
                      },
                    }
                  : undefined,

              tinHoc:
                values.tinHoc && values.tinHoc.length > 0
                  ? {
                      createMany: {
                        data: values.tinHoc.map((item) => {
                          const { id, userProfileId, ...itemWithoutId } = item
                          return itemWithoutId
                        }),
                        skipDuplicates: true,
                      },
                    }
                  : undefined,

              boiDuongQuocPhongAnNinh:
                values.boiDuongQuocPhongAnNinh && values.boiDuongQuocPhongAnNinh.length > 0
                  ? {
                      createMany: {
                        data: values.boiDuongQuocPhongAnNinh.map((item) => {
                          const { id, userProfileId, ...itemWithoutId } = item
                          return itemWithoutId
                        }),
                        skipDuplicates: true,
                      },
                    }
                  : undefined,

              capBac:
                values.capBac && values.capBac.length > 0
                  ? {
                      createMany: {
                        data: values.capBac.map((item) => {
                          const { id, userProfileId, ...itemWithoutId } = item
                          return itemWithoutId
                        }),
                        skipDuplicates: true,
                      },
                    }
                  : undefined,

              quaTrinhCongTac:
                values.quaTrinhCongTac && values.quaTrinhCongTac.length > 0
                  ? {
                      createMany: {
                        data: values.quaTrinhCongTac.map((item) => {
                          const { id, userProfileId, ...itemWithoutId } = item
                          return itemWithoutId
                        }),
                        skipDuplicates: true,
                      },
                    }
                  : undefined,

              quaTrinhCuDiCongTac:
                values.quaTrinhCuDiCongTac && values.quaTrinhCuDiCongTac.length > 0
                  ? {
                      createMany: {
                        data: values.quaTrinhCuDiCongTac.map((item) => {
                          const { id, userProfileId, ...itemWithoutId } = item
                          return itemWithoutId
                        }),
                        skipDuplicates: true,
                      },
                    }
                  : undefined,

              quaTrinhCuDiDaoTao:
                values.quaTrinhCuDiDaoTao && values.quaTrinhCuDiDaoTao.length > 0
                  ? {
                      createMany: {
                        data: values.quaTrinhCuDiDaoTao.map((item) => {
                          const { id, userProfileId, ...itemWithoutId } = item
                          return itemWithoutId
                        }),
                        skipDuplicates: true,
                      },
                    }
                  : undefined,

              khenThuong:
                values.khenThuong && values.khenThuong.length > 0
                  ? {
                      createMany: {
                        data: values.khenThuong.map((item) => {
                          const { id, userProfileId, ...itemWithoutId } = item
                          return itemWithoutId
                        }),
                        skipDuplicates: true,
                      },
                    }
                  : undefined,

              kyLuat:
                values.kyLuat && values.kyLuat.length > 0
                  ? {
                      createMany: {
                        data: values.kyLuat.map((item) => {
                          const { id, userProfileId, ...itemWithoutId } = item
                          return itemWithoutId
                        }),
                        skipDuplicates: true,
                      },
                    }
                  : undefined,

              doiTuongChinhSach:
                values.doiTuongChinhSach && values.doiTuongChinhSach.length > 0
                  ? {
                      createMany: {
                        data: values.doiTuongChinhSach.map((item) => {
                          const { id, userProfileId, ...itemWithoutId } = item
                          return itemWithoutId
                        }),
                        skipDuplicates: true,
                      },
                    }
                  : undefined,

              keKhaiTaiSan:
                values.keKhaiTaiSan && values.keKhaiTaiSan.length > 0
                  ? {
                      createMany: {
                        data: values.keKhaiTaiSan.map((item) => {
                          const { id, userProfileId, ...itemWithoutId } = item
                          return itemWithoutId
                        }),
                        skipDuplicates: true,
                      },
                    }
                  : undefined,

              chienDau:
                values.chienDau && values.chienDau.length > 0
                  ? {
                      createMany: {
                        data: values.chienDau.map((item) => {
                          const { id, userProfileId, ...itemWithoutId } = item
                          return itemWithoutId
                        }),
                        skipDuplicates: true,
                      },
                    }
                  : undefined,

              diNuocNgoai:
                values.diNuocNgoai && values.diNuocNgoai.length > 0
                  ? {
                      createMany: {
                        data: values.diNuocNgoai.map((item) => {
                          const { id, userProfileId, ...itemWithoutId } = item
                          return itemWithoutId
                        }),
                        skipDuplicates: true,
                      },
                    }
                  : undefined,

              thuongTat:
                values.thuongTat && values.thuongTat.length > 0
                  ? {
                      createMany: {
                        data: values.thuongTat.map((item) => {
                          const { id, userProfileId, ...itemWithoutId } = item
                          return itemWithoutId
                        }),
                        skipDuplicates: true,
                      },
                    }
                  : undefined,

              danhHieu:
                values.danhHieu && values.danhHieu.length > 0
                  ? {
                      createMany: {
                        data: values.danhHieu.map((item) => {
                          const { id, userProfileId, ...itemWithoutId } = item
                          return itemWithoutId
                        }),
                        skipDuplicates: true,
                      },
                    }
                  : undefined,

              tiengDanToc:
                values.tiengDanToc && values.tiengDanToc.length > 0
                  ? {
                      createMany: {
                        data: values.tiengDanToc.map((item) => {
                          const { id, userProfileId, ...itemWithoutId } = item
                          return itemWithoutId
                        }),
                        skipDuplicates: true,
                      },
                    }
                  : undefined,

              ToChucXaHoi:
                values.ToChucXaHoi && values.ToChucXaHoi.length > 0
                  ? {
                      createMany: {
                        data: values.ToChucXaHoi.map((item) => {
                          const { id, userProfileId, ...itemWithoutId } = item
                          return itemWithoutId
                        }),
                        skipDuplicates: true,
                      },
                    }
                  : undefined,

              QuaTrinhLuong:
                values.QuaTrinhLuong && values.QuaTrinhLuong.length > 0
                  ? {
                      createMany: {
                        data: values.QuaTrinhLuong.map((item) => {
                          const { id, userProfileId, ...itemWithoutId } = item
                          return itemWithoutId
                        }),
                        skipDuplicates: true,
                      },
                    }
                  : undefined,

              quaTrinhHocTap:
                values.quaTrinhHocTap && values.quaTrinhHocTap.length > 0
                  ? {
                      createMany: {
                        data: values.quaTrinhHocTap.map((item) => {
                          const { id, userProfileId, ...itemWithoutId } = item
                          return itemWithoutId
                        }),
                        skipDuplicates: true,
                      },
                    }
                  : undefined,

              quaTrinhChucVuChinhQuyen:
                values.quaTrinhChucVuChinhQuyen && values.quaTrinhChucVuChinhQuyen.length > 0
                  ? {
                      createMany: {
                        data: values.quaTrinhChucVuChinhQuyen.map((item) => {
                          const { id, userProfileId, ...itemWithoutId } = item
                          return itemWithoutId
                        }),
                        skipDuplicates: true,
                      },
                    }
                  : undefined,

              quaTrinhChucVuDang:
                values.quaTrinhChucVuDang && values.quaTrinhChucVuDang.length > 0
                  ? {
                      createMany: {
                        data: values.quaTrinhChucVuDang.map((item) => {
                          const { id, userProfileId, ...itemWithoutId } = item
                          return itemWithoutId
                        }),
                        skipDuplicates: true,
                      },
                    }
                  : undefined,
            },
          },
        },
      ]
      if (cccdUserProfileData?.lecturer && bLaGiangVien && lecturerTypeId) {
        const lecturerUpdateData: any = {
          lecturerTypeId,
        }

        listTransaction = [
          ...listTransaction,
          {
            model: "Lecturer",
            operation: "update",
            data: {
              where: {
                id: cccdUserProfileData?.lecturer?.id,
              },
              data: lecturerUpdateData,
            },
          },
        ]
      }
      if (!cccdUserProfileData?.lecturer && bLaGiangVien && lecturerTypeId) {
        const lecturerData: any = {
          userProfileId: id,
          lecturerTypeId,
        }

        listTransaction = [
          ...listTransaction,
          {
            model: "Lecturer",
            operation: "create",
            data: {
              data: lecturerData,
            },
          },
        ]
      }

      if (cccdUserProfileData?.lecturer && !bLaGiangVien) {
        listTransaction = [
          ...listTransaction,
          {
            model: "Lecturer",
            operation: "delete",
            data: {
              where: {
                id: cccdUserProfileData?.lecturer?.id,
              },
            },
          },
        ]
      }

      if (
        cccdUserProfileData?.staffs &&
        values.bLaCanBoNhanVien &&
        staffTypeId &&
        staffPositionId
      ) {
        listTransaction = [
          ...listTransaction,
          {
            model: "Staff",
            operation: "update",
            data: {
              where: {
                id: cccdUserProfileData?.staffs?.id,
              },
              data: {
                staffPositionId,
                staffTypeId,
                organizationId: values?.sDM_DonViId,
              },
            },
          },
        ]
      }
      if (
        !cccdUserProfileData?.staffs &&
        values.bLaCanBoNhanVien &&
        staffTypeId &&
        staffPositionId
      ) {
        listTransaction = [
          ...listTransaction,
          {
            model: "Staff",
            operation: "create",
            data: {
              data: {
                userProfileId: id,
                staffPositionId,
                staffTypeId,
                organizationId: values?.sDM_DonViId,
              },
            },
          },
        ]
      }

      if (cccdUserProfileData?.staffs && !values.bLaCanBoNhanVien) {
        listTransaction = [
          ...listTransaction,
          {
            model: "Staff",
            operation: "delete",
            data: {
              where: {
                id: cccdUserProfileData?.staffs?.id,
              },
            },
          },
        ]
      }

      const res = await sqlTransaction(listTransaction)
      if (res?.status === 200) {
        queryClient.invalidateQueries({
          queryKey: ["UserProfile"],
        })
        message.success("Cập nhật thành công")
      }

      // }
      // router.push(ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO)
    } catch (error) {
      message.error("Đã có lỗi xảy ra, vui lòng thử lại sau")
    } finally {
      hideSpinner()
    }
  }

  const { data: cccdUserProfileData } = useFindUniqueUserProfile(
    {
      where: {
        id,
      },
      include: {
        nationality: true,
        religion: true,
        ethnicity: true,
        rank: true,
        academicDegreeType: true,
        academicRankType: true,
        level: true,
        tinHoc: true,
        hocVi: true,
        hocHam: true,
        trinhDoLyLuanChinhTri: true,
        trinhDoQuanLyNhaNuoc: true,
        ngoaiNgu: true,
        boiDuongQuocPhongAnNinh: true,
        capBac: true,
        doiTuongChinhSach: true,
        keKhaiTaiSan: true,
        khenThuong: true,
        kyLuat: true,
        quaTrinhCongTac: true,
        quaTrinhCuDiCongTac: true,
        quaTrinhCuDiDaoTao: true,
        relatives: true,
        chienDau: true,
        diNuocNgoai: true,
        thuongTat: true,
        danhHieu: true,
        tiengDanToc: true,
        ToChucXaHoi: true,
        QuaTrinhLuong: true,
        quaTrinhHocTap: true,
        quaTrinhChucVuChinhQuyen: true,
        quaTrinhChucVuDang: true,
        nhomMau: true,
        trinhDoHocVan: true,
        lecturer: true,
        staffs: true,
      },
    },
    {
      enabled: !!id,
      refetchOnWindowFocus: false,
    }
  )

  // Hàm fill thông tin từ dữ liệu cccdUserProfileData
  // biome-ignore lint/correctness/useExhaustiveDependencies: <dv>
  const fillUserInfo = useCallback(
    async (userData: any) => {
      if (!userData) return
      // Fill thông tin cơ bản từ UserProfile
      form.setFieldsValue({
        ...userData,
        bLaHocVien: !!userData.bLaHocVien,
        bLaCanBoNhanVien: !!userData.bLaCanBoNhanVien,
        bLaGiangVien: !!userData.bLaGiangVien,
        bLaNguoiDung: !!userData.bLaNguoiDung,
        dateOfBirth: userData.dateOfBirth ? dayjs(userData.dateOfBirth) : null,
        idCardDate: userData.idCardDate ? dayjs(userData.idCardDate) : null,
        idCardExpirationDate: userData.idCardExpirationDate
          ? dayjs(userData.idCardExpirationDate)
          : null,
        // Thông tin cá nhân khác
        unionDate: userData.unionDate ? dayjs(userData.unionDate) : null,
        CPVJoinDate: userData.CPVJoinDate ? dayjs(userData.CPVJoinDate) : null,
        officialCPVDate: userData.officialCPVDate ? dayjs(userData.officialCPVDate) : null,
        tenureDate: userData.tenureDate ? dayjs(userData.tenureDate) : null,
        staffPositionId: userData.staffs?.staffPositionId,
        staffTypeId: userData.staffs?.staffTypeId,
        lecturerTypeId: userData.lecturer?.lecturerTypeId,
        organizationId: userData.sDM_DonViId,
        lectureCode: userData.code,
      })
      if (userData?.avatar) {
        const imageUrl = await getLInkImage()
        const avatarFile: UploadFile = {
          uid: "-1",
          name: "avatar.jpg",
          status: "done",
          url: imageUrl, // Sử dụng getMinioUrl để tạo URL hiển thị
        }
        setFileList([avatarFile])
      }
    },
    [form]
  )
  const getLInkImage = async () => {
    const res = await axios.get(
      `${getRuntimeEnv("NEXT_PUBLIC_API_UPLOAD_URL")}/Files/employee/${id}/image`,
      {
        responseType: "blob",
        headers: {
          "Content-Type": "multipart/form-data",
          "K-TenantCode": window.tenantCode || "dev",
          "K-AppCode": getRuntimeEnv("NEXT_PUBLIC_APP_CODE") || "hrm",
        },
        params: {
          h: 100,
          w: 100,
          appCode: getRuntimeEnv("NEXT_PUBLIC_APP_CODE") || "hrm",
          tenantCode: window.tenantCode || "dev",
        },
      }
    )
    if (res?.status === 200) {
      return URL.createObjectURL(res.data)
    }

    return ""
  }

  const avatar = Form.useWatch("avatar", form)
  // const fileListValue = useMemo(async() => {
  //     if (avatar) {
  //         const imageUrl = await getLInkImage();
  //         const avatarFile: UploadFile = {
  //             uid: '-1',
  //             name: 'avatar.jpg',
  //             status: 'done',
  //             url: imageUrl, // Sử dụng getMinioUrl để tạo URL hiển thị
  //         }
  //         return [avatarFile]
  //     }
  // }, [avatar])

  // Effect để fill thông tin khi có dữ liệu từ API
  useEffect(() => {
    if (cccdUserProfileData) {
      fillUserInfo(cccdUserProfileData)
    }
  }, [cccdUserProfileData, fillUserInfo])

  return (
    <Form form={form} onFinish={handleSubmit}>
      <div className="p-4">
        <Flex justify="space-between" className="mb-4">
          <div className="text-xl font-semibold">Hồ sơ của tôi</div>
          <Flex justify="end" wrap="wrap" gap="8px">
            <Dropdown
              trigger={["click"]}
              disabled={!id}
              menu={{
                items: [
                  {
                    key: "trich-yeu-63",
                    label: "Xuất dữ liệu theo mẫu trích yếu 63",
                    onClick: () => onOpenModalTomTatLyLich({ id }),
                  },
                  {
                    key: "mau-c2",
                    label: "Xuất dữ liệu theo mẫu C2",
                    onClick: () => onOpenModalLyLichCanBo({ id }),
                  },
                  {
                    key: "so-yeu-ly-lich",
                    label: "Xuất dữ liệu theo mẫu sơ yếu lý lịch",
                    onClick: () => onOpenModalSoYeuLyLich({ id }),
                  },
                ],
              }}
            >
              <Button htmlType="button" disabled={!id} icon={<PrinterOutlined />}>
                Xuất dữ liệu
              </Button>
            </Dropdown>
            <Button
              onClick={() => {
                router.push(ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO)
              }}
            >
              Hủy
            </Button>
            <Button type="primary" htmlType="submit">
              Lưu
            </Button>
          </Flex>
        </Flex>
        <Flex justify="space-between" className="w-full h-[calc(100vh-175px)]">
          <div className="bg-white rounded-lg shadow h-full overflow-y-auto w-[250px]">
            <div className="p-4">
              <Input
                id="search"
                disabled={false}
                className="w-full"
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm ..."
              />
            </div>

            {listTabsRender.length ? (
              <div className="mt-2">
                {listTabsRender.map((item) => (
                  <div
                    className="relative cursor-pointer mb-2 px-5 py-2 hover:bg-gray-100"
                    key={item.id}
                    onClick={() => handleScroll(item)}
                  >
                    {activeKey === item.id && (
                      <div className="bg-primary absolute top-0 left-0 h-full w-[3px]" />
                    )}
                    <div className={activeKey === item.id ? "text-primary font-[500]" : ""}>
                      {item.title}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4">Không tìm thấy kết quả</div>
            )}
          </div>
          <div className="h-full overflow-y-auto w-[calc(100%-266px)] ">
            <div className="p-6 shadow rounded-lg bg-white mb-4">
              <FormItem name="avatar" form={form} className="mb-0 relative">
                <ImgCrop rotationSlider>
                  <Upload
                    listType="picture-circle"
                    maxCount={1}
                    fileList={fileList}
                    onChange={onChange}
                    onRemove={() => {
                      setFileList([])
                      form.setFieldValue("avatar", null)
                    }}
                    showUploadList={{
                      showPreviewIcon: false,
                    }}
                    className="avatar-upload "
                  >
                    {avatar
                      ? ""
                      : fileList.length < 1 && (
                          <div className="relative flex items-center justify-center">
                            <UserOutlined
                              style={{
                                fontSize: "20px",
                                color: "#686C7B",
                              }}
                            />
                          </div>
                        )}
                  </Upload>
                </ImgCrop>
                <div className="absolute bottom-[0px] left-[52px] w-[24px] h-[24px] rounded-[50%] bg-[#e0e0e0] flex items-center justify-center">
                  <CameraFilled style={{ color: "#686C7B" }} />
                </div>
              </FormItem>
            </div>
            <div className="p-6 shadow rounded-lg bg-white form-userprofile">
              {listTabs.map((i) => {
                return (
                  <div key={i.id} id={i.id}>
                    <div>{i?.render}</div>
                    <Divider className="my-3" />
                  </div>
                )
              })}
            </div>
          </div>
        </Flex>
      </div>
    </Form>
  )
}

UpdateUserPage.getLayout = function getLayout(page: React.ReactElement) {
  return <CreateLayout>{page}</CreateLayout>
}
