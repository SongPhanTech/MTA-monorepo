package milestones

import (
	"fmt"
	"strconv"
	"strings"
)

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
