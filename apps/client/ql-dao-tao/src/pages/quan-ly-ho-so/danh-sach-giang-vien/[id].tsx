import { CheckOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DefaultLayout from "@layouts/default-layout"
import type { SubjectVersion } from "@workspace/db/client"
import { useFindUniqueLecturer } from "@workspace/db/hooks"
import { ROUTER_PATH } from "@workspace/router"
import { Col, Row } from "antd"
import { useRouter } from "next/router"

export default function StudentDetailPage() {
  const router = useRouter()
  const lecturerId = router.query.id as string
  const { data: lecturerData } = useFindUniqueLecturer(
    {
      where: {
        id: lecturerId,
      },
      include: {
        userProfile: true,
        mainSubjectClasses: {
          include: {
            subject: true,
            extraLecturer: {
              include: {
                userProfile: true,
              },
            },
            semester: {
              select: {
                name: true,
                schoolYear: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        extraSubjectClasses: {
          include: {
            subject: true,
            mainLecturer: {
              include: {
                userProfile: true,
              },
            },
          },
        },
        manageFixedClass: {
          include: {
            managementOrganization: true,
            curriculumVersion: true,
            trainingCourse: true,
          },
        },
      },
    },
    {
      enabled: !!lecturerId,
    }
  )

  return (
    <div>
      {/* Header với breadcrumb và nút quay lại */}
      <div className="mb-6">
        <Row gutter={16}>
          <Col span={24} className="mb-6">
            <div className="text-lg font-semibold">
              {[
                lecturerData?.userProfile?.code,
                lecturerData?.userProfile?.fullname ??
                  [lecturerData?.userProfile?.firstName, lecturerData?.userProfile?.lastName]
                    .filter(Boolean)
                    .join(" "),
              ]
                .filter(Boolean)
                .join(" - ")}
            </div>
          </Col>
          <Col span={24} className="mb-6">
            <div className="text-lg font-[500]">Danh sách lớp được quản lý</div>
            <Table
              rowKey="id"
              id="fixed-class"
              onRowClick={(record) => {
                router.push(
                  ROUTER_PATH.QL_DAO_TAO.DANH_MUC_LOP_BIEN_CHE_ID.replace("[id]", String(record.id))
                )
              }}
              columns={[
                {
                  title: "STT",
                  width: 50,
                  align: "center",
                  fixed: "left",
                  render: (_, __, index) => index + 1,
                },
                {
                  title: "Mã lớp quản lý",
                  align: "center",
                  width: 150,
                  fixed: "left",
                  dataIndex: "code",
                },
                {
                  title: "Tên lớp quản lý",
                  align: "center",
                  width: 200,
                  fixed: "left",
                  dataIndex: "name",
                },
                {
                  title: "Đơn vị quản lý",
                  dataIndex: "managementOrganization",
                  align: "center",
                  width: 200,
                  render: (value) => (value?.sTen ? value?.sTen : ""),
                },
                {
                  title: "Khoá",
                  dataIndex: "trainingCourse",
                  align: "center",
                  width: 150,
                  render: (value) => (value?.name ? value?.name : ""),
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
                  width: 150,
                  dataIndex: "trainingLevel",
                  render: (__, record) => record?.curriculumVersion?.trainingLevel?.name || "",
                },
                {
                  title: "Chương trình đào tạo",
                  dataIndex: "curriculumVersion",
                  align: "center",
                  width: 250,
                  render: (value) => (value?.name ? value?.name : ""),
                },
                {
                  title: "Đã tốt nghiệp",
                  align: "center",
                  width: 150,
                  dataIndex: "graduated",
                  render: (value) => (value ? <CheckOutlined className="text-[#028850]" /> : ""),
                },
              ]}
              data={lecturerData?.manageFixedClass || []}
              pagination={false}
            />
          </Col>
          <Col span={24} className="mb-6">
            <div className="text-lg font-[500]">Danh sách lớp giảng dạy</div>
            <Table
              rowKey="id"
              id="training-category"
              columns={[
                {
                  title: "STT",
                  width: 50,
                  align: "center",
                  fixed: "left",
                  render: (_, __, index) => index + 1,
                },
                {
                  title: "Mã lớp môn học",
                  dataIndex: "code",
                  width: 150,
                  fixed: "left",
                  align: "center",
                },
                {
                  title: "Tên môn học",
                  dataIndex: "name",
                  width: 200,
                  fixed: "left",
                  align: "center",
                },
                {
                  title: "Số tín chỉ",
                  dataIndex: "credit",
                  width: 120,
                  align: "center",
                  render: (__, record: { subject?: SubjectVersion }) =>
                    record.subject?.credit ? record.subject?.credit : "",
                },
                {
                  title: "Số SV tối đa",
                  dataIndex: "maxStudent",
                  width: 150,
                  align: "center",
                },
                {
                  title: "Số SV",
                  dataIndex: "subjectClassStudent",
                  width: 100,
                  align: "center",
                  render: (value) => (value?.length ? value?.length : ""),
                },
                {
                  title: "Học kỳ",
                  dataIndex: "semester",
                  width: 100,
                  align: "center",
                  render: (value) => (value ? `${value?.name} - ${value?.schoolYear?.name}` : ""),
                },
                {
                  title: "Trợ giảng",
                  width: 300,
                  align: "center",
                  dataIndex: "extraLecturer",
                  render: (__, record) => record?.extraLecturer?.userProfile?.fullName || "",
                },
                {
                  title: "Đơn vị phụ trách",
                  dataIndex: "subject",
                  width: 130,
                  align: "center",
                  render: (value) => value?.managementOrganization?.sMa || "",
                },
              ]}
              data={lecturerData?.mainSubjectClasses || []}
              pagination={false}
            />
          </Col>
          <Col span={24}>
            <div className="text-lg font-[500]">Danh sách lớp trợ giảng</div>
            <Table
              rowKey="id"
              id="1iu23"
              columns={[
                {
                  title: "STT",
                  width: 50,
                  align: "center",
                  fixed: "left",
                  render: (_, __, index) => index + 1,
                },
                {
                  title: "Mã lớp môn học",
                  dataIndex: "code",
                  width: 150,
                  fixed: "left",
                  align: "center",
                },
                {
                  title: "Tên môn học",
                  dataIndex: "name",
                  width: 200,
                  fixed: "left",
                  align: "center",
                },
                {
                  title: "Số tín chỉ",
                  dataIndex: "credit",
                  width: 120,
                  align: "center",
                  render: (__, record: { subject?: SubjectVersion }) =>
                    record.subject?.credit ? record.subject?.credit : "",
                },
                {
                  title: "Số SV tối đa",
                  dataIndex: "maxStudent",
                  width: 150,
                  align: "center",
                },
                {
                  title: "Số SV",
                  dataIndex: "subjectClassStudent",
                  width: 100,
                  align: "center",
                  render: (value) => (value?.length ? value?.length : ""),
                },
                {
                  title: "Giảng viên chính",
                  width: 300,
                  align: "center",
                  dataIndex: "mainLecturer",
                  render: (__, record) => record?.mainLecturer?.userProfile?.fullName || "",
                },
                {
                  title: "Đơn vị phụ trách",
                  dataIndex: "subject",
                  width: 130,
                  align: "center",
                  render: (value) => value?.managementOrganization?.sMa || "",
                },
              ]}
              data={lecturerData?.extraSubjectClasses || []}
              pagination={false}
            />
          </Col>
        </Row>
      </div>
    </div>
  )
}

StudentDetailPage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <DefaultLayout
      breadcrumbList={[
        { title: "Quản lý hồ sơ" },
        {
          title: "Danh sách giảng viên",
          href: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_HO_SO_DANH_SACH_GIANG_VIEN,
        },
        { title: "Chi tiết giảng viên" },
      ]}
    >
      {page}
    </DefaultLayout>
  )
}
