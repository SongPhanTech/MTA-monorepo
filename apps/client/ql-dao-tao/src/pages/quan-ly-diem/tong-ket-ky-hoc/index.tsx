import Tabs from "@components/commons/tabar"
import DiemTrungBinhKyHoc from "@components/sub-pages/trung-binh-ky-hoc"
import XetCanhCaoHocDuong from "@components/sub-pages/xet-canh-cao-hoc-duong"
import XetCanhCaoHocTap from "@components/sub-pages/xet-canh-cao-hoc-tap"
import XetHocBong from "@components/sub-pages/xet-hoc-bong"
import XetXuLyHocTap from "@components/sub-pages/xet-xu-ly-hoc-tap"
import DefaultLayout from "@layouts/default-layout"
import { AcademicActionType } from "@workspace/db/client"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import type React from "react"

export default function TongKetKyHoc() {
  const { id: semesterId } = useSemesterStore()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  if (!semesterId || !trainingObjectTypeId)
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Không có dữ liệu</h1>
          <p className="text-gray-500">Vui lòng chọn đối tượng đào tạo và học kỳ</p>
        </div>
      </div>
    )

  return (
    <div>
      <Tabs
        items={[
          {
            key: "1",
            label: "Tổng kết học kỳ",
            children: <DiemTrungBinhKyHoc />,
          },
          {
            key: "2",
            label: "Xét học bổng",
            children: (
              <XetHocBong semesterId={semesterId} trainingObjectTypeId={trainingObjectTypeId} />
            ),
          },
          {
            key: "3",
            label: "Xét cảnh cáo học tập",
            children: (
              <XetCanhCaoHocTap
                semesterId={semesterId}
                trainingObjectTypeId={trainingObjectTypeId}
              />
            ),
          },
          {
            key: "4",
            label: "Xét cảnh cáo học đường",
            children: <XetCanhCaoHocDuong semesterId={semesterId} />,
          },
          // {
          //     key: '5',
          //     label: 'Xét thôi học',
          //     children: (
          //         <XetXuLyHocTap
          //             semesterId={semesterId}
          //             trainingObjectTypeId={trainingObjectTypeId}
          //             actionTaken={AcademicActionType.EXPULSION}
          //         />
          //     ),
          // },
          // {
          //     key: '6',
          //     label: 'Xét lưu ban',
          //     children: (
          //         <XetXuLyHocTap
          //             semesterId={semesterId}
          //             trainingObjectTypeId={trainingObjectTypeId}
          //             actionTaken={AcademicActionType.REPEAT_YEAR}
          //         />
          //     ),
          // },
          {
            key: "7",
            label: "Xét đình chỉ",
            children: (
              <XetXuLyHocTap
                semesterId={semesterId}
                trainingObjectTypeId={trainingObjectTypeId}
                actionTaken={AcademicActionType.SUSPENSION}
              />
            ),
          },
        ]}
        className="custom-tab-bar"
        tabBarStyle={{
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          paddingInline: "16px",
          paddingBlock: "8px",
          marginBottom: "0",
        }}
      />
    </div>
  )
}

TongKetKyHoc.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
