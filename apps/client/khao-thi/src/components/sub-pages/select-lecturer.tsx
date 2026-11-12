import FormItem from "@components/commons/form-item"
import TableCollapse from "@components/commons/tableCollapse"
import type { FilterProps } from "@components/commons/typeFilter"
import type { PutSurveyType } from "@components/modal/put-modal-survey"
import { useExamTypeOptions } from "@hooks/examType"
import type { Prisma, SubjectClass } from "@workspace/db"
import { useFindManySubjectVersion } from "@workspace/db/hooks"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { Form } from "antd"
import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"

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
  trainingCourseIds = [],
  directSubjectClassIds = [],
  surveyObjectTypeIds = [],
}: {
  surveyTopicId?: string
  semesterId?: string
  trainingCourseIds?: string[]
  directSubjectClassIds?: string[]
  surveyObjectTypeIds?: string[]
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

  const courseCondition = useMemo(() => {
    const conditions: any[] = []
    if (trainingCourseIds && trainingCourseIds.length > 0) {
      // Đồng bộ với phân hệ Đào tạo (Thời khoá biểu / Đăng ký học cho lớp QL):
      // lớp môn học của khóa là lớp được ghép với lớp quản lý thuộc khóa đó.
      // Không lấy lớp của khóa khác chỉ vì có vài HV học ghép, tránh hiển thị
      // giảng viên chỉ dạy khóa khác.
      conditions.push({
        type: "NORMAL",
        fixedClasses: {
          some: { trainingCourseId: { in: trainingCourseIds } },
        },
      })
    }
    if (directSubjectClassIds && directSubjectClassIds.length > 0) {
      conditions.push({
        id: { in: directSubjectClassIds },
      })
    }
    if (conditions.length === 0) return {}
    if (conditions.length === 1) return conditions[0]
    return { OR: conditions }
  }, [trainingCourseIds, directSubjectClassIds])

  const subjectClassWhere = useMemo((): Prisma.SubjectClassWhereInput => {
    const andConditions: Prisma.SubjectClassWhereInput[] = []

    if (filters.subjectClassName && filters.subjectClassName !== "") {
      andConditions.push({
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
      })
    }

    if (Object.keys(courseCondition).length > 0) {
      andConditions.push(courseCondition)
    }

    const lecturerConditions: Prisma.LecturerWhereInput[] = []
    if (filters.name && filters.name !== "") {
      lecturerConditions.push({
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
      })
    }

    if (filters.code && filters.code !== "") {
      lecturerConditions.push({
        OR: [
          {
            lectureID: {
              contains: filters.code,
              mode: "insensitive" as const,
            },
          },
          {
            userProfile: {
              code: {
                contains: filters.code,
                mode: "insensitive" as const,
              },
            },
          },
        ],
      })
    }

    if (filters.organizationName && filters.organizationName !== "") {
      lecturerConditions.push({
        userProfile: {
          donVi: {
            sMa: {
              contains: filters.organizationName,
              mode: "insensitive" as const,
            },
          },
        },
      })
    }

    const baseWhere: Prisma.SubjectClassWhereInput = {
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
      status: "OFFICIAL" as const,
      type: {
        in: ["NORMAL", "RETAKE"] as const,
      },
      // Chỉ hiển thị Giảng viên 1 (giảng viên chính) được phân công giảng dạy cho khóa đã chọn
      lecturerId: { not: null },
    }

    if (lecturerConditions.length > 0) {
      baseWhere.mainLecturer = {
        AND: lecturerConditions,
      }
    }

    if (andConditions.length > 0) {
      baseWhere.AND = andConditions
    }

    return baseWhere
  }, [filters, semesterId, trainingObjectTypeId, courseCondition])

  const {
    data: subjectData = [],
    isLoading,
    isSuccess,
  } = useFindManySubjectVersion(
    {
      where: {
        subjectClass: {
          some: subjectClassWhere,
        },
      },
      orderBy: {
        name: "asc",
      },
      include: {
        subjectClass: {
          where: subjectClassWhere,
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
      let arr: React.Key[] = []
      if (selected) {
        if (record?.subjectClass?.length > 0) {
          const list = record?.subjectClass.map((i: SubjectClass) => i.id)
          arr = Array.from(new Set([...selectedRowKeys, ...list]))
        } else if (record?.id) {
          arr = Array.from(new Set([...selectedRowKeys, record.id]))
        }
      } else {
        if (record?.subjectClass?.length > 0) {
          const list = record?.subjectClass.map((i: SubjectClass) => i.id)
          arr = selectedRowKeys.filter((i: React.Key) => !list.includes(i))
        } else if (record?.id) {
          arr = selectedRowKeys.filter((i: React.Key) => i !== record.id)
        }
      }

      setSelectedRowKeys(arr)
      form.setFieldsValue({
        subjectClassIds: arr as string[],
      })
    },
    preserveSelectedRowKeys: true,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      const allClassIdSet = new Set<string>()
      subjectData.forEach((e) => {
        e?.subjectClass?.forEach((i) => {
          if (i?.id) allClassIdSet.add(i.id)
        })
      })
      const validClassKeys = newSelectedRowKeys.filter((k) => allClassIdSet.has(k as string))
      setSelectedRowKeys(validClassKeys)
      form.setFieldsValue({
        subjectClassIds: validClassKeys as string[],
      })
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
  const courseKey = useMemo(() => {
    return [
      ...(trainingCourseIds || []).slice().sort(),
      ...(directSubjectClassIds || []).slice().sort(),
      ...(surveyObjectTypeIds || []).slice().sort(),
    ].join(",")
  }, [trainingCourseIds, directSubjectClassIds, surveyObjectTypeIds])

  const ranRef = useRef(false)
  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    ranRef.current = false
  }, [semesterId, courseKey])

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (!isSuccess) return // chưa load xong
    if (ranRef.current) return // đảm bảo chỉ chạy 1 lần

    ranRef.current = true
    if (subjectData.length) {
      const allClassIds: string[] = []
      subjectData.forEach((e) => {
        e?.subjectClass?.forEach((i) => {
          if (i?.id) allClassIds.push(i.id)
        })
      })

      const currentFormIds = form.getFieldValue("subjectClassIds") || []
      const validExistingIds = currentFormIds.filter((id: string) => allClassIds.includes(id))

      const targetIds = validExistingIds.length > 0 ? validExistingIds : allClassIds

      setSelectedRowKeys(targetIds)
      setFilteredData(targetIds)
      form.setFieldsValue({
        subjectClassIds: targetIds,
      })
      setIsFirst(false)
    } else {
      setSelectedRowKeys([])
      setFilteredData([])
      form.setFieldsValue({
        subjectClassIds: [],
      })
    }
  }, [subjectData, isSuccess, form])

  return (
    <div className="w-full px-3 mt-3">
      <div className="mb-4 text-[14px] font-[500]">Chọn giảng viên</div>
      <div>
        <FormItem
          form={form}
          name="subjectClassIds"
          rules={[
            {
              validator: async (_, value) => {
                if (!value || value.length === 0) {
                  return Promise.reject("Vui lòng chọn ít nhất một giảng viên / lớp môn học")
                }
                return Promise.resolve()
              },
            },
          ]}
          className="max-h-[500px] overflow-y-scroll"
        >
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
                title: "Mã định danh",
                dataIndex: "code",
                type: "input",
                width: 150,
                render: (__, record: any) => (
                  <span>
                    {record?.mainLecturer?.userProfile?.code ||
                      record?.mainLecturer?.code ||
                      record?.mainLecturer?.lectureID ||
                      ""}
                  </span>
                ),
              },
              {
                title: "ĐVQL",
                dataIndex: "organizationName",
                width: 80,
                type: "input",
                render: (__, record: any) => (
                  <>{record?.mainLecturer?.userProfile?.donVi?.sMa || ""}</>
                ),
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
