import { CheckOutlined, DownloadOutlined } from "@ant-design/icons"
import Select from "@components/commons/select"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import { buildOrgTree } from "@lib/utils"
import { useSession } from "@workspace/auth/react"
import { emptyObjectIf } from "@workspace/constant"
import {
  useCountFixedClass,
  useFindManyCurriculumVersion,
  useFindManyDM_DonVi,
  useFindManyFixedClass,
  useFindManyTrainingCourse,
  useFindManyTrainingLevel,
  useFindManyTrainingMajor,
  useUpdateFixedClass,
} from "@workspace/db/hooks"
import { fixedClassStudentCount } from "@workspace/libs/api/training"
import { whereActiveOrganization } from "@workspace/libs/org-tree"
import { getFilenameFromContentDisposition } from "@workspace/libs/utils"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION, ROUTER_PATH } from "@workspace/router"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Col, Flex, message, Row, Tooltip } from "antd"
import { Eye, Info } from "lucide-react"
import { useRouter } from "next/router"
import type React from "react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useFixedClassTypeOptions } from "@hooks/fixedClassType"
export default function FixedClassPage() {
  const { can, canSome } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [_searchText, _setSearchText] = useState<string>("")
  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
    managementOrganization: undefined,
    trainingCourses: undefined,
    curriculumVersion: undefined,
    trainingMajors: undefined,
    trainingLevel: undefined,
    startYear: undefined,
    trainingCourseId: undefined,
  })
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const [loading, setLoading] = useState(false)
  const { getFixedClassTypeLabel } = useFixedClassTypeOptions()
  const canReadAll = can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_LOP_BIEN_CHE, "XEM_TAT_CA")

  const { data: session } = useSession()
  const profileId = session?.sDM_NhanVienId || ""
  const router = useRouter()

  const where = useMemo(() => {
    const curriculumVersionFilter = {
      ...(filters.trainingMajors
        ? { curriculum: { trainingMajorId: { in: filters.trainingMajors } } }
        : {}),
      ...(filters.trainingLevel ? { trainingLevelId: { in: filters.trainingLevel } } : {}),
    }
    return {
      deletedAt: null,
      ...(filters.code && filters.code !== ""
        ? { code: { contains: filters.code, mode: "insensitive" as const } }
        : {}),
      ...(filters.name && filters.name !== ""
        ? { name: { contains: filters.name, mode: "insensitive" as const } }
        : {}),
      ...(filters.managementOrganization
        ? { managementOrganizationId: { in: filters.managementOrganization } }
        : {}),
      ...(filters.curriculumVersion
        ? { curriculumVersionId: { in: filters.curriculumVersion } }
        : {}),
      ...(Object.keys(curriculumVersionFilter).length > 0 && {
        curriculumVersion: curriculumVersionFilter,
      }),
      trainingCourse: {
        trainingObjectTypeId,
        ...(filters.trainingCourseId
          ? { id: filters.trainingCourseId }
          : filters.trainingCourses?.length
            ? { id: { in: filters.trainingCourses } }
            : {}),
      },
      active: true,
      ...(!canReadAll
        ? {
            OR: [
              { lecturerManagement: { userProfileId: profileId } },
              { staffManagement: { userProfileId: profileId } },
            ],
          }
        : {}),
    }
  }, [filters, trainingObjectTypeId, profileId, canReadAll])

  const { data = [] } = useFindManyFixedClass({
    where,
    include: {
      _count: {
        select: {
          students: {
            where: { deletedAt: null },
          },
        },
      },
      lecturerManagement: {
        include: {
          userProfile: true,
        },
      },
      managementOrganization: true,
      trainingCourse: {
        include: {
          trainingObjectType: true,
        },
      },
      curriculumVersion: {
        include: {
          curriculum: {
            include: {
              trainingMajor: true,
            },
          },
          trainingLevel: true,
        },
      },
    },
    orderBy: [
      ...emptyObjectIf([{ startYear: filters.startYear }], !!filters.startYear),
      { name: "asc" },
    ],
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
    where: { trainingObjectTypeId, deletedAt: null, active: true },
    orderBy: {
      semesterStart: {
        startDate: "desc",
      },
    },
  })
  const { data: curriculumVersionData = [] } = useFindManyCurriculumVersion({
    where: { trainingObjectTypeId, deletedAt: null, active: true },
    orderBy: { name: "asc" },
  })

  const { data: trainingMajorData = [] } = useFindManyTrainingMajor({
    where: {
      trainingObjectTypes: { some: { trainingObjectType: { id: trainingObjectTypeId } } },
      deletedAt: null,
      active: true,
    },
    orderBy: { name: "asc" },
  })

  const { data: trainingLevelData = [] } = useFindManyTrainingLevel({
    orderBy: { name: "asc" },
  })

  const { data: count } = useCountFixedClass({ where: { ...where, deletedAt: null } })

  const { data: manageOrgData = [] } = useFindManyDM_DonVi({
    where: whereActiveOrganization,
    orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
  })
  const treeData = buildOrgTree(manageOrgData)

  const { onOpen } = useDisclosure<string>({
    tag: "PutFixedClassModal",
  })

  const { onOpen: onOpenChuyenLop } = useDisclosure({
    tag: "ModalChuyenLop",
  })

  const { onOpen: onOpenChiTietLopBienChe } = useDisclosure<{
    fixedClassId: string
  }>({
    tag: "ModalChiTietLopBienChe",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const handleModal = () => {
    onOpen()
  }

  const handleModalChuyenLop = () => {
    onOpenChuyenLop()
  }

  const downloadStatsFile = async () => {
    if (!trainingObjectTypeId) {
      message.error("Vui lòng chọn ĐTĐT")
      return
    }

    const trainingCourseId = filters.trainingCourseId || filters.trainingCourses?.[0]
    if (!trainingCourseId) {
      message.error("Vui lòng chọn một khoá đào tạo")
      return
    }
    try {
      setLoading(true)
      // TODO: cho chọn ngày hoặc lấy ngày từ HK đang chọn
      const { status, headers, data } = await fixedClassStudentCount({
        trainingObjectTypeId,
        trainingCourseId,
      })
      if (status === 200) {
        const filename = getFilenameFromContentDisposition(
          headers.get("content-disposition") as string
        )
        const blob = new Blob([data], {
          type: headers.get("content-type") as string,
        })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = filename || "QS theo khoá.xlsx"
        link.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error(error)
      message.error("Lỗi khi tải file")
    } finally {
      setLoading(false)
    }
  }

  const { mutateAsync: updateFixedClass } = useUpdateFixedClass()
  async function handleDelete(id: string) {
    try {
      showSpinner()
      await updateFixedClass({
        where: {
          id,
        },
        data: {
          deletedAt: new Date(),
          curriculumVersionId: null,
        },
      })
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

  return (
    <div>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <Row gutter={[16, 16]} align="top" justify={"end"}>
            <Col span={12}>
              <Flex>
                <Col span={8}>
                  <Select
                    className="w-full"
                    placeholder="Chọn khoá học"
                    value={filters.trainingCourseId}
                    options={trainingCourseData.map((i) => ({
                      value: i.id,
                      label: i.name,
                    }))}
                    onChange={(trainingCourseId) =>
                      setFilters((prev) => ({
                        ...prev,
                        trainingCourseId,
                      }))
                    }
                    allowClear
                  />
                </Col>
              </Flex>
            </Col>
            <Col span={12}>
              <Flex justify="end">
                <Tooltip title="Quân số theo khoá">
                  <Button
                    className="mr-3"
                    type="primary"
                    onClick={downloadStatsFile}
                    loading={loading}
                  >
                    <DownloadOutlined />
                    QS theo khoá
                  </Button>
                </Tooltip>
                <Button className="mr-3" type="primary" onClick={handleModalChuyenLop}>
                  Chuyển lớp
                </Button>
                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_LOP_BIEN_CHE, "THEM") && (
                  <Button onClick={handleModal} type="primary">
                    Thêm mới
                  </Button>
                )}
              </Flex>
            </Col>
          </Row>
        </Col>
        <Col span={24}>
          <Table
            rowKey="id"
            id="fixed-class"
            filters={filters}
            setFilters={(value) => {
              setFilters(value)
              setCurrentPage(1)
            }}
            onRowClick={(record) => {
              if (can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_LOP_BIEN_CHE, "XEM_CHI_TIET")) {
                router.push(
                  ROUTER_PATH.QL_DAO_TAO.DANH_MUC_LOP_BIEN_CHE_ID.replace("[id]", String(record.id))
                )
              }
            }}
            columns={[
              {
                title: "STT",
                width: 45,
                align: "center",
                fixed: "left",
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Mã lớp",
                align: "center",
                width: 100,
                fixed: "left",
                dataIndex: "code",
                type: "input",
              },
              {
                title: "Tên lớp",
                align: "center",
                width: 200,
                fixed: "left",
                dataIndex: "name",
                type: "input",
              },
              {
                title: "Sĩ số",
                align: "center",
                width: 60,
                render: (_, record) => record._count.students,
              },
              {
                title: "Loại lớp",
                align: "center",
                width: 150,
                dataIndex: "classType",
                type: "input",
                render: (_, record) => getFixedClassTypeLabel(record.classType),
              },
              {
                title: "Đơn vị quản lý",
                dataIndex: "managementOrganization",
                align: "center",
                width: 200,
                type: "tree_select",
                options: treeData,
                render: (value) => (value?.sTen ? value?.sTen : ""),
              },
              {
                title: "Chuyên ngành",
                align: "center",
                width: 200,
                type: "select",
                options: trainingMajorData.map((item) => ({
                  label: item.name,
                  value: item.id,
                })),
                dataIndex: "trainingMajors",
                render: (_, record) =>
                  record?.curriculumVersion?.curriculum?.trainingMajor?.name || "",
              },
              {
                title: "Khoá",
                dataIndex: "trainingCourses",
                align: "center",
                width: 120,
                type: "select",
                options: trainingCourseData.map((item) => ({
                  label: item.name,
                  value: item.id,
                })),
                render: (_, record) =>
                  record.trainingCourse?.name ? record.trainingCourse?.name : "",
              },
              {
                title: "Đối tượng đào tạo",
                align: "center",
                dataIndex: "trainingObjectTypes",
                width: 180,
                render: (__, record) => record?.trainingCourse?.trainingObjectType?.name || "",
              },

              {
                title: "Bậc đào tạo",
                align: "center",
                width: 120,
                type: "select",
                options: trainingLevelData.map((item) => ({
                  label: item.name,
                  value: item.id,
                })),
                dataIndex: "trainingLevel",
                render: (__, record) => record?.curriculumVersion?.trainingLevel?.name || "",
              },
              {
                title: "Chương trình đào tạo",
                dataIndex: "curriculumVersion",
                align: "center",
                width: 250,
                type: "select",
                options: curriculumVersionData.map((item) => ({
                  label: item.name,
                  value: item.id,
                })),
                render: (value) => (value?.name ? value?.name : ""),
              },

              {
                title: "Đã tốt nghiệp",
                align: "center",
                width: 150,
                dataIndex: "graduated",
                type: "select",
                options: [
                  { value: true, label: "Đã tốt nghiệp" },
                  { value: false, label: "Chưa tốt nghiệp" },
                ],
                render: (value) => (value ? <CheckOutlined className="text-[#028850]" /> : ""),
              },
              {
                title: "Giảng viên chủ nhiệm",
                dataIndex: "lecturerManagement",
                align: "center",
                width: 180,
                type: "input",
                render: (value) =>
                  value?.userProfile?.fullname ? value?.userProfile?.fullname : "",
              },
              {
                title: "Cán bộ quản lý",
                dataIndex: "staffManagement",
                align: "center",
                width: 180,
                type: "input",
                render: (value) =>
                  value?.userProfile?.fullname ? value?.userProfile?.fullname : "",
              },
              // {
              //     title: 'Năm bắt đầu',
              //     dataIndex: 'startYear',
              //     width: 150,
              //     type: 'order',
              //     align: 'center',
              // },
              // {
              //     title: 'Trạng thái',
              //     align: 'center',
              //     fixed: 'right',
              //     width: 130,
              //     render: (value, record) => {
              //         return !record?.active ? (
              //             <Tag color="error">Không hoạt động</Tag>
              //         ) : (
              //             <Tag color="success">Đang hoạt động</Tag>
              //         )
              //     },
              // },
              {
                title: "Thao tác",
                width: 150,
                fixed: "right",
                align: "center",
                hidden: !canSome(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_LOP_BIEN_CHE,
                  "XEM_CHI_TIET",
                  "SUA",
                  "XOA"
                ),
                render: (_, { id }) => (
                  <Row className="justify-center gap-2">
                    {can(
                      QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_LOP_BIEN_CHE,
                      "XEM_CHI_TIET"
                    ) && (
                      <>
                        <Tooltip title="Xem chi tiết lớp" placement="top">
                          <Info
                            size={16}
                            strokeWidth={1.5}
                            className="text-base cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              onOpenChiTietLopBienChe({
                                fixedClassId: id,
                              })
                            }}
                          />
                        </Tooltip>
                        <Tooltip title="Xem danh sách học viên" placement="top">
                          <Eye
                            size={16}
                            strokeWidth={1.5}
                            className="text-base cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(
                                ROUTER_PATH.QL_DAO_TAO.DANH_MUC_LOP_BIEN_CHE_ID.replace(
                                  "[id]",
                                  String(id)
                                )
                              )
                            }}
                          />
                        </Tooltip>
                      </>
                    )}
                    {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_LOP_BIEN_CHE, "SUA") && (
                      <EditIcon
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpen(id)
                        }}
                        className="text-sm text-blue-700 cursor-pointer"
                      />
                    )}
                    {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_LOP_BIEN_CHE, "XOA") && (
                      <DeleteIcon
                        popConfirm={{
                          onConfirm: (e) => {
                            handleDelete(id)
                            e?.stopPropagation()
                          },
                          onCancel: (e) => {
                            e?.stopPropagation()
                          },
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </Row>
                ),
              },
            ]}
            data={data}
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
              showTotal: (total, range) =>
                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
            }}
          />
        </Col>
      </Row>
    </div>
  )
}

FixedClassPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
