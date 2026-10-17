-- Thông báo chat trên cổng sinh viên dùng lại bảng Notification.
-- So sánh và ghi type qua ::text / giá trị enum mới; không dùng literal CHAT trong cùng transaction.
ALTER TYPE "ql-danh-muc"."NotificationType" ADD VALUE 'CHAT';
