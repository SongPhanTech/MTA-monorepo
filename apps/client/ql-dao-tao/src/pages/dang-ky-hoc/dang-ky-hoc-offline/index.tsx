import DefaultLayout from '@layouts/default-layout'
import { Store } from '@tanstack/react-store'
import { Col, Row, Tabs } from 'antd'
import type React from 'react'
import CaNhanTrongLopQuanLy from './_components/dang-ky-hoc-cho-lop-quan-ly/ca-nhan-trong-lop-quan-ly'
import DangKyHocChoCaNhan from './_components/dang-ky-hoc-cho-lop-ca-nhan'
import KeQuaDangKyHocLopQuanLy from './_components/ket-qua-dang-ky-hoc-lop-quan-ly'
import DangKyHocChoLopQuanLy from './_components/dang-ky-hoc-cho-lop-quan-ly/dang-ky-hoc-cho-lop-quan-ly'
import LopQuanLyDaGhep from './_components/dang-ky-hoc-cho-lop-quan-ly/lop-quan-ly-da-ghep'
import KetQuaDangKyHoc from './_components/dang-ky-hoc-cho-ca-nhan/ket-qua-dang-ky-hoc'
import MonToanTruong from './_components/dang-ky-hoc-cho-ca-nhan/mon-toan-truong'
import MonTrongCTDT from './_components/dang-ky-hoc-cho-ca-nhan/mon-trong-ctdt'
import MonTuongDuong from './_components/dang-ky-hoc-cho-ca-nhan/mon-tuong-duong'

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
type DangKyHocChoCaNhanStore = {
    subjectClassIds: string[]
    studentId?: string
}

export const dangKyHocChoLopQuanLyStore = new Store<DangKyHocChoLopQuanLyStore>({
    subjectClassId: undefined,
    fixedClassesIds: [],
    studentIds: [],
})

export const dangKyHocChoCaNhanStore = new Store<DangKyHocChoCaNhanStore>({
    studentId: undefined,
    subjectClassIds: [],
})

export default function DangKyHoc({ hocLai = false }: { hocLai?: boolean }) {
    const leftTabs: TabItem[] = hocLai
        ? [
              {
                  key: '2',
                  label: 'Đăng ký học cho cá nhân',
                  content: <DangKyHocChoCaNhan hocLai={hocLai} />,
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
                  content: (
                      <Row gutter={[8, 8]}>
                          <Col span={12}>
                              <DangKyHocChoCaNhan />
                          </Col>
                          <Col span={12}>
                              <Tabs className="m-0 p-0">
                                  <Tabs.TabPane
                                      className="m-0 p-0"
                                      tab={'Kết quả ĐKH'}
                                      key={'ket-qua-dang-ky-hoc'}
                                  >
                                      <KetQuaDangKyHoc />
                                  </Tabs.TabPane>
                                  <Tabs.TabPane
                                      className="m-0 p-0"
                                      tab={'Môn toàn trường'}
                                      key={'mon-toan-truong'}
                                  >
                                      <MonToanTruong />
                                  </Tabs.TabPane>
                                  <Tabs.TabPane
                                      className="m-0 p-0"
                                      tab={'Môn trong CTDT'}
                                      key={'mon-trong-ctdt'}
                                  >
                                      <MonTrongCTDT />
                                  </Tabs.TabPane>
                                  <Tabs.TabPane
                                      className="m-0 p-0"
                                      tab={'Môn tương đương'}
                                      key={'mon-tuong-duong'}
                                  >
                                      <MonTuongDuong />
                                  </Tabs.TabPane>
                              </Tabs>
                          </Col>
                      </Row>
                  ),
              },
              {
                  key: '3',
                  label: 'Kết quả đăng ký học lớp quản lý',
                  content: <KeQuaDangKyHocLopQuanLy />,
              },
          ]

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
