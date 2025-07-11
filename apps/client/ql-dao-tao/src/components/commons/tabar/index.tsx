import type { TabsProps as TabsAntdProps } from 'antd'
import { Tabs as TabAntd } from 'antd'
import { useState } from 'react'

type TabsProps = {
    items: TabsAntdProps['items']
} & TabsAntdProps

const Tabs: React.FC<TabsProps> = ({ items }) => {
    const [active, setActive] = useState('1')

    const handleOnChange = (key: string) => {
        setActive(key)
    }
    return (
        <TabAntd
            items={items}
            onChange={handleOnChange}
            activeKey={active}
            className="custom-tab-bar"
            tabBarStyle={{
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                padding: '16px',
                marginBottom: '0',
            }}
        />
    )
}

export default Tabs
