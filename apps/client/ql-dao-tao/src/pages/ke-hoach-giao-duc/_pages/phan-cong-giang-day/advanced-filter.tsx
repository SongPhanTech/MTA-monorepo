import TreeSelectDepartment from "@components/commons/department-select/TreeSelectDepartment"
import { FilterOutlined, InfoCircleOutlined } from "@ant-design/icons"
import { FixedClassSelect } from "@pages/ke-hoach-giao-duc/_components/course-class-filter"
import {
  useFixedClassStore,
  useTrainingMajorStore,
  useTrainingObjectTypeStore,
} from "@workspace/ui"
import { $Enums } from "@workspace/db/client"
import { useFindManyTrainingMajor } from "@workspace/db/hooks"
import { Badge, Button, Flex, Popover, Select, Tooltip, Typography } from "antd"
import { useState } from "react"
import StatusFilterChips, { type FilterStatus } from "./status-filter-chips"

const { Text } = Typography

type AdvancedFilterProps = {
  khoaBoMon: boolean
  orgId?: string
  organization?: string[]
  onChangeOrganization: (val?: string[]) => void
  filterStatus?: FilterStatus
  onChangeFilterStatus: (next?: FilterStatus) => void
  examType?: $Enums.ExamType[]
  onChangeExamType?: (val?: $Enums.ExamType[]) => void
  examTypeOptions?: { label: string; value: $Enums.ExamType }[]
}

export default function AdvancedFilter({
  khoaBoMon,
  orgId,
  organization,
  onChangeOrganization,
  filterStatus,
  onChangeFilterStatus,
  examType,
  onChangeExamType,
  examTypeOptions,
}: AdvancedFilterProps) {
  const [open, setOpen] = useState(false)
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { id: trainingMajorId, onSelect: onSelectTrainingMajor } = useTrainingMajorStore()
  const { id: fixedClassId, onSelect: onSelectFixedClass } = useFixedClassStore()

  const { data: trainingMajorData = [] } = useFindManyTrainingMajor({
    orderBy: { name: "asc" },
    where: {
      trainingObjectTypes: { some: { trainingObjectTypeId } },
      active: true,
      deletedAt: null,
    },
  })

  const activeCount =
    (fixedClassId ? 1 : 0) +
    (trainingMajorId ? 1 : 0) +
    (organization?.length ? 1 : 0) +
    (filterStatus ? 1 : 0) +
    (examType?.length ? 1 : 0)

  const handleReset = () => {
    onChangeOrganization(undefined)
    onSelectFixedClass(undefined)
    onSelectTrainingMajor()
    onChangeFilterStatus(undefined)
    onChangeExamType?.(undefined)
  }

  const content = (
    <div className="w-[360px] p-1">
      <div className="mb-3">
        <Text className="mb-1.5 block text-[13px] font-medium">Chuyên ngành đào tạo</Text>
        <Select
          placeholder="Chọn chuyên ngành đào tạo"
          className="w-full"
          options={trainingMajorData.map((i) => ({
            value: i.id,
            label: i.name,
          }))}
          showSearch
          value={trainingMajorId}
          onChange={onSelectTrainingMajor}
          allowClear
        />
      </div>

      <div className="mb-3">
        <Text className="mb-1.5 block text-[13px] font-medium">Lớp quản lý</Text>
        <FixedClassSelect
          className="w-full"
          getPopupContainer={(trigger) => trigger.parentElement ?? document.body}
        />
      </div>

      <div className="mb-3">
        <Text className="mb-1.5 block text-[13px] font-medium">Hình thức thi</Text>
        <Select
          mode="multiple"
          maxTagCount="responsive"
          placeholder="Chọn hình thức thi"
          className="w-full"
          options={examTypeOptions}
          value={examType}
          onChange={(value) => onChangeExamType?.(value?.length ? value : undefined)}
          allowClear
        />
      </div>

      <div className="mb-3">
        <Text className="mb-1.5 block text-[13px] font-medium">Đơn vị</Text>
        <Flex align="center" gap={4}>
          <TreeSelectDepartment
            className="min-w-0 flex-1"
            style={{ width: "100%" }}
            value={organization}
            rootId={!khoaBoMon ? "0" : orgId}
            onChange={(val) => onChangeOrganization((val as string[] | undefined) ?? undefined)}
            getPopupContainer={(trigger) => trigger.parentElement ?? document.body}
          />
          {!khoaBoMon && (
            <Tooltip title="Khoa/Viện/Bộ môn chỉ có thể nhìn thấy lớp môn học có hạn phân công giảng dạy.">
              <span className="inline-flex h-8 w-7 shrink-0 cursor-help items-center justify-center text-gray-400">
                <InfoCircleOutlined />
              </span>
            </Tooltip>
          )}
        </Flex>
      </div>

      <div className="mb-2">
        <Text className="mb-1.5 block text-[13px] font-medium">Trạng thái PCGD</Text>
        <StatusFilterChips value={filterStatus} onChange={onChangeFilterStatus} />
      </div>

      <div className="flex justify-end border-t border-slate-100 pt-2">
        <Button size="small" disabled={!activeCount} onClick={handleReset}>
          Bỏ lọc
        </Button>
      </div>
    </div>
  )

  return (
    <Popover
      trigger="click"
      placement="bottomRight"
      open={open}
      onOpenChange={setOpen}
      content={content}
    >
      <Badge count={activeCount} size="small" offset={[-2, 2]}>
        <Button icon={<FilterOutlined />} type={activeCount ? "primary" : "default"}></Button>
      </Badge>
    </Popover>
  )
}
