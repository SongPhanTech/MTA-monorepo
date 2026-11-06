import HtmlTruncate from "@components/commons/html-truncate"
import Table from "@components/commons/table"
import type { FilterProps } from "@components/commons/typeFilter"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import { buildOrgTree } from "@lib/utils"
import type {
  DM_DonVi,
  FixedClass,
  SubjectClass,
  TrainingCourse,
  TrainingField,
  TrainingMajor,
} from "@workspace/db"
import {
  useCountSurveyObjectType,
  useFindManyDM_DonVi,
  useFindManyFixedClass,
  useFindManySubjectClass,
  useFindManySurveyObjectType,
  useFindManyTrainingCourse,
  useFindManyTrainingField,
  useFindManyTrainingMajor,
  useUpdateSurveyObjectType,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { KHAO_THI_PERMISSION } from "@workspace/router"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Col, Flex, message, Row } from "antd"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { whereActiveOrganization } from "@workspace/libs/org-tree"

function TabDoiTuongKhaoSat() {
  const { can, canSome } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
    organization: undefined,
    trainingField: undefined,
    trainingMajors: undefined,
    trainingCourse: undefined,
    fixedClass: undefined,
    subjectClass: undefined,
  })

  const { data: manageOrgData = [] } = useFindManyDM_DonVi({
    where: whereActiveOrganization,
    orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
  })
  const treeData = buildOrgTree(manageOrgData)
  const { data: trainingFieldData = [] } = useFindManyTrainingField({
    where: {
      trainingObjectTypes: {
        some: {
          trainingObjectTypeId,
        },
      },
    },
    orderBy: { name: "asc" },
  })
  const { data: trainingMajorData = [] } = useFindManyTrainingMajor({
    where: {
      trainingObjectTypes: {
        some: {
          trainingObjectTypeId,
        },
      },
    },
    orderBy: { name: "asc" },
  })

  const { data: trainingCourses = [] } = useFindManyTrainingCourse({
    where: { trainingObjectTypeId },
    orderBy: {
      semesterStart: {
        startDate: "desc",
      },
    },
  })

  const { data: fixedClasses = [] } = useFindManyFixedClass({
    where: {
      trainingCourse: {
        trainingObjectTypeId,
      },
    },
    orderBy: { name: "asc" },
  })

  const { data: subjectClassData = [] } = useFindManySubjectClass({
    orderBy: { name: "asc" },
    where: {
      active: true,
      deletedAt: null,
      cancelled: false,
      status: "OFFICIAL",
      trainingObjectTypeId,
    },
  })

  const where = useMemo(
    () => ({
      trainingObjectTypeId,
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
            name: {
              contains: filters.name,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.organization
        ? {
            organizations: {
              some: {
                Id: {
                  in: filters.organization,
                },
              },
            },
          }
        : {}),
      ...(filters.trainingField
        ? {
            trainingFields: {
              some: {
                id: {
                  in: filters.trainingField,
                },
              },
            },
          }
        : {}),
      ...(filters.trainingMajors
        ? {
            trainingMajors: {
              some: {
                id: {
                  in: filters.trainingMajors,
                },
              },
            },
          }
        : {}),
      ...(filters.trainingCourse
        ? {
            trainingCourses: {
              some: {
                id: {
                  in: filters.trainingCourse,
                },
              },
            },
          }
        : {}),
      ...(filters.fixedClass
        ? {
            fixedClasses: {
              some: {
                id: {
                  in: filters.fixedClass,
                },
              },
            },
          }
        : {}),
      ...(filters.subjectClass
        ? {
            subjectClasses: {
              some: {
                id: {
                  in: filters.subjectClass,
                },
              },
            },
          }
        : {}),
    }),
    [filters, trainingObjectTypeId]
  )

  const { data = [], refetch } = useFindManySurveyObjectType({
    where,
    include: {
      organizations: true,
      trainingFields: true,
      trainingMajors: true,
      trainingCourses: true,
      fixedClasses: true,
      subjectClasses: true,
    },
    orderBy: { createdAt: "desc" },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: count } = useCountSurveyObjectType({ where: { ...where, deletedAt: null } })

  const { onOpen, onClose } = useDisclosure<string>({
    tag: "PutSurveyObjectTypeModal",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const handleModal = () => {
    onOpen()
  }
  const { mutateAsync: updateSurveyObjectType } = useUpdateSurveyObjectType()

  async function handleDelete(id: string) {
    try {
      showSpinner()
      await updateSurveyObjectType({
        where: {
          id,
        },
        data: {
          deletedAt: new Date(),
          code: `${id}-deleted`,
        },
      })
      refetch()
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
      <Row gutter={[16, 8]}>
        <Col span={24}>
          <Flex justify="end">
            {can(KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_THIET_LAP_CHUNG, "THEM") && (
              <Button onClick={handleModal} type="primary" size="small">
                Thêm mới
              </Button>
            )}
          </Flex>
        </Col>
        <Col span={24}>
          <Table
            className="h-[calc(100vh-230px)]"
            rowKey="id"
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
                title: "Mã ĐTKS",
                dataIndex: "code",
                type: "input",
                width: 150,
                fixed: "left",
              },
              {
                title: "Tên đối tượng làm KS",
                dataIndex: "name",
                type: "input",
                width: 250,
                fixed: "left",
              },

              {
                title: "Đơn vị",
                dataIndex: "organization",
                type: "tree_select",
                options: treeData,
                width: 100,
                render: (_, record) => {
                  return record?.organizations?.length ? (
                    <HtmlTruncate>
                      <ul>
                        {record?.organizations?.map((i: DM_DonVi) => (
                          <li key={i.Id}>- {i.sMa}</li>
                        ))}
                      </ul>
                    </HtmlTruncate>
                  ) : (
                    ""
                  )
                },
              },

              {
                title: "Ngành",
                dataIndex: "trainingField",
                type: "select",
                width: 150,
                options: trainingFieldData?.map(({ id, name }) => ({
                  value: id,
                  label: name,
                })),
                render: (_, record) => {
                  return record?.trainingFields?.length ? (
                    <HtmlTruncate>
                      <ul>
                        {record?.trainingFields?.map((i: TrainingField) => (
                          <li key={i.id}>- {i.name}</li>
                        ))}
                      </ul>
                    </HtmlTruncate>
                  ) : (
                    ""
                  )
                },
              },
              {
                title: "Chuyên ngành",
                dataIndex: "trainingMajors",
                type: "select",
                width: 150,
                options: trainingMajorData?.map(({ id, name }) => ({
                  value: id,
                  label: name,
                })),
                render: (_, record) => {
                  return record?.trainingMajors?.length ? (
                    <HtmlTruncate>
                      <ul>
                        {record?.trainingMajors?.map((i: TrainingMajor) => (
                          <li key={i.id}>- {i.name}</li>
                        ))}
                      </ul>
                    </HtmlTruncate>
                  ) : (
                    ""
                  )
                },
              },
              {
                title: "Khoá",
                dataIndex: "trainingCourse",
                type: "select",
                width: 150,
                options: trainingCourses?.map(({ id, name }) => ({
                  value: id,
                  label: name,
                })),
                render: (_, record) => {
                  return record?.trainingCourses?.length ? (
                    <HtmlTruncate>
                      <ul>
                        {record?.trainingCourses?.map((i: TrainingCourse) => (
                          <li key={i.id}>- {i.name}</li>
                        ))}
                      </ul>
                    </HtmlTruncate>
                  ) : (
                    ""
                  )
                },
              },
              {
                title: "Lớp quản lý",
                dataIndex: "fixedClass",
                type: "select",
                width: 150,
                options: fixedClasses?.map(({ id, name }) => ({
                  value: id,
                  label: name,
                })),
                render: (_, record) => {
                  return record?.fixedClasses?.length ? (
                    <HtmlTruncate>
                      <ul>
                        {record?.fixedClasses?.map((i: FixedClass) => (
                          <li key={i.id}>- {i.name}</li>
                        ))}
                      </ul>
                    </HtmlTruncate>
                  ) : (
                    ""
                  )
                },
              },
              {
                title: "Lớp MH",
                dataIndex: "subjectClass",
                type: "select",
                width: 100,
                options: subjectClassData?.map(({ id, name }) => ({
                  value: id,
                  label: name,
                })),
                render: (_, record) => {
                  return record?.subjectClasses?.length ? (
                    <HtmlTruncate>
                      <ul>
                        {record?.subjectClasses?.map((i: SubjectClass) => (
                          <li key={i.id}>- {i.code}</li>
                        ))}
                      </ul>
                    </HtmlTruncate>
                  ) : (
                    ""
                  )
                },
              },

              {
                title: "Thao tác",
                width: 100,
                align: "center",
                hidden: !canSome(
                  KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_THIET_LAP_CHUNG,
                  "SUA",
                  "XOA"
                ),
                render: (_, { id }) => (
                  <Row className="justify-center gap-2">
                    {can(
                      KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_THIET_LAP_CHUNG,
                      "SUA"
                    ) && (
                      <EditIcon
                        onClick={onOpen.bind(null, id)}
                        className="text-sm text-blue-700 cursor-pointer"
                      />
                    )}
                    {can(
                      KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_THIET_LAP_CHUNG,
                      "XOA"
                    ) && (
                      <DeleteIcon
                        popConfirm={{
                          onConfirm: () => handleDelete(id),
                        }}
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
            }}
          />
        </Col>
      </Row>
    </div>
  )
}

export default TabDoiTuongKhaoSat
