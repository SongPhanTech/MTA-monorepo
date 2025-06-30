import type { TabsProps as TabsAntdProps } from 'antd'
import { Tabs as TabAntd } from 'antd'
import { useState } from 'react'

type TabsProps = {
    items: TabsAntdProps['items']
} & TabsAntdProps

const Tabs: React.FC<TabsProps> = ({ items }) => {
    const [active, setActive] = useState('1')

    const hanldeOnChange = (key: string) => {
        setActive(key)
    }
    return (
        <TabAntd
            items={items}
            onChange={hanldeOnChange}
            activeKey={active}
            className="overflow-hidden"
        />
    )
}

export default Tabs
