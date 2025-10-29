import DefaultLayout from '@layouts/default-layout'
import { Store } from '@tanstack/react-store'
import { useFindManyTrainingCourse } from '@workspace/db/hooks'
import { useTrainingObjectTypeStore } from '@workspace/ui'
import { Col, Row, Tabs } from 'antd'
import type React from 'react'
import { useState } from 'react'
import CaNhanTrongLopQuanLy from './_components/ca-nhan-trong-lop-quan-ly'
import DangKyHocChoCaNhan from './_components/dang-ky-hoc-cho-lop-ca-nhan'
import DangKyHocChoLopQuanLy from './_components/dang-ky-hoc-cho-lop-quan-ly'
import KeQuaDangKyHocLopQuanLy from './_components/ket-qua-dang-ky-hoc-lop-quan-ly'
import LopMonHocDaMo from './_components/lop-mon-hoc-da-mo'
import LopQuanLyDaGhep from './_components/lop-quan-ly-da-ghep'

interface TabItem {
    key: string
    label: string
    content: React.ReactNode
}

type DangKyHocChoLopQuanLyStore = {
    subjectClassId?: string
    fixedClassesIds: string[]
    studentIds: string[]
}

export const dangKyHocChoLopQuanLyStore = new Store<DangKyHocChoLopQuanLyStore>({
    subjectClassId: undefined,
    fixedClassesIds: [],
    studentIds: [],
})

export default function DangKyHoc({ hocLai = false }: { hocLai?: boolean }) {
    const [studentId, setStudentId] = useState<string | null>(null)
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
        orderBy: {
            name: 'asc',
        },
        where: {
            active: true,
            trainingObjectTypeId,
        },
    })
    const leftTabs: TabItem[] = hocLai
        ? [
              {
                  key: '2',
                  label: 'Đăng ký học cho cá nhân',
                  content: <DangKyHocChoCaNhan hocLai={hocLai} setStudentId={setStudentId} />,
              },
          ]
        : [
              {
                  key: '1',
                  label: 'Đăng ký học cho lớp quản lý',
                  content: (
                      <Row gutter={[8, 8]}>
                          <Col span={8}>
                              <DangKyHocChoLopQuanLy />
                          </Col>
                          <Col span={6}>
                              <LopQuanLyDaGhep />
                          </Col>
                          <Col span={10}>
                              <CaNhanTrongLopQuanLy />
                          </Col>
                      </Row>
                  ),
              },
              {
                  key: '2',
                  label: 'Đăng ký học cho cá nhân',
                  content: <DangKyHocChoCaNhan setStudentId={setStudentId} />,
              },
              {
                  key: '3',
                  label: 'Kết quả đăng ký học lớp quản lý',
                  content: <KeQuaDangKyHocLopQuanLy />,
              },
          ]

    const rightTabsMap: Record<string, TabItem[]> = {
        '1': [
            {
                key: '1',
                label: 'Lớp có môn theo KHGD',
                content: <></>,
            },
        ],
        '2': [
            {
                key: '1',
                label: 'Lớp môn học đã mở',
                content: <LopMonHocDaMo hocLai={hocLai} studentId={studentId} />,
            },
        ],
    }

    return (
        <Row gutter={[8, 0]} className="bg-white">
            <Col span={24}>
                <div className="rounded-lg shadow-sm">
                    <Tabs className="m-0 p-0">
                        {leftTabs.map((tab) => (
                            <Tabs.TabPane className="m-0 p-0" tab={tab.label} key={tab.key}>
                                {tab.content}
                            </Tabs.TabPane>
                        ))}
                    </Tabs>
                </div>
            </Col>
        </Row>
    )
}

DangKyHoc.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout unLayout={true}>{page}</DefaultLayout>
}
