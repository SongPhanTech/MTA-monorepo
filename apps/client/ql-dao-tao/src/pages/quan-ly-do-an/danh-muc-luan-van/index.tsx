import Select from "@components/commons/select";
import Table from "@components/commons/table";
import DeleteIcon from "@components/icons/delete";
import EditIcon from "@components/icons/edit";
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants";
import useSpinner from "@hooks/spinner";
import DefaultLayout from "@layouts/default-layout";
import {
  useCountStudent,
  useCreateStudentThesisRegistration,
  useCreateThesisProject,
  useFindManyDM_DonVi,
  useFindManyExpertProfile,
  useFindManyFixedClass,
  useFindManyStudent,
  useFindManyThesisSession,
  useFindManyTrainingCourse,
  useUpdateThesisProject,
} from "@workspace/db/hooks";
import { useAbility } from "@workspace/permissions/hooks";
import { QL_DAO_TAO_PERMISSION } from "@workspace/router";
import { dayjs, useTrainingObjectTypeStore } from "@workspace/ui";
import { Button, Col, Flex, Form, Input, message, Row } from "antd";

import { BookPlus } from "lucide-react";
import type React from "react";
import { useState } from "react";

export default function PostgraduateProject() {
  const { can } = useAbility();
  const [editingRowKey, setEditingRowKey] = useState<string | null>(null);

  const [editingValues, setEditingValues] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE);
  const handleSave = async (rowId: string) => {
    try {
      showSpinner();
      const payload = {
        title: editingValues.title,
        description: `Ngôn ngữ: ${editingValues.language} - Luận án/Đề án: ${editingValues.type}`,
        supervisor: {
          connect: {
            id: editingValues.supervisor,
          },
        },

        coSupervisor: {
          connect: {
            id: editingValues.coSupervisor,
          },
        },
      };
      await updateThesisProject({
        data: payload,
        where: {
          id: rowId,
        },
      });

      message.success("Lưu thành công");
    } catch (error) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại");
    } finally {
      hideSpinner();
      await refetch();
      if (refetchCount) await refetchCount();
    }
    setEditingRowKey(null);
    setEditingValues({});
  };
  const { TextArea } = Input;
  const { id: trainingObjectId } = useTrainingObjectTypeStore();
  const [trainingCourseSelected, setTrainingCourseSelected] = useState<
    string[]
  >([]);
  const [fixedClassesSelected, setFixedClassesSelected] = useState<string[]>(
    []
  );
  const [queryFixedClasses, setQueryFixedClasses] = useState<string[]>([]);
  const [needAllStudents, setNeedAllStudents] = useState<boolean>(false);
  const [hasClickedFetch, setHasClickedFetch] = useState<boolean>(false);

  const { data: sDm_Donvi } = useFindManyDM_DonVi();
  const [thesisSessionSelected, setThesisSessionSelected] = useState<any>(null);

  const { data: trainingCourses } = useFindManyTrainingCourse(
    {
      where: {
        id: thesisSessionSelected?.trainingCourseId,
      },
    },
    {
      enabled: !!thesisSessionSelected?.trainingCourseId,
    }
  );

  const { data: fixedClasses } = useFindManyFixedClass({
    where: {
      trainingCourseId: {
        in: trainingCourseSelected,
      },
    },
  });
  const { data: expertProfileData } = useFindManyExpertProfile({
    include: {
      lecturer: {
        include: {
          userProfile: true,
        },
      },
    },
  });
  const handleEditChange = (field: string, value: any) => {
    setEditingValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const defaultButtonClick = () => {
    message.info("Tính năng đang trong quá trình phát triển");
  };
  const buttonList = [
    {
      id: 1,
      label: "Phụ lục ds luận văn",
      onClick: () => defaultButtonClick(),
    },
    {
      id: 2,
      label: "Sao QĐ HDLV",
      onClick: () => defaultButtonClick(),
    },
    {
      id: 3,
      label: "Giấy mời HDLV",
      onClick: () => defaultButtonClick(),
    },
    {
      id: 5,
      label: "Giấy mời chấm LV PB",
      onClick: () => defaultButtonClick(),
    },
    {
      id: 6,
      label: "Phụ lục QĐHĐ",
      onClick: () => defaultButtonClick(),
    },
    {
      id: 6.1,
      label: "Bản sao HDDGLV",
      onClick: () => defaultButtonClick(),
    },
    {
      id: 7,
      label: "Đề xuất hội đồng",
      onClick: () => defaultButtonClick(),
    },
    {
      id: 8,
      label: "Hồ sơ BV LV",
      onClick: () => defaultButtonClick(),
    },
    {
      id: 9,
      label: "Danh sách bảo vệ",
      onClick: () => defaultButtonClick(),
    },
    {
      id: 10,
      label: "Danh sách bảo vệ(Dán PBV)",
      onClick: () => defaultButtonClick(),
    },
    
    {
      id: 12,
      label: "Danh sách chuyên gia",
      onClick: () => defaultButtonClick(),
    },
   
    {
      id: 13,
      label: "Thanh toán hướng dẫn",
      onClick: () => defaultButtonClick(),
    },
    {
      id: 13.1,
      label: "Thanh toán hướng dẫn - Ngoài HV",
      onClick: () => defaultButtonClick(),
    },
    {
      id: 14,
      label: "Thông kê CBHD LV",
      onClick: () => defaultButtonClick(),
    },
    {
      id: 15,
      label: "Thống kê cán bộ tham gia HĐ",
      onClick: () => defaultButtonClick(),
    },
    {
      id: 16,
      label: "Thống kê KQ BV LV",
      onClick: () => defaultButtonClick(),
    },
    {
      id: 19,
      label: "Danh sách nộp luận văn thư viện",
      onClick: () => defaultButtonClick(),
      
    },
    {
      id: 11,
      label: "Thanh toán hội đồng bảo vệ",
      onClick: () => defaultButtonClick(),
    },
  ];
  const { mutateAsync: createThesisProject } = useCreateThesisProject();
  const { mutateAsync: createStudentThesisRegistration } =
    useCreateStudentThesisRegistration();
  const { mutateAsync: updateThesisProject } = useUpdateThesisProject();
  const { data: thesisSessionData } = useFindManyThesisSession({
    orderBy: { startDate: "desc" },
    where: {
      trainingObjectTypeId: trainingObjectId,
    },
    include: {
      trainingObjectType: true,
      trainingCourse: true,
    },
  });

  const { showSpinner, hideSpinner } = useSpinner();

  const { data: students, refetch } = useFindManyStudent(
    {
      where: {
        fixedClassId: {
          in: queryFixedClasses,
        },
      },
      include: {
        userProfile: true,
        fixedClass: {
          include: {
            trainingCourse: true,
          },
        },
        trainingObjectType: true,
        thesisRegistrations: {
          include: {
            thesisProject: {
              include: {
                organization: true,
                supervisor: true,
                coSupervisor: true,
              },
            },
          },
        },
      },
      skip: (currentPage - 1) * numberOfPages,
      take: numberOfPages,
    },
    {
      enabled: hasClickedFetch,
    }
  );
  const { data: allStudents } = useFindManyStudent(
    {
      where: {
        fixedClassId: {
          in: queryFixedClasses,
        },
      },
      include: {
        userProfile: true,
        fixedClass: {
          include: {
            trainingCourse: true,
          },
        },
        trainingObjectType: true,
      },
    },
    { enabled: needAllStudents }
  );
  const { data: countStudent, refetch: refetchCount } = useCountStudent(
    {
      where: {
        fixedClassId: {
          in: queryFixedClasses,
        },
      },
    },
    {
      enabled: hasClickedFetch,
    }
  );
  const taodulieumau = async () => {
    showSpinner();
    setNeedAllStudents(true);
    const createPromises = allStudents?.map(async (student) => {
      const payload = {
        title: "",
        summary: "",
        titleEN: "",
        supervisorId: expertProfileData?.[0]?.id ?? "",
        organizationId: sDm_Donvi?.[0]?.Id ?? "",
        maxStudents: 1,
        description: "Ngôn ngữ: Tiếng Việt - Luận án/Đề án: Luận văn",
      };
      const response = await createThesisProject({
        data: {
          ...payload,
        },
      });
      const payloadRegistration = {
        thesisProjectId: response?.id ?? "",
        studentId: student.id,
      };
      const responseRegistration = await createStudentThesisRegistration({
        data: payloadRegistration,
      });
      return { response, responseRegistration };
    });
    try {
      await Promise.all(createPromises || []);
      message.success("Tạo dữ liệu mẫu thành công");
    } catch (error) {
      message.error("Đã xảy ra lỗi trong lúc tạo dữ liệu mẫu");
    } finally {
      hideSpinner();
    }
  };

  return (
    <div>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <Row gutter={[16, 16]} align="top" justify="space-between">
            <Col span={24}>
              <Flex gap={12}>
                <Form.Item name="searchDotXet" label="Đợt xét" required>
                  <Select
                    className="w-36"
                    options={thesisSessionData?.map((item) => ({
                      label: item.name,
                      value: item.id,
                    }))}
                    onChange={(value) => {
                      setThesisSessionSelected(
                        thesisSessionData?.find((x) => x.id === value) || null
                      );
                      setTrainingCourseSelected([]);
                      setFixedClassesSelected([]);
                    }}
                    placeholder="Chọn đợt xét"
                  />
                </Form.Item>
                <Form.Item name="searchKhoaHoc" label="Khóa học" required>
                  <Select
                    className="w-36"
                    mode="multiple"
                    options={
                      trainingCourses?.map((item) => ({
                        label: item.name,
                        value: item.id,
                      })) || []
                    }
                    onChange={(value) => {
                      setTrainingCourseSelected(value as string[]);
                    }}
                    placeholder="Chọn khóa học"
                    disabled={!thesisSessionSelected}
                  />
                </Form.Item>
                <Form.Item name="searchText" label="Lớp học" required>
                  <Select
                    mode="multiple"
                    className="w-36"
                    options={fixedClasses?.map((x) => {
                      return {
                        label: x.name,
                        value: x.id,
                      };
                    })}
                    onChange={(value) => {
                      setFixedClassesSelected(value as string[]);
                    }}
                    placeholder="Chọn lớp học"
                  />
                </Form.Item>
                <Form.Item name="searchKhoaQuanLy" label="Khoa quản lí">
                  <Select
                    mode="multiple"
                    className="w-40"
                    options={sDm_Donvi?.map((x) => {
                      return {
                        label: x.sTen,
                        value: x.Id,
                      };
                    })}
                    placeholder="Chọn khoa quản lí"
                  />
                </Form.Item>
                <Form.Item className="flex justify-end gap-3">
                  <Button
                    type="primary"
                    onClick={() => {
                      // 1. "Chốt" bộ lọc: Copy giá trị từ UI vào Query
                      setQueryFixedClasses(fixedClassesSelected);

                      // 2. Kích hoạt hook (chỉ cho lần đầu tiên)
                      if (!hasClickedFetch) {
                        setHasClickedFetch(true);
                      }
                    }}
                  >
                    Xem kết quả
                  </Button>
                  <Button
                    type="primary"
                    className="ml-2"
                    onClick={async () => await taodulieumau()}
                  >
                    Tạo dữ liệu mẫu
                  </Button>
                </Form.Item>
              </Flex>
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col>
              <Flex  gap={4} wrap="wrap">
                {buttonList.map((item) => (
                  <Button key={item.id} type="primary" onClick={item.onClick}>
                    {item.id}. {item.label}
                  </Button>
                ))}
              </Flex>
            </Col>
          </Row>
        </Col>

        <Col span={24}>
          <Table
            className="w-full custom-scrollbar mt-2 "
            rowKey="id"
            columns={[
              {
                title: "Đối tượng đào tạo",
                width: 100,
                render: (_, record) => {
                  return record?.trainingObjectType?.name;
                },
              },
              {
                title: "Đợt xét",
                width: 100,
                render: (_) => {
                  return thesisSessionSelected?.name;
                },
              },
              {
                title: "Mã sinh viên",
                width: 100,
                render: (_, record) => {
                  return record?.code;
                },
              },
              {
                title: "Họ tên",
                width: 180,
                dataIndex: "name",
                render: (_, record) => {
                  return record?.userProfile?.fullname;
                },
              },
              {
                title: "Ngày sinh",
                width: 130,
                dataIndex: "name",
                render: (_, record) => {
                  return record?.userProfile?.dateOfBirth
                    ? dayjs(record?.userProfile?.dateOfBirth).format(
                        "DD/MM/YYYY"
                      )
                    : "";
                },
              },
              {
                title: "Đề tài",
                width: 200,
                dataIndex: "title",
                render: (text: string, record: any) => {
                  if (record?.id === editingRowKey) {
                    return (
                      <TextArea
                        rows={2}
                        value={
                          editingValues.title ||
                          record?.thesisRegistrations?.[0]?.thesisProject
                            ?.title ||
                          ""
                        }
                        onChange={(e) => {
                          console.log("value", e.target.value);
                          handleEditChange("title", e.target.value);
                        }}
                      />
                    );
                  }
                  return (
                    record?.thesisRegistrations?.[0]?.thesisProject?.title || ""
                  );
                },
              },
              {
                title: "GVHD 1",
                width: 150,
                dataIndex: "supervisor",
                render: (text: string, record: any) => {
                  if (record?.id === editingRowKey) {
                    return (
                      <Select
                        className="w-full"
                        options={expertProfileData?.map((item) => ({
                          label: item.name,
                          value: item.id,
                        }))}
                        value={
                          editingValues.supervisor ||
                          record?.thesisRegistrations?.[0]?.thesisProject
                            ?.supervisor?.name ||
                          ""
                        }
                        onChange={(value) =>
                          handleEditChange("supervisor", value)
                        }
                      />
                    );
                  }
                  return (
                    record?.thesisRegistrations?.[0]?.thesisProject?.supervisor
                      ?.name || ""
                  );
                },
              },
              {
                title: "GVHD 2",
                width: 150,
                dataIndex: "coSupervisor",
                render: (text: string, record: any) => {
                  if (record?.id === editingRowKey) {
                    return (
                      <Select
                        className="w-full"
                        options={expertProfileData?.map((item) => ({
                          label: item.name,
                          value: item.id,
                        }))}
                        value={
                          editingValues.coSupervisor ||
                          record?.thesisRegistrations?.[0]?.thesisProject
                            ?.coSupervisor?.name ||
                          ""
                        }
                        onChange={(value) =>
                          handleEditChange("coSupervisor", value)
                        }
                      />
                    );
                  }
                  return record;
                },
              },
              {
                title: "Ngôn ngữ",
                width: 100,
                dataIndex: "language",
                render: (text: string, record: any) => {
                  if (record?.id === editingRowKey) {
                    return (
                      <Input
                        value={
                          editingValues.language ||
                          record?.thesisRegistrations?.[0]?.thesisProject?.description
                            ?.split("-")[0]
                            .trim()
                            .split(":")[1] ||
                          ""
                        }
                        onChange={(e) =>
                          handleEditChange("language", e.target.value)
                        }
                      />
                    );
                  }
                  const data =
                    record?.thesisRegistrations?.[0]?.thesisProject
                      ?.description;
                  return data ? data.split("-")[0].trim().split(":")[1] : "";
                },
              },
              {
                title: "Luận văn/Đề án",
                width: 130,
                dataIndex: "type",
                render: (text: string, record: any) => {
                  if (record?.id === editingRowKey) {
                    return (
                      <Select
                        className="w-full"
                        options={["Luận văn", "Đề án"].map((item) => ({
                          label: item,
                          value: item,
                        }))}
                        value={
                          editingValues.type ||
                          record?.thesisRegistrations?.[0]?.thesisProject?.description
                            ?.split("-")[1]
                            .trim()
                            .split(":")[1] ||
                          ""
                        }
                        onChange={(value) => handleEditChange("type", value)}
                      />
                    );
                  }
                  const data =
                    record?.thesisRegistrations?.[0]?.thesisProject
                      ?.description;
                  return data ? data.split("-")[1].trim().split(":")[1] : "";
                },
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                render: (_, record: any) => {
                  if (record?.id === editingRowKey) {
                    return (
                      <Row className="justify-center gap-2">
                        <Button
                          size="small"
                          type="primary"
                          onClick={async () =>
                            await handleSave(
                              record?.thesisRegistrations?.[0]?.thesisProject
                                ?.id
                            )
                          }
                        >
                          Lưu
                        </Button>
                        <Button
                          size="small"
                          onClick={() => {
                            setEditingRowKey(null);
                            setEditingValues({}); // Xóa giá trị tạm
                          }}
                        >
                          Hủy
                        </Button>
                      </Row>
                    );
                  }

                  if (record?.id) {
                    return (
                      <Row className="justify-center gap-2">
                        <EditIcon
                          className="text-sm text-blue-700 cursor-pointer"
                          onClick={() => {
                            setEditingRowKey(record?.id);

                            setEditingValues({
                              title:
                                record?.thesisRegistrations?.[0]?.thesisProject
                                  ?.title || "",
                              supervisor:
                                record?.thesisRegistrations?.[0]?.thesisProject
                                  ?.supervisor?.id || "",
                              coSupervisor:
                                record?.thesisRegistrations?.[0]?.thesisProject
                                  ?.coSupervisor?.id || "",
                              language:
                                record?.thesisRegistrations?.[0]?.thesisProject?.description
                                  ?.split("-")[0]
                                  .trim()
                                  .split(":")[1] || "",
                              type:
                                record?.thesisRegistrations?.[0]?.thesisProject?.description
                                  ?.split("-")[1]
                                  .trim()
                                  .split(":")[1] || "",
                            });
                          }}
                        />
                        <DeleteIcon
                          className="text-sm text-red-700 cursor-pointer"
                          onClick={async () => {
                            const payload = {
                              deletedAt: new Date(),
                            };
                            try {
                              showSpinner();
                              await updateThesisProject({
                                data: payload,
                                where: {
                                  id: record?.id,
                                },
                              });
                              message.success("Xóa thành công");
                            } catch (error) {
                              message.error(
                                "Đã xảy ra lỗi, vui lòng kiểm tra lại"
                              );
                            } finally {
                              hideSpinner();
                            }
                          }}
                        />
                      </Row>
                    );
                  }
                  return "";
                },
              },
            ]}
            data={students}
            pagination={{
              current: currentPage,
              pageSize: numberOfPages,
              total: countStudent || 0,
              onChange: async (page, pageSize) => {
                if (numberOfPages === pageSize) {
                  setCurrentPage(page);
                } else {
                  setCurrentPage(1);
                  setNumberOfPages(pageSize);
                }
              },
            }}
          />
        </Col>
      </Row>
    </div>
  );
}

PostgraduateProject.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>;
};
