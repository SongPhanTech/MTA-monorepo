import { queryClient } from "@api/index"
import TableCollapse from "@components/commons/tableCollapse"
import { examPostponeReason } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import { formatDate } from "@lib/utils"
import { useStore } from "@tanstack/react-store"
import { createId } from "@workspace/db"
import type { Prisma } from "@workspace/db/client"
import { useFindManyExamList, useFindUniqueExam, useUpdateExam } from "@workspace/db/hooks"
import { sqlTransaction } from "@workspace/libs/api/model"
import type { SqlTransactionBodyItem } from "@workspace/libs/api/schemas/sqlTransactionBodyItem"
import { AutoComplete, Button, Checkbox, Col, Flex, Form, Input, message, Row } from "antd"
import { useEffect } from "react"
import { keHoachThiStore } from ".."
import ExportExamList from "./export-exam-list"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import where from "lodash/fp/where"

interface StudentSubjectScoreFormType {
  list: Record<
    string,
    {
      examPostponed?: boolean
      examPostponedReason?: string
      description?: string
    }
  >
}

export default function DanhSachSinhVien() {
  const [form] = Form.useForm<StudentSubjectScoreFormType>()

  const { selectedExamId } = useStore(keHoachThiStore)
  const { can } = useAbility()

  const { data = [], isLoading } = useFindManyExamList(
    {
      where: {
        examRoom: {
          examId: selectedExamId,
          active: true,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        start: true,
        examRoom: {
          select: {
            room: {
              select: {
                name: true,
              },
            },
            capacity: true,
          },
        },
        firstSupervisor: {
          select: {
            id: true,
            userProfile: {
              select: {
                fullname: true,
                hocHam: {
                  select: {
                    academicRankType: {
                      select: {
                        sTen: true,
                      },
                    },
                  },
                },
                hocVi: {
                  select: {
                    academicDegreeType: {
                      select: {
                        sTen: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        secondSupervisor: {
          select: {
            id: true,
            userProfile: {
              select: {
                fullname: true,
                hocHam: {
                  select: {
                    academicRankType: {
                      select: {
                        sTen: true,
                      },
                    },
                  },
                },
                hocVi: {
                  select: {
                    academicDegreeType: {
                      select: {
                        sTen: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        examPapers: {
          include: {
            studentSubjectScore: {
              include: {
                student: {
                  include: {
                    userProfile: {
                      select: {
                        fullname: true,
                        code: true,
                        dateOfBirth: true,
                      },
                    },
                    fixedClass: {
                      select: {
                        name: true,
                        trainingCourse: {
                          select: {
                            name: true,
                          },
                        },
                        code: true,
                      },
                    },
                  },
                },
                subjectClass: {
                  select: {
                    code: true,
                    room: {
                      select: {
                        id: true,
                        name: true,
                        capacity: true,
                      },
                    },
                    subject: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: [
            {
              studentSubjectScore: {
                student: {
                  userProfile: {
                    firstName: "asc",
                  },
                },
              },
            },
            {
              studentSubjectScore: {
                student: {
                  userProfile: {
                    lastName: "asc",
                  },
                },
              },
            },
          ],
        },
      },
      orderBy: {
        start: {
          nulls: "first",
          sort: "asc",
        },
      },
    },
    { enabled: !!selectedExamId }
  )

  const { data: examData, refetch: refetchExamData } = useFindUniqueExam({
    where: { id: selectedExamId },
    select: {
      subjectClass: {
        select: {
          isLockScore: true,
          isLockExamScore: true,
        },
      },
      lockExamSessions: true,
      examRooms: {
        include: {
          examList: {
            orderBy: {
              start: "asc",
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  const isAssignedExamRoom = data.some((el) => el.examRoom?.room && el.examPapers.length > 0)

  /// đã đánh phách
  const isCreatedExamCode = examData?.examRooms?.some((er) =>
    er.examList?.some((el) => el.createdExamCode)
  )

  const { mutateAsync: updateExamData } = useUpdateExam()
  const { showSpinner, hideSpinner } = useSpinner()

  const listForm = Form.useWatch("list", form) || []

  const handleLayDiemCCTX = async ({ lockAfter = true }: { lockAfter?: boolean } = {}) => {
    try {
      showSpinner()
      const resExam = await sqlTransaction([
        {
          model: "Exam" as const,
          operation: "findUnique",
          data: {
            where: {
              id: selectedExamId,
            },
            select: {
              subjectClass: {
                select: {
                  subjectClassStudent: true,
                },
              },
            },
          },
        },
      ])
      if (resExam.status !== 200 || !resExam.data) {
        throw new Error("Lấy điểm thất bại, vui lòng thử lại")
      }
      const exam = resExam.data[0] as Prisma.ExamGetPayload<{
        select: {
          subjectClass: {
            select: {
              subjectClassStudent: true
            }
          }
        }
      }>

      const allStudentSubjectScores = exam.subjectClass.flatMap((e) => e.subjectClassStudent)
      const examNonRoomId = createId()
      const examListNonRoomId = createId()
      const res = await sqlTransaction([
        {
          model: "ExamPaper" as const,
          operation: "deleteMany",
          data: {
            where: {
              examCode: null,
              examList: {
                examRoom: {
                  examId: selectedExamId,
                },
              },
            },
          },
        },
        {
          model: "ExamList" as const,
          operation: "deleteMany",
          data: {
            where: {
              examRoom: {
                examId: selectedExamId,
                roomId: null,
              },
            },
          },
        },
        {
          model: "ExamRoom" as const,
          operation: "deleteMany",
          data: {
            where: {
              examId: selectedExamId,
              roomId: null,
            },
          },
        },
        {
          model: "ExamRoom" as const,
          operation: "create",
          data: {
            data: {
              id: examNonRoomId,
              examId: selectedExamId,
              roomId: null,
            },
          },
        },
        {
          model: "ExamList" as const,
          operation: "create",
          data: {
            data: {
              id: examListNonRoomId,
              examRoomId: examNonRoomId,
            },
          },
        },
        ...allStudentSubjectScores.map((studentSubjectScore) => ({
          model: "ExamPaper" as const,
          operation: "create",
          data: {
            data: {
              studentSubjectScoreId: studentSubjectScore.id,
              examListId: examListNonRoomId,
            },
          },
        })),
      ])
      if (res.status !== 200) {
        throw new Error("Lấy điểm thất bại")
      }
      if (lockAfter) {
        await updateExamData({
          where: { id: selectedExamId || "" },
          data: {
            subjectClass: {
              updateMany: {
                data: { isLockScore: true },
                where: {},
              },
            },
          },
        })
      }
      queryClient.invalidateQueries({
        queryKey: ["zenstack", "ExamPaper"],
      })
      queryClient.invalidateQueries({
        queryKey: ["zenstack", "ExamList"],
      })
      queryClient.invalidateQueries({
        queryKey: ["zenstack", "Exam"],
      })
      lockAfter && message.success("Lấy điểm và khoá điểm thành công")
    } catch (error: any) {
      message.error(error.message || "Có lỗi xảy ra, vui lòng thử lại sau!")
    } finally {
      hideSpinner()
    }
  }

  const handlePhanPhongThi = async () => {
    if (data?.length <= 0) return message.error("Không phân được phòng thi")
    const listExamRomError = data.filter((el) => !el.examRoom?.room && el.examPapers.length > 0)
    const listExamRoom = data.filter((el) => el.examRoom?.room)
    if (listExamRomError?.length <= 0) {
      message.error("Không phân được phòng thi")
      return
    }
    if (listExamRoom?.length <= 0) {
      message.error("Chưa có phòng thi")
      return
    }
    try {
      showSpinner()

      const resExam = await sqlTransaction([
        {
          model: "Exam" as const,
          operation: "findUnique",
          data: {
            where: {
              id: selectedExamId,
            },
            select: {
              subjectClass: {
                select: {
                  subjectClassStudent: {
                    orderBy: {
                      student: {
                        userProfile: {
                          firstName: "asc",
                        },
                      },
                    },
                    select: {
                      id: true,
                      examBanned: true,
                      examPostponed: true,
                      attendanceScore: true,
                      midtermScore: true,
                      student: {
                        select: {
                          userProfile: {
                            select: {
                              firstName: true,
                              lastName: true,
                            },
                          },
                        },
                      },
                    },
                  },
                  subject: {
                    select: {
                      onePoint: true,
                    },
                  },
                },
              },
              examRooms: {
                include: {
                  examList: {
                    orderBy: {
                      start: "asc",
                    },
                  },
                },
                orderBy: { createdAt: "asc" },
              },
            },
          },
        },
      ])
      if (resExam.status !== 200 || !resExam.data) {
        throw new Error("Lấy kế hoạch thi thất bại")
      }
      const exam = resExam.data[0] as Prisma.ExamGetPayload<{
        select: {
          subjectClass: {
            select: {
              subjectClassStudent: {
                select: {
                  id: true
                  examBanned: true
                  examPostponed: true
                  attendanceScore: true
                  midtermScore: true
                  student: {
                    select: {
                      userProfile: {
                        select: {
                          firstName: true
                          lastName: true
                        }
                      }
                    }
                  }
                }
              }
              subject: {
                select: {
                  onePoint: true
                }
              }
            }
          }
          examRooms: {
            select: {
              capacity: true
              examList: true
            }
          }
        }
      }>

      const allStudentSubjectScores = exam.subjectClass
        .map((e) => ({
          ...e,
          subjectClassStudent: e.subjectClassStudent.map((scs) => ({
            ...scs,
            onePoint: !!e.subject.onePoint,
          })),
        }))
        .flatMap((e) => e.subjectClassStudent)
      type StudentSubjectScore = (typeof allStudentSubjectScores)[number]

      const filteredStudentSubjectScores = allStudentSubjectScores.filter(
        (score) =>
          !score.examBanned &&
          !score.examPostponed &&
          (!score.onePoint ? score.attendanceScore && score.midtermScore : true)
      )

      if (filteredStudentSubjectScores.length === 0) {
        hideSpinner()
        return
      }

      const skippedStudentSubjectScores = allStudentSubjectScores.filter(
        (score) =>
          score.examBanned ||
          score.examPostponed ||
          (!score.onePoint && (!score.attendanceScore || !score.midtermScore))
      )

      const allExamLists = exam.examRooms.flatMap((er) =>
        er.examList.map((el) => ({
          ...el,
          capacity: er.capacity,
          studentSubjectScores: [] as StudentSubjectScore[],
        }))
      )
      filteredStudentSubjectScores.sort((a, b) => {
        const nameA = a.student?.userProfile?.firstName ?? ""
        const nameB = b.student?.userProfile?.firstName ?? ""
        return nameA.localeCompare(nameB, "vi")
      })
      let idx = 0
      loop: for (const el of allExamLists) {
        for (let i = 0; i < el.capacity; i++) {
          const s = filteredStudentSubjectScores[idx]
          idx++

          if (!s) {
            break loop
          }

          if (s.examBanned || s.examPostponed) {
            continue
          }

          el.studentSubjectScores.push(s)
        }
      }
      const overflowStudentSubjectScores = filteredStudentSubjectScores.slice(idx)

      const examNonRoomId = createId()
      const examListNonRoomId = createId()
      const res = await sqlTransaction([
        {
          model: "ExamPaper" as const,
          operation: "deleteMany",
          data: {
            where: {
              examCode: null,
              examList: {
                examRoom: {
                  examId: selectedExamId,
                },
              },
            },
          },
        },
        {
          model: "ExamList" as const,
          operation: "deleteMany",
          data: {
            where: {
              examRoom: {
                examId: selectedExamId,
                roomId: null,
              },
            },
          },
        },
        {
          model: "ExamRoom" as const,
          operation: "deleteMany",
          data: {
            where: {
              examId: selectedExamId,
              roomId: null,
            },
          },
        },
        {
          model: "ExamRoom" as const,
          operation: "create",
          data: {
            data: {
              id: examNonRoomId,
              examId: selectedExamId,
              roomId: null,
            },
          },
        },
        {
          model: "ExamList" as const,
          operation: "create",
          data: {
            data: {
              id: examListNonRoomId,
              examRoomId: examNonRoomId,
            },
          },
        },
        ...[...skippedStudentSubjectScores, ...overflowStudentSubjectScores].map(
          (studentSubjectScore) => ({
            model: "ExamPaper" as const,
            operation: "create",
            data: {
              data: {
                studentSubjectScoreId: studentSubjectScore.id,
                examListId: examListNonRoomId,
              },
            },
          })
        ),
        ...allExamLists
          .flatMap((examList) =>
            examList.studentSubjectScores.map((sss) => ({
              examListId: examList.id,
              studentSubjectScoreId: sss.id,
            }))
          )
          .map(({ examListId, studentSubjectScoreId }) => ({
            model: "ExamPaper" as const,
            operation: "create",
            data: {
              data: {
                studentSubjectScoreId: studentSubjectScoreId,
                examListId: examListId,
              },
            },
          })),
      ])
      if (res.status !== 200) {
        throw new Error("Phân phòng thất bại")
      }
      queryClient.invalidateQueries({
        queryKey: ["zenstack", "ExamPaper"],
      })
      queryClient.invalidateQueries({
        queryKey: ["zenstack", "ExamList"],
      })
      queryClient.invalidateQueries({
        queryKey: ["zenstack", "Exam"],
      })
      if (overflowStudentSubjectScores.length > 0) {
        message.warning(
          `Phân phòng thi thành công. Có ${overflowStudentSubjectScores.length} sinh viên chưa được phân phòng do không đủ ghế thi.`
        )
      } else {
        message.success("Phân phòng thi thành công")
      }
    } catch (error: any) {
      console.error(error)
      message.error(error.message || "Có lỗi xảy ra, vui lòng thử lại sau!")
    }
    hideSpinner()
  }

  const updateExamDataFn = async () => {
    try {
      showSpinner()
      await updateExamData({
        where: {
          id: selectedExamId || "",
        },
        data: {
          lockExamSessions: true,
          subjectClass: {
            updateMany: {
              data: {
                isLockScore: true,
              },
              where: {},
            },
          },
        },
      })
      hideSpinner()
    } catch (error: any) {
      console.error(error)
    }
  }

  const handleSaveExamDecision = async () => {
    try {
      showSpinner()
      const values = form.getFieldsValue()
      const valueListObject = Object.entries(values.list).map(([key, value_]) => ({
        id: key,
        ...value_,
      }))
      const updateTransactions: SqlTransactionBodyItem[] = valueListObject.map((i) => ({
        model: "StudentSubjectScore",
        operation: "update",
        data: {
          where: { id: i.id },
          data: {
            examPostponed: i.examPostponed ?? false,
            examPostponedReason: i.examPostponed ? i.examPostponedReason || null : null,
            description: i.description ?? null,
          },
        },
      }))

      const res = await sqlTransaction(updateTransactions)

      if (res.status === 200) {
        queryClient.invalidateQueries({
          queryKey: ["zenstack", "StudentSubjectScore"],
        })
        queryClient.invalidateQueries({ queryKey: ["zenstack", "ExamPaper"] })
        queryClient.invalidateQueries({ queryKey: ["zenstack", "ExamList"] })
        message.success("Cập nhật thành công")
      }
    } catch (error: any) {
      message.error(error.message || "Có lỗi xảy ra, vui lòng thử lại sau!")
    } finally {
      hideSpinner()
    }
  }

  useEffect(() => {
    if (selectedExamId && data.length > 0) {
      form.setFieldsValue({
        list: data
          .flatMap((e) => e.examPapers)
          .reduce(
            (acc, cur) => {
              acc[cur.studentSubjectScoreId] = {
                examPostponed: cur?.studentSubjectScore?.examPostponed ?? false,
                examPostponedReason: cur?.studentSubjectScore?.examPostponedReason ?? undefined,
                description: cur?.studentSubjectScore?.description ?? undefined,
              }
              return acc
            },
            {} as StudentSubjectScoreFormType["list"]
          ),
      })
    }
  }, [selectedExamId, data, form])

  return (
    <Row gutter={16}>
      <Col span={24}>
        <Row gutter={16} align="middle">
          <Col span={24}>
            <Flex justify="end" align="center" gap={12}>
              <Button
                type="primary"
                disabled={examData?.lockExamSessions || isCreatedExamCode}
                onClick={() => handleLayDiemCCTX()}
              >
                0. Lấy điểm SV
              </Button>
              <Button
                type="primary"
                className="bg-orange-500"
                disabled={
                  examData?.lockExamSessions ||
                  isCreatedExamCode ||
                  !can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_TO_CHUC_THI_LAP_DANH_SANH_THI, "DUYET")
                }
                onClick={handleSaveExamDecision}
              >
                1. Lưu hoãn thi
              </Button>
              <Checkbox
                indeterminate={
                  !examData?.subjectClass.every((sc) => sc.isLockScore) &&
                  examData?.subjectClass.some((sc) => sc.isLockScore)
                }
                onChange={async (e) => {
                  try {
                    await updateExamData({
                      where: {
                        id: selectedExamId || "",
                      },
                      data: {
                        subjectClass: {
                          updateMany: {
                            data: {
                              isLockScore: e.target.checked,
                            },
                            where: {},
                          },
                        },
                      },
                    })
                    if (!e.target.checked) {
                      await handleLayDiemCCTX({ lockAfter: false })
                    }
                  } catch (error) {}
                }}
                disabled={examData?.lockExamSessions || isCreatedExamCode}
                checked={examData?.subjectClass.some((sc) => sc.isLockScore)}
              >
                2. Khoá nhập ĐQT
              </Checkbox>
              <Button
                type="primary"
                disabled={
                  examData?.lockExamSessions ||
                  isCreatedExamCode ||
                  !examData?.subjectClass.every((sc) => sc.isLockScore)
                }
                onClick={handlePhanPhongThi}
              >
                3. Phân phòng thi
              </Button>
              <Checkbox
                disabled={examData?.subjectClass.some((sc) => !sc.isLockScore) || isCreatedExamCode}
                onChange={async (e) => {
                  try {
                    await updateExamData({
                      where: {
                        id: selectedExamId || "",
                      },
                      data: {
                        lockExamSessions: e.target.checked,
                        subjectClass: e.target.checked
                          ? {
                              updateMany: {
                                data: {
                                  isLockScore: e.target.checked,
                                },
                                where: {},
                              },
                            }
                          : {},
                      },
                    })
                  } catch (error) {}
                }}
                checked={examData?.lockExamSessions}
              >
                4. Khoá DS thi
              </Checkbox>
              <ExportExamList
                data={data}
                disabled={!selectedExamId || data.length === 0}
                updateExamData={updateExamDataFn}
              />
            </Flex>
          </Col>
        </Row>
      </Col>
      <Col span={24}>
        <Form form={form}>
          <TableCollapse
            resetIndexPerGroup
            rowKey="id"
            id="danh-sach-sinh-vien"
            headerTitleKey={(record) =>
              record.examRoom?.room ? (
                <span>
                  Phòng thi: {record.examRoom?.room?.name} - Ca {record.start}{" "}
                  {record.examRoom?.capacity ? ` : ${record.examRoom?.capacity}` : ""}
                </span>
              ) : (
                "Chưa phân phòng thi"
              )
            }
            childrenFieldName="examPapers"
            defaultExpandAll
            data={data}
            pagination={false}
            loading={isLoading}
            columns={[
              {
                title: "Mã sinh viên",
                align: "center",
                width: 100,
                render: (_, record) => record?.studentSubjectScore?.student?.code || "",
              },
              {
                title: "Họ và tên",
                width: 220,
                align: "center",
                render: (_, record) => {
                  return (
                    <div className="text-left">
                      {record?.studentSubjectScore?.student?.userProfile?.fullname || "Không rõ"}
                    </div>
                  )
                },
              },
              {
                title: "Ngày sinh",
                width: 80,
                align: "center",
                render: (_, record) => {
                  const dob = record?.studentSubjectScore?.student?.userProfile?.dateOfBirth
                  return dob ? formatDate(dob) : undefined
                },
              },
              {
                title: "Lớp",
                width: 100,
                align: "center",
                render: (_, record) =>
                  `${record?.studentSubjectScore?.student?.fixedClass?.code || ""}`,
              },
              {
                title: "Điểm TX",
                width: 70,
                align: "center",
                render: (_, record) => record?.studentSubjectScore?.attendanceScore,
              },
              {
                title: "Điểm ĐK",
                align: "center",
                width: 70,
                render: (_, record) => record?.studentSubjectScore?.midtermScore,
              },
              {
                title: "Điểm thi",
                align: "center",
                width: 70,
                render: (_, record) => record?.studentSubjectScore?.examScore,
              },
              {
                title: "Cấm thi",
                align: "center",
                width: 80,
                render: (_, record) => {
                  return <Checkbox checked={record?.studentSubjectScore?.examBanned} />
                },
              },
              {
                title: "Lý do cấm thi",
                render: (_, record) => {
                  return (
                    <Input.TextArea
                      autoSize
                      readOnly
                      variant="underlined"
                      value={record?.studentSubjectScore?.examBannedReason ?? ""}
                    />
                  )
                },
              },
              {
                title: "Hoãn thi",
                align: "center",
                width: 80,
                render: (_, record) => {
                  return (
                    <Form.Item
                      className="w-full mb-0"
                      name={["list", record.studentSubjectScoreId, "examPostponed"]}
                      label=""
                      valuePropName="checked"
                    >
                      <Checkbox
                        disabled={
                          isAssignedExamRoom || examData?.lockExamSessions || isCreatedExamCode
                        }
                        onChange={(e) => {
                          if (!e.target.checked) {
                            form.setFieldValue(
                              ["list", record.studentSubjectScoreId, "examPostponedReason"],
                              undefined
                            )
                          }
                        }}
                      />
                    </Form.Item>
                  )
                },
              },
              {
                title: "Lý do hoãn thi",
                render: (_, record) => {
                  const examPostponed = listForm[record.studentSubjectScoreId]?.examPostponed
                  return (
                    <Form.Item
                      name={["list", record.studentSubjectScoreId, "examPostponedReason"]}
                      className="m-0"
                    >
                      {!examPostponed ? (
                        <Input.TextArea autoSize readOnly variant="underlined" />
                      ) : (
                        <AutoComplete
                          placeholder="Nhập lý do hoãn thi"
                          options={examPostponeReason.map((s) => ({
                            label: s,
                            value: s,
                          }))}
                          styles={{ popup: { root: { width: "fit" } } }}
                          disabled={
                            isAssignedExamRoom ||
                            !examPostponed ||
                            examData?.lockExamSessions ||
                            isCreatedExamCode
                          }
                        >
                          <Input.TextArea autoSize readOnly variant="underlined" />
                        </AutoComplete>
                      )}
                    </Form.Item>
                  )
                },
              },
              {
                title: "Ghi chú",
                render: (_, record) => {
                  return (
                    <Form.Item
                      className="w-full mb-0"
                      name={["list", record.studentSubjectScoreId, "description"]}
                      label=""
                    >
                      <Input
                        variant="underlined"
                        disabled={examData?.lockExamSessions || isCreatedExamCode}
                      />
                    </Form.Item>
                  )
                },
              },
            ]}
            scroll={{ y: "calc(100vh - 64px - 40px - 48px - 150px)" }}
          />
        </Form>
      </Col>
    </Row>
  )
}
