/** CSS + script inject vào Scalar Reference — nút xuất DOCX tại mục Giới thiệu. */

export const REFERENCE_EXPORT_DOCX_CSS = `
.mta-export-docx-wrap {
  margin: 1rem 0 1.5rem;
  padding: 0;
}
.mta-export-docx-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  color: #fff;
  background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(91, 33, 182, 0.35);
  transition: filter 0.15s ease, transform 0.1s ease;
}
.mta-export-docx-btn:hover {
  filter: brightness(1.08);
}
.mta-export-docx-btn:active {
  transform: scale(0.98);
}
.mta-export-docx-btn:disabled {
  opacity: 0.65;
  cursor: wait;
}
`

/** Script chèn nút tải DOCX vào vùng mô tả / Giới thiệu (#description/giới-thiệu). */
export const REFERENCE_EXPORT_DOCX_SCRIPT = `
(function () {
  var EXPORT_PATH = "./openapi/export-docx";
  var BTN_ID = "mta-export-docx-btn";

  function getExportUrl() {
    return new URL(EXPORT_PATH, window.location.href).href;
  }

  function downloadDocx() {
    var btn = document.getElementById(BTN_ID);
    if (btn) btn.disabled = true;
    fetch(getExportUrl())
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.blob();
      })
      .then(function (blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "Tai-lieu-API-Quan-ly-Dao-tao.docx";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      })
      .catch(function (err) {
        alert("Không thể xuất tài liệu DOCX: " + (err && err.message ? err.message : err));
      })
      .finally(function () {
        if (btn) btn.disabled = false;
      });
  }

  function createButton() {
    var wrap = document.createElement("div");
    wrap.className = "mta-export-docx-wrap";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = BTN_ID;
    btn.className = "mta-export-docx-btn";
    btn.textContent = "Xuất tài liệu API (.docx)";
    btn.addEventListener("click", downloadDocx);
    wrap.appendChild(btn);
    return wrap;
  }

  function findIntroContainer() {
    if (location.hash && location.hash.indexOf("giới-thiệu") !== -1) {
      var byHash = document.getElementById(location.hash.slice(1));
      if (byHash) return byHash;
    }
    var headings = document.querySelectorAll("h1, h2, h3, [class*='heading']");
    for (var i = 0; i < headings.length; i++) {
      var h = headings[i];
      var text = (h.textContent || "").trim().toLowerCase();
      if (text === "giới thiệu" || text.indexOf("giới thiệu") === 0) {
        return h.parentElement || h;
      }
    }
    var section = document.querySelector(
      "[data-section='description'], .introduction, .markdown, main .layout-content, main"
    );
    return section;
  }

  function inject() {
    if (document.getElementById(BTN_ID)) return true;
    var container = findIntroContainer();
    if (!container) return false;
    var btnWrap = createButton();
    if (container.firstChild) {
      container.insertBefore(btnWrap, container.firstChild);
    } else {
      container.appendChild(btnWrap);
    }
    return true;
  }

  function start() {
    if (inject()) return;
    var tries = 0;
    var obs = new MutationObserver(function () {
      tries++;
      if (inject() || tries > 80) obs.disconnect();
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(function () {
      inject();
      obs.disconnect();
    }, 8000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
  window.addEventListener("hashchange", function () {
    setTimeout(inject, 300);
  });
})();
`

export function injectReferenceExportDocx(html: string): string {
  const styleBlock = `<style>${REFERENCE_EXPORT_DOCX_CSS}</style>`
  const scriptBlock = `<script>${REFERENCE_EXPORT_DOCX_SCRIPT}</script>`
  if (html.includes("</head>")) {
    html = html.replace("</head>", `${styleBlock}</head>`)
  }
  if (html.includes("</body>")) {
    return html.replace("</body>", `${scriptBlock}</body>`)
  }
  return html + styleBlock + scriptBlock
}
