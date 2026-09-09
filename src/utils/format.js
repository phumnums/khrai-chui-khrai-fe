/**
 * แปลงตัวเลขเป็นรูปแบบเงินบาท ทศนิยม 2 ตำแหน่ง เช่น 1234.5 -> "1,234.50"
 */
export function formatBaht(value) {
  const num = Number(value)
  if (Number.isNaN(num)) return '0.00'
  return num.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

/**
 * แปลง string ตัวเลขที่พิมพ์ในฟอร์มให้เป็น number ที่ปลอดภัย (รองรับค่าว่าง)
 */
export function toNumber(value) {
  if (value === '' || value === null || value === undefined) return 0
  const n = Number(value)
  return Number.isNaN(n) ? 0 : n
}

/**
 * ปัดเศษ 2 ตำแหน่งแบบตัวเลข (ไม่ใช่ string) สำหรับใช้คำนวณต่อ
 */
export function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
