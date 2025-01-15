import DefaultLayout from '@layouts/default-layout'
import React from 'react'
import { RobotOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import Link from 'next/link'

export default function NotFoundPage() {
    return (
            <div className="flex items-center justify-center py-10">
                <div className="text-center text-primary">
                    <RobotOutlined className="text-7xl mb-4" />
                    <h1 className="text-2xl font-semibold mb-2">
                        Không tìm thấy trang!
                    </h1>
                    <p className="text-lg font-semibold mb-1">
                        Vui lòng quay lại sau
                    </p>
                    <br />
                    <Button type="primary" size="large">
                        <Link href="/home">Quay lại trang chủ</Link>
                    </Button>
                </div>
            </div>
    )
}
NotFoundPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
  }
  