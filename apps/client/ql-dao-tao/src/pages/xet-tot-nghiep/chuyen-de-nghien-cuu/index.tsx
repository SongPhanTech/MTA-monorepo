import { FileOutlined } from "@ant-design/icons";
import Select from "@components/commons/select";
import Table from "@components/commons/table";
import TreeSelect from "@components/commons/tree-select";
import DefaultLayout from "@layouts/default-layout";
import { buildOrgTree } from "@lib/utils";
import {
  useFindManyDM_DonVi,
  useFindManySemester,
  useFindManyStudentSubjectScore,
  useFindManySubjectClass,
  useFindManyTrainingCourse,
  useFindManyTrainingObjectType,
} from "@workspace/db/hooks";
import { Button, Col, DatePicker, Form, Row } from "antd";
import dayjs from "dayjs";
import { useMemo } from "react";

interface ChuyenDeNghienCuuForm {
  trainingObjectTypeId: string;
  trainingCourseId: string;
  organizationId: string;
  semesterId: string;
}
interface TimeReportForm {
  subjectClassId: string;
  reportDate: string;
}

export default function ChuyenDeNghienCuu() {
  const [form] = Form.useForm<ChuyenDeNghienCuuForm>();
  const [timeReportForm] = Form.useForm<TimeReportForm>();
  const { data: trainingObjectTypeData = [] } = useFindManyTrainingObjectType();
  const { data: trainingCourseData = [] } = useFindManyTrainingCourse();
  const { data: organizationData = [] } = useFindManyDM_DonVi();
  const { data: semesterData = [] } = useFindManySemester();
  const { data: subjectClassData = [] } = useFindManySubjectClass();
  const where = useMemo(() => {
    return {
      studentResearchTopic: {
        isNot: null,
      },
    };
  }, []);
  const {
    data: studentSubjectScoreData = [],
    refetch: refetchStudentSubjectScore,
  } = useFindManyStudentSubjectScore({
    where,
    include: {
      studentResearchTopic: {
        include: {
          supervisor: {
            include: {
              userProfile: true,
            },
          },
          coSupervisor: {
            include: {
              userProfile: true,
            },
          },
        },
      },
      subjectClass: {
        include: {
          trainingObjectType: true,
          semester: true,
        },
      },
      student: {
        include: {
          fixedClass: {
            include: {
              trainingCourse: true,
            },
          },
        },
      },
      subjectVersion: {
        include: {
          subject: {
            include: {
              managementOrganization: true,
            },
          },
        },
      },
    },
  });

  const treeOrgData = buildOrgTree(organizationData ?? [], "0");
  return (
    <Row gutter={[16, 0]}>
      <Col span={24}>
        <Row gutter={[16, 16]} align="top" justify="space-between">
          <Col span={24}>
            <Form
              form={form}
              layout="horizontal"
              className="w-full mb-6 flex flex-wrap items-end gap-4"
            >
              <Form.Item
                name="trainingObjectTypeId"
                label="Đối tượng"
                className="mb-0"
              >
                <Select
                  className="w-36"
                  options={trainingObjectTypeData?.map((item) => ({
                    label: item.name,
                    value: item.id,
                  }))}
                  placeholder="Chọn đối tượng"
                />
              </Form.Item>

              <Form.Item
                name="trainingCourseId"
                label="Khóa học"
                className="mb-0"
              >
                <Select
                  className="w-36"
                  options={
                    trainingCourseData?.map((item) => ({
                      label: item.name,
                      value: item.id,
                    })) || []
                  }
                  placeholder="Chọn khóa học"
                />
              </Form.Item>

              <Form.Item
                name="organizationId"
                label="Khoa quản lí"
                className="mb-0"
              >
                <TreeSelect
                  className="w-80"
                  placeholder="Chọn khoa quản lý"
                  allowClear
                  showSearch
                  treeDefaultExpandAll
                  treeData={treeOrgData}
                />
              </Form.Item>

              <Form.Item name="semesterId" label="Học kỳ" className="mb-0">
                <Select
                  className="w-64"
                  maxTagCount="responsive"
                  maxTagPlaceholder={(omittedValues) =>
                    `+${omittedValues.length}`
                  }
                  options={semesterData?.map((x) => {
                    return {
                      label: x.name,
                      value: x.id,
                    };
                  })}
                  placeholder="Chọn học kỳ"
                />
              </Form.Item>

              <Form.Item className="mb-0">
                <div className="flex gap-2">
                  <Button type="primary" onClick={() => {}}>
                    Xem dữ liệu
                  </Button>
                  <Button
                    type="primary"
                    icon={<FileOutlined />}
                    onClick={() => {}}
                  >
                    Phụ lục QĐ chuyên đề nghiên cứu
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </Col>
        </Row>
        <Row gutter={[16, 16]} align="top" justify="space-between">
          <Col span={24}>
            <Form
              form={timeReportForm}
              layout="horizontal"
              className="w-full mb-6 flex flex-wrap items-end gap-4"
            >
              <Form.Item
                name="subjectClassId"
                label="Lớp môn học"
                className="mb-0"
              >
                <Select
                  className="w-46"
                  options={subjectClassData?.map((item) => ({
                    label: `${item.code} - ${item.name}`,
                    value: item.id,
                  }))}
                  placeholder="Chọn lớp môn học"
                />
              </Form.Item>

              <Form.Item className="mb-0">
                <div className="flex gap-2">
                  <Button type="primary" onClick={() => {}}>
                    Lấy dữ liệu
                  </Button>
                  <Button type="primary" onClick={() => {}}>
                    Lấy điểm từ lớp môn học sang
                  </Button>
                </div>
              </Form.Item>
              <Form.Item
                name="reportDate"
                label="Hạn nhập chuyên đề"
                className="mb-0"
              >
                <DatePicker
                  className="w-36"
                  format="DD/MM/YYYY"
                  placeholder="Chọn hạn nhập chuyên đề"
                />
              </Form.Item>
              <Form.Item className="mb-0">
                <div className="flex gap-2">
                  <Button type="primary" onClick={() => {}}>
                    Gán ngày
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </Col>
        </Row>
        <Table
          columns={[
            {
              title: "Hạn nhập chuyên đề",
              width: 200,
              align: "left",
              render: (_, record) => {
                return (
                  <div>
                    {record.studentResearchTopic?.deadline
                      ? dayjs(record.studentResearchTopic?.deadline).format(
                          "DD/MM/YYYY"
                        )
                      : ""}
                  </div>
                );
              },
            },
            {
              title: "ĐTĐT",
              width: 150,
              align: "left",
              render: (_, record) => {
                return record?.subjectClass?.trainingObjectType?.name || "";
              },
            },
            {
              title: "Khóa học",
              width: 150,
              align: "left",
              render: (_, record) => {
                return record?.student?.fixedClass?.trainingCourse?.name || "";
              },
            },
            {
              title: "Học kỳ",
              width: 150,
              align: "left",
              render: (_, record) => {
                return record?.subjectClass?.semester?.name || "";
              },
            },
            {
              title: "Sinh viên",
              width: 150,
              align: "left",
              render: (_, record) => {
                return `${record?.student?.userProfile?.lastName || ""} ${
                  record?.student?.userProfile?.firstName || ""
                }`.trim();
              },
            },
            {
              title: "Lớp môn học",
              width: 150,
              align: "left",
              render: (_, record) => {
                return record?.subjectClass?.name || "";
              },
            },
            {
              title: "STC",
              width: 50,
              align: "left",
              render: (_, record) => {
                return record?.subjectVersion?.credit || "";
              },
            },
            {
              title: "Tên chuyên đề",
              width: 250,
              align: "left",
              render: (_, record) => {
                return record?.studentResearchTopic?.name || "";
              },
            },
            {
              title: "Nội dung chính đạt được",
              width: 250,
              align: "left",
              render: (_, record) => {
                return record?.studentResearchTopic?.mainContent || "";
              },
            },
            {
              title: "GVHD1",
              width: 150,
              align: "left",
              render: (_, record) => {
                return `${
                  record?.studentResearchTopic?.supervisor?.userProfile
                    ?.lastName || ""
                }
                 ${
                   record?.studentResearchTopic?.supervisor?.userProfile
                     ?.firstName || ""
                 }`.trim();
              },
            },
            {
              title: "GVHD2",
              width: 150,
              align: "left",
              render: (_, record) => {
                return `${
                  record?.studentResearchTopic?.coSupervisor?.userProfile
                    ?.lastName || ""
                }
                 ${
                   record?.studentResearchTopic?.coSupervisor?.userProfile
                     ?.firstName || ""
                 }`.trim();
              },
            },
            {
              title: "Thời gian báo cáo",
              width: 150,
              align: "left",
              render: (_, record) => {
                return record?.studentResearchTopic?.reportDate
                  ? dayjs(record?.studentResearchTopic?.reportDate).format(
                      "DD/MM/YYYY"
                    )
                  : "";
              },
            },
            {
              title: "Điểm",
              width: 100,
              align: "left",
              render: (_, record) => {
                return record?.finalScore
                  ? Number(record?.finalScore).toFixedSmart(2)
                  : "";
              },
            },
            {
              title: "Thao tác",
              width: 100,
              fixed: "right",
              align: "center",
              render: (_, record) => {
                return <EyeOutlined className="text-sm cursor-pointer" />;
              },
            },
          ]}
          data={studentSubjectScoreData}
          pagination={false}
        />
      </Col>
    </Row>
  );
}
ChuyenDeNghienCuu.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>;
};
