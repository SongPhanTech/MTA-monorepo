#!/usr/bin/env node
/**
 * Script kiểm tra CORS từ localhost → backend online
 * Chạy: node scripts/test-cors.mjs
 */

const BACKEND_URL = "https://daotao.swantech.vn/api/lms/api/subject-class/open-subject-class-retake"
const ORIGIN = "http://localhost:3000"

async function testCors() {
  console.log("=== Test CORS: Preflight (OPTIONS) ===")
  console.log(`→ URL:    ${BACKEND_URL}`)
  console.log(`→ Origin: ${ORIGIN}\n`)

  try {
    // Preflight request
    const preflight = await fetch(BACKEND_URL, {
      method: "OPTIONS",
      headers: {
        Origin: ORIGIN,
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Content-Type,Authorization",
      },
    })

    console.log(`Status: ${preflight.status}`)
    console.log("\nResponse Headers:")

    const corsHeaders = [
      "access-control-allow-origin",
      "access-control-allow-credentials",
      "access-control-allow-methods",
      "access-control-allow-headers",
      "access-control-max-age",
    ]

    let allGood = true
    for (const header of corsHeaders) {
      const value = preflight.headers.get(header)
      const icon = value ? "✅" : "❌"
      console.log(`  ${icon} ${header}: ${value || "(missing)"}`)
    }

    // Kiểm tra critical issues
    const acao = preflight.headers.get("access-control-allow-origin")
    const acac = preflight.headers.get("access-control-allow-credentials")

    console.log("\n=== Kết quả ===")

    if (acao === "*") {
      console.log("❌ CORS FAIL: Access-Control-Allow-Origin = '*' → browser reject khi credentials:include")
      allGood = false
    } else if (acao === ORIGIN) {
      console.log("✅ Access-Control-Allow-Origin đúng")
    } else if (!acao) {
      console.log("❌ CORS FAIL: Không có header Access-Control-Allow-Origin")
      allGood = false
    } else {
      console.log(`⚠️  Access-Control-Allow-Origin = '${acao}' (expected '${ORIGIN}')`)
      allGood = false
    }

    if (acac === "true") {
      console.log("✅ Access-Control-Allow-Credentials = true")
    } else {
      console.log("❌ CORS FAIL: Access-Control-Allow-Credentials != true")
      allGood = false
    }

    if (allGood) {
      console.log("\n🎉 CORS cấu hình đúng! FE từ localhost:3000 có thể gọi API online.")
    } else {
      console.log("\n⛔ CORS chưa đúng. Cần cập nhật ORIGIN trên server online và redeploy.")
      console.log("   Thêm biến: ORIGIN=http://localhost:3000,https://daotao.swantech.vn")
    }
  } catch (err) {
    console.error("❌ Không thể kết nối:", err.message)
    console.log("\nCó thể do:")
    console.log("  1. Backend online không chạy / không truy cập được")
    console.log("  2. DNS/network issue")
    console.log("  3. WAF/Cloudflare chặn request từ script")
  }
}

testCors()
