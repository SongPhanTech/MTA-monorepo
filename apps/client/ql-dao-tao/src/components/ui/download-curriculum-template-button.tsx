import useSpinner from "@hooks/spinner";
import { downloadCurriculumImportTemplate } from "@workspace/libs/api/training";
import { getMinioUrl } from "@workspace/libs/utils";
import { Button, message } from "antd";
import type { ButtonProps } from "antd";
import { saveAs } from "file-saver";
import { Download } from "lucide-react";
import type React from "react";

interface DownloadCurriculumTemplateButtonProps extends ButtonProps {
  trainingObjectTypeId?: string;
}

export const DownloadCurriculumTemplateButton = (props: DownloadCurriculumTemplateButtonProps) => {
  const {trainingObjectTypeId, ...rest} = props;
  const { showSpinner, hideSpinner } = useSpinner();

  const handleExportTemplate = async () => {
    if (!trainingObjectTypeId) {
      message.error("Thiếu thông tin loại hình đào tạo!");
      return;
    }
    try {
      showSpinner();
      const res = await downloadCurriculumImportTemplate({
        trainingObjectTypeId,
      });
      if (res.status === 200) {
        saveAs(res.data, "MAU-NHAP_CTDT.xlsx");
      } else {
        message.error(
          res.data.message || "Đã xảy ra lỗi, vui lòng kiểm tra lại",
        );
      }
    } catch (error: any) {
      message.error(error.message || "Đã xảy ra lỗi, vui lòng kiểm tra lại");
    } finally {
      hideSpinner();
    }
  };

  return (
    <Button onClick={handleExportTemplate} {...rest}>
      <Download size={props.size === "small" ? 14 : 16} />
      Mẫu nhập CTĐT
    </Button>
  );
};
