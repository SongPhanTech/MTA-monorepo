#!/usr/bin/env node
/**
 * Script kiểm tra session flow: get-session API có trả về session hợp lệ không
 * Chạy: node scripts/test-session.mjs [cookie-value]
 * 
 * Nếu không truyền cookie, test xem API trả lỗi gì khi không có session
 */

const MODEL_URL = "https://daotao.swantech.vn/api/model/api/auth/get-session?appCode=lms"
const LMS_URL = "https://daotao.swantech.vn/api/lms/api/subject-class/open-subject-class-retake"
const ORIGIN = "http://localhost:3000"

async function testEndpoint(label, url, cookie) {
  console.log(`\n=== ${label} ===`)
  console.log(`→ URL: ${url}`)

  try {
    const headers = {
      Origin: ORIGIN,
      Referer: `${ORIGIN}/lms/thong-ke-hoc-lai`,
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    }
    if (cookie) headers.Cookie = cookie

    const res = await fetch(url, {
      method: "GET",
      headers,
    })

    console.log(`Status: ${res.status} ${res.statusText}`)
    
    // Check CORS headers on actual response
    const acao = res.headers.get("access-control-allow-origin")
    const acac = res.headers.get("access-control-allow-credentials")
    console.log(`CORS: Allow-Origin=${acao || "(missing)"}, Allow-Credentials=${acac || "(missing)"}`)

    // Check Set-Cookie headers
    const setCookies = res.headers.getSetCookie?.() || []
    if (setCookies.length > 0) {
      console.log(`\nSet-Cookie headers (${setCookies.length}):`)
      for (const sc of setCookies) {
        const name = sc.split("=")[0]
        const hasSameSiteNone = /samesite=none/i.test(sc)
        const hasSecure = /;\s*secure/i.test(sc)
        const hasHttpOnly = /httponly/i.test(sc)
        const domain = sc.match(/domain=([^;]+)/i)?.[1] || "(none)"
        const path = sc.match(/path=([^;]+)/i)?.[1] || "(none)"
        
        console.log(`  📝 ${name}`)
        console.log(`     Domain=${domain}, Path=${path}`)
        console.log(`     SameSite=None: ${hasSameSiteNone ? "✅" : "❌ (cần SameSite=None cho cross-origin)"}`)
        console.log(`     Secure: ${hasSecure ? "✅" : "❌ (cần Secure khi SameSite=None)"}`)
        console.log(`     HttpOnly: ${hasHttpOnly ? "✅" : "ℹ️ (không bắt buộc)"}`)
      }
    }

    const text = await res.text()
    try {
      const json = JSON.parse(text)
      console.log(`\nResponse body (JSON):`)
      console.log(JSON.stringify(json, null, 2).slice(0, 500))
    } catch {
      console.log(`\nResponse body (text):`)
      console.log(text.slice(0, 300))
    }
  } catch (err) {
    console.error(`❌ Error: ${err.message}`)
  }
}

async function main() {
  const cookie = process.argv[2] || ""

  console.log("======================================")
  console.log("  Test Session / Cookie flow")
  console.log("======================================")
  console.log(`Cookie: ${cookie ? cookie.slice(0, 40) + "..." : "(none - testing without auth)"}`)

  // Test 1: get-session endpoint
  await testEndpoint("Get Session (auth check)", MODEL_URL, cookie)

  // Test 2: LMS API endpoint  
  await testEndpoint("LMS API (subject-class)", LMS_URL, cookie)

  console.log("\n\n======================================")
  console.log("  Tóm tắt")
  console.log("======================================")
  if (!cookie) {
    console.log("⚠️  Chưa truyền cookie. Để test đầy đủ:")
    console.log("   1. Mở DevTools trên browser → Application → Cookies")
    console.log("   2. Copy giá trị cookie x-token-lms và x-tenantcode")
    console.log('   3. Chạy lại: node scripts/test-session.mjs "x-tenantcode=dev; x-token-lms=<token>"')
  }
}

main()
