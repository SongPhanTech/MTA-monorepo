import DefaultLayout from "@layouts/default-layout"
import KeHoachGhepLopMonHoc from "@pages/ke-hoach-giao-duc/_pages/ke-hoach-ghep-lop-mon-hoc"
import ThongKeNoHocLai from "@pages/ke-hoach-hoc-lai/_pages/thong-ke-hoc-lai"
import ThongKeNoThiLai from "@pages/ke-hoach-thi-lai/_pages/thong-ke-thi-lai"
import type { $Enums } from "@workspace/db/client"
import { useFindManyFixedClass, useFindManyTrainingMajor } from "@workspace/db/hooks"
import {
  Select,
  SelectTrainingCourseStore,
  useFixedClassStore,
  useTrainingCourseStore,
  useTrainingMajorStore,
  useTrainingObjectTypeStore,
} from "@workspace/ui"
import { Flex, Form, Tabs } from "antd"
import type React from "react"
import { useMemo, useState } from "react"
import KeHoachMoLopMonHoc from "./_pages/ke-hoach-mo-lop-mon-hoc"
import LapKeHoach from "./_pages/lap-ke-hoach"
import PhanCongGiangDay from "./_pages/phan-cong-giang-day"
import ThoiKhoaBieu from "./_pages/thoi-khoa-bieu"

interface TabItem {
  key: string
  label: string
  content: React.ReactNode
}

type KeHoachDaoTaoPageProps = {
  type: $Enums.SubjectClassType
  role: "P2_QLDT" | "P2_KHCT"
}

export default function KeHoachDaoTao({ type = "NORMAL", role }: KeHoachDaoTaoPageProps) {
  const [activeLeftTab, setActiveLeftTab] = useState(
    type !== "NORMAL" ? (role === "P2_QLDT" ? "thong-ke-no" : "mo-lop-mon-hoc") : "lap-ke-hoach"
  )

  const tabs: TabItem[] = useMemo(() => {
    if (type === "NORMAL") {
      return [
        {
          key: "lap-ke-hoach",
          label: "Lập kế hoạch giảng dạy học kỳ",
          content: <LapKeHoach type={type} />,
        },
        {
          key: "mo-lop-mon-hoc",
          label: "Mở LMH",
          content: <KeHoachMoLopMonHoc type={type} />,
        },
        {
          key: "ghep-lop-mon-hoc",
          label: "Ghép LMH",
          content: <KeHoachGhepLopMonHoc />,
        },
        {
          key: "phan-cong-giang-day",
          label: "Phân công giảng dạy",
          content: <PhanCongGiangDay type={type} role={role} />,
        },
        {
          key: "thoi-khoa-bieu",
          label: "Thời khóa biểu",
          content: <ThoiKhoaBieu type={type} />,
        },
      ]
    }

    if (type === "RETAKE") {
      if (role === "P2_QLDT") {
        return [
          {
            key: "thong-ke-no",
            label: "Thống kê học lại",
            content: <ThongKeNoHocLai />,
          },
          {
            key: "lap-ke-hoach",
            label: "Lập kế hoạch học lại",
            content: <LapKeHoach type={type} />,
          },
          {
            key: "thoi-khoa-bieu",
            label: "Thời khóa biểu học lại",
            content: <ThoiKhoaBieu type={type} />,
          },
        ]
      }

      return [
        // {
        //     key: 'lap-ke-hoach',
        //     label: 'Lập kế hoạch giảng dạy học lại',
        //     content: <LapKeHoach type={type} />,
        // },
        {
          key: "mo-lop-mon-hoc",
          label: "Mở LMH",
          content: <KeHoachMoLopMonHoc type={type} />,
        },
        {
          key: "phan-cong-giang-day",
          label: "Phân công giảng dạy",
          content: <PhanCongGiangDay type={type} role={role} />,
        },
        {
          key: "thoi-khoa-bieu",
          label: "Thời khóa biểu học lại",
          content: <ThoiKhoaBieu type={type} />,
        },
      ]
    }

    if (type === "REEXAM") {
      if (role === "P2_QLDT") {
        return [
          {
            key: "thong-ke-no",
            label: "Thống kê thi lại",
            content: <ThongKeNoThiLai />,
          },
          {
            key: "lap-ke-hoach",
            label: "Lập kế hoạch thi lại",
            content: <LapKeHoach type={type} />,
          },
          {
            key: "thoi-khoa-bieu",
            label: "Thời khóa biểu thi lại",
            content: <ThoiKhoaBieu type={type} />,
          },
        ]
      }
      return [
        // {
        //     key: 'lap-ke-hoach',
        //     label: 'Lập kế hoạch thi lại',
        //     content: <LapKeHoach type={type} />,
        // },
        {
          key: "mo-lop-mon-hoc",
          label: "Mở LMH",
          content: <KeHoachMoLopMonHoc type={type} />,
        },
        {
          key: "phan-cong-giang-day",
          label: "Phân công giảng dạy",
          content: <PhanCongGiangDay type={type} role={role} />,
        },
        {
          key: "thoi-khoa-bieu",
          label: "Thời khóa biểu thi lại",
          content: <ThoiKhoaBieu type={type} />,
        },
      ]
    }
    return []
  }, [type, role])

  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const { id: trainingMajorId, onSelect: onSelectTrainingMajor } = useTrainingMajorStore()
  const { id: fixedClassId, onSelect: onSelectFixedClass } = useFixedClassStore()
  const { id: trainingCourseId } = useTrainingCourseStore()

  const { data: trainingMajorData = [] } = useFindManyTrainingMajor({
    orderBy: { name: "asc" },
    where: {
      trainingObjectTypes: { some: { trainingObjectTypeId } },
      active: true,
      deletedAt: null,
    },
  })

  const { data: fixedClassData = [] } = useFindManyFixedClass({
    orderBy: { name: "asc" },
    where: {
      deletedAt: null,
      active: true,
      trainingCourse: {
        trainingObjectTypeId,
        id: trainingCourseId,
      },
      curriculumVersion: {
        curriculum: {
          trainingMajorId,
        },
      },
    },
  })
  return (
    <>
      <Flex gap={8}>
        <Form.Item className="m-0" name="trainingCourseId" label="Khóa đào tạo" labelAlign="left">
          <SelectTrainingCourseStore />
        </Form.Item>
        <Form.Item
          className="m-0"
          name="trainingMajorId"
          label="Chuyên ngành đào tạo"
          labelAlign="left"
        >
          <Select
            placeholder="Chọn chuyên ngành đào tạo"
            options={trainingMajorData.map((i) => ({
              value: i.id,
              label: i.name,
            }))}
            showSearch
            value={trainingMajorId}
            onChange={onSelectTrainingMajor}
            dropdownStyle={{
              minWidth: 350,
            }}
            allowClear
          />
        </Form.Item>
        <div className="flex items-center">Lớp quản lý:</div>
        <Select
          placeholder="Chọn lớp quản lý"
          options={fixedClassData.map((i) => ({
            value: i.id,
            label: [i.code, i.name].filter(Boolean).join(" - "),
          }))}
          value={fixedClassId}
          onChange={onSelectFixedClass}
          styles={{ popup: { root: { minWidth: 600 } } }}
          allowClear
        />
      </Flex>
      <Tabs activeKey={activeLeftTab} onChange={setActiveLeftTab}>
        {tabs.map((tab) => (
          <Tabs.TabPane tab={tab.label} key={tab.key}>
            {tab.content}
          </Tabs.TabPane>
        ))}
      </Tabs>
    </>
  )
}

KeHoachDaoTao.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
