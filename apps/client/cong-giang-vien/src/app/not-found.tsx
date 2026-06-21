import { ROUTER_PATH } from "@workspace/router"
import "../styles/not-found.css"

export default function NotFoundPage() {
  return (
    <section>
      <h1>Lỗi 404</h1>
      <p className="zoom-area">Không tìm thấy website</p>
      <section className="error-container">
        <span className="four">
          <span className="screen-reader-text">4</span>
        </span>
        <span className="zero">
          <span className="screen-reader-text">0</span>
        </span>
        <span className="four">
          <span className="screen-reader-text">4</span>
        </span>
      </section>
      <div className="link-container">
        <a href={ROUTER_PATH.CONG_GIANG_VIEN.HOME} className="more-link">
          Quay về trang chủ
        </a>
      </div>
    </section>
  )
}
