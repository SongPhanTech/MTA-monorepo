import FormItem from "@components/commons/form-item";
import PutFormModal from "@components/commons/put-modal";
import DatePicker from "@components/commons/date-picker";
import useSpinner from "@hooks/spinner";
import { ThesisType } from "@workspace/db/client";
import {
  useCreateStudentThesisRegistration,
  useCreateThesisProject,
  useFindManyExpertProfile,
  useFindManyFixedClass,
  useFindManyStudent,
} from "@workspace/db/hooks";
import { Col, Form, Input, message, Select } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useDisclosure } from "react-hook-disclosure-modal";
import "dayjs/locale/vi";

type PutLibrarySubmissionCreateForm = {
  fixedClassId?: string;
  studentId?: string;
  supervisorId?: string;
  coSupervisorId?: string;
  title?: string;
  submissionDate?: Date;
};

dayjs.locale("vi");

const PutLibrarySubmissionCreate = () => {
  const [form] = Form.useForm<PutLibrarySubmissionCreateForm>();
  const { isOpen, onClose, input } = useDisclosure<{ thesisSessionId?: string }>({
    tag: "PutLibrarySubmissionCreate",
    onClose: form.resetFields,
  });
  const fixedClassId = Form.useWatch("fixedClassId", form);
  const [searchExpert, setSearchExpert] = useState("");

  const {
    mutateAsync: createThesisProject,
    isPending: isPendingCreateThesisProject,
  } = useCreateThesisProject({
    onSuccess: (res) => {
      if (!res?.id) {
        message.error("Không thể tạo dự án luận văn");
      }
    },
    onError: (error: any) => {
      message.error(
        error?.info?.message || "Đã xảy ra lỗi khi tạo dự án luận văn",
      );
    },
  });

  const {
    mutateAsync: createStudentThesisRegistration,
    isPending: isPendingCreateStudentThesisRegistration,
  } = useCreateStudentThesisRegistration({
    onSuccess: (res) => {
      if (res) {
        message.success("Tạo đăng ký luận văn cho sinh viên thành công");
      }
      onClose();
    },
    onError: (error: any) => {
      message.error(
        error?.info?.message ||
          "Đã xảy ra lỗi khi tạo đăng ký luận văn cho sinh viên",
      );
    },
  });

  const { data: fixedClasses = [] } = useFindManyFixedClass({
    orderBy: [{ name: "asc" }, { code: "asc" }],
  });

  const { data: students = [] } = useFindManyStudent(
    {
      where: {
        fixedClassId: fixedClassId,
      },
      include: {
        userProfile: true,
        fixedClass: true,
      },
    },
    {
      enabled: !!fixedClassId,
    },
  );

  const { data: expertProfiles = [] } = useFindManyExpertProfile({
    where: {
      ...(searchExpert
        ? {
            OR: [
              {
                name: { contains: searchExpert, mode: "insensitive" },
              },
              {
                lecturer: {
                  userProfile: {
                    fullname: { contains: searchExpert, mode: "insensitive" },
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      lecturer: {
        include: {
          userProfile: true,
        },
      },
    },
  });

  const onOk = async (values?: PutLibrarySubmissionCreateForm) => {
    if (!values?.fixedClassId) return;

    if (!values?.studentId) return;

    const thesisProject = await createThesisProject({
      data: {
        title: values?.title?.trim(),
        thesisType: ThesisType.THESIS,
        thesisSessionId: input?.thesisSessionId || null,
        supervisorId: values.supervisorId || null,
        coSupervisorId: values.coSupervisorId || null,
        librarySubmission: {
          create: {
            submissionDate: values.submissionDate,
            isHardcopy: false,
            isSoftcopy: false,
            librarianNote: "",
          },
        },
      },
    });

    if (!thesisProject?.id) {
      return;
    }

    await createStudentThesisRegistration({
      data: {
        studentId: values.studentId,
        thesisProjectId: thesisProject?.id,
      },
    });
  };

  const handleSearchExpert = (value: string) => {
    setSearchExpert(value);
  };

  return (
    <PutFormModal
      open={isOpen}
      confirmLoading={
        isPendingCreateThesisProject || isPendingCreateStudentThesisRegistration
      }
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title="Tạo mới thông tin luận văn thư viện"
      className="w-[720px]"
    >
      <Col span={12}>
        <FormItem form={form} name="title" label="Tên đề tài" required>
          <Input placeholder="Nhập tên đề tài" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="submissionDate" label="Ngày nộp" required>
          <DatePicker
            placeholder="Chọn ngày nộp"
            format={{ format: "DD/MM/YYYY", type: "mask" }}
            className="w-full"
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="fixedClassId" label="Lớp quản lý" required>
          <Select
            placeholder="Chọn lớp quản lý"
            options={fixedClasses.map((item) => ({
              label: `${item.code ? `${item.code} - ` : ""}${item.name}`,
              value: item.id,
            }))}
            showSearch
            filterOption={(inputValue, option) =>
              String(option?.label)
                .toLowerCase()
                .includes(inputValue.toLowerCase())
            }
          />
        </FormItem>
      </Col>

      <Col span={12}>
        <FormItem form={form} name="studentId" label="Sinh viên">
          <Select
            placeholder="Chọn sinh viên"
            options={students.map((item) => ({
              label: `${item.code ? `${item.code} - ` : ""}${item.userProfile?.fullname || ""}`,
              value: item.id,
            }))}
            disabled={!fixedClassId}
            showSearch
            filterOption={(inputValue, option) =>
              String(option?.label).toLowerCase().includes(inputValue)
            }
            allowClear
          />
        </FormItem>
      </Col>

      <Col span={12}>
        <FormItem
          form={form}
          name="supervisorId"
          label="Giảng viên hướng dẫn 1"
        >
          <Select
            placeholder="Chọn giảng viên hướng dẫn 1"
            showSearch
            filterOption={false}
            onSearch={handleSearchExpert}
            allowClear
            options={expertProfiles.map((item) => ({
              label: `${item.code ? `${item.code} - ` : ""}${item.lecturer?.userProfile?.fullname || item.name || ""}`,
              value: item.id,
            }))}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem
          form={form}
          name="coSupervisorId"
          label="Giảng viên hướng dẫn 2"
        >
          <Select
            placeholder="Chọn giảng viên hướng dẫn 2"
            showSearch
            filterOption={false}
            onSearch={handleSearchExpert}
            allowClear
            options={expertProfiles.map((item) => ({
              label: `${item.code ? `${item.code} - ` : ""}${item.lecturer?.userProfile?.fullname || item.name || ""}`,
              value: item.id,
            }))}
          />
        </FormItem>
      </Col>
    </PutFormModal>
  );
};

export default PutLibrarySubmissionCreate;
