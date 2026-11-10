import { type SelectProps, Tooltip } from "antd"
import { useEffect } from "react"
import { Select } from "../commons"
import { useFindManyTrainingObjectTypePermission, useTrainingObjectTypeStore } from "./hook"

type SelectTrainingObjectTypeProps = SelectProps & {
  subsystem?: string
}

const SelectTrainingObjectType = ({ subsystem, ...props }: SelectTrainingObjectTypeProps) => {
  const { id, onSelect } = useTrainingObjectTypeStore()

  const { data: doiTuongDaoTao = [], isLoading } = useFindManyTrainingObjectTypePermission(undefined, {
    subsystem,
  })

  // Nếu id hiện tại không nằm trong danh sách đối tượng đào tạo được phân quyền
  useEffect(() => {
    if (doiTuongDaoTao.length > 0) {
      const isCurrentIdValid = doiTuongDaoTao.some((e) => e.id === id)
      if (!id || !isCurrentIdValid) {
        onSelect(doiTuongDaoTao[0]!.id)
      }
    }
  }, [id, doiTuongDaoTao, onSelect])

  return (
    <div className="flex items-center gap-2 font-bold">
      <Tooltip title="Đối tượng đào tạo">
        <p>Đối tượng đào tạo</p>
      </Tooltip>
      <Select
        loading={isLoading || props.loading}
        dropdownStyle={{ maxHeight: 300, overflow: "auto", minWidth: 480 }}
        popupMatchSelectWidth={false}
        placeholder="Chọn đối tượng đào tạo"
        options={doiTuongDaoTao.map((e) => ({
          label: e.name,
          value: e.id,
        }))}
        value={id}
        onChange={onSelect}
        allowClear={false}
        style={{ width: 360 }}
        {...props}
      />
    </div>
  )
}

export { SelectTrainingObjectType }
