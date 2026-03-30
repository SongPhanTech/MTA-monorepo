# Package/ui

### Mô tả

- Chia sẻ component cho các dự án khác

### Cấu trúc dự án

1.Cây thư mục

```sh
📦src
 ┣ 📂assets
 ┃ ┗ 📂styles
 ┣ 📂components
 ┃ ┣ 📂commons
 ┃ ┃ ┣ 📂Button
 ┃ ┃ ┃ ┗ 📜index.tsx
 ┃ ┃ ┗ 📜index.ts
 ┃ ┣ 📂layouts
 ┃ ┃ ┗ 📂header
 ┃ ┗ 📜index.ts
 ┣ 📂lib
 ┃ ┗ 📜utils.ts
 ┗ 📜index.ts
```

2.Cấu trúc thư mục và ý nghĩa

#### 📂`src/assets`

Thư mục này chứa các tài nguyên tĩnh như ảnh, biểu tượng, và style

- **`styles`**: Chứa các file CSS, SCSS hoặc các biến dùng chung liên quan đến giao diện.

#### 📂`src/components`

Thư mục này chứa các thành phần giao diện của ứng dụng.

- **`commons`**: Các thành phần giao diện nhỏ, tái sử dụng (ví dụ: Button, Input, Modal, v.v.).
  - Mỗi component sẽ được đặt trong thư mục riêng.
  - Các component sẽ được export qua file `src/components/commons/index.ts`.
- **`layouts`**: Các thành phần bố cục như header, footer, sidebar, v.v.
  - Được tổ chức theo từng phần cụ thể.

#### 📂`src/lib`

Thư mục này chứa các function hoặc hàm helper (ví dụ: `formatDate`, `debounce`, API handlers).

#### 📂`src/index.ts`

Điểm nhập chính cho toàn bộ các export từ thư mục `src`.

### 3. Quy tắc Export

Sử dụng pattern export đồng nhất để dễ dàng quản lý và tái sử dụng các module trong toàn bộ dự án.

### File 📂`src/index.ts`

```typescript
export * from "./components"
export * from "./lib"
export * from "./assets/styles" // Nếu cần thiết
```

### File 📂`src/components/index.ts`

```typescript
export * from "./commons"
export * from "./layouts"
```

### File 📂`src/components/commons/index.ts`

```typescript
export * from "./Button"
```

Các file khác tương tự vậy.
