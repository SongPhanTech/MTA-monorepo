import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import { SubjectType } from "@pages/chuong-trinh-dao-tao/ql-mon-hoc"
import { useFindUniqueSubjectVersion, useUpdateSubjectVersion } from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { Button, Col, Flex, message, Row } from "antd"
import { BookPlus } from "lucide-react"
import { useMemo } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

type Props = {
  subjectVersionId: string
  keyEnum: string
}

export default function MonHocTienQuyetSongHanhPage({ subjectVersionId, keyEnum }: Props) {
  const { can } = useAbility()
  const { onOpen } = useDisclosure<{
    id: string
    title: string
    keyEnum: string
    type: "above" | "below"
  }>({
    tag: "PutSubjectTienQuyetSongHanh",
  })
  const { data } = useFindUniqueSubjectVersion(
    {
      where: { id: subjectVersionId },
      include: {
        ...(keyEnum === SubjectType.prerequisite && {
          prerequisiteSubject: true,
          dependentSubject: true,
        }),
        ...(keyEnum === SubjectType.parallel && {
          coRequisiteSubject: true,
          depCoRequisiteSubject: true,
        }),
      },
    },
    { enabled: !!subjectVersionId }
  )

  const { aboveData, belowData } = useMemo(() => {
    if (!data) return { aboveData: [], belowData: [] }

    if (keyEnum === SubjectType.prerequisite) {
      return {
        aboveData: data.prerequisiteSubject ?? [],
        belowData: data.dependentSubject ?? [],
      }
    }

    if (keyEnum === SubjectType.parallel) {
      return {
        aboveData: data.coRequisiteSubject ?? [],
        belowData: data.depCoRequisiteSubject ?? [],
      }
    }

    return { aboveData: [], belowData: [] }
  }, [data, keyEnum])

  // Định nghĩa map cho các quan hệ
  const relationFieldMap: Record<string, { above: string; below: string }> = {
    prerequisite: {
      above: "prerequisiteSubject",
      below: "dependentSubject",
    },
    parallel: {
      above: "coRequisiteSubject",
      below: "depCoRequisiteSubject",
    },
  }

  // Hàm helper
  const getRelationField = (keyEnum: string, type: "above" | "below"): string | undefined => {
    return relationFieldMap[keyEnum]?.[type]
  }

  const { mutateAsync: updateSubjectVersion } = useUpdateSubjectVersion()

  const handleDelete = async (id: string, type: "above" | "below") => {
    try {
      const field = getRelationField(keyEnum, type)
      if (!field) return

      await updateSubjectVersion({
        where: { id: subjectVersionId },
        data: {
          [field]: {
            disconnect: { id },
          },
        },
      })
      message.success("Xóa thành công")
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Row gutter={[16, 0]} className="bg-white rounded-lg shadow-sm p-4">
        <Col span={24}>
          <Row gutter={[16, 0]} align="top" justify="space-between">
            <Col span={18}>
              <strong>
                {keyEnum === SubjectType.prerequisite ? "Môn học tiên quyết" : "Môn học song hành"}
              </strong>
            </Col>
            <Col span={6}>
              <Flex justify="end" gap={8}>
                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_QL_MON_HOC, "THEM") && (
                  <Button
                    type="primary"
                    onClick={() =>
                      onOpen({
                        id: subjectVersionId,
                        title: `Thêm ${keyEnum === SubjectType.prerequisite ? "môn học tiên quyết" : "môn học song hành"}`,
                        keyEnum,
                        type: "above",
                      })
                    }
                  >
                    <BookPlus />
                    Thêm
                  </Button>
                )}
              </Flex>
            </Col>
          </Row>
        </Col>
        <Col span={24}>
          <Table
            data={aboveData}
            columns={[
              {
                title: "Mã môn học",
                align: "center",
                width: 120,
                fixed: "left",
                render: (_, record) => record?.code || "",
              },
              {
                title: "Tên môn học",
                align: "center",
                width: 120,
                render: (_, record) => record?.name || "",
              },
              {
                title: "STC",
                align: "center",
                width: 100,
                render: (_, record) => record?.credit || "",
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                fixed: "right",
                render: (_, record) => (
                  <Row className="justify-center gap-2">
                    {can(
                      QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_QL_MON_HOC,
                      "XOA"
                    ) && (
                      <DeleteIcon
                        popConfirm={{
                          onConfirm: () => handleDelete(record?.id, "above"),
                        }}
                      />
                    )}
                  </Row>
                ),
              },
            ]}
          />
        </Col>
      </Row>
      <Row gutter={[16, 0]} className="bg-white rounded-lg shadow-sm p-4">
        <Col span={24}>
          <Row gutter={[16, 0]} align="top" justify="space-between">
            <Col span={18}>
              <strong>Môn học phụ thuộc</strong>
            </Col>
            <Col span={24}>
              <Flex justify="end" gap={8}>
                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_QL_MON_HOC, "THEM") && (
                  <Button
                    type="primary"
                    onClick={() =>
                      onOpen({
                        id: subjectVersionId,
                        title: "Thêm môn học phụ thuộc",
                        keyEnum,
                        type: "below",
                      })
                    }
                  >
                    <BookPlus />
                    Thêm
                  </Button>
                )}
              </Flex>
            </Col>
          </Row>
        </Col>
        <Col span={24}>
          <Table
            data={belowData}
            columns={[
              {
                title: "Mã môn học",
                align: "center",
                width: 120,
                fixed: "left",
                render: (_, record) => record?.code || "",
              },
              {
                title: "Tên môn học",
                align: "center",
                width: 120,
                render: (_, record) => record?.name || "",
              },
              {
                title: "STC",
                align: "center",
                width: 100,
                render: (_, record) => record?.credit || "",
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                fixed: "right",
                render: (_, record) => (
                  <Row className="justify-center gap-2">
                    {can(
                      QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_QL_MON_HOC,
                      "XOA"
                    ) && (
                      <DeleteIcon
                        popConfirm={{
                          onConfirm: () => handleDelete(record?.id, "below"),
                        }}
                      />
                    )}
                  </Row>
                ),
              },
            ]}
          />
        </Col>
      </Row>
    </div>
  )
}
