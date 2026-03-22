# CI/CD cho `socialTTVV` (FE)

## Khái niệm ngắn gọn

| Thuật ngữ | Ý nghĩa |
|-----------|---------|
| **CI** (Continuous Integration) | Mỗi lần bạn **commit/push** code lên repo, máy chủ **tự chạy** lint → test → build để phát hiện lỗi sớm. |
| **CD** (Continuous Delivery/Deployment) | Sau khi CI **xanh**, có thể **tự hoặc bán tự** đưa bản build lên server / CDN (bước này tùy team — deploy). |
| **Jenkins** | Một **máy chủ CI** phổ biến: đọc `Jenkinsfile`, chạy các bước (shell) theo pipeline. |
| **Pipeline** | Chuỗi bước: cài `npm` → `lint` → `test` → `build`. |

**Luồng bạn mô tả (đúng hướng):**

1. Developer **commit & push** lên Git (GitHub/GitLab/Bitbucket…).
2. **Jenkins** (hoặc GitHub Actions, GitLab CI…) **kích hoạt** job.
3. Job chạy: **`npm ci`** → **`npm run lint`** → **`npm run test`** → **`npm run build`**.
4. Nếu một bước **fail**, pipeline **đỏ** — cần sửa code rồi push lại.
5. (Tuỳ chọn) Bước **deploy** gọi script upload `dist/` lên hosting.

**Lưu ý:** Jenkins **không** thay thế Git — Jenkins **lấy code từ Git** rồi chạy lệnh. “Commit → test → CI/CD → Jenkins” hiểu là: **Git lưu code**, **Jenkins chạy CI** sau khi có push.

---

## Lệnh trên máy local (giống CI)

```bash
cd UI/socialTTVV
npm ci
npm run ci
```

(`npm run ci` = lint + test + build một lượt.)

Riêng khi dev:

```bash
npm run test        # chạy test một lần (Vitest)
npm run test:watch  # chạy test khi sửa file
```

---

## Jenkins

1. Cài **Node.js 20+** và **npm** trên agent (hoặc dùng Docker image `node:20`).
2. Tạo **Pipeline** trỏ tới repo, **Script Path** = `UI/socialTTVV/Jenkinsfile` nếu repo là monorepo (root có thư mục `UI/socialTTVV`).
3. Nếu repo **chỉ chứa** project FE ở root, copy `Jenkinsfile` lên root job hoặc đặt job workspace = thư mục FE — pipeline tự detect `PROJECT_DIR` (`. ` hoặc `UI/socialTTVV`).

**Agent Windows:** đổi `sh` trong `Jenkinsfile` thành `bat` và lệnh tương ứng (`npm ci` vẫn dùng được).

---

## Test (Vitest)

- File test đặt cạnh code: `*.test.ts` / `*.test.tsx` trong `src/`.
- Ví dụ: `src/utils/appMeta.test.ts`.

---

## GitHub Actions — file nằm ở đâu?

GitHub **chỉ** đọc workflow từ **root của repository** trên GitHub (thư mục có `.git` khi clone).

| Cách làm repo | Đặt `.github` |
|----------------|---------------|
| **Repo chỉ là FE** (push cả thư mục `socialTTVV` lên GitHub, root = `package.json`) | `socialTTVV/.github/workflows/ci.yml` — **đúng như hiện tại** trong project này. |
| **Monorepo** (một repo chứa cả `BE/`, `UI/socialTTVV/`, …) | Phải có `.github/workflows/...` ở **root monorepo** (cùng cấp với `UI`), và trong YAML dùng `working-directory: UI/socialTTVV` hoặc `defaults.run`. Workflow **không** được nhận nếu chỉ nằm trong `UI/socialTTVV` khi root repo là cả `KIenTruc`. |

Tóm lại: **gắn `.github` trong FE là đúng** khi repo GitHub của bạn = **chỉ** project frontend. Nếu sau này bạn gom cả BE vào **một** repo lớn, **copy** thêm một workflow lên root monorepo (hoặc xóa `.github` trong FE và chỉ giữ bản ở root).

File mẫu: `socialTTVV/.github/workflows/ci.yml` (lint → test → build).
