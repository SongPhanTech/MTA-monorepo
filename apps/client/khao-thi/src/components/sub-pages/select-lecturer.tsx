import FormItem from "@components/commons/form-item"
import TableCollapse from "@components/commons/tableCollapse"
import type { FilterProps } from "@components/commons/typeFilter"
import type { PutSurveyType } from "@components/modal/put-modal-survey"
import { useExamTypeOptions } from "@hooks/examType"
import type { SubjectClass } from "@workspace/db"
import { useFindManySubjectVersion } from "@workspace/db/hooks"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { Form } from "antd"
import type React from "react"
import { useEffect, useRef, useState } from "react"

// interface MyTreeNode {
//     title: string
//     key: string
//     value?: string // nếu bạn muốn gán giá trị riêng
//     children?: MyTreeNode[]
// }

// function buildOrgAndLectureTree(
//     list: Array<{ id: string; name: string | null; parentId: string | null }>,
//     lecturers: Array<{
//         id: string
//         userProfile: { fullName: string }
//         donViId: string
//         selectable: boolean
//     }>,
//     parentId: string | null = null
// ): Array<TreeNodeType> {
//     return list
//         .filter((item) => (item.parentId ?? null) === parentId)
//         .map((item) => ({
//             title: item.name || 'Đơn vị không tên',
//             value: item.id,
//             selectable: false,
//             children: [
//                 ...lecturers
//                     .filter((lecturer) => lecturer.donViId === item.id)
//                     .map((lecturer) => ({
//                         ...lecturer,
//                         title: lecturer.userProfile?.fullName || 'Giảng viên không tên',
//                         value: `${lecturer.id}`,
//                         children: [],
//                     })),
//                 ...buildOrgAndLectureTree(list, lecturers, item.id),
//             ],
//         }))
// }

function SelectLecturer({
  surveyTopicId,
  semesterId,
}: {
  surveyTopicId?: string
  semesterId?: string
}) {
  const [filters, setFilters] = useState<FilterProps>({
    name: "",
    code: "",
    organizationName: "",
    subjectClassName: undefined,
    examType: undefined,
  })

  const [isFirst, setIsFirst] = useState<boolean>(true)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const form = Form.useFormInstance<PutSurveyType>()
  const [initValue, setInitValue] = useState<string[]>([])
  const { options, getExamTypeLabel } = useExamTypeOptions()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const [filteredData, setFilteredData] = useState<any>([])
  // const { data: lecturerData = [] } = useFindManyLecturer(
  //     {
  //         where: {
  //             mainSubjectClasses: {
  //                 some: {
  //                     ...(!!semesterId && { semesterId }),
  //                     ...(!!trainingObjectTypeId && { trainingObjectTypeId }),
  //                     active: true,
  //                     deletedAt: null,
  //                     cancelled: false,
  //                     status: 'OFFICIAL',
  //                 },
  //             },
  //         },
  //         orderBy: {
  //             userProfile: {
  //                 firstName: 'asc',
  //             },
  //         },
  //         include: {
  //             userProfile: {
  //                 include: {
  //                     academicDegreeType: true,
  //                     academicRankType: true,
  //                     level: true,
  //                     rank: true,
  //                 },
  //             },
  //             mainSubjectClasses: {
  //                 include: {
  //                     semester: true,
  //                 },
  //             },
  //             organization: true,
  //         },
  //     },
  //     {
  //         enabled: !!semesterId || !!trainingObjectTypeId,
  //     }
  // )

  const {
    data: subjectData = [],
    isLoading,
    isSuccess,
  } = useFindManySubjectVersion(
    {
      where: {
        subjectClass: {
          some: {
            ...(filters.subjectClassName && filters.subjectClassName !== ""
              ? {
                  OR: [
                    {
                      code: {
                        contains: filters.subjectClassName,
                        mode: "insensitive" as const,
                      },
                    },
                    {
                      name: {
                        contains: filters.subjectClassName,
                        mode: "insensitive" as const,
                      },
                    },
                  ],
                }
              : {}),
            ...(filters.examType
              ? {
                  examType: {
                    in: filters.examType,
                  },
                }
              : {}),
            ...(!!semesterId && { semesterId }),
            ...(!!trainingObjectTypeId && { trainingObjectTypeId }),
            active: true,
            deletedAt: null,
            cancelled: false,
            status: "OFFICIAL",
            type: {
              in: ["NORMAL", "RETAKE"],
            },
            ...(filters.name && filters.name !== ""
              ? {
                  mainLecturer: {
                    userProfile: {
                      OR: [
                        {
                          fullname: {
                            contains: filters.name,
                            mode: "insensitive" as const,
                          },
                        },
                        {
                          lastName: {
                            contains: filters.name,
                            mode: "insensitive" as const,
                          },
                        },
                        {
                          firstName: {
                            contains: filters.name,
                            mode: "insensitive" as const,
                          },
                        },
                      ],
                    },
                  },
                }
              : {}),
            ...(filters.code && filters.code !== ""
              ? {
                  mainLecturer: {
                    code: {
                      contains: filters.code,
                      mode: "insensitive" as const,
                    },
                  },
                }
              : {}),
            ...(filters.organizationName && filters.organizationName !== ""
              ? {
                  mainLecturer: {
                    userProfile: {
                      donVi: {
                        sMa: {
                          contains: filters.organizationName,
                          mode: "insensitive" as const,
                        },
                      },
                    },
                  },
                }
              : {}),
          },
        },
      },
      orderBy: {
        name: "asc",
      },
      include: {
        subjectClass: {
          where: {
            ...(filters.subjectClassName && filters.subjectClassName !== ""
              ? {
                  OR: [
                    {
                      code: {
                        contains: filters.subjectClassName,
                        mode: "insensitive" as const,
                      },
                    },
                    {
                      name: {
                        contains: filters.subjectClassName,
                        mode: "insensitive" as const,
                      },
                    },
                  ],
                }
              : {}),
            ...(filters.examType
              ? {
                  examType: {
                    in: filters.examType,
                  },
                }
              : {}),
            ...(!!semesterId && { semesterId }),
            ...(!!trainingObjectTypeId && { trainingObjectTypeId }),
            active: true,
            deletedAt: null,
            cancelled: false,
            status: "OFFICIAL",
            type: {
              in: ["NORMAL", "RETAKE"],
            },
            ...(filters.name && filters.name !== ""
              ? {
                  mainLecturer: {
                    userProfile: {
                      OR: [
                        {
                          fullname: {
                            contains: filters.name,
                            mode: "insensitive" as const,
                          },
                        },
                        {
                          lastName: {
                            contains: filters.name,
                            mode: "insensitive" as const,
                          },
                        },
                        {
                          firstName: {
                            contains: filters.name,
                            mode: "insensitive" as const,
                          },
                        },
                      ],
                    },
                  },
                }
              : {}),
            ...(filters.code && filters.code !== ""
              ? {
                  mainLecturer: {
                    code: {
                      contains: filters.code,
                      mode: "insensitive" as const,
                    },
                  },
                }
              : {}),
            ...(filters.organizationName && filters.organizationName !== ""
              ? {
                  mainLecturer: {
                    userProfile: {
                      donVi: {
                        sMa: {
                          contains: filters.organizationName,
                          mode: "insensitive" as const,
                        },
                      },
                    },
                  },
                }
              : {}),
          },
          include: {
            mainLecturer: {
              include: {
                userProfile: { include: { donVi: true } },
              },
            },
          },
        },
      },
    },
    {
      enabled: !!semesterId && !!trainingObjectTypeId,
    }
  )

  // const {
  //     data: organizations = [],
  //     isLoading: organizationsLoading,
  //     error: organizationsError,
  // } = useFindManyDM_DonVi({
  //     where: {},
  // })

  // // Tạo treeData từ organizations và lecturers
  // const treeData: TreeNodeType[] = useMemo(() => {
  //     if (!organizations.length || !lecturerData.length) return []

  //     return buildOrgAndLectureTree(
  //         organizations.map((org) => ({
  //             id: org.Id,
  //             name: `${org.sMa} - ${org.sTen}`,
  //             parentId: org.sParentId,
  //         })),
  //         lecturerData.map((lec) => ({
  //             ...lec,
  //             id: lec.id,
  //             userProfile: {
  //                 ...lec.userProfile,
  //                 fullName:
  //                     `${lec.userProfile?.lastName ?? ''} ${
  //                         lec.userProfile?.firstName ?? ''
  //                     }`.trim() || 'Giảng viên không tên',
  //             },
  //             selectable: true,
  //             donViId: lec.userProfile?.sDM_DonViId,
  //         })),
  //         null
  //     )
  // }, [organizations, lecturerData])

  const rowSelection = {
    selectedRowKeys,
    checkStrictly: false,
    onSelect: (record: any, selected: boolean) => {
      if (selected) {
        let arr: any = []
        if (record?.subjectClass?.length > 0) {
          const list = record?.subjectClass.map((i: SubjectClass) => i.id)
          arr = [...selectedRowKeys, ...list]
        } else {
          arr = arr.push(record?.id)
        }

        setSelectedRowKeys(arr)
        form.setFieldsValue({
          subjectClassIds: arr as string[],
        })
      } else {
        let arr: React.Key[] = []
        if (record?.subjectClass?.length > 0) {
          const list = record?.subjectClass.map((i: SubjectClass) => i.id)
          arr = selectedRowKeys.filter((i: React.Key) => !list.includes(i))
        } else {
          arr = selectedRowKeys.filter((i: React.Key) => i !== record?.id)
        }
        setSelectedRowKeys(arr)
        form.setFieldsValue({
          subjectClassIds: arr as string[],
        })
      }
    },
    preserveSelectedRowKeys: true,
    onChange: (selectedRowKeys: any, selectedRows: any, info: any) => {
      if (info.type === "all") {
      }
    },
    // onChange: (newSelectedRowKeys: React.Key[]) => {

    //     setSelectedRowKeys(newSelectedRowKeys)
    //     form.setFieldsValue({
    //         subjectClassIds: newSelectedRowKeys as string[],
    //     })
    // },
    // getCheckboxProps: (record: any) => ({
    //     disabled: !record.mainLecturer,
    // }),
  }
  const ranRef = useRef(false)
  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    ranRef.current = false
  }, [semesterId])

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (!isSuccess) return // chưa load xong
    if (ranRef.current) return // đảm bảo chỉ chạy 1 lần

    ranRef.current = true
    if (subjectData.length) {
      const list: string[] = []
      subjectData.forEach((e) => {
        e?.subjectClass.forEach((i) => {
          list.push(i?.id)
        })
      })
      setSelectedRowKeys(list)
      setFilteredData(list)
      form.setFieldsValue({
        subjectClassIds: list,
      })
      setIsFirst(false)
    }
  }, [subjectData])

  return (
    <div className="w-full px-3 mt-3">
      <div className="mb-4 text-[14px] font-[500]">Chọn giảng viên</div>
      <div>
        <FormItem form={form} name="subjectClassIds" className="max-h-[500px] overflow-y-scroll">
          <TableCollapse
            filters={filters}
            setFilters={(value) => {
              setFilters(value)
            }}
            rowKey="id"
            id="learning-result"
            headerTitleKey="name"
            defaultExpandAll
            data={subjectData}
            scroll={{ y: 500 }}
            childrenFieldName="subjectClass"
            rowSelection={rowSelection}
            columns={[
              {
                title: "Giảng viên",
                dataIndex: "name",
                type: "input",
                render: (__, record) => <span>{record?.mainLecturer?.userProfile?.fullname}</span>,
              },
              {
                title: "Mã GV",
                dataIndex: "code",
                type: "input",
                width: 150,
                render: (__, record: any) => <span>{record?.mainLecturer?.code}</span>,
              },
              {
                title: "ĐVQL",
                dataIndex: "organizationName",
                width: 80,
                type: "input",
                render: (__, record: any) => <>{record?.mainLecturer?.userProfile?.donVi?.sMa || ""}</>,
              },
              {
                title: "Lớp môn học",
                dataIndex: "subjectClassName",
                width: 200,
                type: "input",
                render: (__, record: any) => (
                  <>
                    {record?.code || ""} - {record?.name || ""}
                  </>
                ),
              },
              {
                title: "Hình thức thi",
                dataIndex: "examType",
                width: 120,
                type: "select",
                options: options,
                render: (__, record: any) => (
                  <>{record?.examType ? getExamTypeLabel(record?.examType) : ""}</>
                ),
              },
            ]}
            pagination={{
              hideOnSinglePage: true,
            }}
          />
        </FormItem>
      </div>
    </div>
  )
}

export default SelectLecturer
