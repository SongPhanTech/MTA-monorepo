import { ExportOutlined, TableOutlined, UploadOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import ExportTemplateLecturer from "@components/modal/export-template-lecturer"
import ImportLecturerModal from "@components/modal/import-excel-lecturer"
import ModalChiTietGiangVien from "@components/modal/modal-chi-tiet-giang-vien"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import DefaultLayout from "@layouts/default-layout"
import { buildOrgFlat, buildOrgTree } from "@lib/utils"
import type { UserProfile } from "@workspace/db/client"
import {
  useCountLecturer,
  useFindManyDM_DonVi,
  useFindManyDM_HocHam,
  useFindManyDM_HocVi,
  useFindManyLecturer,
  useFindManyLecturerType,
} from "@workspace/db/hooks"
import { exportLecturerProfile } from "@workspace/libs/api/training"
import { whereOrganization } from "@workspace/libs/constants"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION, ROUTER_PATH } from "@workspace/router"
import { Button, Col, Row, Tooltip } from "antd"
import dayjs from "dayjs"
import { saveAs } from "file-saver"
import { InfoIcon } from "lucide-react"
import { useRouter } from "next/router"
import type React from "react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

dayjs.locale("vi")

export default function UserProfilePageLecture() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const { can, canSome } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [importModalVisible, setImportModalVisible] = useState(false)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const router = useRouter()
  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
    dateOfBirth: undefined,
    academicRankType: undefined,
    academicDegreeType: undefined,
    organization: undefined,
    gender: undefined,
    rankId: undefined,
    officerNumber: undefined,
    lecturerType: undefined,
    idCardNumber: undefined,
  })

  const canXemTatCa = can(
    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_HO_SO_DANH_SACH_GIANG_VIEN,
    "XEM_TAT_CA"
  )
  const orgId = window.contextData?.organizationId
  const { data: dmDonViIds = [] } = useFindManyDM_DonVi(
    {
      select: { Id: true },
      where: whereOrganization,
      orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
    },
    {
      refetchOnWindowFocus: false,
    }
  )

  const orgIds = useMemo(() => {
    return [
      ...buildOrgFlat(
        dmDonViIds.map((e) => ({
          Id: e.Id,
          sTen: null,
          sParentId: null,
          sMa: null,
        })),
        orgId || "0"
      ).map((org) => org.value),
      orgId,
    ]
  }, [orgId, dmDonViIds])

  const where = useMemo(
    () => ({
      deletedAt: null,
      ...(filters.code
        ? {
            code: {
              contains: filters.code,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.name
        ? {
            userProfile: {
              fullname: {
                contains: filters.name,
                mode: "insensitive" as const,
              },
            },
          }
        : {}),
      ...(filters.idCardNumber
        ? {
            userProfile: {
              idCardNumber: {
                contains: filters.idCardNumber,
                mode: "insensitive" as const,
              },
            },
          }
        : {}),
      ...(filters.gender
        ? {
            userProfile: {
              genderId: {
                in: filters.gender,
              },
            },
          }
        : {}),
      ...(filters.dateOfBirth?.length === 2
        ? {
            userProfile: {
              dateOfBirth: {
                gte: dayjs(filters.dateOfBirth?.[0], "DD/MM/YYYY").toDate(),
                lte: dayjs(filters.dateOfBirth?.[1], "DD/MM/YYYY").toDate(),
              },
            },
          }
        : {}),
      ...(filters.officerNumber
        ? {
            userProfile: {
              officerNumber: {
                contains: filters.officerNumber,
                mode: "insensitive" as const,
              },
            },
          }
        : {}),
      ...(filters.academicRankType
        ? {
            userProfile: {
              academicRankTypeId: {
                in: filters.academicRankType,
              },
            },
          }
        : {}),
      ...(filters.academicDegreeType
        ? {
            userProfile: {
              academicDegreeTypeId: {
                in: filters.academicDegreeType,
              },
            },
          }
        : {}),
      ...(filters.rankId
        ? {
            userProfile: {
              rankId: {
                in: filters.rankId,
              },
            },
          }
        : {}),
      ...(filters.lecturerType
        ? {
            lecturerTypeId: {
              in: filters.lecturerType,
            },
          }
        : {}),
      ...(filters.organization
        ? {
            organizationId: {
              in: filters.organization,
            },
          }
        : !canXemTatCa
          ? { organizationId: { in: orgIds } }
          : {}),
    }),
    [filters, canXemTatCa, orgIds]
  )

  const { data: lecturerData = [], refetch } = useFindManyLecturer({
    where,
    include: {
      userProfile: {
        include: {
          academicRankType: true,
          academicDegreeType: true,
          rank: true,
        },
      },
      organization: true,
      lecturerType: true,
      mainSubjectClasses: true,
      extraSubjectClasses: true,
      manageFixedClass: true,
    },
    orderBy: {
      userProfile: {
        firstName: "asc",
      },
    },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: count, refetch: refetchCount } = useCountLecturer({
    where: {
      ...where,
      organization: { bDeleted: false },
      deletedAt: null,
    },
  })

  const { data: academicRankTypes = [] } = useFindManyDM_HocHam()
  const { data: academicDegreeTypes = [] } = useFindManyDM_HocVi()
  const { data: lecturerTypeData = [] } = useFindManyLecturerType()
  const { data: manageOrgData = [] } = useFindManyDM_DonVi({
    where: whereOrganization,
    orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
  })
  const treeData = buildOrgTree(manageOrgData, canXemTatCa ? "0" : orgId || "0")
  const { onOpen: onOpenModalAdd } = useDisclosure({
    tag: "PutUserProfileLectureModal",
  })
  const { onOpen: onOpenModalChiTiet } = useDisclosure<string>({
    tag: "ModalChiTietGiangVien",
  })

  const handleModal = () => {
    onOpenModalAdd()
  }

  const handleExportLecturers = async () => {
    const { status, data } = await exportLecturerProfile({
      lecturerIds: selectedRowKeys as string[],
    })

    if (status === 200) {
      saveAs(data, "danh_sach_GV.xlsx")
    }
  }

  const handleRowClick = (record: { id?: string }) => {
    if (record?.id) {
      onOpenModalChiTiet(record.id)
    }
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Row gutter={[16, 16]} align="middle" justify="end" className="gap-1">
            {selectedRowKeys.length > 0 && <p>(Đang chọn {selectedRowKeys.length} GV)</p>}
            <Button type="primary" onClick={handleExportLecturers} icon={<TableOutlined />}>
              Xuất DS GV
            </Button>
            <Button
              type="primary"
              onClick={() => setImportModalVisible(true)}
              icon={<UploadOutlined />}
            >
              Nhập dữ liệu Excel
            </Button>
            <ImportLecturerModal
              visible={importModalVisible}
              onSuccess={() => {
                setImportModalVisible(false)
                refetch()
                refetchCount()
              }}
              onCancel={() => setImportModalVisible(false)}
            />
            <ExportTemplateLecturer />
            {/* <Button onClick={handleModal} type="primary">
                                    Thêm mới
                                </Button> */}
          </Row>
        </Col>
        <Col span={24}>
          <Table
            className="h-[calc(100vh-250px)]"
            rowSelection={{
              selectedRowKeys,
              preserveSelectedRowKeys: true,
              onChange: (keys) => {
                setSelectedRowKeys(keys)
              },
            }}
            filters={filters}
            setFilters={(value) => {
              setFilters(value)
              setCurrentPage(1)
            }}
            columns={[
              {
                title: "STT",
                width: 50,
                align: "center",
                fixed: "left",
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Mã giảng viên",
                dataIndex: "code",
                align: "center",
                width: 120,
                type: "input",
              },
              {
                title: "Họ và tên",
                align: "center",
                width: 180,
                fixed: "left",
                dataIndex: "name",
                type: "input",
                render: (__, record: { userProfile?: UserProfile }) =>
                  record.userProfile
                    ? `${record.userProfile.lastName} ${record.userProfile.firstName}`
                    : "",
              },
              {
                title: "Ngày sinh",
                render: (__, record) =>
                  record.userProfile?.dateOfBirth
                    ? dayjs(record.userProfile.dateOfBirth).format("DD/MM/YYYY")
                    : "",
                align: "center",
                width: 100,
                dataIndex: "dateOfBirth",
              },
              {
                title: "CCCD/CMND",
                render: (__, record) => record.userProfile?.idCardNumber,
                align: "center",
                width: 120,
                dataIndex: "idCardNumber",
                type: "input",
              },
              {
                title: "SĐT",
                render: (__, record) => record.userProfile?.phoneNumber,
                align: "center",
                width: 100,
                dataIndex: "phoneNumber",
              },
              {
                title: "Đơn vị",
                dataIndex: "organization",
                align: "center",
                width: 200,
                render: (_, record) => {
                  if (record.organization) {
                    return `${record.organization.sMa}-${record.organization.sTen}`
                  }
                },

                type: "tree_select",
                options: treeData,
              },
              {
                title: "Học hàm",
                dataIndex: "academicRankType",
                align: "center",
                width: 120,
                render: (_, record) => record.userProfile?.academicRankType?.sTen,
                type: "select",
                options: academicRankTypes.map((type) => ({
                  label: type.sTen,
                  value: type.Id,
                })),
              },
              {
                title: "Học vị",
                dataIndex: "academicDegreeType",
                align: "center",
                width: 120,
                render: (_, record) => record.userProfile?.academicDegreeType?.sTen,
                type: "select",
                options: academicDegreeTypes.map((type) => ({
                  label: type.sTen,
                  value: type.Id,
                })),
              },
              {
                title: "Loại GV",
                align: "center",
                options: lecturerTypeData.map((type) => ({
                  label: type.name,
                  value: type.id,
                })),
                dataIndex: "lecturerType",
                type: "select",
                width: 120,
                render: (__, record) => record?.lecturerType?.name || "",
              },

              // {
              //     title: 'Lớp giảng dạy',
              //     dataIndex: 'mainSubjectClasses',
              //     align: 'center',
              //     width: 200,
              //     render: (__, record: any) => {
              //         return record?.mainSubjectClasses.length ? (
              //             <TextTruncate
              //                 arr={record?.mainSubjectClasses.map((i: any) => {
              //                     return { key: i?.id, label: i?.name }
              //                 })}
              //                 key="mainSubjectClasses"
              //             />
              //         ) : (
              //             ''
              //         )
              //     },
              // },
              // {
              //     title: 'Lớp trợ giảng',
              //     dataIndex: 'extraSubjectClasses',
              //     align: 'center',
              //     width: 200,
              //     render: (__, record) => {
              //         return record?.extraSubjectClasses.length ? (
              //             <TextTruncate
              //                 arr={record?.extraSubjectClasses.map((i: any) => {
              //                     return { key: i?.id, label: i?.name }
              //                 })}
              //                 key="extraSubjectClasses"
              //             />
              //         ) : (
              //             ''
              //         )
              //     },
              // },
              // {
              //     title: 'Lớp được quản lý',
              //     dataIndex: 'manageFixedClass',
              //     align: 'center',
              //     width: 200,
              //     render: (__, record) => {
              //         return record?.manageFixedClass.length ? (
              //             <TextTruncate
              //                 arr={record?.manageFixedClass.map((i: any) => {
              //                     return { key: i?.id, label: i?.name }
              //                 })}
              //                 key="manageFixedClass"
              //             />
              //         ) : (
              //             ''
              //         )
              //     },
              // },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                fixed: "right",
                hidden: !canSome(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_HO_SO_DANH_SACH_GIANG_VIEN,
                  "XEM_CHI_TIET",
                  "SUA"
                ),
                render: (_, { id, userProfileId }) => {
                  if (id) {
                    return (
                      <Row className="justify-center gap-2">
                        {can(
                          QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_HO_SO_DANH_SACH_GIANG_VIEN,
                          "XEM_CHI_TIET"
                        ) && (
                          <Tooltip title="Xem chi tiết" placement="top">
                            <InfoIcon
                              onClick={() => handleRowClick({ id })}
                              size={16}
                              strokeWidth={1.5}
                              className="text-green-600 cursor-pointer"
                            />
                          </Tooltip>
                        )}
                        {can(
                          QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_HO_SO_DANH_SACH_GIANG_VIEN,
                          "SUA"
                        ) && (
                          <Tooltip title="Sửa" placement="top">
                            <Button
                              type="link"
                              target="_blank"
                              rel="noopener noreferrer"
                              href={`/hrm/${ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO}/${userProfileId}`}
                              className="text-green-600 border-none"
                            >
                              <ExportOutlined />
                            </Button>
                          </Tooltip>
                        )}
                      </Row>
                    )
                  }
                  return ""
                },
              },
            ]}
            data={lecturerData}
            rowKey="id"
            pagination={{
              current: currentPage,
              pageSize: numberOfPages,
              total: count,
              onChange: (page, pageSize) => {
                if (numberOfPages === pageSize) {
                  setCurrentPage(page)
                } else {
                  setCurrentPage(1)
                  setNumberOfPages(pageSize)
                }
              },
            }}
          />
        </Col>
      </Row>
      <ModalChiTietGiangVien />
    </div>
  )
}

UserProfilePageLecture.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
