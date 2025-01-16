# Website

### Mô tả

- Sử dụng các component, function từ packages shared

### Công nghệ

- [NextJs] Frontend
- [NodeJs-20] Môi trường

### Cài đặt

Bước 1: Thêm package "@workspace/ui" vào trong dependencies của package.json

```json
{
    "name": "@client/web_example",
    "version": "0.1.0",
    "script" : {
        "start": "next start",
        ......
    },
    "dependencies": {
        "@workspace/ui": "workspace:*"
        .....
    }
}
```

Bước 2: Chạy lệnh install để cài @workspace/ui

`pnpm install`

### Sử dụng

- Import các components từ @workspace/ui

```typescript
import {Button} from '@workspace/ui'
import {Button, Input ...} from '@workspace/ui'
```
