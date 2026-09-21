import { Carousel } from "antd"
import type { ReactNode } from "react"

const CAROUSEL_CLASS =
  "[&_.slick-slide>div]:h-full [&_.slick-slide>div]:px-1.5 [&_.slick-slide]:h-auto [&_.slick-dots]:!relative [&_.slick-dots]:!bottom-0 [&_.slick-dots]:!mt-2 [&_.slick-arrow]:text-cgv-green-dark"

const DEFAULT_RESPONSIVE = [
  { breakpoint: 1280, settings: { slidesToShow: 2 } },
  { breakpoint: 640, settings: { slidesToShow: 1 } },
]

type ResponsiveCardRowProps<T extends { key: string }> = {
  items: T[]
  renderItem: (item: T) => ReactNode
  /** Tailwind grid cols khi full màn (≥xl), vd: "grid-cols-5" */
  gridColsClass: string
  /** Số slide mặc định khi < xl */
  slidesToShow?: number
  responsive?: { breakpoint: number; settings: { slidesToShow: number } }[]
}

/** Full màn (≥xl): grid. Thu nhỏ: Carousel. */
export default function ResponsiveCardRow<T extends { key: string }>({
  items,
  renderItem,
  gridColsClass,
  slidesToShow = 3,
  responsive = DEFAULT_RESPONSIVE,
}: ResponsiveCardRowProps<T>) {
  return (
    <>
      <div className={`hidden shrink-0 gap-3 xl:grid ${gridColsClass}`}>
        {items.map((item) => (
          <div key={item.key}>{renderItem(item)}</div>
        ))}
      </div>

      <div className="min-w-0 shrink-0 overflow-hidden xl:hidden">
        <Carousel
          arrows
          dots
          infinite={false}
          draggable
          slidesToShow={slidesToShow}
          slidesToScroll={1}
          responsive={responsive}
          className={CAROUSEL_CLASS}
        >
          {items.map((item) => (
            <div key={item.key} className="h-full">
              {renderItem(item)}
            </div>
          ))}
        </Carousel>
      </div>
    </>
  )
}
