import ForbiddenPage from "@components/commons/403"
import DefaultLayout from "@layouts/default-layout"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_HO_SO_PERMISSION, ROUTER_PATH } from "@workspace/router"
import { Col, Flex, Input, Row } from "antd"
import {
  Backpack,
  BadgeJapaneseYen,
  Blocks,
  BookMarked,
  BookMinus,
  BookOpen,
  BookOpenCheck,
  BookType,
  Boxes,
  Building,
  Building2,
  Calculator,
  ChartBarDecreasing,
  ChartBarStacked,
  Clock,
  Component,
  Contact,
  ContactRound,
  FileChartColumnIncreasing,
  FileImage,
  FileSliders,
  FileSpreadsheet,
  Gem,
  GitBranch,
  GraduationCap,
  HandCoins,
  HeartCrack,
  HeartPulse,
  Layers,
  LibraryBig,
  ListOrdered,
  Medal,
  Network,
  Presentation,
  School,
  Tangent,
  TypeOutline,
  User,
  UserCog,
  Users,
} from "lucide-react"
import { useRouter } from "next/router"
import { useMemo, useState } from "react"

type MenuItem = {
  id: string
  label: string
  icon: any
  path: string
  description: string
}
type ListDataType = {
  id: string
  label: string
  children: MenuItem[]
}

export default function DanhMucHoSo() {
  const { can, canSome } = useAbility()
  const router = useRouter()
  const [search, setSearch] = useState<string>("")
  const list = [
    {
      id: "trinh-do",
      label: "Trình độ",
      children: [
        {
          id: "educational-level",
          label: "Học vấn",
          icon: <GraduationCap style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_TRINH_DO_HOC_VAN,
          description: "Trình độ học vấn",
        },
        {
          id: "political-theory-level",
          label: "Lý luận chính trị",
          icon: <ChartBarDecreasing style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_TRINH_DO_LY_LUAN_CHINH_TRI,
          description: "Trình độ lý luận chính trị",
        },
        {
          id: "state-management-level",
          label: "Quản lý nhà nước",
          icon: <BookMarked style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_TRINH_DO_QUAN_LY_NHA_NUOC,
          description: "Trình độ quản lý nhà nước",
        },
        {
          id: "trinh-do-chuyen-mon-quan-ly",
          label: "Chuyên môn quản lý",
          icon: <BookMinus style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_CHI_HUY_QUAN_LY,
          description: "Trình độ chuyên môn quản lý",
        },
        {
          id: "trinh-do-chuyen-mon-ky-thuat",
          label: "Chuyên môn kỹ thuật",
          icon: <BookOpenCheck style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_CHUYEN_MON_KY_THUAT,
          description: "Trình độ chuyên môn kỹ thuật",
        },
        {
          id: "nganh-hoc",
          label: "Ngành học",
          icon: <ChartBarStacked style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_NGANH_HOC,
          description: "Quản lý ngành học",
        },
      ],
    },
    {
      id: "hoc-tap",
      label: "Học tập",
      children: [
        {
          id: "type-of-study",
          label: "Loại hình đi học tập",
          icon: <BookType style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_LOAI_HINH_DI_HOC_TAP,
          description: "Quản lý loại hình đi học tập",
        },
        {
          id: "study-status",
          label: "Tình trạng đi học tập",
          icon: <LibraryBig style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_TINH_TRANG_DI_HOC_TAP,
          description: "Quản lý tình trạng đi học tập",
        },
        {
          id: "coutries-sending-for-study",
          label: "Các nước cử đi học tập",
          icon: <School style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_CAC_NUOC_CU_DI_HOC_TAP,
          description: "Các nước cử đi học tập",
        },
        {
          id: "professional-title-of-lecturer",
          label: "Ngạch giảng viên",
          icon: <ContactRound style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_CHUC_DANH_CMNV_NGACH_GIANG_VIEN,
          description: "Quản lý chức danh CMNV ngạch giảng viên",
        },
        {
          id: "professional-title-of-researcher",
          label: "Ngạch nghiên cứu viên",
          icon: <Contact style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_CHUC_DANH_CMNV_NGACH_NGHIEN_CUU_VIEN,
          description: "Quản lý chức danh CMNV ngạch nghiên cứu viên",
        },
        {
          id: "professional-title-of-engineer",
          label: "Ngạch kỹ sư",
          icon: <UserCog style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_CHUC_DANH_CMNV_NGACH_KY_SU,
          description: "Quản lý chức danh CMNV ngạch kỹ sư",
        },
        {
          id: "universities",
          label: "Các trường đào tạo bậc đại học",
          icon: <Network style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_CAC_TRUONG_DAO_TAO_BAC_DAI_HOC,
          description: "Các trường đào tạo bậc đại học",
        },
        {
          id: "undergraduate-training-majors",
          label: "Chuyên ngành đào tạo bậc đại học",
          icon: <Boxes style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_CAC_CHUYEN_NGANH_DAO_TAO_BAC_DAI_HOC,
          description: "Các chuyên ngành đào tạo bậc đại học",
        },
      ],
    },
    {
      id: "xep-loai",
      label: "Xếp loại",
      children: [
        {
          id: "forms-of-government-commendation",
          label: "Khen thưởng của chính quyền",
          icon: <FileSpreadsheet style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_HINH_THUC_KHEN_THUONG_CUA_CHINH_QUYEN,
          description: "Quản lý hình thức khen thưởng của chính quyền",
        },
        {
          id: "forms-of-party-commendation",
          label: "Khen thưởng của Đảng",
          icon: <FileSliders style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_HINH_THUC_KHEN_THUONG_CUA_DANG,
          description: "Quản lý hình thức khen thưởng của Đảng",
        },
        {
          id: "cadre-evaluation",
          label: "Xếp loại đánh giá cán bộ",
          icon: <FileImage style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_XEP_LOAI_DANH_GIA_CAN_BO,
          description: "Quản lý xếp loại đánh giá cán bộ",
        },
        {
          id: "party-member-quality-evaluation",
          label: "Chất lượng đảng viên",
          icon: <FileChartColumnIncreasing style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_XEP_LOAI_DANH_GIA_CHAT_LUONG_DANG_VIEN,
          description: "Quản lý xếp loại đánh giá chất lượng đảng viên",
        },
      ],
    },
    {
      id: "ca-nhan",
      label: "Cá nhân",
      children: [
        {
          id: "national",
          label: "Quốc tịch",
          icon: <Backpack style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_QUOC_GIA,
          description: "Quản lý quốc tịch",
        },
        {
          id: "working-status",
          label: "Trạng thái làm việc",
          icon: <Backpack style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_TRANG_THAI_LAM_VIEC,
          description: "Quản lý trạng thái làm việc",
        },
        {
          id: "marital-status",
          label: "Tình trạng hôn nhân",
          icon: <Gem style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_TINH_TRANG_HON_NHAN,
          description: "Quản lý tình trạng hôn nhân",
        },
        {
          id: "relatie-type",
          label: "Quan hệ thân nhân",
          icon: <User style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_QUAN_HE_THAN_NHAN,
          description: "Quản lý quan hệ thân nhân",
        },
        {
          id: "type-of-work",
          label: "Loại hình công tác",
          icon: <TypeOutline style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_LOAI_HINH_CONG_TAC,
          description: "Loại hình công tác",
        },
        {
          id: "type-of-work-status",
          label: "Loại tình trạng công tác",
          icon: <BookOpen style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_LOAI_TINH_TRANG_CONG_TAC,
          description: "Loại tình trạng công tác",
        },
        {
          id: "work-status",
          label: "Tình Trạng Công Tác",
          icon: <BadgeJapaneseYen style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_TINH_TRANG_CONG_TAC,
          description: "Quản lý tình Trạng Công Tác",
        },
        {
          id: "to-chuc-xa-hoi",
          label: "Tổ chức xã hội",
          icon: <Building style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_TO_CHUC_XA_HOI,
          description: "Quản lý tổ chức xã hội",
        },
        {
          id: "ngach",
          label: "Ngạch",
          icon: <Tangent style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_NGACH,
          description: "Quản lý ngạch",
        },
        {
          id: "bac-luong",
          label: "Bậc lương",
          icon: <HandCoins style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_BAC_LUONG,
          description: "Quản lý bậc lương",
        },
      ],
    },
    {
      id: "suc-khoe",
      label: "Sức khỏe",
      children: [
        {
          id: "blood-group",
          label: "Nhóm máu",
          icon: <Component style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_NHOM_MAU,
          description: "Quản lý nhóm máu",
        },

        {
          id: "loai-suc-khoe",
          label: "Loại sức khỏe",
          icon: <HeartPulse style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_LOAI_SUC_KHOE,
          description: "Quản lý loại sức khỏe",
        },
        {
          id: "loai-thuong-tat",
          label: "Loại thương tật",
          icon: <HeartCrack style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_LOAI_THUONG_TAT,
          description: "Quản lý loại thương tật",
        },
      ],
    },
    {
      id: "dao-tao",
      label: "Đào tạo",
      children: [
        {
          id: "doi-tuong-dao-tao",
          label: "Đối tượng đào tạo",
          icon: <Users style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_DOI_TUONG_DAO_TAO,
          description: "Đối tượng đào tạo",
        },

        {
          id: "loai-hinh-dao-tao",
          label: "Loại hình đào tạo",
          icon: <Layers style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_LOAI_HINH_DAO_TAO,
          description: "Loại hình đào tạo",
        },
        {
          id: "bac-dao-tao",
          label: "Bậc đào tạo",
          icon: <ListOrdered style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_TRINH_DO_DAO_TAO,
          description: "Bậc đào tạo",
        },
        {
          id: "dia-diem-dao-tao",
          label: "Khu vực đào tạo",
          icon: <Building2 style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_DANH_MUC_PHONG_HOC,
          description: "Khu vực đào tạo",
        },

        {
          id: "danh-muc-nganh",
          label: "Danh mục ngành",
          icon: <BookOpen style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_DANH_MUC_NGANH,
          description: "Danh mục ngành",
        },
        {
          id: "chuyen-nganh",
          label: "Chuyên ngành",
          icon: <GitBranch style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_DANH_MUC_CHUYEN_NGANH,
          description: "Chuyên ngành",
        },

        {
          id: "Khối kiến thức CTĐT",
          label: "Khối kiến thức CTĐT",
          icon: <Blocks style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_DAO_TAO.CHUONG_TRINH_DAO_TAO_KHOI_KIEN_THUC_CTDT,
          description: "Khối kiến thức CTĐT",
        },

        {
          id: "Thời gian đào tạo",
          label: "Thời gian đào tạo",
          icon: <Clock style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_THOI_GIAN_DAO_TAO,
          description: "Thời gian đào tạo",
        },
        {
          id: "Hình thức huấn luyện",
          label: "Hình thức huấn luyện",
          icon: <Presentation style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_HINH_THUC_HUAN_LUYEN,
          description: "Hình thức huấn luyện",
        },

        {
          id: "Xếp loại học lực",
          label: "Xếp loại học lực",
          icon: <Medal style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_XEP_LOAI_HOC_LUC,
          description: "Xếp loại học lực",
        },
        {
          id: "Nội dung tính tải",
          label: "Nội dung tính tải",
          icon: <Calculator style={{ fontSize: "24px" }} />,
          path: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_NOI_DUNG_TINH_TAI,
          description: "Nội dung tính tải",
        },
      ],
    },
  ]
  function normalizeText(text: string): string {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // xoá dấu
      .toLowerCase()
      .trim()
  }

  function searchTree(tree: ListDataType[], keyword: string): any {
    if (!keyword) return tree
    const normalizedKeyword = normalizeText(keyword)

    function dfs(nodes: any): any {
      return nodes
        .map((node: any) => {
          const isMatch = normalizeText(node.label).includes(normalizedKeyword)
          const filteredChildren = node.children ? dfs(node.children) : []

          // Nếu node match hoặc có con match thì giữ lại
          if (isMatch || filteredChildren.length > 0) {
            return {
              ...node,
              children: filteredChildren,
            }
          }
          return null
        })
        .filter((n: any): n is any => n !== null)
    }

    return dfs(tree)
  }
  const HighlightText = ({ text, searchText }: { text: string; searchText?: string }) => {
    if (!searchText) return <div className="font-semibold truncate text-sm">{text}</div>

    const parts = text.split(new RegExp(`(${searchText})`, "gi"))

    return (
      <div className="font-semibold truncate text-sm">
        {parts.map((part) =>
          part.toLowerCase() === searchText.toLocaleLowerCase() ? (
            <span key={part} className="text-yellow-800 bg-yellow-300 font-semibold">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </div>
    )
  }

  const data = useMemo(() => {
    const result = searchTree(list, search)

    return result
  }, [search, list, searchTree])
  return (
    <>
      {can(QL_HO_SO_PERMISSION.QL_HO_SO_DANH_MUC_HO_SO, "XEM") ? (
        <div>
          <Col className="mb-6" xs={6} xl={4}>
            <div className="text-xl font-semibold mb-4 w-full min-w-[250px]">Tìm kiếm</div>
            <Input
              id="search"
              className="w-full min-w-[250px]"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm ..."
            />
          </Col>
          {data?.length > 0 ? (
            data.map((item: ListDataType) => {
              return (
                <div key={item?.id} className="mb-7">
                  <div className="flex items-center w-full">
                    {/* Khối màu xanh có text */}
                    <div className="bg-green-800 text-white font-bold text-sm px-4 py-1 relative">
                      <span>{item?.label}</span>
                      {/* Góc xiên bên phải */}
                      <div
                        className="absolute top-0 right-[-30px] w-0 h-0 
                        border-t-[28px] border-t-transparent 
                        border-l-[30px] border-l-green-800 
                        border-b-[00px] border-b-transparent"
                      >
                        {" "}
                      </div>
                    </div>
                    {/* Đường kẻ ngang */}
                    <div className="flex-1 border-b border-green-800 pb-[26px]"> </div>
                  </div>
                  <Row className="gap-y-4 mt-4" gutter={16}>
                    {item?.children?.length > 0 &&
                      item?.children.map((i: MenuItem) => {
                        return (
                          <Col key={i.id} xs={24} sm={24} md={12} lg={12} xl={8}>
                            <Flex
                              align="center"
                              className="h-[64px] border-[1px] border-solid px-4 py-3 rounded-lg cursor-pointer hover:!border-[#166534] hover:shadow-md"
                              onClick={() => {
                                if (
                                  canSome(
                                    QL_HO_SO_PERMISSION.QL_HO_SO_DANH_MUC_HO_SO,
                                    "THEM",
                                    "SUA",
                                    "XOA"
                                  )
                                ) {
                                  if (item?.id === "dao-tao") {
                                    window.open(`/lms${i.path}`, "_blank")
                                    return
                                  }
                                  router.push(i.path)
                                }
                              }}
                            >
                              <div>{i?.icon}</div>
                              <div className="ml-4">
                                <HighlightText text={i.label} searchText={search} />
                                {/* <p className="font-semibold truncate text-sm">
                                                                    {i.label}
                                                                </p> */}
                                <p className="text-xs">{i.description}</p>
                              </div>
                            </Flex>
                          </Col>
                        )
                      })}
                  </Row>
                </div>
              )
            })
          ) : (
            <div>Không tìm thấy danh mục</div>
          )}
        </div>
      ) : (
        <ForbiddenPage />
      )}
    </>
  )
}

DanhMucHoSo.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
