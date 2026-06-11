import rocket from "@assets/images/rocket-ship-rocket-svgrepo-com.svg"
import Image from "next/image"

const TinhNangPhatTrien = () => {
  return (
    <div className="flex h-full min-h-full items-center justify-center p-6">
      <div className="from-cgv-teal to-cgv-peach w-full max-w-md rounded-2xl bg-gradient-to-r via-white px-10 py-12 text-center shadow-lg">
        <div className="border-primary mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 bg-white shadow-sm">
          <Image src={rocket} alt="icon-ten-lua" className="h-10 w-10" />
        </div>

        <div className="border-primary/40 text-primary mt-6 inline-block rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-widest">
          See you soon!
        </div>

        <h2 className="text-cgv-green-dark mt-4 text-xl font-bold">
          Tính năng đang được phát triển
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-gray-500">
          Chúng tôi đang nỗ lực xây dựng tính năng này. Vui lòng quay lại sau!
        </p>

        <div className="mt-6 flex items-center justify-center gap-2">
          <span
            className="bg-primary h-2 w-2 animate-bounce rounded-full"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="bg-primary h-2 w-2 animate-bounce rounded-full"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="bg-primary h-2 w-2 animate-bounce rounded-full"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  )
}

export default TinhNangPhatTrien
