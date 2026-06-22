interface LoiChaoProps {
  hoVaTen?: string
  khoa?: string
}

// Lời chào đầu trang: tên giảng viên + khoa/đơn vị.
const LoiChao = ({ hoVaTen, khoa }: LoiChaoProps) => {
  return (
    <div>
      <h2 className="m-0 text-lg font-bold leading-tight text-cgv-green-dark">
        Xin chào,&nbsp;
        <span>{hoVaTen || "Giảng viên"}!</span>
      </h2>
      {khoa ? <p className="m-0 mt-0.5 text-xs text-gray-500">{khoa}</p> : null}
    </div>
  )
}

export default LoiChao
