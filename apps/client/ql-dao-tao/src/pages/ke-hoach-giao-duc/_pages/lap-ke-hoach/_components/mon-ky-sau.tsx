import Table from "@components/commons/table"
import type { OpenSubjectClass } from "@workspace/libs/api/schemas/openSubjectClass"
import { useOpenSubjectClass } from "@workspace/libs/api/training"
import { useAbility } from "@workspace/permissions/hooks"
import { useSemesterStore, useTrainingCourseStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { Col, Flex, Form, Input, Row } from "antd"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

interface SubjectBySemesterForm {
  searchText?: string
  trainingCourseId?: string
  trainingMajorId?: string
  subjectSelected?: Array<string>
}

export default function MonKySau() {
  const { canSome } = useAbility()
  const [form] = Form.useForm<SubjectBySemesterForm>()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(100)
  const { id: semesterId } = useSemesterStore()
  const searchText = Form.useWatch("searchText", form)
  const trainingMajorId = Form.useWatch("trainingMajorId", form)
  const { id: trainingCourseId } = useTrainingCourseStore()
  const { onOpen: onOpenDetailSubject } = useDisclosure<{
    subjectVersionId?: string
  }>({
    tag: "ModalChiTietMonHoc",
  })
  const { onOpen: onOpenDetailFixedClass } = useDisclosure<{
    fixedClassId: string
  }>({
    tag: "ModalChiTietLopBienChe",
  })
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { data: res } = useOpenSubjectClass(
    {
      semesterId: semesterId as string,
      search: searchText,
      trainingCourseId: trainingCourseId || "",
      trainingMajorId,
      trainingObjectTypeId: trainingObjectTypeId || "",
      nextSemester: 1,
    },
    { query: { enabled: !!semesterId && !!trainingObjectTypeId && !!trainingCourseId } }
  )

  const data = useMemo(() => {
    if (res?.status !== 200) return []
    const result: Array<
      Omit<OpenSubjectClass, "fixedClass"> &
        OpenSubjectClass["fixedClass"][number] & {
          rowSpan: number
          groupKey: string
        }
    > = []
    res?.data?.data
      .map((subjectVersion, idx) => ({
        id: subjectVersion.subjectVersionId,
        ...subjectVersion,
        index: idx + 1,
      }))
      .forEach((subject) => {
        const { fixedClass, ...subjectInfo } = subject
        const length = fixedClass?.length || 0
        fixedClass.forEach((cls, index) => {
          result.push({
            ...subjectInfo,
            ...cls,
            rowSpan: index === 0 ? length : 0,
            groupKey:
              index === 0
                ? subject.subjectVersionId
                : `${subject.subjectVersionId}-${cls.fixedClassId}`,
          })
        })
      })
    return result
  }, [res])

  return (
    <div>
      <Row gutter={[0, 8]}>
        <Col span={24}>
          <Flex gap={4}>
            <Col span={8}>
              <Form.Item className="mb-0" name="searchText">
                <Input id="search" placeholder="Tìm kiếm" allowClear />
              </Form.Item>
            </Col>
          </Flex>
        </Col>
        <Col span={24}>
          <Table
            className="mt-0"
            data={data}
            // onRow={(record) => {
            //     return {
            //         onClick: () => {
            //             const isSelected = subjectSelected.includes(
            //                 record.subjectVersionId
            //             )
            //             if (isSelected) {
            //                 form.setFieldValue(
            //                     'subjectSelected',
            //                     subjectSelected.filter(
            //                         (id) => id !== record.subjectVersionId
            //                     )
            //                 )
            //             } else {
            //                 form.setFieldValue('subjectSelected', [
            //                     ...subjectSelected,
            //                     record.subjectVersionId,
            //                 ])
            //             }
            //         },
            //     }
            // }}
            columns={[
              {
                title: "TT",
                width: 35,
                dataIndex: "index",
                align: "center",
                onCell: (record) => ({ rowSpan: record.rowSpan }),
              },
              {
                title: "Mã MH",
                dataIndex: "subjectVersionCode",
                align: "center",
                width: 100,
                onCell: (record) => ({ rowSpan: record.rowSpan }),
              },
              {
                title: "Tên môn học",
                dataIndex: "subjectVersionName",
                align: "center",
                onCell: (record) => ({ rowSpan: record.rowSpan }),
                render: (__, record) => {
                  return (
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenDetailSubject({
                          subjectVersionId: record.subjectVersionId,
                        })
                      }}
                      className="text-left hover:text-primary cursor-pointer"
                    >
                      {`${record?.subjectVersionName} (${record?.subjectVersionCredit}TC)` || ""}
                    </div>
                  )
                },
              },
              {
                title: "Lớp quản lý",
                align: "center",
                width: 120,
                render: (__, record) => {
                  return (
                    <span
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenDetailFixedClass({
                          fixedClassId: record.fixedClassId,
                        })
                      }}
                      className="text-left hover:text-primary cursor-pointer"
                    >
                      {`${record?.fixedClassCode} (${record?.fixedClassCount} SV)`}
                    </span>
                  )
                },
              },
              {
                title: "CTĐT",
                align: "center",
                width: 180,
                render: (__, record) => {
                  return `${record?.curriculumVersionName}`
                },
              },
              {
                title: "Kỳ học",
                align: "center",
                width: 80,
                render: (__, record) => {
                  return `Kỳ ${record?.fixedClassSemester}`
                },
              },
              {
                title: "Tổng SV",
                dataIndex: "countStudent",
                width: 80,
                align: "center",
                onCell: (record) => ({ rowSpan: record.rowSpan }),
              },
              {
                title: "Đơn vị phụ trách",
                dataIndex: "managementOrganizationCode",
                width: 150,
                align: "center",
                onCell: (record) => ({ rowSpan: record.rowSpan }),
              },
            ]}
            pagination={false}
          />
        </Col>
      </Row>
    </div>
  )
}
