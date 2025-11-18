package backups

import (
	"time"

	"github.com/eduardolat/pgbackweb/internal/view/web/component"
	nodx "github.com/nodxdev/nodxgo"
)

func localBackupsHelp() []nodx.Node {
	return []nodx.Node{
		component.H3Text("Sao lưu local"),
		component.PText(`
			Sao lưu local được lưu trữ trên máy chủ nơi phần mềm đang chạy. Chúng được lưu trong thư mục /backups, vì vậy bạn có thể gắn một volume Docker vào thư mục này để duy trì các bản sao lưu theo cách bạn muốn.
		`),

		nodx.Div(
			nodx.Class("mt-2"),
			component.H3Text("Sao lưu từ xa"),
			component.PText(`
				Sao lưu từ xa được lưu trữ tại một đích đến. Đích đến là một kho lưu trữ từ xa tương thích với S3. Với tùy chọn này, bạn không cần lo lắng về việc tạo và quản lý các volume của Docker.
			`),
		),
	}
}

func timezoneFilenamesHelp() []nodx.Node {
	serverTimezone := time.Now().Location().String()

	return []nodx.Node{
		component.PText(`
			Đây là múi giờ mà biểu thức cron sẽ được đánh giá.
		`),
		nodx.P(
			component.SpanText(`
				Tên tệp sao lưu sẽ luôn sử dụng múi giờ của máy chủ (hiện tại là
			`),
			component.BText(serverTimezone),
			component.SpanText(")."),
		),
	}
}

func destinationDirectoryHelp() []nodx.Node {
	return []nodx.Node{
		component.PText(`
			Thư mục đích là nơi lưu trữ các bản sao lưu. Thư mục này được xác định tương đối so với thư mục gốc của đích đến. Nó phải bắt đầu bằng dấu /, không được chứa khoảng trắng và không được kết thúc bằng dấu /.
		`),

		nodx.Div(
			nodx.Class("mt-2"),
			component.H3Text("Sao lưu local"),
			component.PText(`
				Đối với sao lưu local, thư mục gốc là **/backups**. Do đó, các tệp sao lưu sẽ được lưu trữ tại:
			`),
			nodx.Div(
				nodx.ClassMap{
					"whitespace-nowrap p-1": true,
					"overflow-x-scroll":     true,
					"font-mono":             true,
				},
				component.BText(
					"/backups/<destination-directory>/<YYYY>/<MM>/<DD>/dump-<random-suffix>.zip",
				),
			),
		),

		nodx.Div(
			nodx.Class("mt-2"),
			component.H3Text("Sao lưu từ xa"),
			component.PText(`
				Đối với sao lưu từ xa, thư mục gốc là thư mục gốc của bucket. Do đó, các tệp sao lưu sẽ được lưu trữ tại:
			`),
			nodx.Div(
				nodx.ClassMap{
					"whitespace-nowrap p-1": true,
					"overflow-x-scroll":     true,
					"font-mono":             true,
				},
				component.BText(
					"s3://<bucket>/<destination-directory>/<YYYY>/<MM>/<DD>/dump-<random-suffix>.zip",
				),
			),
		),
	}
}

func retentionDaysHelp() []nodx.Node {
	return []nodx.Node{
		nodx.Div(
			nodx.Class("space-y-2"),

			component.PText(`
				Số ngày lưu giữ xác định số ngày các tệp sao lưu được giữ trước khi bị xóa tự động. Điều này đảm bảo rằng các bản sao lưu cũ được loại bỏ để tiết kiệm dung lượng lưu trữ. Thời gian lưu giữ được đánh giá theo từng lần thực thi.
			`),

			component.PText(`
				Nếu bạn đặt số ngày lưu giữ là 0, các bản sao lưu sẽ không bao giờ bị xóa.
			`),
		),
	}
}

func pgDumpOptionsHelp() []nodx.Node {
	return []nodx.Node{
		nodx.Div(
			nodx.Class("space-y-2"),

			component.PText(`
				Phần mềm này sử dụng tiện ích pg_dump đã được kiểm chứng để tạo bản sao lưu. Nó đảm bảo sao lưu nhất quán ngay cả khi cơ sở dữ liệu đang được sử dụng đồng thời.
			`),

			component.PText(`
				Đây là các tùy chọn sẽ được truyền cho tiện ích pg_dump. Theo mặc định, phần mềm không truyền bất kỳ tùy chọn nào, do đó các bản sao lưu sẽ là sao lưu đầy đủ.
			`),
		),
	}
}
