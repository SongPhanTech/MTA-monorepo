import { NotificationOutlined } from '@ant-design/icons'
import { useFindManyNotification } from '@workspace/db/hooks'
import { Alert, Space } from 'antd'
import { useDisclosure } from 'react-hook-disclosure-modal'

function ListNotification() {
    const { data = [] } = useFindManyNotification()
    const { onOpen } = useDisclosure<string>({
        tag: 'ViewNotificationModal',
    })
    return (
        <div
            style={{
                height: '100%',
                maxHeight: '550px',
                overflowY: 'auto',
                paddingRight: '8px',
            }}
        >
            <Space direction="vertical">
                {data?.length > 0 &&
                    data?.map((item) => {
                        return (
                            <p
                                key={item.id}
                                onClick={() => onOpen(item.id)}
                                className="cursor-pointer"
                            >
                                <Alert
                                    showIcon
                                    icon={<NotificationOutlined />}
                                    message={
                                        <div>
                                            <span className="line-clamp-2">{item?.title}</span>
                                        </div>
                                    }
                                    type={item.type === 'URGENT' ? 'error' : 'info'}
                                />
                            </p>
                        )
                    })}
            </Space>
        </div>
    )
}

export default ListNotification
