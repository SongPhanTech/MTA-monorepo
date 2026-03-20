import { NotificationOutlined } from '@ant-design/icons'
import { Alert, Card, Space } from 'antd'
import dayjs from 'dayjs'
import Link from 'next/link'

const fakeData: any = [
    {
        id: 1,
        message:
            'Hội thảo KH quốc tế “Di cư quốc tế và Hội nhập xã hội: Hòa nhập và Phát triển bao trùm”',
        name: 'Cán bộ giảng viên',
        avatar: 'https://bcp.cdnchinhphu.vn/334894974524682240/2023/11/1/2210-02-169882989025254325254.jpg',
        image: 'https://bcp.cdnchinhphu.vn/334894974524682240/2023/11/1/2210-02-169882989025254325254.jpg',
        date: '2022-12-10T03:34:34Z',
        type: 'info',
        link: 'https://mta.edu.vn/Tin-t%E1%BB%A9c/ArticleID/8391/0325P4HD5711',
    },
    {
        id: 2,
        message: 'Kết quả xét chọn đề xuất đề tài NCKH sinh viên năm học 2023',
        name: 'Cán bộ giảng viên',
        avatar: 'https://static.vecteezy.com/ti/vetor-gratis/p3/2002300-icone-de-personagem-de-avatar-de-mulher-bonita-gratis-vetor.jpg',
        image: 'https://icdn.dantri.com.vn/thumb_w/640/2020/09/27/nghien-cuu-khoa-hoc-1601167698407.png',
        date: '2023-12-13T03:34:34Z',
        type: 'info',
        link: 'https://mta.edu.vn/Tin-t%E1%BB%A9c/ArticleID/8391/0325P4HD5711',
    },
    {
        id: 3,
        message: 'Thông báo phân bổ và hướng dẫn sử dụng tài khoản học liệu số năm học 2023-2024',
        name: 'Cán bộ giảng viên',
        avatar: 'https://static.vecteezy.com/ti/vetor-gratis/p3/2002300-icone-de-personagem-de-avatar-de-mulher-bonita-gratis-vetor.jpg',
        image: 'https://i0.wp.com/mmgroup.vn/wp-content/uploads/2021/02/cach-tao-tai-khoan-gmail.jpg?fit=760%2C430&quality=89&ssl=1',
        date: '2023-12-13T03:34:34Z',
        type: 'info',
        link: 'https://mta.edu.vn/Tin-t%E1%BB%A9c/ArticleID/8391/0325P4HD5711',
    },
    {
        id: 4,
        message: 'Thông báo đăng ký tài khoản học online năm học 2023-2024',
        name: 'Cán bộ giảng viên',
        avatar: 'https://static.vecteezy.com/ti/vetor-gratis/p3/2002300-icone-de-personagem-de-avatar-de-mulher-bonita-gratis-vetor.jpg',
        image: 'https://stcv4.hnammobile.com/downloads/b/thanh-thao-google-meet-voi-10-bi-quyet-sau-day-01622474237.jpg',
        date: '2023-12-13T03:34:34Z',
        type: 'info',
        link: 'https://mta.edu.vn/Tin-t%E1%BB%A9c/ArticleID/8391/0325P4HD5711',
    },
]

const type = 'card'
function News() {
    return (
        // <div style={{ height: "100%" }}>
        <div
            style={{
                height: '100%',
                maxHeight: '550px',
                overflowY: 'auto',
                paddingRight: '8px',
            }}
        >
            <Space direction="vertical">
                {fakeData?.length > 0 &&
                    fakeData?.map((item: any) => {
                        // <Link to={`/quanlythongtindieuhanh/thongbao/${item?.id}`}>
                        return type !== 'card' ? (
                            <Link key={item.id} target="_blank" rel="noopener noreferrer" href={item?.link}>
                                <Alert
                                    showIcon
                                    icon={<NotificationOutlined />}
                                    key={item.id}
                                    message={
                                        <div>
                                            <span>
                                                {dayjs(item?.date).format('HH:mm DD/MM/YYYY')}
                                            </span>{' '}
                                            - <span>{item.message}</span>
                                        </div>
                                    }
                                    type={item.type}
                                />
                            </Link>
                        ) : (
                            <Card size="small" key={item.id}>
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                    }}
                                >
                                    <img src={item?.image} style={{ width: '100%' }} alt="" />
                                    <div style={{ paddingTop: '5px' }}>
                                        <span
                                            style={{
                                                fontSize: 14,
                                                fontWeight: '600',
                                            }}
                                        >
                                            {item?.newsTitle}
                                        </span>
                                        <br />
                                        <span
                                            style={{
                                                fontSize: 12,
                                                color: '#595959',
                                            }}
                                        >
                                            {item?.message && item.message.length > 40
                                                ? `${item.message.slice(0, 40)}...`
                                                : item.message}
                                        </span>
                                        <br />
                                        <span
                                            style={{
                                                fontSize: 11,
                                                color: '#999999',
                                            }}
                                        >
                                            {dayjs(item?.date).format('HH:mm DD/MM/YYYY')}
                                        </span>
                                        <br />
                                        <a href={item?.link} target="_blank" rel="noopener noreferrer">
                                            Xem thêm
                                        </a>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
            </Space>
        </div>
    )
}

export default News
