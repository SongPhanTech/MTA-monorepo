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
.mta-sidebar-logo-wrap {
  width: 100%;
  padding: 1rem 1rem 0.5rem;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  box-sizing: border-box;
}
.mta-sidebar-logo-wrap img {
  max-width: 100%;
  height: 48px;
  border-radius: 0.375rem;
  object-fit: contain;
  transition: transform 0.2s ease;
}
.mta-sidebar-logo-wrap img:hover {
  transform: scale(1.05);
}
`

/** Script chèn nút tải DOCX vào vùng mô tả / Giới thiệu và chèn logo trang ở đầu menu sidebar trái. */
export const REFERENCE_EXPORT_DOCX_SCRIPT = `
(function () {
  var EXPORT_PATH = "./openapi/export-docx";
  var BTN_ID = "mta-export-docx-btn";
  var LOGO_WRAP_ID = "mta-sidebar-logo-wrap";
  var LOGO_URL = "https://static.vecteezy.com/system/resources/thumbnails/057/068/323/small/single-fresh-red-strawberry-on-table-green-background-food-fruit-sweet-macro-juicy-plant-image-photo.jpg";

  function getExportUrl() {
    return new URL(EXPORT_PATH, window.location.href).href;
  }

  function downloadDocx() {
    var btn = querySelectorDeep("#" + BTN_ID);
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
    btn.textContent = "Xuất tài liệu API(.docx)";
    btn.addEventListener("click", downloadDocx);
    wrap.appendChild(btn);
    return wrap;
  }

  function findIntroContainer() {
    if (location.hash && location.hash.indexOf("giới-thiệu") !== -1) {
      var byHash = querySelectorDeep("#" + location.hash.slice(1));
      if (byHash) return byHash;
    }
    var headings = querySelectorAllDeep("h1, h2, h3, [class*='heading']");
    for (var i = 0; i < headings.length; i++) {
      var h = headings[i];
      var text = (h.textContent || "").trim().toLowerCase();
      if (text === "giới thiệu" || text.indexOf("giới thiệu") === 0) {
        return h.parentElement || h;
      }
    }
    var section = querySelectorDeep(
      "[data-section='description'], .introduction, .markdown, main .layout-content, main"
    );
    return section;
  }

  function querySelectorAllDeep(selector, root) {
    root = root || document;
    var results = Array.prototype.slice.call(root.querySelectorAll(selector));
    var queue = [root];
    while (queue.length > 0) {
      var current = queue.shift();
      if (current.shadowRoot) {
        results = results.concat(Array.prototype.slice.call(current.shadowRoot.querySelectorAll(selector)));
        var shadowChildren = current.shadowRoot.querySelectorAll('*');
        for (var i = 0; i < shadowChildren.length; i++) {
          if (shadowChildren[i].shadowRoot) queue.push(shadowChildren[i]);
        }
      }
      var lightChildren = current.querySelectorAll('*');
      for (var j = 0; j < lightChildren.length; j++) {
        if (lightChildren[j].shadowRoot) queue.push(lightChildren[j]);
      }
    }
    return results;
  }

  function querySelectorDeep(selector, root) {
    var list = querySelectorAllDeep(selector, root);
    return list.length > 0 ? list[0] : null;
  }

  function findLeftSidebar() {
    // 1. Search for the semantic aside element first (most reliable for sidebars)
    var aside = querySelectorDeep('aside');
    if (aside) return aside;

    // 2. Fallback to selectors while filtering out layout classes
    var selectors = [
      '.sidebar',
      '.scalar-sidebar',
      '.references-sidebar',
      '.references-classic-sidebar',
      '[class*="sidebar-left"]',
      '.sidebar-left'
    ];
    for (var i = 0; i < selectors.length; i++) {
      var el = querySelectorDeep(selectors[i]);
      if (el) {
        var cls = (el.className || '').toString().toLowerCase();
        if (!cls.includes('right') && !cls.includes('layout')) {
          return el;
        }
      }
    }

    var searchEl = querySelectorDeep('input[type="search"]') || 
                   querySelectorDeep('[placeholder*="Search"]') ||
                   querySelectorDeep('[placeholder*="search"]') ||
                   querySelectorDeep('[class*="search"]');
    if (searchEl) {
      var parent = searchEl;
      while (parent && parent !== document.body) {
        var className = (parent.className || '').toString().toLowerCase();
        var nodeName = parent.nodeName.toLowerCase();
        if ((className.includes('sidebar') && !className.includes('layout')) || nodeName === 'aside') {
          return parent;
        }
        parent = parent.parentElement;
      }
      if (searchEl.parentElement && searchEl.parentElement.parentElement) {
        return searchEl.parentElement.parentElement;
      }
    }

    var allElements = querySelectorAllDeep('*');
    for (var k = 0; k < allElements.length; k++) {
      var elem = allElements[k];
      var cls = (elem.className || '').toString().toLowerCase();
      if (cls.includes('sidebar') && !cls.includes('right') && !cls.includes('layout')) {
        return elem;
      }
    }
    return null;
  }

  function injectSidebarLogo() {
    if (querySelectorDeep("#" + LOGO_WRAP_ID)) return true;
    var sidebar = findLeftSidebar();
    if (!sidebar) return false;

    var rootNode = sidebar.getRootNode();
    if (rootNode && rootNode !== document && !rootNode.getElementById("mta-logo-style")) {
      var styleEl = document.createElement("style");
      styleEl.id = "mta-logo-style";
      styleEl.textContent = \`
        .mta-sidebar-logo-wrap {
          width: 100%;
          padding: 1rem 1rem 0.5rem;
          display: flex;
          justify-content: flex-start;
          align-items: center;
          box-sizing: border-box;
        }
        .mta-sidebar-logo-wrap img {
          max-width: 100%;
          height: 48px;
          border-radius: 0.375rem;
          object-fit: contain;
          transition: transform 0.2s ease;
        }
        .mta-sidebar-logo-wrap img:hover {
          transform: scale(1.05);
        }
      \`;
      rootNode.appendChild(styleEl);
    }

    var wrap = document.createElement("div");
    wrap.id = LOGO_WRAP_ID;
    wrap.className = "mta-sidebar-logo-wrap";

    var img = document.createElement("img");
    img.src = LOGO_URL;
    img.alt = "MTA Logo";

    wrap.appendChild(img);

    if (sidebar.firstChild) {
      sidebar.insertBefore(wrap, sidebar.firstChild);
    } else {
      sidebar.appendChild(wrap);
    }
    return true;
  }

  function inject() {
    var docxDone = querySelectorDeep("#" + BTN_ID) !== null;
    if (!docxDone) {
      var container = findIntroContainer();
      if (container) {
        var btnWrap = createButton();
        if (container.firstChild) {
          container.insertBefore(btnWrap, container.firstChild);
        } else {
          container.appendChild(btnWrap);
        }
        docxDone = true;
      }
    }

    var logoDone = querySelectorDeep("#" + LOGO_WRAP_ID) !== null;
    if (!logoDone) {
      logoDone = injectSidebarLogo();
    }

    return docxDone && logoDone;
  }

  function start() {
    inject();
    var obs = new MutationObserver(function () {
      inject();
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    
    setInterval(inject, 1000);
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
