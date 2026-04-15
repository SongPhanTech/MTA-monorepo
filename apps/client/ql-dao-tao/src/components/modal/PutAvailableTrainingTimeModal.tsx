import PutFormModal from "@components/commons/put-modal";
import {
  useCreateAvailableTrainingTime,
  useFindUniqueAvailableTrainingTime,
  useUpdateAvailableTrainingTime,
} from "@workspace/db/hooks";
import { Col, Form, InputNumber, message } from "antd";
import { useEffect } from "react";
import { useDisclosure } from "react-hook-disclosure-modal";
import { queryClient } from "@api/index";
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui";
export type PutAvailableTrainingTime = {
  duration: number;
};

const PutAvailableTrainingTimeModal = () => {
  const [form] = Form.useForm<PutAvailableTrainingTime>();
  const { id: semesterId } = useSemesterStore();
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore();

  const { isOpen, onClose, input } = useDisclosure<{ id?: string }>({
    tag: "PutAvailableTrainingTimeModal",
    onClose: form.resetFields,
  });
  const { data: initialValue, isLoading: isLoadingAvailableTrainingTime } = useFindUniqueAvailableTrainingTime(
    {
      where: { id: input?.id },
    },
    {
      refetchOnWindowFocus: false,
      enabled: !!input?.id,
    },
  );

  const { mutateAsync: updateAvailableTrainingTime, isPending: isLoadingUpdateAvailableTrainingTime } =
    useUpdateAvailableTrainingTime({
      onSuccess: () => {
        message.success("Cập nhật thành công");
        queryClient.invalidateQueries({
          queryKey: ["AvailableTrainingTime"],
        });
      },
      onError: (error: any) => {
        message.error(
          error?.info?.message || "Đã xảy ra lỗi, vui lòng kiểm tra lại",
        );
      },
      onSettled: () => {
        onClose();
      },
    });

  const { mutateAsync: createAvailableTrainingTime, isPending: isLoadingCreateAvailableTrainingTime } =
    useCreateAvailableTrainingTime({
      onSuccess: () => {
        message.success("Tạo thành công");
        queryClient.invalidateQueries({
          queryKey: ["AvailableTrainingTime"],
        });
      },
      onError: (error: any) => {
        message.error(
          error?.info?.message || "Đã xảy ra lỗi, vui lòng kiểm tra lại",
        );
      },
      onSettled: () => {
        onClose();
      },
    });

  const onOk = async (output?: PutAvailableTrainingTime) => {
    if (!output) return;

    if (!semesterId) {
      message.error("Vui lòng chọn học kỳ");
      return;
    }

    if (!trainingObjectTypeId) {
      message.error("Vui lòng chọn đối tượng đào tạo");
      return;
    }

    const payload = {
      duration: output.duration,
      semesterId,
      trainingObjectTypeId,
    };

    if (input?.id) {
      await updateAvailableTrainingTime({
        where: { id: input.id },
        data: payload,
      });
    } else {
      await createAvailableTrainingTime({
        data: payload,
      });
    }
  };

  useEffect(() => {
    if (initialValue) {
      form.setFieldsValue({
        duration: initialValue.duration,
      });
    }
  }, [initialValue]);

  return (
    <PutFormModal
      loading={isLoadingAvailableTrainingTime}
      confirmLoading={isLoadingCreateAvailableTrainingTime || isLoadingUpdateAvailableTrainingTime}
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={
        input?.id
          ? "Chỉnh sửa quỹ thời gian đào tạo"
          : "Tạo quỹ thời gian đào tạo"
      }
      className="w-[700px]"
    >
      <Col span={24}>
        <Form.Item name="duration" label="Quỹ thời gian" required>
          <InputNumber
            min={0}
            className="w-full"
            placeholder="Nhập quỹ thời gian tính theo Ngày"
          />
        </Form.Item>
      </Col>
    </PutFormModal>
  );
};

export default PutAvailableTrainingTimeModal;
