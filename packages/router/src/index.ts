import { PieChartOutlined, UserOutlined } from "@ant-design/icons";
import * as ROUTER_PATH from "../generated/router.json";
import type { AntdIconProps } from "@ant-design/icons/lib/components/AntdIcon";
interface MenuItem {
	id: string;
	label: string;
	icon?: React.ForwardRefExoticComponent<
		Omit<AntdIconProps, "ref"> & React.RefAttributes<HTMLSpanElement>
	>;
	path?: string;
	children?: MenuItem[];
}

type NavigationType = Record<
	keyof typeof ROUTER_PATH,
	{
		menus: MenuItem[];
		label: string;
	}
>;

const NAVIGATION: NavigationType = {
	QL_NGUOI_DUNG: {
		menus: [
			{
				id: "home",
				label: "Trang chủ",
				icon: PieChartOutlined,
				path: ROUTER_PATH.QL_NGUOI_DUNG.HOME,
			},
			{
				id: "user",
				label: "Người dùng",
				icon: UserOutlined,
				children: [
					{
						id: "list",
						label: "Danh sách",
						path: ROUTER_PATH.QL_NGUOI_DUNG.USER,
					},
					{
						id: "group",
						label: "Nhóm người dùng",
						path: ROUTER_PATH.QL_NGUOI_DUNG.USER_GROUP,
					},
					{
						id: "group",
						label: "Vai trò",
						path: ROUTER_PATH.QL_NGUOI_DUNG.USER_ROLE,
					},
					{
						id: "group",
						label: "Quyền cơ bản",
						path: ROUTER_PATH.QL_NGUOI_DUNG.USER_PERMISSION,
					},
				],
			},
		],
		label: "Quản lý người dùng",
	},
	WEB: {
		menus: [],
		label: "Web",
	},
};
export type { MenuItem, NavigationType };
export { ROUTER_PATH };
export default NAVIGATION;
