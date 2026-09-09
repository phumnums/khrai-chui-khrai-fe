import { useEffect, useState } from 'react'
import TopBar from './TopBar.jsx'
import { calculateSplit } from '../api.js'
import { formatBaht, toNumber } from '../utils/format.js'

export default function Summary({ payment, items, onReset }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [grouped, setGrouped] = useState([])
  const [toast, setToast] = useState('')

  const ratioPercent = Math.round((toNumber(payment.paid_amount) / toNumber(payment.total_amount)) * 100)

  useEffect(() => {
    let cancelled = false

    async function run() {
      setLoading(true)
      setError('')
      try {
        const payload = {
          total_amount: toNumber(payment.total_amount),
          government_support: toNumber(payment.government_support),
          paid_amount: toNumber(payment.paid_amount),
          order_items: items.map((it) => ({
            name: it.name,
            item_name: it.item_name,
            purchased_amount: toNumber(it.purchased_amount)
          }))
        }
        const res = await calculateSplit(payload)
        if (cancelled) return

        const byName = new Map()
        for (const row of res.data || []) {
          const key = row.name
          if (!byName.has(key)) {
            byName.set(key, { name: key, items: [], totalPay: 0 })
          }
          const entry = byName.get(key)
          entry.items.push({
            item_name: row.item_name,
            purchased_total: parseFloat(row.purchased_total),
            amount_to_pay: parseFloat(row.amount_to_pay)
          })
          entry.totalPay += parseFloat(row.amount_to_pay)
        }
        setGrouped(Array.from(byName.values()))
      } catch (err) {
        if (!cancelled) setError(err.message || 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const grandTotal = grouped.reduce((sum, p) => sum + p.totalPay, 0)

  function handleCopy() {
    const lines = [
      `สรุปยอดที่ต้องจ่ายคืน — ใครช่วยใคร`,
      `ราคาเต็ม ${formatBaht(payment.total_amount)} บาท / รัฐช่วย ${formatBaht(payment.government_support)} บาท / จ่ายจริง ${formatBaht(payment.paid_amount)} บาท`,
      ''
    ]
    for (const p of grouped) {
      lines.push(`${p.name}: ${formatBaht(p.totalPay)} บาท`)
    }
    lines.push('')
    lines.push(`รวมทั้งหมด: ${formatBaht(grandTotal)} บาท`)

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setToast('คัดลอกข้อความแล้ว')
      setTimeout(() => setToast(''), 2000)
    })
  }

  return (
    <div className="app-card">
      <TopBar step={3} done />

      <div className="heading-block">
        <h1>สรุปยอดที่ต้องจ่ายคืน</h1>
        <p>คำนวณสัดส่วน {Number.isFinite(ratioPercent) ? ratioPercent : 0}% เรียบร้อยแล้ว</p>
      </div>

      {loading && (
        <div className="panel">
          <div className="loading-block">
            <div className="spinner" />
            <span className="progress-text">กำลังคำนวณยอด...</span>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="panel">
          <div className="error-box">{error}</div>
          <button className="btn btn-secondary btn-block" type="button" onClick={onReset}>
            เริ่มคำนวณใหม่
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="gradient-card">
            <span className="label">ยอดรวมจ่ายจริงทั้งหมด ({Number.isFinite(ratioPercent) ? ratioPercent : 0}%)</span>
            <span className="amount">{formatBaht(grandTotal)} บาท</span>
          </div>

          <div className="persons-list">
            {grouped.map((p) => (
              <div className="person-card" key={p.name}>
                <div className="person-card-top">
                  <span className="name">{p.name}</span>
                  <span className="ratio-badge">สัดส่วน {Number.isFinite(ratioPercent) ? ratioPercent : 0}%</span>
                </div>
                <span className="items-summary">
                  รายการ: {p.items.map((it) => `${it.item_name} (${formatBaht(it.purchased_total)} บาท)`).join(', ')}
                </span>
                <div className="person-card-bottom">
                  <span className="owe-label">ต้องจ่ายคืนเพื่อน:</span>
                  <span className="owe-amount">{formatBaht(p.totalPay)} ฿</span>
                </div>
              </div>
            ))}
          </div>

          <div className="btn-row">
            <button className="btn btn-secondary" type="button" onClick={onReset}>
              เริ่มคำนวณใหม่
            </button>
            <button className="btn btn-primary" type="button" onClick={handleCopy}>
              📋 คัดลอกข้อความ
            </button>
          </div>
        </>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
