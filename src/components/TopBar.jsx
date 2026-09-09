export default function TopBar({ step, total = 3, done = false }) {
  return (
    <div className="topbar">
      <span className={`pill ${done ? 'success' : ''}`}>
        {done ? 'เสร็จสิ้น' : `ขั้นตอนที่ ${step} จาก ${total}`}
      </span>
      <span className="brand">ใครช่วยใคร</span>
    </div>
  )
}
