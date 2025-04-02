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
    Typography
} from 'antd'
const { Title } = Typography;
import _ from 'lodash'
import PieChart from '@components/dashboard/org-structure'
import News from '@components/dashboard/news'
import Notifications from '@components/dashboard/notifications'
import StaffLevel from '@components/dashboard/staff-level'
import TypeOfTraining from '@components/dashboard/type-of-training';
import StaffByOrg from '@components/dashboard/staff-by-org';
function Home() {
    return (
        <DefaultLayout className="p-0">
            <Row gutter={[16, 16]} className="p-4 h-[650px]">
                <Col span={12}>
                    <Title level={4}>Thống kê đối tượng đào tạo</Title>
                    <PieChart />
                </Col>
                <Col span={6}>
                    <Title level={4}>Tin tức</Title>
                    <News />
                </Col>
                <Col span={6}>
                    <Title level={4}>Thông báo</Title>
                    <Notifications />
                </Col>
            </Row>
            <Row gutter={[16, 16]} className="p-4">
                <Col span={12}>
                    <Title level={4}>Thống kê số lượng giảng viên theo trình độ</Title>
                    <StaffLevel />
                </Col>
                <Col span={12}>
                    <Title level={4}>Thống kê số lượng học viên theo loại hình đào tạo</Title>
                    <TypeOfTraining />
                </Col>
            </Row>
            <Row gutter={[16, 16]} className="p-4">
                <Col span={24}>
                    <Title level={4}>Thống kê số lượng giảng viên theo đầu mối</Title>
                    <StaffByOrg />
                </Col>
            </Row>
        </DefaultLayout >
    )
}

export default Home
