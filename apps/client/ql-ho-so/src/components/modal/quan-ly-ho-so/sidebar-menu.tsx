import type { StudentSiderbarProps } from "./type"

const SidebarMenu = ({ activeKey, setActiveKey, tabs }: StudentSiderbarProps) => {
  return (
    <div className="space-y-2">
      {tabs?.map((item) => {
        const isActive = item.key === activeKey
        return (
          <div
            key={item.key}
            className="flex items-center gap-3 p-3 cursor-pointer"
            onClick={() => setActiveKey(item.key)}
          >
            <div
              className={`w-8 h-8 rounded-sm flex items-center justify-center text-sm font-medium ${
                isActive
                  ? "bg-green-600 text-white shadow-[0_3px_6px_0_rgba(0,95,39,0.4)]"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {item.key}
            </div>
            <span
              className={`text-sm font-medium ${isActive ? "text-green-600" : "text-gray-700"}`}
            >
              {item.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default SidebarMenu
