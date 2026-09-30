import { ExportOutlined, TableOutlined, UploadOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import ExportTemplateGuestLecturer from "@components/modal/export-template-guest-lecturer"
import ExportTemplateLecturer from "@components/modal/export-template-lecturer"
import ImportGuestLecturerModal from "@components/modal/import-excel-guest-lecturer"
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
import useSpinner from "@hooks/spinner"
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
  const { showSpinner, hideSpinner } = useSpinner()
  const [selection, setSelection] = useState<{
    isSelectAll: boolean
    selectedIds: React.Key[]
    excludedIds: React.Key[]
  }>({
    isSelectAll: false,
    selectedIds: [],
    excludedIds: [],
  })
  const { can, canSome } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [importModalVisible, setImportModalVisible] = useState(false)
  const [guestImportModalVisible, setGuestImportModalVisible] = useState(false)
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

  const where = useMemo(() => {
    const userProfile: Record<string, unknown> = {}
    if (filters.name) {
      userProfile.fullname = { contains: filters.name, mode: "insensitive" as const }
    }
    if (filters.idCardNumber) {
      userProfile.idCardNumber = { contains: filters.idCardNumber, mode: "insensitive" as const }
    }
    if (filters.gender) {
      userProfile.genderId = { in: filters.gender }
    }
    if (filters.dateOfBirth?.length === 2) {
      userProfile.dateOfBirth = {
        gte: dayjs(filters.dateOfBirth[0], "DD/MM/YYYY").toDate(),
        lte: dayjs(filters.dateOfBirth[1], "DD/MM/YYYY").toDate(),
      }
    }
    if (filters.officerNumber) {
      userProfile.officerNumber = { contains: filters.officerNumber, mode: "insensitive" as const }
    }
    if (filters.academicRankType) {
      userProfile.academicRankTypeId = { in: filters.academicRankType }
    }
    if (filters.academicDegreeType) {
      userProfile.academicDegreeTypeId = { in: filters.academicDegreeType }
    }
    if (filters.rankId) {
      userProfile.rankId = { in: filters.rankId }
    }
    if (filters.organization) {
      userProfile.sDM_DonViId = { in: filters.organization }
    } else if (!canXemTatCa) {
      userProfile.sDM_DonViId = { in: orgIds }
    }
    if (filters.code) {
      userProfile.code = { contains: filters.code, mode: "insensitive" as const }
    }

    return {
      deletedAt: null,
      active: true,
      ...(filters.lecturerType
        ? {
            lecturerTypeId: {
              in: filters.lecturerType,
            },
          }
        : {}),
      ...(Object.keys(userProfile).length ? { userProfile } : {}),
    }
  }, [filters, canXemTatCa, orgIds])

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
    showSpinner()
    try {
      const { status, data } = await exportLecturerProfile({
        isSelectAll: selection.isSelectAll,
        lecturerIds: selection.selectedIds as string[],
        excludedIds: selection.excludedIds as string[],
        filters: {
          code: filters.code,
          name: filters.name,
          dateOfBirth: filters.dateOfBirth?.map((d) => dayjs(d).format("DD/MM/YYYY")),
          academicRankType: filters.academicRankType,
          academicDegreeType: filters.academicDegreeType,
          organization: filters.organization || (!canXemTatCa ? (orgIds as string[]) : undefined),
          gender: filters.gender,
          rankId: filters.rankId,
          officerNumber: filters.officerNumber,
          lecturerType: filters.lecturerType,
          idCardNumber: filters.idCardNumber,
        },
      })

      if (status === 200) {
        saveAs(data, "danh_sach_GV.xlsx")
      }
    } finally {
      hideSpinner()
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
            {(selection.isSelectAll || selection.selectedIds.length > 0) && (
              <p>
                (Đang chọn{" "}
                {selection.isSelectAll
                  ? (count || 0) - selection.excludedIds.length
                  : selection.selectedIds.length}{" "}
                GV)
              </p>
            )}
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
            <Button
              type="primary"
              onClick={() => setGuestImportModalVisible(true)}
              icon={<UploadOutlined />}
            >
              Nhập GV mời giảng
            </Button>
            <ImportGuestLecturerModal
              visible={guestImportModalVisible}
              onSuccess={() => {
                setGuestImportModalVisible(false)
                refetch()
                refetchCount()
              }}
              onCancel={() => setGuestImportModalVisible(false)}
            />
            <ExportTemplateLecturer />
            <ExportTemplateGuestLecturer />
          </Row>
        </Col>
        <Col span={24}>
          <Table
            className="h-[calc(100vh-250px)]"
            rowSelection={{
              selectedRowKeys: selection.isSelectAll
                ? (lecturerData
                    .map((item) => item.id)
                    .filter(
                      (id) => !selection.excludedIds.includes(id as React.Key)
                    ) as React.Key[])
                : selection.selectedIds,
              onSelect: (record, selected) => {
                if (selection.isSelectAll) {
                  if (!selected) {
                    setSelection((prev) => ({
                      ...prev,
                      excludedIds: [...prev.excludedIds, record.id as React.Key],
                    }))
                  } else {
                    setSelection((prev) => ({
                      ...prev,
                      excludedIds: prev.excludedIds.filter((id) => id !== record.id),
                    }))
                  }
                } else {
                  if (selected) {
                    setSelection((prev) => ({
                      ...prev,
                      selectedIds: [...prev.selectedIds, record.id as React.Key],
                    }))
                  } else {
                    setSelection((prev) => ({
                      ...prev,
                      selectedIds: prev.selectedIds.filter((id) => id !== record.id),
                    }))
                  }
                }
              },
              onSelectAll: (selected) => {
                setSelection({
                  isSelectAll: selected,
                  selectedIds: [],
                  excludedIds: [],
                })
              },
            }}
            filters={filters}
            setFilters={(value) => {
              setFilters(value)
              setCurrentPage(1)
              setSelection({
                isSelectAll: false,
                selectedIds: [],
                excludedIds: [],
              })
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
                title: "Mã định danh",
                dataIndex: "code",
                align: "center",
                width: 120,
                type: "input",
                render: (__, record: { userProfile?: { code?: string | null } }) =>
                  record.userProfile?.code || "",
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
                  const orgId = record.userProfile?.sDM_DonViId
                  const org = orgId ? manageOrgData.find((item) => item.Id === orgId) : undefined
                  if (org) {
                    return `${org.sMa || ""}-${org.sTen || ""}`
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
                              href={`/hrm${ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO}/${userProfileId}`}
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
