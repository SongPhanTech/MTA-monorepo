import TableCollapse from "@components/commons/tableCollapse"
import type { FilterProps } from "@constants/type"
import { useExamTypeOptions } from "@hooks/examType"
import DefaultLayout from "@layouts/default-layout"
import { PagePermissionGate } from "@components/commons/page-permission-gate"
import { CONG_SINH_VIEN_PERMISSION } from "@workspace/router"
import { buildOrgTree } from "@lib/utils"
import { useSession } from "@workspace/auth/react"
import { emptyObjectIf } from "@workspace/constant"
import type { Prisma, SubjectVersion } from "@workspace/db/client"
import { $Enums } from "@workspace/db/client"
import {
  useFindManyDM_DonVi,
  useFindManyTrainingBlockOnCurriculumVersion,
  useFindUniqueCurriculumVersion,
  useFindUniqueUserProfile,
} from "@workspace/db/hooks"
import { whereOrganization } from "@workspace/libs/constants"
import { cn } from "@workspace/ui/lib/utils"
import { Col, Divider, Row, Tooltip } from "antd"
import type React from "react"
import { Fragment, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function TrainingProgramSubjects() {
  const [filters, setFilters] = useState<FilterProps>({
    organization: undefined,
    code: "",
    name: "",
    trainingMajors: undefined,
    semester: undefined,
    examType: undefined,
  })

  const { data: me } = useSession()
  const userId = me?.sDM_NhanVienId || ""

  const { data: userProfile } = useFindUniqueUserProfile(
    {
      where: { id: userId },
      select: {
        educationAndTraining: {
          select: {
            curriculumVersionId: true,
          },
        },
      },
    },
    {
      enabled: !!userId,
    }
  )
  const id = userProfile?.educationAndTraining?.[0]?.curriculumVersionId ?? ""

  const { data: initialValue } = useFindUniqueCurriculumVersion(
    {
      where: { id },
      include: {
        curriculum: {
          include: {
            managementOrganization: true,
            trainingMajor: true,
          },
        },
        trainingBlocks: {
          include: {
            subjects: {
              include: {
                subject: {
                  include: {
                    subjectClass: {
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
        trainingTime: true,
        documentFiles: true,
      },
    },
    { enabled: !!id }
  )
  const { options, getExamTypeLabel } = useExamTypeOptions()

  const isFiltering = useMemo(() => {
    return Object.values(filters).some((value) => !!value)
  }, [filters])

  const where: Prisma.TrainingBlockOnCurriculumVersionWhereInput = useMemo(
    () =>
      isFiltering
        ? {
            subjects: {
              some: {
                subject: {
                  ...(filters.name
                    ? {
                        name: {
                          contains: filters.name,
                          mode: "insensitive",
                        },
                      }
                    : {}),
                  ...(filters.code
                    ? {
                        code: {
                          contains: filters.code,
                          mode: "insensitive",
                        },
                      }
                    : {}),
                  ...emptyObjectIf(
                    {
                      managementOrganizationId: {
                        in: filters.organization,
                      },
                    },
                    !!filters.organization
                  ),
                  ...emptyObjectIf(
                    {
                      examType: {
                        in: filters.examType,
                      },
                    },
                    !!filters.examType
                  ),
                },
              },
            },
          }
        : {},
    [filters, isFiltering]
  )

  const { data = [] } = useFindManyTrainingBlockOnCurriculumVersion({
    where: {
      curriculumVersionId: id,
      curriculumVersion: {
        deletedAt: null,
      },
      ...where,
    },
    include: {
      subjects: {
        where: {
          subject: {
            ...(filters.name
              ? {
                  name: {
                    contains: filters.name,
                    mode: "insensitive",
                  },
                }
              : {}),
            ...(filters.code
              ? {
                  code: {
                    contains: filters.code,
                    mode: "insensitive",
                  },
                }
              : {}),
            ...emptyObjectIf(
              {
                managementOrganizationId: {
                  in: filters.organization,
                },
              },
              !!filters.organization
            ),
            ...emptyObjectIf(
              {
                examType: {
                  in: filters.examType,
                },
              },
              !!filters.examType
            ),
            ...(filters.creditCmp
              ? {
                  credit: {
                    ...(filters.creditCmp.gte
                      ? {
                          gte: Number(filters.creditCmp.gte),
                        }
                      : {}),
                    ...(filters.creditCmp.lte
                      ? {
                          lte: Number(filters.creditCmp.lte),
                        }
                      : {}),
                  },
                }
              : {}),
            ...(filters.periodCmp
              ? {
                  period: {
                    ...(filters.periodCmp.gte
                      ? {
                          gte: Number(filters.periodCmp.gte),
                        }
                      : {}),
                    ...(filters.periodCmp.lte
                      ? {
                          lte: Number(filters.periodCmp.lte),
                        }
                      : {}),
                  },
                }
              : {}),
            ...(filters.numberOfTheoryCmp
              ? {
                  numberOfTheory: {
                    ...(filters.numberOfTheoryCmp.gte
                      ? {
                          gte: Number(filters.numberOfTheoryCmp.gte),
                        }
                      : {}),
                    ...(filters.numberOfTheoryCmp.lte
                      ? {
                          lte: Number(filters.numberOfTheoryCmp.lte),
                        }
                      : {}),
                  },
                }
              : {}),
            ...(filters.numberOfPracticalCmp
              ? {
                  numberOfPractical: {
                    ...(filters.numberOfPracticalCmp.gte
                      ? {
                          gte: Number(filters.numberOfPracticalCmp.gte),
                        }
                      : {}),
                    ...(filters.numberOfPracticalCmp.lte
                      ? {
                          lte: Number(filters.numberOfPracticalCmp.lte),
                        }
                      : {}),
                  },
                }
              : {}),
            ...(filters.numberOfSelfStudyCmp
              ? {
                  numberOfSelfStudy: {
                    ...(filters.numberOfSelfStudyCmp.gte
                      ? {
                          gte: Number(filters.numberOfSelfStudyCmp.gte),
                        }
                      : {}),
                    ...(filters.numberOfSelfStudyCmp.lte
                      ? {
                          lte: Number(filters.numberOfSelfStudyCmp.lte),
                        }
                      : {}),
                  },
                }
              : {}),
            ...(filters.numberOfPracticeCmp
              ? {
                  numberOfPractice: {
                    ...(filters.numberOfPracticeCmp.gte
                      ? {
                          gte: Number(filters.numberOfPracticeCmp.gte),
                        }
                      : {}),
                    ...(filters.numberOfPracticeCmp.lte
                      ? {
                          lte: Number(filters.numberOfPracticeCmp.lte),
                        }
                      : {}),
                  },
                }
              : {}),
            ...(filters.numberOfReviewCmp
              ? {
                  numberOfReview: {
                    ...(filters.numberOfReviewCmp.gte
                      ? {
                          gte: Number(filters.numberOfReviewCmp.gte),
                        }
                      : {}),
                    ...(filters.numberOfReviewCmp.lte
                      ? {
                          lte: Number(filters.numberOfReviewCmp.lte),
                        }
                      : {}),
                  },
                }
              : {}),
            ...(filters.numberOfExamCmp
              ? {
                  numberOfExam: {
                    ...(filters.numberOfExamCmp.gte
                      ? {
                          gte: Number(filters.numberOfExamCmp.gte),
                        }
                      : {}),
                    ...(filters.numberOfExamCmp.lte
                      ? {
                          lte: Number(filters.numberOfExamCmp.lte),
                        }
                      : {}),
                  },
                }
              : {}),
          },
          ...(filters.semesterCmp
            ? {
                semester: {
                  ...(filters.semesterCmp.gte
                    ? {
                        gte: Number(filters.semesterCmp.gte),
                      }
                    : {}),
                  ...(filters.semesterCmp.lte
                    ? {
                        lte: Number(filters.semesterCmp.lte),
                      }
                    : {}),
                },
              }
            : {}),
        },
        include: {
          subject: {
            include: {
              managementOrganization: {
                include: {
                  trainingMajors: true,
                },
              },
              subject: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      },
      trainingBlock: true,
    },
    orderBy: {
      priority: "asc",
    },
  })

  const { data: manageOrgData = [] } = useFindManyDM_DonVi({
    where: whereOrganization,
    orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
  })

  const { onOpen: openChiTietMonHoc } = useDisclosure<{
    subjectVersionId?: string
  }>({
    tag: "ModalChiTietMonHoc",
  })
  const treeData = buildOrgTree(manageOrgData)

  return (
    <div className="animate-page-enter">
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-slate-50/80 flex items-center justify-between">
              <span className="font-semibold uppercase tracking-wide text-sm text-[#004725] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#028850] animate-pulse-glow" />
                CTĐT toàn khoá:{" "}
                {[initialValue?.code, initialValue?.name].filter(Boolean).join(" - ")}
              </span>
            </div>
            <div className="p-4">
              <TableCollapse
                header={
                  <div className="flex gap-2">
                    <p className="flex gap-2 items-center">
                      <p className="w-4 h-4 bg-white border border-black" /> Môn bắt buộc
                    </p>
                    <p className="flex gap-2 items-center">
                      <p className="w-4 h-4 bg-yellow-200" /> Môn tự chọn
                    </p>
                    <p className="flex gap-2 items-center">
                      <p className="w-4 h-4 bg-orange-300" /> Môn điều kiện
                    </p>
                  </div>
                }
                scrollable
                maxHeight={"calc(100vh - 250px)"}
                rowKey="key"
                headerTitleKey={({ trainingBlock }) =>
                  `${[trainingBlock?.name].filter(Boolean).join(" - ")}`
                }
                onRow={(record) => {
                  const isParent = Array.isArray(record?.subjects)
                  if (isParent) {
                    return {}
                  }
                  const subject = record as unknown as Prisma.TrainingBlockSubjectGetPayload<{
                    include: {
                      subject: {
                        include: {
                          managementOrganization: {
                            include: {
                              trainingMajors: true
                            }
                          }
                          subject: {
                            select: {
                              id: true
                            }
                          }
                        }
                      }
                    }
                  }>
                  return {
                    className: cn(
                      subject.type === $Enums.SubjectRequirementType.Mandatory && "bg-white",
                      subject.type === $Enums.SubjectRequirementType.Optional && "bg-yellow-100",
                      !subject.useForFinalScore && "bg-orange-300"
                    ),
                    onClick: () => {
                      openChiTietMonHoc({
                        subjectVersionId: subject?.subjectId,
                      })
                    },
                  }
                }}
                headerColumn={[
                  {
                    colSpan: 1,
                  },
                  {
                    render: (_, record) => (
                      <p className="font-bold">{record?.trainingBlock?.name}</p>
                    ),
                    colSpan: 2,
                  },
                  {
                    render: (_, record) => (
                      <p className="text-center font-bold">{record?.electiveCreditsRequired}</p>
                    ),
                    colSpan: 1,
                  },
                  {
                    colSpan: 1,
                  },
                  {
                    render: (_, record) => (
                      <p className="text-center font-bold">
                        {record.subjects.reduce((sum, s) => sum + s.subject.credit, 0)}
                      </p>
                    ),
                    colSpan: 1,
                  },
                  {
                    colSpan: 1,
                  },
                  {
                    colSpan: 1,
                  },
                  {
                    render: (_, record) => (
                      <p className="font-bold">
                        {record.subjects.reduce((sum, s) => sum + (s.subject?.period ?? 0), 0)}
                      </p>
                    ),
                    colSpan: 1,
                  },
                  {
                    render: (_, record) => (
                      <p className="font-bold">
                        {record.subjects.reduce(
                          (sum, s) => sum + (s.subject?.numberOfTheory ?? 0),
                          0
                        )}
                      </p>
                    ),
                    colSpan: 1,
                  },
                  {
                    render: (_, record) => (
                      <p className="font-bold">
                        {record.subjects.reduce(
                          (sum, s) => sum + (s.subject.numberOfPractical ?? 0),
                          0
                        )}
                      </p>
                    ),
                    colSpan: 1,
                  },
                  {
                    render: (_, record) => (
                      <p className="font-bold">
                        {record.subjects.reduce(
                          (sum, s) => sum + (s.subject.numberOfSelfStudy ?? 0),
                          0
                        )}
                      </p>
                    ),
                    colSpan: 1,
                  },
                  {
                    render: (_, record) => (
                      <p className="font-bold">
                        {record.subjects.reduce(
                          (sum, s) => sum + (s.subject.numberOfPractice ?? 0),
                          0
                        )}
                      </p>
                    ),
                    colSpan: 1,
                  },
                  {
                    render: (_, record) => (
                      <p className="font-bold">
                        {record.subjects.reduce(
                          (sum, s) => sum + (s.subject.numberOfReview ?? 0),
                          0
                        )}
                      </p>
                    ),
                    colSpan: 1,
                  },
                  {
                    render: (_, record) => (
                      <p className="font-bold">
                        {record.subjects.reduce((sum, s) => sum + (s.subject.numberOfExam ?? 0), 0)}
                      </p>
                    ),
                    colSpan: 1,
                  },
                  {
                    colSpan: 1,
                  },
                ]}
                childrenFieldName="subjects"
                defaultExpandAll
                filters={filters}
                setFilters={setFilters}
                columns={[
                  {
                    title: "Mã MH",
                    dataIndex: "code",
                    width: 120,
                    align: "center",
                    type: "input",
                    render: (__, record: { subject?: SubjectVersion }) => {
                      return record?.subject?.code ? record?.subject?.code : ""
                    },
                  },
                  {
                    title: "Tên môn học",
                    dataIndex: "name",
                    type: "input",
                    width: 250,
                    render: (__, record: { subject?: SubjectVersion }) => {
                      return record?.subject?.name
                    },
                  },
                  {
                    title: (
                      <Tooltip title="Số tín chỉ tự chọn">
                        <span>Số tín chỉ (Tự chọn)</span>
                      </Tooltip>
                    ),
                    width: 80,
                    align: "center",
                  },
                  {
                    title: (
                      <Tooltip title="Đơn vị phụ trách">
                        <span>ĐVPT</span>
                      </Tooltip>
                    ),
                    dataIndex: "organization",
                    width: 100,
                    align: "center",
                    type: "tree_select",
                    options: treeData,
                    render: (_, record) => {
                      return record?.subject?.managementOrganization?.sMa
                    },
                  },
                  {
                    title: "Số TC",
                    dataIndex: "creditCmp",
                    width: 80,
                    type: "cmp",
                    align: "center",
                    distinctFilters: [
                      "semester",
                      "period",
                      "numberOfTheory",
                      "numberOfPractical",
                      "numberOfSelfStudy",
                      "numberOfPractice",
                      "numberOfReview",
                      "numberOfExam",
                      "numberOfOther",
                    ],
                    render: (__, record: { subject?: SubjectVersion }) => {
                      return record?.subject?.credit
                    },
                  },
                  {
                    title: (
                      <Tooltip title="Học kỳ dự kiến">
                        <span>HKDK</span>
                      </Tooltip>
                    ),
                    dataIndex: "semesterCmp",
                    width: 80,
                    type: "cmp",
                    align: "center",
                    render: (__, record) => record?.semester,
                  },
                  {
                    title: (
                      <Tooltip title="Học kỳ giảng dạy">
                        <span>HKGD</span>
                      </Tooltip>
                    ),
                    width: 80,
                    type: "cmp",
                    align: "center",
                  },
                  {
                    title: "Số tiết TKB",
                    width: 120,
                    align: "center",
                    type: "cmp",
                    distinctFilters: [
                      "credit",
                      "semester",
                      "numberOfTheory",
                      "numberOfPractical",
                      "numberOfSelfStudy",
                      "numberOfPractice",
                      "numberOfReview",
                      "numberOfExam",
                      "numberOfOther",
                    ],
                    render: (__, record: { subject?: SubjectVersion }) => {
                      return record?.subject?.period
                    },
                  },
                  {
                    title: "LT",
                    width: 80,
                    type: "cmp",
                    align: "center",
                    distinctFilters: [
                      "credit",
                      "semester",
                      "period",
                      "numberOfPractical",
                      "numberOfSelfStudy",
                      "numberOfPractice",
                      "numberOfReview",
                      "numberOfExam",
                      "numberOfOther",
                    ],
                    render: (__, record: { subject?: SubjectVersion }) => {
                      return record?.subject?.numberOfTheory
                    },
                  },
                  {
                    title: "BT",
                    type: "cmp",
                    width: 80,
                    align: "center",
                    distinctFilters: [
                      "credit",
                      "semester",
                      "period",
                      "numberOfTheory",
                      "numberOfSelfStudy",
                      "numberOfPractice",
                      "numberOfReview",
                      "numberOfExam",
                      "numberOfOther",
                    ],
                    render: (__, record: { subject?: SubjectVersion }) => {
                      return record?.subject?.numberOfPractical
                    },
                  },
                  {
                    title: "ThL",
                    width: 80,
                    align: "center",
                    type: "cmp",
                    distinctFilters: [
                      "credit",
                      "semester",
                      "period",
                      "numberOfTheory",
                      "numberOfPractical",
                      "numberOfPractice",
                      "numberOfReview",
                      "numberOfExam",
                      "numberOfOther",
                    ],
                    render: (__, record: { subject?: SubjectVersion }) => {
                      return record?.subject?.numberOfSelfStudy
                    },
                  },
                  {
                    title: "TN, TH",
                    width: 90,
                    align: "center",
                    type: "cmp",
                    distinctFilters: [
                      "credit",
                      "semester",
                      "period",
                      "numberOfTheory",
                      "numberOfPractical",
                      "numberOfSelfStudy",
                      "numberOfReview",
                      "numberOfExam",
                      "numberOfOther",
                    ],
                    render: (__, record: { subject?: SubjectVersion }) => {
                      return record?.subject?.numberOfPractice
                    },
                  },
                  {
                    title: "Ôn",
                    width: 60,
                    align: "center",
                    type: "cmp",
                    distinctFilters: [
                      "credit",
                      "semester",
                      "period",
                      "numberOfTheory",
                      "numberOfPractical",
                      "numberOfSelfStudy",
                      "numberOfPractice",
                      "numberOfExam",
                      "numberOfOther",
                    ],
                    render: (__, record: { subject?: SubjectVersion }) => {
                      return record?.subject?.numberOfReview
                    },
                  },
                  {
                    title: "KT, Thi",
                    width: 90,
                    align: "center",
                    type: "cmp",
                    distinctFilters: [
                      "credit",
                      "semester",
                      "period",
                      "numberOfTheory",
                      "numberOfPractical",
                      "numberOfSelfStudy",
                      "numberOfPractice",
                      "numberOfReview",
                      "numberOfOther",
                    ],
                    render: (__, record: { subject?: SubjectVersion }) => {
                      return record?.subject?.numberOfExam
                    },
                  },
                  {
                    title: "Thi",
                    width: 90,
                    align: "center",
                    type: "select",
                    options: options,
                    render: (__, record: { subject?: SubjectVersion }) =>
                      getExamTypeLabel(record?.subject?.examType),
                  },
                  // {
                  //     title: 'Tính điểm TBC',
                  //     align: 'center',
                  //     fixed: 'right',
                  //     dataIndex: 'useForFinalScore',
                  //     width: 120,
                  //     render: (value: boolean) => {
                  //         return <Checkbox checked={!!value} />
                  //     },
                  // },
                  // {
                  //     title: 'Trạng thái',
                  //     align: 'center',
                  //     width: 120,
                  //     render: (record) => {
                  //         return !record?.active ? (
                  //             <Tag color="error">Ngừng đào tạo</Tag>
                  //         ) : (
                  //             <Tag color="success">Đang hoạt động</Tag>
                  //         )
                  //     },
                  // },
                ]}
                data={data}
                // headerRight={({ id }) => (
                //     <div className="flex gap-2.5 w-[80px] justify-center items-center">
                //         <CreateIcon
                //             title={'Thêm môn học'}
                //             onClick={(e) => {
                //                 e.stopPropagation()
                //                 onOpenTrainingBlockSubject({
                //                     curriculumVersionId: id,
                //                     trainingBlockOnCurriculumVersionId: id,
                //                     trainingBlockSubjectId: '',
                //                 })
                //             }}
                //         />

                //         <DeleteIcon
                //             popConfirm={{
                //                 onConfirm: () =>
                //                     handleDeleteTrainingBlockOnCurriculumVersion(id),
                //             }}
                //             onClick={(e) => e.stopPropagation()}
                //         />
                //     </div>
                // )}
                pagination={false}
              />
            </div>
          </div>
        </Col>
      </Row>
    </div>
  )
}
TrainingProgramSubjects.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <DefaultLayout breadcrumbList={[{ title: "Chương trình đào tạo" }]}>
      <PagePermissionGate permission={CONG_SINH_VIEN_PERMISSION.CONG_SINH_VIEN_CHUONG_TRINH_DAO_TAO}>
        {page}
      </PagePermissionGate>
    </DefaultLayout>
  )
}
