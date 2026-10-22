import { CameraFilled, UserOutlined } from "@ant-design/icons"
import HocHamForm from "@components/modal/quan-ly-ho-so/form/hoc-ham"
import HocViForm from "@components/modal/quan-ly-ho-so/form/hoc-vi"
import ThongTinCoBan from "@components/modal/quan-ly-ho-so/form/thong-tin-co-ban"
import ThongTinThanNhanForm from "@components/modal/quan-ly-ho-so/form/thong-tin-than-nhan"
import TrinhDoLyLuanChinhTriForm from "@components/modal/quan-ly-ho-so/form/trinh-do-ly-luan-chinh-tri"
import CreateLayout from "@layouts/create-layout"
import { QL_HO_SO_PERMISSION, ROUTER_PATH } from "@workspace/router"
import {
  Button,
  Divider,
  Flex,
  Form,
  type GetProp,
  Input,
  message,
  Upload,
  type UploadFile,
  type UploadProps,
} from "antd"
import { useRouter } from "next/router"
import { useMemo, useState } from "react"
import "./index.css"
import { queryClient } from "@api/index"
import ForbiddenPage from "@components/commons/403"
import FormItem from "@components/commons/form-item"
import BoiDuongQuocPhongAnNinhForm from "@components/modal/quan-ly-ho-so/form/boi-duong-quoc-phong-an-ninh"
import CapBacForm from "@components/modal/quan-ly-ho-so/form/cap-bac"
import ChucVuChinhQuyenForm from "@components/modal/quan-ly-ho-so/form/chuc-vu-chinh-quyen"
import ChucVuDangForm from "@components/modal/quan-ly-ho-so/form/chuc-vu-dang"
import DanhHieuForm from "@components/modal/quan-ly-ho-so/form/danh-hieu"
import NuocNgoaiForm from "@components/modal/quan-ly-ho-so/form/di-nuoc-ngoai"
import DoanDang from "@components/modal/quan-ly-ho-so/form/doan-dang"
import DoiTuongChinhSachForm from "@components/modal/quan-ly-ho-so/form/doi-tuong-chinh-sach"
import KeKhaiTaiSanForm from "@components/modal/quan-ly-ho-so/form/ke-khai-taI-san"
import NgoaiNguForm from "@components/modal/quan-ly-ho-so/form/ngoai-ngu"
import ChienDauForm from "@components/modal/quan-ly-ho-so/form/phuc-vu-chien-dau"
import QuaTrinhCongTacForm from "@components/modal/quan-ly-ho-so/form/qua-trinh-cong-tac"
import QuaTrinhCuDiCongTacForm from "@components/modal/quan-ly-ho-so/form/qua-trinh-cu-di-cong-tac"
import QuaTrinhDiDaoTaoBoiDuongForm from "@components/modal/quan-ly-ho-so/form/qua-trinh-di-dao-tao-boi-duong"
import QuaTrinhHocTapForm from "@components/modal/quan-ly-ho-so/form/qua-trinh-hoc-tap"
import QuaTrinhLuongForm from "@components/modal/quan-ly-ho-so/form/qua-trinh-luong"
import ThongTinKhenThuongForm from "@components/modal/quan-ly-ho-so/form/thong-tin-khen-thuong"
import ThongTinKyLuatForm from "@components/modal/quan-ly-ho-so/form/thong-tin-ky-luat"
import ThongTinLienHe from "@components/modal/quan-ly-ho-so/form/thong-tin-lien-he"
import ThuongTatForm from "@components/modal/quan-ly-ho-so/form/thuong-tat"
import TiengDanTocForm from "@components/modal/quan-ly-ho-so/form/tieng-dan-toc"
import TinHocForm from "@components/modal/quan-ly-ho-so/form/tin-hoc"
import ToChucXaHoiForm from "@components/modal/quan-ly-ho-so/form/to-chuc-xa-hoi"
import TrinhDoQuanLyNhaNuocForm from "@components/modal/quan-ly-ho-so/form/trinh-do-quan-ly-nha-nuoc"
import useSpinner from "@hooks/spinner"
import { emptyObjectIf } from "@workspace/constant"
import type { Prisma } from "@workspace/db"
import { useCreateLecturer, useCreateStaff, useUpsertUserProfile } from "@workspace/db/hooks"
import { buildLsbNhanVienPayload, getLsbErrorMessage } from "@lib/lsb-nhan-vien"
import { toHocHamCreateInput, toHocViCreateInput } from "@lib/utils"
import { postDMNhanViens } from "@workspace/libs/api/system"
import { getRuntimeEnv } from "@workspace/libs/utils"
import { useAbility } from "@workspace/permissions/hooks"
import ImgCrop from "antd-img-crop"
import axios from "axios"
import dayjs from "dayjs"

dayjs.locale("vi")
interface itemType {
  id: string
  render?: JSX.Element
  title: string
}

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0]

export type SubmitForm = Prisma.UserProfileGetPayload<{
  include: {
    quaTrinhChucVuChinhQuyen: true
    quaTrinhChucVuDang: true
    tinHoc: true
    hocVi: true
    hocHam: true
    trinhDoLyLuanChinhTri: true
    trinhDoQuanLyHanhChinh: true
    trinhDoQuanLyNhaNuoc: true
    ngoaiNgu: true
    boiDuongQuocPhongAnNinh: true
    capBac: true
    doanDang: true
    doiTuongChinhSach: true
    keKhaiTaiSan: true
    quaTrinhCongTac: true
    quaTrinhCuDiCongTac: true
    quaTrinhCuDiDaoTao: true
    khenThuong: true
    kyLuat: true
    relatives: true
    tiengDanToc: true
    chienDau: true
    diNuocNgoai: true
    thuongTat: true
    danhHieu: true
    quaTrinhHocTap: true
    ToChucXaHoi: true
    QuaTrinhLuong: true
  }
}> & {
  file?: FileType
  lecturerTypeId?: string
  staffTypeId?: string
  staffPositionId?: string
  lectureCode?: string
  organizationId?: string
}

export default function CreateUserPage() {
  const { can, canSome } = useAbility()
  const [form] = Form.useForm<SubmitForm>()
  const [search, setSearch] = useState<string>("")
  const [activeKey, setActiveKey] = useState("thongTinCoBan")
  const [expland, setExpland] = useState<string[]>(["thongTinCoBan", "thongTinLienHe"])
  const { mutateAsync: createLecturer } = useCreateLecturer()
  const { mutateAsync: createStaff } = useCreateStaff()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const router = useRouter()
  function findLatestQuyetDinh(list: any[]) {
    if (list.length === 0) return null
    return list.reduce((latest, current) =>
      new Date(current.ngayNhanQuyetDinh) > new Date(latest.ngayNhanQuyetDinh) ? current : latest
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
  const listTabs: itemType[] = [
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

  const { mutateAsync: upsertUserProfile } = useUpsertUserProfile()

  const handleSubmit = async ({
    bLaGiangVien,
    lecturerTypeId,
    staffTypeId,
    staffPositionId,
    lectureCode,
    organizationId,
    // Loại bỏ tất cả relation fields khỏi spread để tránh lỗi Prisma
    tinHoc,
    hocVi,
    hocHam,
    trinhDoLyLuanChinhTri,
    trinhDoQuanLyHanhChinh,
    trinhDoQuanLyNhaNuoc,
    ngoaiNgu,
    boiDuongQuocPhongAnNinh,
    capBac,
    doanDang,
    doiTuongChinhSach,
    keKhaiTaiSan,
    quaTrinhCongTac,
    quaTrinhCuDiCongTac,
    quaTrinhCuDiDaoTao,
    khenThuong,
    kyLuat,
    relatives,
    tiengDanToc,
    chienDau,
    diNuocNgoai,
    thuongTat,
    danhHieu,
    quaTrinhHocTap,
    ToChucXaHoi,
    QuaTrinhLuong,
    quaTrinhChucVuChinhQuyen,
    quaTrinhChucVuDang,
    ...values
  }: SubmitForm) => {
    if (!values) return

    if (fileList.length > 0) {
      // const file = fileList[0]
      // const resPresignedUrl = await generatePresignedUrl({
      //     path: 'avatar',
      //     extension: file.name?.split('.').pop() ?? '',
      // })

      // await fetch(resPresignedUrl.data.url, {
      //     method: 'PUT',
      //     body: file.originFileObj,
      // })

      // form.setFieldsValue({
      //     avatar: resPresignedUrl.data.fileName,
      // })
      const file: any = fileList[0]
      const formData = new FormData()
      formData.append("file", file?.originFileObj)
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
      const donViId = values.sDM_DonViId || organizationId || null
      const res = await postDMNhanViens(
        buildLsbNhanVienPayload({
          donViId,
          code: values.code,
          lastName: values.lastName,
          firstName: values.firstName,
          genderId: values.genderId,
          dateOfBirth: values.dateOfBirth ? dayjs(values.dateOfBirth).toISOString() : null,
          idCardNumber: values.idCardNumber,
          phoneNumber: values.phoneNumber,
          email: values.email,
          avatar: form.getFieldValue("avatar"),
          officerNumber: values.officerNumber,
          nationalityId: values.nationalityId,
          currentAddress: values.currentAddress,
          newCurrentAddress: values.newCurrentAddress,
          viTriCongViecId: values.sDM_ViTriCongViecId,
          quanLyTrucTiepId: values.sQuanlyTrucTiepId,
          provinceCurrentAddressId: values.provinceCurrentAddressId,
          districtCurrentAddressId: values.districtCurrentAddressId,
          communeCurrentAddressId: values.communeCurrentAddressId,
          newProvinceCurrentAddressId: values.newProvinceCurrentAddressId,
          newCommuneCurrentAddressId: values.newCommuneCurrentAddressId,
          bLaHocVien: values.bLaHocVien,
          bLaCanBoNhanVien: values.bLaCanBoNhanVien,
          bLaGiangVien,
          bLaNguoiDung: values.bLaNguoiDung,
          active: values.active,
        })
      )
      if (res?.status !== 200) {
        message.error(getLsbErrorMessage(res, "Đồng bộ LSB thất bại, hồ sơ chưa được tạo"))
        return
      }
      if (res?.status === 200) {
        let rank = null
        let hocvi = null
        let hocham = null
        if (capBac?.length > 0) {
          if (capBac?.length === 1) {
            rank = capBac[0]
          }
          rank = findLatestQuyetDinh(capBac)
        }

        if (hocVi?.length > 0) {
          if (hocVi?.length === 1) {
            hocvi = hocVi[0]
          }
          hocvi = findLatestHocVi(hocVi)
        }
        if (hocHam?.length > 0) {
          if (hocHam?.length === 1) {
            hocham = hocHam[0]
          }
          hocham = findLatestHocHam(hocHam)
        }
        const profileData = {
          ...values,
          code: values.code || lectureCode,
          lastName: values.lastName?.trim(),
          firstName: values.firstName?.trim(),
          id: res?.data?.Id,
          bLaCanBoNhanVien: values?.bLaCanBoNhanVien,
          bLaGiangVien: bLaGiangVien || undefined,
          bLaNguoiDung: values?.bLaNguoiDung,
          sDM_DonViId: donViId,
          dateOfBirth: values.dateOfBirth ? dayjs(values.dateOfBirth).toISOString() : null,
          idCardDate: values.idCardDate ? dayjs(values.idCardDate).toISOString() : null,
          unionDate: values.unionDate ? dayjs(values.unionDate).toISOString() : null,
          CPVJoinDate: values.CPVJoinDate ? dayjs(values.CPVJoinDate).toISOString() : null,
          officialCPVDate: values.officialCPVDate
            ? dayjs(values.officialCPVDate).toISOString()
            : null,
          tenureDate: values.tenureDate ? dayjs(values.tenureDate).toISOString() : null,
          avatar: form.getFieldValue("avatar"),
          fullname: `${values.lastName?.trim() || ""} ${values.firstName?.trim() || ""}`.trim(),
          rankId: rank?.capBacId ?? null,
          academicDegreeTypeId: hocvi?.academicDegreeTypeId ?? null,
          academicRankTypeId: hocham?.academicRankTypeId ?? null,
        }

        const resProfile = await upsertUserProfile({
          where: { code: values.code ?? undefined },
          create: {
            ...profileData,
            ...emptyObjectIf(
              {
                hocVi: {
                  createMany: {
                    data: hocVi?.map((item) => toHocViCreateInput(item as Record<string, unknown>)),
                  },
                },
              },

              !!hocVi
            ),
            ...emptyObjectIf(
              {
                hocHam: {
                  createMany: {
                    data: hocHam?.map((item) => toHocHamCreateInput(item as Record<string, unknown>)),
                  },
                },
              },

              !!hocHam
            ),
            ...emptyObjectIf(
              {
                relatives: {
                  createMany: {
                    data: relatives?.map((item) => ({
                      ...item,
                    })),
                  },
                },
              },
              !!relatives
            ),
            ...emptyObjectIf(
              {
                quaTrinhChucVuChinhQuyen: {
                  createMany: {
                    data: quaTrinhChucVuChinhQuyen?.map((item) => ({
                      ...item,
                    })),
                  },
                },
              },
              !!quaTrinhChucVuChinhQuyen
            ),
            ...emptyObjectIf(
              {
                quaTrinhChucVuDang: {
                  createMany: {
                    data: quaTrinhChucVuDang?.map((item) => ({
                      ...item,
                    })),
                  },
                },
              },
              !!quaTrinhChucVuDang
            ),
            ...emptyObjectIf(
              {
                trinhDoLyLuanChinhTri: {
                  createMany: {
                    data: trinhDoLyLuanChinhTri?.map((item) => ({
                      ...item,
                    })),
                  },
                },
              },

              !!trinhDoLyLuanChinhTri
            ),
            ...emptyObjectIf(
              {
                trinhDoQuanLyNhaNuoc: {
                  createMany: {
                    data: trinhDoQuanLyNhaNuoc?.map((item) => ({
                      ...item,
                    })),
                  },
                },
              },

              !!trinhDoQuanLyNhaNuoc
            ),
            ...emptyObjectIf(
              {
                ngoaiNgu: {
                  createMany: {
                    data: ngoaiNgu?.map((item) => ({
                      ...item,
                    })),
                  },
                },
              },

              !!ngoaiNgu
            ),
            ...emptyObjectIf(
              {
                boiDuongQuocPhongAnNinh: {
                  createMany: {
                    data: boiDuongQuocPhongAnNinh?.map((item) => ({
                      ...item,
                    })),
                  },
                },
              },

              !!boiDuongQuocPhongAnNinh
            ),
            ...emptyObjectIf(
              {
                capBac: {
                  createMany: {
                    data: capBac?.map((item) => ({
                      ...item,
                    })),
                  },
                },
              },

              !!capBac
            ),
            ...emptyObjectIf(
              {
                quaTrinhCongTac: {
                  createMany: {
                    data: quaTrinhCongTac?.map((item) => ({
                      ...item,
                    })),
                  },
                },
              },

              !!quaTrinhCongTac
            ),
            ...emptyObjectIf(
              {
                quaTrinhCuDiCongTac: {
                  createMany: {
                    data: quaTrinhCuDiCongTac?.map((item) => ({
                      ...item,
                    })),
                  },
                },
              },
              !!quaTrinhCuDiCongTac
            ),
            ...emptyObjectIf(
              {
                quaTrinhCuDiDaoTao: {
                  createMany: {
                    data: quaTrinhCuDiDaoTao?.map((item) => ({
                      ...item,
                    })),
                  },
                },
              },
              !!quaTrinhCuDiDaoTao
            ),
            ...emptyObjectIf(
              {
                khenThuong: {
                  createMany: {
                    data: khenThuong?.map((item) => ({
                      ...item,
                    })),
                  },
                },
              },
              !!khenThuong
            ),
            ...emptyObjectIf(
              {
                kyLuat: {
                  createMany: {
                    data: kyLuat?.map((item) => ({
                      ...item,
                    })),
                  },
                },
              },
              !!kyLuat
            ),
            ...emptyObjectIf(
              {
                doiTuongChinhSach: {
                  createMany: {
                    data: doiTuongChinhSach?.map((item) => ({
                      ...item,
                    })),
                  },
                },
              },
              !!doiTuongChinhSach
            ),
            ...emptyObjectIf(
              {
                keKhaiTaiSan: {
                  createMany: {
                    data: keKhaiTaiSan?.map((item) => ({
                      ...item,
                    })),
                  },
                },
              },
              !!keKhaiTaiSan
            ),
            ...emptyObjectIf(
              {
                tinHoc: {
                  createMany: {
                    data: tinHoc?.map((item) => ({
                      ...item,
                    })),
                  },
                },
              },
              !!tinHoc
            ),
            ...emptyObjectIf(
              {
                chienDau: {
                  createMany: {
                    data: chienDau?.map((item) => ({
                      ...item,
                    })),
                  },
                },
              },
              !!chienDau
            ),
            ...emptyObjectIf(
              {
                diNuocNgoai: {
                  createMany: {
                    data: diNuocNgoai?.map((item) => ({
                      ...item,
                    })),
                  },
                },
              },
              !!diNuocNgoai
            ),
            ...emptyObjectIf(
              {
                thuongTat: {
                  createMany: {
                    data: thuongTat?.map((item) => ({
                      ...item,
                    })),
                  },
                },
              },
              !!thuongTat
            ),
            ...emptyObjectIf(
              {
                danhHieu: {
                  createMany: {
                    data: danhHieu?.map((item) => ({
                      ...item,
                    })),
                  },
                },
              },
              !!danhHieu
            ),
            ...emptyObjectIf(
              {
                tiengDanToc: {
                  createMany: {
                    data: tiengDanToc?.map((item) => ({
                      ...item,
                    })),
                  },
                },
              },
              !!tiengDanToc
            ),
            ...emptyObjectIf(
              {
                ToChucXaHoi: {
                  createMany: {
                    data: ToChucXaHoi?.map((item) => ({
                      ...item,
                    })),
                  },
                },
              },
              !!ToChucXaHoi
            ),
            ...emptyObjectIf(
              {
                danhHieu: {
                  createMany: {
                    data: danhHieu?.map((item) => ({
                      ...item,
                    })),
                  },
                },
              },
              !!danhHieu
            ),
            ...emptyObjectIf(
              {
                QuaTrinhLuong: {
                  createMany: {
                    data: QuaTrinhLuong?.map((item) => ({
                      ...item,
                    })),
                  },
                },
              },
              !!QuaTrinhLuong
            ),
            ...emptyObjectIf(
              {
                quaTrinhHocTap: {
                  createMany: {
                    data: quaTrinhHocTap?.map((item) => ({
                      ...item,
                    })),
                  },
                },
              },
              !!quaTrinhHocTap
            ),
          },
          update: profileData,
        })
        if (bLaGiangVien && resProfile && lecturerTypeId) {
          await createLecturer({
            data: {
              userProfileId: resProfile?.id,
              lecturerTypeId: lecturerTypeId,
            },
          })
        }
        if (values.bLaCanBoNhanVien && resProfile && staffTypeId && staffPositionId) {
          await createStaff({
            data: {
              userProfileId: resProfile?.id,
              staffPositionId: staffPositionId,
              staffTypeId: staffTypeId,
              organizationId: donViId || "",
            },
          })
        }

        queryClient.invalidateQueries({
          queryKey: ["UserProfile"],
        })
        router.push(ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO)
      } else {
        message.error("Đã có lỗi xảy ra, vui lòng thử lại sau")
      }
    } catch (error) {
      message.error("Đã có lỗi xảy ra, vui lòng thử lại sau")
    } finally {
      hideSpinner()
    }
  }

  return (
    <>
      {can(QL_HO_SO_PERMISSION.QL_HO_SO_QUAN_LY_HO_SO, "THEM") ? (
        <Form form={form} onFinish={handleSubmit}>
          <div>
            <Flex justify="space-between" className="p-4">
              <div className="text-xl font-semibold">Thêm hồ sơ</div>
              <Flex justify="end">
                <Button
                  className="mr-3"
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
                        {fileList.length > 0
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
      ) : (
        <ForbiddenPage />
      )}
    </>
  )
}

CreateUserPage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <CreateLayout
      breadcrumbList={[
        { title: "Hồ sơ giảng viên/cán bộ", href: "/quan-ly-ho-so" },
        { title: "Tạo mới" },
      ]}
    >
      {page}
    </CreateLayout>
  )
}
