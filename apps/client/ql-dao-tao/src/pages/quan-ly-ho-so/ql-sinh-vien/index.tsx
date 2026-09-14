import { DownloadOutlined, FileExcelOutlined, UploadOutlined } from "@ant-design/icons"
import Select from "@components/commons/select"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import ImportStudentModal from "@components/modal/import-excel-student"
import { DEFAULT_PAGINATE_SIZE, FIXED_CLASS_STUDENT_STATUS } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import type {
  FixedClass,
  Prisma,
  TrainingCourse,
  TrainingField,
  TrainingMajor,
  UserProfile,
} from "@workspace/db/client"
import {
  useCountStudent,
  useFindManyCurriculumVersion,
  useFindManyFixedClass,
  useFindManyStudent,
  useFindManyTrainingCourse,
  useFindManyTrainingField,
  useFindManyTrainingMajor,
  useDeleteStudent,
  useDeleteUserProfile,
} from "@workspace/db/hooks"
import {
  downloadStudentImportTemplate,
  useExportStudentProfiles,
} from "@workspace/libs/api/training"
import { formatPlaceOfBirth } from "@workspace/libs/utils"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION, ROUTER_PATH } from "@workspace/router"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Col, Flex, message, Row, Tag, Tooltip } from "antd"
import dayjs from "dayjs"
import { saveAs } from "file-saver"
import { BookCheckIcon, InfoIcon } from "lucide-react"
import { useRouter } from "next/router"
import { useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

dayjs.locale("vi")
export default function UserProfilePageDs() {
  const router = useRouter()
  const { can } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [sortDescriptor, setSortDescriptor] = useState<any>(null)
  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
    dateOfBirth: undefined,
    trainingField: undefined,
    gender: undefined,
    fixedClass: undefined,
    trainingCourse: undefined,
    trainingMajors: undefined,
    curriculumVersion: undefined,
    trainingCourseId: undefined,
    fixedClassId: undefined,
    rank: undefined,
    phone: undefined,
    curriculumVersionParallel: undefined,
  })

  const handleFiltersChange = (value: FilterProps) => {
    setFilters(value)
    setCurrentPage(1)
  }

  const [importModalVisible, setImportModalVisible] = useState(false)
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { mutateAsync: exportStudentProfiles } = useExportStudentProfiles()

  const handleDownloadTemplate = async () => {
    if (!trainingObjectTypeId) {
      message.error("Vui lòng chọn đối tượng đào tạo")
      return
    }
    try {
      showSpinner()
      const res = await downloadStudentImportTemplate({
        trainingObjectTypeId,
      })
      if (res.status === 200) {
        saveAs(res.data, "MauImportDSHV_v5.xlsx")
      } else {
        message.error(res.data.message || "Đã xảy ra lỗi, vui lòng kiểm tra lại")
      }
    } catch {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }
  const handleExportStudentProfiles = async () => {
    if (!filters.trainingCourseId) {
      message.error("Vui lòng chọn khoá học")
      return
    }
    try {
      showSpinner()
      const res = await exportStudentProfiles({
        data: { trainingCourseId: filters.trainingCourseId },
      })

      if (res.status === 200) {
        saveAs(res.data, "DANH_SACH_SV.xlsx")
      } else {
        message.error(res.data.message)
      }
    } catch (error) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const where: Prisma.StudentWhereInput = useMemo(() => {
    const and: Prisma.StudentWhereInput[] = []

    if (filters.code) {
      and.push({
        code: {
          contains: filters.code,
          mode: "insensitive",
        },
      })
    }

    const userProfile: Prisma.UserProfileWhereInput = {
      ...(filters.name
        ? {
            fullname: {
              contains: filters.name,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.idCardNumber
        ? {
            idCardNumber: {
              contains: filters.idCardNumber,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.rank
        ? {
            rank: {
              sTen: {
                contains: filters.rank,
                mode: "insensitive",
              },
            },
          }
        : {}),
      ...(filters.phone
        ? {
            phoneNumber: {
              contains: filters.phone,
              mode: "insensitive",
            },
          }
        : {}),
    }
    if (Object.keys(userProfile).length > 0) {
      and.push({ userProfile })
    }

    if (filters.curriculumVersion?.length) {
      and.push({ curriculumVersionId: { in: filters.curriculumVersion } })
    }
    if (filters.curriculumVersionParallel?.length) {
      and.push({ curriculumVersionParallelId: { in: filters.curriculumVersionParallel } })
    }
    if (filters.statusStudent?.length) {
      and.push({ status: { in: filters.statusStudent } })
    }

    const selectedClassIds = filters.fixedClassId
      ? [filters.fixedClassId]
      : filters.fixedClass?.length
        ? filters.fixedClass
        : undefined
    const selectedCourseIds = filters.trainingCourseId
      ? [filters.trainingCourseId]
      : filters.trainingCourse?.length
        ? filters.trainingCourse
        : undefined

    if (selectedClassIds) {
      and.push({ fixedClassId: { in: selectedClassIds } })
    } else if (selectedCourseIds) {
      and.push({
        OR: [
          { fixedClass: { trainingCourseId: { in: selectedCourseIds } } },
          {
            fixedClassId: null,
            curriculumVersion: { trainingCourseId: { in: selectedCourseIds } },
          },
        ],
      })
    } else {
      and.push({
        OR: [
          {
            fixedClass: {
              trainingCourse: {
                trainingObjectTypeId,
              },
            },
          },
          {
            fixedClassId: null,
            OR: [
              { curriculumVersion: { trainingObjectTypeId } },
              { curriculumVersion: { curriculum: { trainingObjectTypeId } } },
              { curriculumVersionId: null },
            ],
          },
        ],
      })
    }

    if (filters.trainingMajors?.length || filters.trainingField?.length) {
      const trainingMajor = {
        ...(filters.trainingMajors?.length ? { id: { in: filters.trainingMajors } } : {}),
        ...(filters.trainingField?.length
          ? { trainingFieldId: { in: filters.trainingField } }
          : {}),
      }
      and.push({
        OR: [
          {
            fixedClass: {
              curriculumVersion: {
                curriculum: { trainingMajor },
              },
            },
          },
          {
            curriculumVersion: {
              curriculum: { trainingMajor },
            },
          },
        ],
      })
    }

    return and.length > 0 ? { AND: and } : {}
  }, [filters, trainingObjectTypeId])

  const {
    data = [],
    isLoading: isLoadingStudents,
    isFetching: isFetchingStudents,
    refetch,
  } = useFindManyStudent({
    where,
    include: {
      userProfile: {
        include: { rank: true, provinceOfBirth: true, newProvinceOfBirth: true },
      },
      fixedClass: {
        include: {
          trainingCourse: {
            include: {
              trainingObjectType: true,
              scoreConverts: true,
            },
          },
          curriculumVersion: {
            include: {
              curriculum: {
                include: {
                  trainingField: true,
                  trainingMajor: {
                    include: {
                      trainingField: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      curriculumVersion: {
        include: {
          trainingLevel: true,
          curriculum: {
            include: {
              trainingMajor: {
                include: {
                  trainingField: true,
                },
              },
            },
          },
        },
      },
      curriculumVersionParallel: true,
      thesisRegistrations: {
        where: { deletedAt: null },
        include: {
          thesisProject: {
            include: {
              primarySupervisor: {
                include: {
                  userProfile: {
                    include: {
                      academicRankType: true,
                      academicDegreeType: true,
                    },
                  },
                },
              },
              secondarySupervisor: {
                include: {
                  userProfile: {
                    include: {
                      academicRankType: true,
                      academicDegreeType: true,
                    },
                  },
                },
              },
              supervisor: {
                include: {
                  academicRankType: true,
                  academicDegreeType: true,
                  expert: {
                    include: {
                      lecturer: {
                        include: {
                          userProfile: {
                            include: {
                              academicRankType: true,
                              academicDegreeType: true,
                            },
                          },
                          organization: true,
                        },
                      },
                    },
                  },
                },
              },
              coSupervisor: {
                include: {
                  academicRankType: true,
                  academicDegreeType: true,
                  expert: {
                    include: {
                      lecturer: {
                        include: {
                          userProfile: {
                            include: {
                              academicRankType: true,
                              academicDegreeType: true,
                            },
                          },
                          organization: true,
                        },
                      },
                    },
                  },
                },
              },
              thirdSupervisor: {
                include: {
                  academicRankType: true,
                  academicDegreeType: true,
                  expert: {
                    include: {
                      lecturer: {
                        include: {
                          userProfile: {
                            include: {
                              academicRankType: true,
                              academicDegreeType: true,
                            },
                          },
                          organization: true,
                        },
                      },
                    },
                  },
                },
              },
              thesisSession: true,
              defenseSession: true,
              room: true,
              council: {
                include: {
                  members: {
                    include: {
                    expertProfileVersion: {
                      include: {
                        academicRankType: true,
                        academicDegreeType: true,
                        expert: {
                          include: {
                            lecturer: {
                              include: {
                                userProfile: {
                                  include: {
                                    academicRankType: true,
                                    academicDegreeType: true,
                                  },
                                },
                                organization: true,
                              },
                            },
                          },
                        },
                      },
                    },
                      expert: {
                        include: {
                        lecturer: {
                          include: {
                            userProfile: true,
                          },
                        },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          council: {
            include: {
              members: {
                include: {
                expertProfileVersion: {
                  include: {
                    academicRankType: true,
                    academicDegreeType: true,
                    expert: {
                      include: {
                        lecturer: {
                          include: {
                            userProfile: {
                              include: {
                                academicRankType: true,
                                academicDegreeType: true,
                              },
                            },
                            organization: true,
                          },
                        },
                      },
                    },
                  },
                },
                  expert: {
                    include: {
                    lecturer: {
                      include: {
                        userProfile: true,
                      },
                    },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      _count: {
        select: {
          subjectClassStudent: true,
          studentSemesterResult: true,
          studentYearResult: true,
        },
      },
    },
    orderBy: [
      ...(sortDescriptor ? [sortDescriptor] : []),
      {
        fixedClass: {
          trainingCourse: {
            semesterStart: { startDate: "desc" },
          },
        },
      },
      {
        curriculumVersion: {
          curriculum: {
            trainingMajor: {
              name: "asc",
            },
          },
        },
      },
      { userProfile: { firstName: "asc" } },
      { userProfile: { lastName: "asc" } },
    ],
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: count, refetch: refetchCount } = useCountStudent({
    where: {
      ...where,
      deletedAt: null,
    },
  })

  const { data: TrainingCourseData = [] } = useFindManyTrainingCourse({
    include: {
      fixedClass: true,
    },
    orderBy: {
      semesterStart: {
        startDate: "desc",
      },
    },
    where: { trainingObjectTypeId, deletedAt: null, active: true },
  })

  const { data: fixedClassData = [] } = useFindManyFixedClass({
    where: {
      trainingCourse: {
        trainingObjectTypeId,
        deletedAt: null,
        active: true,
      },
    },
    include: {
      trainingCourse: true,
    },
  })
  const filteredFixedClassData = filters.trainingCourseId
    ? fixedClassData.filter((c: FixedClass) => c.trainingCourseId === filters.trainingCourseId)
    : fixedClassData

  const fixedClassMap = useMemo(() => {
    return new Map(fixedClassData.map((c) => [c.id, c]))
  }, [fixedClassData])

  const handleFixedClassChange = (val?: string) => {
    if (!val) {
      handleFiltersChange({
        ...filters,
        fixedClassId: undefined,
      })
      return
    }

    const selectedClass = fixedClassMap.get(val)

    handleFiltersChange({
      ...filters,
      fixedClassId: val,
      trainingCourseId: filters.trainingCourseId ?? selectedClass?.trainingCourseId,
    })
  }

  const { data: trainingFieldData = [] } = useFindManyTrainingField({
    where: { trainingObjectTypes: { some: { trainingObjectTypeId } } },
    orderBy: { name: "asc" },
  })

  const { data: trainingMajorData = [] } = useFindManyTrainingMajor({
    where: { trainingObjectTypes: { some: { trainingObjectTypeId } } },
    orderBy: { name: "asc" },
  })

  const { data: TrainingCurriculumVersionData = [] } = useFindManyCurriculumVersion({
    where: { trainingObjectTypeId },
    orderBy: { name: "asc" },
  })

  const { onOpen } = useDisclosure<{
    tag?: string
    preSelectedValues?: {
      trainingObjectTypeId?: string
      trainingCourseId?: string
      fixedClassId?: string
    }
    id?: string | null
  }>({
    tag: "PutStudentModal",
  })

  const { onOpen: onOpenUpdate } = useDisclosure<{
    tag?: string
    id: string | null
  }>({
    tag: "PutStudentModal",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const handleModal = () => {
    onOpen({
      preSelectedValues: {},
    })
  }
  const { mutateAsync: deleteStudent } = useDeleteStudent()
  const { mutateAsync: deleteUserProfile } = useDeleteUserProfile()

  async function handleDelete(record: any) {
    const id = record.id
    const userProfileId = record.userProfileId
    const hasScores =
      (record._count?.subjectClassStudent || 0) > 0 ||
      (record._count?.studentSemesterResult || 0) > 0 ||
      (record._count?.studentYearResult || 0) > 0

    if (hasScores) {
      message.error("Sinh viên đã có điểm hoặc kết quả học tập, không thể xóa!")
      return
    }

    try {
      showSpinner()
      await deleteStudent({ where: { id } })
      await deleteUserProfile({ where: { id: userProfileId } })
      message.success("Xóa thành công")
    } catch (error) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }
  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Row gutter={[16, 16]} align="top" justify="end">
            <Col span={12}>
              <Flex>
                <Col span={12}>
                  <Select
                    className="w-full"
                    placeholder="Chọn khoá học"
                    value={filters.trainingCourseId}
                    options={TrainingCourseData.map((i: TrainingCourse) => ({
                      value: i.id,
                      label: i.name,
                    }))}
                    onChange={(val) =>
                      handleFiltersChange({
                        ...filters,
                        trainingCourseId: val,
                        fixedClassId: undefined,
                      })
                    }
                    allowClear
                  />
                </Col>

                <Col span={12}>
                  <Select
                    className="w-full"
                    placeholder="Chọn lớp quản lý"
                    options={filteredFixedClassData.map((i) => ({
                      value: i.id,
                      label: i.name,
                    }))}
                    value={filters.fixedClassId}
                    onChange={handleFixedClassChange}
                    allowClear
                  />
                </Col>
              </Flex>
            </Col>
            <Col xs={12}>
              <Flex justify="end" wrap="wrap" gap="8px">
                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_HO_SO_QL_SINH_VIEN, "NHAP_EXCEL") && (
                  <>
                    <Button
                      className="px-4 py-1"
                      onClick={() => handleDownloadTemplate()}
                      type="primary"
                    >
                      <DownloadOutlined />
                      Xuất file mẫu excel
                    </Button>
                    <Button
                      type="primary"
                      onClick={() => setImportModalVisible(true)}
                      icon={<UploadOutlined />}
                    >
                      Nhập dữ liêu Excel
                    </Button>
                    <ImportStudentModal
                      visible={importModalVisible}
                      onCancel={() => {
                        setImportModalVisible(false)
                        refetch()
                        refetchCount()
                      }}
                    />

                    <Button
                      className="px-4 py-1"
                      onClick={handleExportStudentProfiles}
                      type="primary"
                    >
                      <FileExcelOutlined />
                      Xuất DS sinh viên
                    </Button>
                  </>
                )}
                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_HO_SO_QL_SINH_VIEN, "THEM") && (
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
            className="h-[calc(100vh-250px)]"
            loading={isFetchingStudents || isLoadingStudents}
            filters={filters}
            setFilters={handleFiltersChange}
            onChange={(_, __, sorter: any) => {
              if (sorter.order) {
                const order = sorter.order === "ascend" ? "asc" : "desc"
                if (sorter.field === "code") {
                  setSortDescriptor({ code: order })
                } else if (sorter.field === "trainingField") {
                  setSortDescriptor({
                    fixedClass: {
                      curriculumVersion: {
                        curriculum: {
                          trainingMajor: {
                            trainingField: {
                              name: order,
                            },
                          },
                        },
                      },
                    },
                  })
                }
              } else {
                setSortDescriptor(null)
              }
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
                title: "Mã sinh viên",
                dataIndex: "code",
                width: 130,
                align: "center",
                fixed: "left",
                type: "input",
                sorter: true,
                render: (__, record: any) => (record.code ? record?.code : ""),
              },
              {
                title: "Họ và tên",
                align: "center",
                width: 180,
                fixed: "left",
                dataIndex: "name",
                type: "input",
                render: (__, record: { userProfile?: UserProfile }) =>
                  record.userProfile?.fullname
                    ? record.userProfile.fullname
                    : `${record.userProfile?.lastName} ${record.userProfile?.firstName}`,
              },
              {
                title: "Ngày sinh",
                align: "center",
                width: 120,
                render: (__, record) =>
                  record.userProfile?.dateOfBirth
                    ? dayjs(record.userProfile.dateOfBirth).format("DD/MM/YYYY")
                    : "",
              },
              {
                title: "Nơi sinh",
                align: "center",
                width: 150,
                render: (__, record) => formatPlaceOfBirth(record.userProfile),
              },
              {
                title: "CCCD",
                align: "center",
                width: 100,
                dataIndex: "idCardNumber",
                type: "input",
                render: (__, record: { userProfile?: UserProfile }) =>
                  record.userProfile?.idCardNumber,
              },
              // {
              //     title: 'ĐTĐT',
              //     align: 'center',
              //     width: 150,
              //     // type: 'select',
              //     dataIndex: 'trainingObjectTypes',
              //     // options: trainingObjectTypeData.map((item: TrainingObjectType) => ({
              //     //     label: item.name,
              //     //     value: item.id,
              //     // })),
              //     render: (__, record: any) =>
              //         record?.trainingObjectType
              //             ? record?.trainingObjectType?.name
              //             : '',
              // },
              {
                title: "Khoá",
                align: "center",
                width: 100,
                dataIndex: "trainingCourse",
                type: "select",
                options: TrainingCourseData.map((item: TrainingCourse) => ({
                  label: item.name,
                  value: item.id,
                })),
                render: (__, record: any) => {
                  const trainingCourse = record?.fixedClass?.trainingCourse
                  return trainingCourse ? trainingCourse?.name : ""
                },
              },
              {
                title: "Lớp",
                align: "center",
                width: 120,
                dataIndex: "fixedClass",
                type: "select",
                options: fixedClassData.map((item: FixedClass) => ({
                  label: item.name,
                  value: item.id,
                })),
                render: (__, record: any) => {
                  if (!record.fixedClass) return ""
                  return (
                    <Tooltip title={record.fixedClass?.name}>{record.fixedClass?.code}</Tooltip>
                  )
                },
              },
              {
                title: "Ngành",
                align: "center",
                width: 160,
                dataIndex: "trainingField",
                type: "select",
                sorter: true,
                options: trainingFieldData.map((item: TrainingField) => ({
                  label: item.name,
                  value: item.id,
                })),
                render: (__, record: any) => {
                  return (
                    record?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.trainingField
                      ?.name ||
                    record?.fixedClass?.curriculumVersion?.curriculum?.trainingField?.name
                  )
                },
              },
              {
                title: "Chuyên ngành",
                align: "center",
                width: 180,
                type: "select",
                dataIndex: "trainingMajors",
                options: trainingMajorData.map((item: TrainingMajor) => ({
                  label: item.name,
                  value: item.id,
                })),
                render: (__, record: any) => {
                  return record?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name
                },
              },
              {
                title: <Tooltip title="Chương trình đào tạo">CTĐT</Tooltip>,
                align: "center",
                dataIndex: "curriculumVersion",
                width: 180,
                type: "select",
                options: TrainingCurriculumVersionData.map((item) => ({
                  label: item.name,
                  value: item.id,
                })),
                render: (__, record) => {
                  const curriculum =
                    record.curriculumVersion || record.fixedClass?.curriculumVersion
                  return curriculum ? curriculum.name : ""
                },
              },
              {
                title: "CTĐT song song",
                align: "center",
                dataIndex: "curriculumVersionParallel",
                width: 150,
                type: "select",
                options: TrainingCurriculumVersionData.map((item) => ({
                  label: item.name,
                  value: item.id,
                })),
                render: (__, record) => {
                  return record?.curriculumVersionParallel?.name || ""
                },
              },
              {
                title: "Cấp bậc",
                align: "center",
                width: 120,
                dataIndex: "rank",
                type: "input",
                render: (__, record) =>
                  record.userProfile?.rank?.sTen ? record.userProfile?.rank?.sTen : "",
              },
              {
                title: "Trạng thái",
                dataIndex: "statusStudent",
                type: "select",
                options: Object.entries(FIXED_CLASS_STUDENT_STATUS).map(([value, info]) => ({
                  label: <Tag color={info.color}>{info.label}</Tag>,
                  value: value,
                })),
                align: "center",
                width: 120,
                render: (_, record) => {
                  const statusInfo =
                    FIXED_CLASS_STUDENT_STATUS[
                      record.status as keyof typeof FIXED_CLASS_STUDENT_STATUS
                    ]
                  return statusInfo ? (
                    <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
                  ) : (
                    <Tag color="default">Không xác định</Tag>
                  )
                },
              },
              {
                title: "Thao tác",
                width: 130,
                align: "center",
                fixed: "right",
                render: (_, record) => (
                  <Row className="justify-center gap-2">
                    <Tooltip title="Xem chi tiết" placement="top">
                      <InfoIcon
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(
                            ROUTER_PATH.QL_DAO_TAO.QUAN_LY_HO_SO_QL_SINH_VIEN_ID.replace(
                              "[id]",
                              record.id
                            )
                          )
                        }}
                        size={16}
                        className="text-green-600 cursor-pointer"
                      />
                    </Tooltip>
                    <Tooltip title="Kết quả học tập" placement="top">
                      <BookCheckIcon
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(
                            ROUTER_PATH.QL_DAO_TAO.DANH_MUC_LOP_BIEN_CHE_KET_QUA_HOC_TAP_ID.replace(
                              "[id]",
                              record.id
                            )
                          )
                        }}
                        size={16}
                        className="cursor-pointer"
                      />
                    </Tooltip>
                    {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_HO_SO_QL_SINH_VIEN, "SUA") && (
                      <EditIcon
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpenUpdate({ id: record.id })
                        }}
                        className="text-sm text-blue-700 cursor-pointer"
                      />
                    )}
                    {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_HO_SO_QL_SINH_VIEN, "XOA") && (
                      <DeleteIcon
                        popConfirm={{
                          onConfirm: () => handleDelete(record),
                        }}
                      />
                    )}
                  </Row>
                ),
              },
            ]}
            rowKey="id"
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

UserProfilePageDs.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
