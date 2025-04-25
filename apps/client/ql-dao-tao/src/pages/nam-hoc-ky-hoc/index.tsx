import DefaultLayout from '@layouts/default-layout'
import {
    Button,
    Col,
    Divider,
    Flex,
    Form,
    Input,
    Row,
    Tooltip,
    message,
    Typography,
} from 'antd'
const { Title } = Typography
import _ from 'lodash'
import SchoolYearPage from '../../components/sub-pages/schoolyear'
import SemesterPage from '../../components/sub-pages/semester'
import { useState } from 'react'
import type { SchoolYear } from '@workspace/db'
function Home() {
    const [selectedSchoolYear, setSelectedSchoolYear] = useState<SchoolYear>()
    return (
        <DefaultLayout className="p-0">
            <Row gutter={[24, 24]} className="p-4">
                <Col span={12}>
                    <SchoolYearPage
                        selectedSchoolYear={selectedSchoolYear}
                        setSelectedSchoolYear={setSelectedSchoolYear}
                    />
                </Col>
                <Col span={12}>
                    <SemesterPage selectedSchoolYear={selectedSchoolYear} />
                </Col>
            </Row>
        </DefaultLayout>
    )
}

export default Home
