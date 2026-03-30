import { useState } from "react"

/**
 * Hook lưu trạng thái vào localStorage.
 *
 * Dùng tương tự như useState, nhưng giá trị sẽ được lưu lại trong localStorage để giữ nguyên khi reload trang.
 *
 * @template T - Kiểu dữ liệu của giá trị cần lưu
 * @param {string} key - Tên key trong localStorage
 * @param {T} defaultValue - Giá trị mặc định nếu key chưa tồn tại
 *
 * @returns {[T, (val: T) => void]} Một mảng gồm:
 *   - `value`: giá trị hiện tại (đọc từ localStorage hoặc defaultValue)
 *   - `setValue`: hàm để cập nhật giá trị (sẽ đồng thời cập nhật localStorage)
 *
 * @example
 * const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme_mode', 'light')
 *
 * return (
 *   <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
 *     Giao diện: {theme}
 *   </button>
 * )
 */
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored !== null ? JSON.parse(stored) : defaultValue
    } catch {
      return defaultValue
    }
  })

  const updateValue = (newValue: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(newValue))
      setValue(newValue)
    } catch {}
  }

  return [value, updateValue] as const
}
