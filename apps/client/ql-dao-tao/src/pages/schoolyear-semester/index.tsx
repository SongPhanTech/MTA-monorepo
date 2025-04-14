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
import SchoolYearPage from './schoolyear'
import SemesterPage from './semester'
import { useState } from 'react'
function Home() {
    const [selectedSchoolYear, setSelectedSchoolYear] = useState<any>()
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
