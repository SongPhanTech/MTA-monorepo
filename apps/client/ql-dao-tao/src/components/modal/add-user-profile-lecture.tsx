import { queryClient } from "@api/index";
import FormItem from "@components/commons/form-item";
import PutFormModal from "@components/commons/put-modal";
import useSpinner from "@hooks/spinner";
import type {
  UserProfile,
  TrainingCourse,
  Organization,
  UserType,
} from "@workspace/db";
import {
  useCreateUserProfile,
  useFindUniqueUserProfile,
  useUpdateUserProfile,
  useFindManyTrainingCourse,
  useFindManyFixedClass,
  useFindManyUserType,
} from "@workspace/db/hooks";
import {
  Col,
  Form,
  Input,
  message,
  Row,
  Upload,
  UploadFile,
  UploadProps,
} from "antd";
import { useEffect, useState } from "react";
import { useDisclosure } from "react-hook-disclosure-modal";
import Select from "@components/commons/select";
import DatePicker from "@components/commons/date-picker";
import dayjs from "dayjs";
import { GENDER_LIST } from "@constants/constants";
export type PutUserProfile = UserProfile;
import "dayjs/locale/vi";
import { fetchGeneratePresignedUrl } from "@api/model/modelComponents";
export interface AddUserProfileLectureProps {
  id: string | null;
  code: string;
}
dayjs.locale("vi");
const AddUserProfileLecture = () => {
  const [form] = Form.useForm<PutUserProfile>();
  const { isOpen, onClose, input } = useDisclosure<AddUserProfileLectureProps>({
    tag: AddUserProfileLecture.name,
    onClose: form.resetFields,
  });
  const { id, code } = input ?? {};
  const { showSpinner, hideSpinner } = useSpinner();

  const { data: userTypeData = [], refetch: refetchUserType } =
    useFindManyUserType({
      take: 1000,
      skip: 0,
    });

  const { mutateAsync: createUserProfile } = useCreateUserProfile();
  const { mutateAsync: updateUserProfile } = useUpdateUserProfile();
  async function onOk(output?: PutUserProfile) {
    console.log(userTypeData?.find((type: any) => type.code === code));
    if (!output) return;
    // const resPresignedUrl = await fetchGeneratePresignedUrl({
    //   body: {
    //     path: "avatar",
    //     extension: fileList[0].name.split(".").pop() ?? "",
    //   },
    // });
    // const res = await fetch(resPresignedUrl.url, {
    //   method: "PUT",
    //   body: fileList[0].originFileObj,
    // });
    // console.log("check res", res);
    try {
      showSpinner();
      if (id) {
        await updateUserProfile({
          data: {
            code: output.code,
            firstName: output.firstName,
            lastName: output.lastName,
            gender: output.gender,
            dateOfBirth: output.dateOfBirth,
            homeTown: output.homeTown,
            idCardNumber: output.idCardNumber,
            phoneNumber: output.phoneNumber,
            userTypeId:
              userTypeData?.find((type: any) => type.code === code)?.id ??
              undefined,
          },
          where: {
            id,
          },
        });
        message.success("Cập nhật thành công");
      } else {
        await createUserProfile({
          data: {
            code: output.code,
            firstName: output.firstName,
            lastName: output.lastName,
            gender: output.gender,
            dateOfBirth: output.dateOfBirth,
            homeTown: output.homeTown,
            idCardNumber: output.idCardNumber,
            phoneNumber: output.phoneNumber,
            userTypeId: userTypeData?.find((type: any) => type.code === code)!
              .id,
          },
        });
        message.success("Thêm mới thành công");
      }
      // refetch() lại danh sách level
      queryClient.invalidateQueries({
        queryKey: ["UserProfile"],
      });
      onClose();
    } catch (error) {
      console.log("error", error);
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại");
    }
    hideSpinner();
  }

  const { data: level } = useFindUniqueUserProfile(
    id
      ? {
          where: {
            id: id,
          },
        }
      : {
          where: {
            id: "",
          },
        }
  );
  useEffect(() => {
    if (level) {
      form.setFieldsValue({
        ...level,
        dateOfBirth: dayjs(level.dateOfBirth),
      });
    }
  }, [level]);

  //upload file
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const beforeUpload = (file: File) => {
    const fileURL = URL.createObjectURL(file);

    const newFile: UploadFile = {
      uid: Date.now().toString(),
      name: file.name,
      status: "done",
      url: fileURL,
      originFileObj: file as any,
    };
    setFileList([newFile]);
    return false;
  };

  const onChange: UploadProps["onChange"] = ({ fileList: newFileList }) => {
    setFileList(newFileList.slice(-1));
  };

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={code === "GV" ? "Thêm mới giáo viên" : "Thêm mới cán bộ"}
      className="w-[30vw]"
    >
      <Row gutter={[40, 0]}>
        <Col span={8}>
          <div
            style={{
              transform: "scale(1.5)",
              transformOrigin: "top left",
              fontSize: "0.65rem",
            }}
          >
            <Form.Item name={"file"} className="mb-0">
              <Upload
                listType="picture-card"
                fileList={fileList}
                onChange={onChange}
                beforeUpload={beforeUpload}
                onRemove={() => {
                  setFileList([]);
                  return true;
                }}
              >
                {fileList.length < 1 && (
                  <p style={{ fontSize: "0.65rem" }}>+ Tải ảnh lên</p>
                )}
              </Upload>
            </Form.Item>
          </div>
        </Col>
        <Col span={16}>
          <Row gutter={[0, 0]}>
            <Col span={24}>
              <FormItem form={form} name="code" label="Mã" required>
                <Input placeholder="Nhập mã" />
              </FormItem>
            </Col>
            <Col span={24}>
              <FormItem
                form={form}
                name="lastName"
                label="Họ và tên đệm"
                required
              >
                <Input placeholder="Nhập họ và tên đệm" />
              </FormItem>
            </Col>
          </Row>
        </Col>
      </Row>
      <Col span={12}>
        <FormItem form={form} name="firstName" label="Tên" required>
          <Input placeholder="Nhập tên" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="dateOfBirth" label="Ngày sinh">
          <DatePicker format="DD/MM/YYYY" className="w-full" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem
          form={form}
          name="gender"
          label="Giới tính"
          // required
        >
          <Select
            placeholder="Chọn giới tính"
            options={GENDER_LIST.map((i: any) => {
              return {
                value: i.id,
                label: i.name,
              };
            })}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="idCardNumber" label="Số CCCD">
          <Input placeholder="Nhập số CCCD" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="phoneNumber" label="Số điện thoại">
          <Input placeholder="Nhập số điện thoại" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="homeTown" label="Quê quán">
          <Input placeholder="Nhập quê quán" />
        </FormItem>
      </Col>
    </PutFormModal>
  );
};

export default AddUserProfileLecture;
