import { type RefObject, useLayoutEffect, useState } from "react"

/** Vùng nội dung của DefaultLayout — khung cố định theo viewport */
export const FIT_VIEWPORT_ATTR = "data-fit-viewport"
export const FIT_TABLE_ATTR = "data-fit-table"

const MIN_BODY_HEIGHT = 200

const overlapsX = (a: DOMRect, b: DOMRect) => a.left < b.right - 1 && b.left < a.right - 1

/**
 * Chiều cao nội dung nằm dưới bảng trong cùng cột (nút, ghi chú, padding của Card...).
 * Không lấy theo đáy của cả trang vì các cột bên cạnh (Row/Col) có thể cao hơn bảng.
 */
const getTrailingHeight = (el: HTMLElement, root: HTMLElement) => {
  const rect = el.getBoundingClientRect()
  let trailing = 0
  let node: HTMLElement = el
  while (node !== root && node.parentElement) {
    const parent: HTMLElement = node.parentElement
    const nodeBottom = node.getBoundingClientRect().bottom
    let belowBottom = nodeBottom
    let sibling = node.nextElementSibling
    while (sibling) {
      const siblingRect = sibling.getBoundingClientRect()
      if (
        siblingRect.height > 0 &&
        siblingRect.top >= nodeBottom - 1 &&
        overlapsX(siblingRect, rect)
      ) {
        belowBottom = Math.max(belowBottom, siblingRect.bottom)
      }
      sibling = sibling.nextElementSibling
    }
    trailing += belowBottom - nodeBottom
    // Padding của khung nội dung đã được trừ ở contentBottom
    if (parent !== root) {
      const style = getComputedStyle(parent)
      trailing +=
        (Number.parseFloat(style.paddingBottom) || 0) +
        (Number.parseFloat(style.borderBottomWidth) || 0)
    }
    node = parent
  }
  return trailing
}


export const useFitTableHeight = (ref: RefObject<HTMLElement | null>, enabled: boolean) => {
  const [height, setHeight] = useState<number>()

  useLayoutEffect(() => {
    const el = ref.current
    if (!enabled || !el) {
      setHeight(undefined)
      return
    }
    const content = el.closest<HTMLElement>(`[${FIT_VIEWPORT_ATTR}]`)
    const inner = content?.firstElementChild as HTMLElement | null
    if (!content || !inner) return

    let frame = 0
    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect()
        if (!rect.height) return

        const hasTableBelow = Array.from(
          content.querySelectorAll<HTMLElement>(`[${FIT_TABLE_ATTR}]`)
        ).some((other) => {
          if (other === el || other.contains(el) || el.contains(other)) return false
          const otherRect = other.getBoundingClientRect()
          return (
            otherRect.height > 0 && otherRect.top >= rect.bottom - 1 && overlapsX(otherRect, rect)
          )
        })
        if (hasTableBelow) {
          setHeight(undefined)
          return
        }

        const body =
          el.querySelector<HTMLElement>(".ant-table-body") ??
          el.querySelector<HTMLElement>(".ant-table-tbody")
        if (!body) return

        const contentRect = content.getBoundingClientRect()
        const paddingBottom = Number.parseFloat(getComputedStyle(content).paddingBottom) || 0
        const contentBottom = contentRect.top + content.clientHeight - paddingBottom
        const bodyTop = body.getBoundingClientRect().top + content.scrollTop

        const pagination = el.querySelector<HTMLElement>(".ant-table-pagination")
        let paginationHeight = 0
        if (pagination) {
          const style = getComputedStyle(pagination)
          paginationHeight =
            pagination.offsetHeight +
            (Number.parseFloat(style.marginTop) || 0) +
            (Number.parseFloat(style.marginBottom) || 0)
        }
        const trailing = getTrailingHeight(el, content)
        // 2px cho viền dưới của bảng
        const available = contentBottom - bodyTop - paginationHeight - trailing - 2

        const next = Math.max(MIN_BODY_HEIGHT, Math.floor(available))
        setHeight((prev) => (prev !== undefined && Math.abs(prev - next) <= 1 ? prev : next))
      })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(content)
    observer.observe(inner)
    observer.observe(el)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [ref, enabled])

  return height
}
