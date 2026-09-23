/**
 * Load test đăng ký học — mục tiêu ~500 VU
 *
 * Cài k6: https://grafana.com/docs/k6/latest/set-up/install-k6/
 *
 * Chạy nhanh (smoke):
 *   k6 run scripts/load-test/class-register/k6-class-register.js
 *
 * Ramp tới 500 VU:
 *   k6 run -e VUS_MAX=500 -e RAMP=true scripts/load-test/class-register/k6-class-register.js
 *
 * Biến môi trường bắt buộc khi test thật (có auth):
 *   BASE_URL=https://daotao.swantech.vn/api/portal
 *   AUTH_TOKEN=Bearer_xxx          # hoặc COOKIE=...
 *   SESSION_ID=cm...
 *   CURRICULUM_VERSION_ID=...
 *   SUBJECT_CLASS_IDS=id1,id2,id3  # pool lớp để ĐK (xoay vòng theo VU)
 *
 * Chỉ đo đọc (không ĐK):
 *   k6 run -e MODE=read scripts/load-test/class-register/k6-class-register.js
 */

import http from "k6/http"
import { check, sleep } from "k6"
import { Counter, Rate, Trend } from "k6/metrics"

const BASE_URL = (__ENV.BASE_URL || "http://127.0.0.1:3044/api").replace(/\/$/, "")
const MODE = (__ENV.MODE || "mixed").toLowerCase() // mixed | read | register
const VUS_MAX = Number(__ENV.VUS_MAX || 50)
const RAMP = String(__ENV.RAMP || "false").toLowerCase() === "true"
const THINK = Number(__ENV.THINK || 1)

const registerOk = new Counter("class_register_ok")
const registerFail = new Counter("class_register_fail")
const overbookSuspect = new Counter("class_register_full")
const errorRate = new Rate("errors")
const registerLatency = new Trend("class_register_duration", true)
const classesInfoLatency = new Trend("classes_info_duration", true)

export const options = RAMP
  ? {
      scenarios: {
        spike_500: {
          executor: "ramping-vus",
          startVUs: 0,
          stages: [
            { duration: "1m", target: 100 },
            { duration: "2m", target: 300 },
            { duration: "2m", target: VUS_MAX },
            { duration: "3m", target: VUS_MAX },
            { duration: "1m", target: 0 },
          ],
          gracefulRampDown: "30s",
        },
      },
      thresholds: {
        http_req_failed: ["rate<0.05"],
        class_register_duration: ["p(95)<3000"],
        errors: ["rate<0.05"],
      },
    }
  : {
      vus: Number(__ENV.VUS || 10),
      duration: __ENV.DURATION || "30s",
      thresholds: {
        http_req_failed: ["rate<0.1"],
      },
    }

function authHeaders() {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  }
  if (__ENV.AUTH_TOKEN) {
    headers.Authorization = __ENV.AUTH_TOKEN.startsWith("Bearer ")
      ? __ENV.AUTH_TOKEN
      : `Bearer ${__ENV.AUTH_TOKEN}`
  }
  if (__ENV.COOKIE) {
    headers.Cookie = __ENV.COOKIE
  }
  return headers
}

function pickSubjectClassId() {
  const raw = __ENV.SUBJECT_CLASS_IDS || ""
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  if (ids.length === 0) return null
  return ids[(__VU - 1) % ids.length]
}

function getSessions() {
  const res = http.get(`${BASE_URL}/class-register/get-class-register-session`, {
    headers: authHeaders(),
    tags: { name: "get-session" },
  })
  check(res, { "get-session 2xx": (r) => r.status >= 200 && r.status < 300 })
  return res
}

function getClassesInfo(sessionId, curriculumVersionId) {
  const qs = `sessionId=${sessionId}&curriculumVersionId=${curriculumVersionId}&byCurriculum=true&isRegistered=false`
  const res = http.get(`${BASE_URL}/class-register/get-classes-info?${qs}`, {
    headers: authHeaders(),
    tags: { name: "get-classes-info" },
  })
  classesInfoLatency.add(res.timings.duration)
  const ok = check(res, { "classes-info 2xx": (r) => r.status >= 200 && r.status < 300 })
  errorRate.add(!ok)
  return res
}

function postRegister(sessionId, curriculumVersionId, subjectClassId) {
  const payload = JSON.stringify({
    sessionId,
    curriculumVersionId,
    subjectClassIds: [subjectClassId],
  })
  const res = http.post(`${BASE_URL}/class-register/class-register`, payload, {
    headers: authHeaders(),
    tags: { name: "class-register" },
  })
  registerLatency.add(res.timings.duration)

  const ok = res.status === 200
  if (ok) registerOk.add(1)
  else {
    registerFail.add(1)
    if (res.status === 400 && String(res.body).includes("đủ số lượng")) {
      overbookSuspect.add(1)
    }
  }
  errorRate.add(!ok && res.status >= 500)
  check(res, {
    "register 200 or business 4xx": (r) => r.status === 200 || (r.status >= 400 && r.status < 500),
  })
  return res
}

export default function () {
  const sessionId = __ENV.SESSION_ID
  const curriculumVersionId = __ENV.CURRICULUM_VERSION_ID

  if (MODE === "read" || MODE === "mixed") {
    if (sessionId && curriculumVersionId) {
      getClassesInfo(sessionId, curriculumVersionId)
    } else {
      getSessions()
    }
  }

  if (MODE === "register" || MODE === "mixed") {
    const subjectClassId = pickSubjectClassId()
    if (!sessionId || !curriculumVersionId || !subjectClassId) {
      console.warn(
        "Thiếu SESSION_ID / CURRICULUM_VERSION_ID / SUBJECT_CLASS_IDS — bỏ qua POST register"
      )
    } else if (MODE === "register" || Math.random() < 0.7) {
      postRegister(sessionId, curriculumVersionId, subjectClassId)
    }
  }

  sleep(THINK)
}

export function handleSummary(data) {
  const out = {
    http_reqs: data.metrics.http_reqs?.values?.count,
    http_req_failed: data.metrics.http_req_failed?.values?.rate,
    class_register_ok: data.metrics.class_register_ok?.values?.count,
    class_register_fail: data.metrics.class_register_fail?.values?.count,
    class_register_p95: data.metrics.class_register_duration?.values?.["p(95)"],
    classes_info_p95: data.metrics.classes_info_duration?.values?.["p(95)"],
  }
  return {
    stdout: `\n=== class-register load summary ===\n${JSON.stringify(out, null, 2)}\n`,
  }
}
