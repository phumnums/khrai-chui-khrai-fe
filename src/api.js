const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

/**
 * ส่งข้อมูลไปคำนวณยอดหารเงินที่ backend Go
 * @param {{total_amount:number, government_support:number, paid_amount:number, order_items:Array}} payload
 * @returns {Promise<{data: Array}>}
 */
export async function calculateSplit(payload) {
  let res
  try {
    res = await fetch(`${API_BASE_URL}/api/v1/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  } catch (err) {
    throw new Error(
      `เชื่อมต่อ backend ไม่สำเร็จ (${API_BASE_URL}) — ตรวจสอบว่าเปิดเซิร์ฟเวอร์ Go อยู่ และตั้งค่า CORS ให้อนุญาต origin นี้แล้ว`
    )
  }

  if (!res.ok) {
    let message = `เซิร์ฟเวอร์ตอบกลับผิดพลาด (สถานะ ${res.status})`
    try {
      const errBody = await res.json()
      if (errBody?.message) message = errBody.message
    } catch {
      // ignore parse error, keep default message
    }
    throw new Error(message)
  }

  return res.json()
}
