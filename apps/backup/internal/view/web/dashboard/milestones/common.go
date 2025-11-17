package milestones

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/eduardolat/pgbackweb/internal/view/web/component"
	nodx "github.com/nodxdev/nodxgo"
	lucide "github.com/nodxdev/nodxgo-lucide"
)

func cronExpressionHelp() []nodx.Node {
	return []nodx.Node{
		component.PText(`
			Biểu thức cron là một chuỗi được sử dụng để xác định lịch trình chạy tác vụ trong các hệ điều hành giống Unix. Nó bao gồm năm trường đại diện cho phút, giờ, ngày trong tháng, tháng và ngày trong tuần. Biểu thức cron cho phép lập lịch chính xác cho các tác vụ định kỳ.
		`),

		nodx.Div(
			nodx.Class("mt-4 flex justify-end items-center space-x-1"),
			nodx.A(
				nodx.Href("https://en.wikipedia.org/wiki/Cron"),
				nodx.Target("_blank"),
				nodx.Class("btn btn-ghost"),
				component.SpanText("Xem thêm trên Wikipedia"),
				lucide.ExternalLink(),
			),
			nodx.A(
				nodx.Href("https://crontab.guru/examples.html"),
				nodx.Target("_blank"),
				nodx.Class("btn btn-ghost"),
				component.SpanText("Xem ví dụ"),
				lucide.ExternalLink(),
			),
		),
	}
}

func toCron(timeStr string, dayInterval int) (string, error) {
	parts := strings.Split(timeStr, ":")
	if len(parts) != 2 {
		return "", fmt.Errorf("invalid time format, expected HH:MM")
	}

	hour, err := strconv.Atoi(parts[0])
	if err != nil {
		return "", err
	}

	minute, err := strconv.Atoi(parts[1])
	if err != nil {
		return "", err
	}

	// 5-field cron: min hour day month weekday
	cron := fmt.Sprintf("%d %d */%d * *", minute, hour, dayInterval)
	return cron, nil
}

func CronToParams(cron string) (string, int, error) {
	// cron dạng: min hour */dayInterval * *
	fields := strings.Fields(cron)
	if len(fields) != 5 {
		return "", 0, fmt.Errorf("invalid cron format, expected 5 fields")
	}

	minStr := fields[0]
	hourStr := fields[1]
	dayField := fields[2] // dạng */3

	minute, err := strconv.Atoi(minStr)
	if err != nil {
		return "", 0, fmt.Errorf("invalid minute: %v", err)
	}

	hour, err := strconv.Atoi(hourStr)
	if err != nil {
		return "", 0, fmt.Errorf("invalid hour: %v", err)
	}

	// Parse dạng */3
	if !strings.HasPrefix(dayField, "*/") {
		return "", 0, fmt.Errorf("invalid day interval field: %s", dayField)
	}

	intervalStr := strings.TrimPrefix(dayField, "*/")
	dayInterval, err := strconv.Atoi(intervalStr)
	if err != nil {
		return "", 0, fmt.Errorf("invalid day interval: %v", err)
	}

	// Build time HH:MM
	timeStr := fmt.Sprintf("%02d:%02d", hour, minute)

	return timeStr, dayInterval, nil
}
