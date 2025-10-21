// Trong file xlsx-template-browser.d.ts

declare module 'xlsx-template-browser' {
    
    /**
     * Tạo file Excel từ template (URL hoặc ArrayBuffer) và dữ liệu.
     * @param template URL (string) hoặc ArrayBuffer của file template.
     * @param values Dữ liệu (object) để điền vào.
     * @returns Promise trả về một Blob chứa file Excel đã xử lý.
     */
    export function generateXlsx(
        template: string | ArrayBuffer,
        values: object
    ): Promise<Blob>;

    /**
     * Tự động tạo và tải file Excel xuống.
     * @param template URL (string) hoặc ArrayBuffer của file template.
     * @param values Dữ liệu (object) để điền vào.
     * @param filename Tên file (string) để lưu xuống.
     * @returns Promise
     */
    export function downloadXlsx(
        template: string | ArrayBuffer,
        values: object,
        filename: string
    ): Promise<void>;
}