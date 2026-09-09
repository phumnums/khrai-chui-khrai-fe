import { useState } from 'react'
import TopBar from './TopBar.jsx'
import { formatBaht, toNumber } from '../utils/format.js'

export default function OrderInfo({ items, setItems, totalAmount, onBack, onNext }) {
  const [name, setName] = useState('')
  const [itemName, setItemName] = useState('')
  const [amount, setAmount] = useState('')

  const itemsTotal = items.reduce((sum, it) => sum + toNumber(it.purchased_amount), 0)
  const diff = Math.round((toNumber(totalAmount) - itemsTotal) * 100) / 100
  const isMatching = Math.abs(diff) < 0.01
  const canAdd = name.trim() !== '' && toNumber(amount) > 0

  function handleAdd() {
    if (!canAdd) return
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        item_name: itemName.trim() || '-',
        purchased_amount: toNumber(amount)
      }
    ])
    setName('')
    setItemName('')
    setAmount('')
  }

  function handleRemove(id) {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  return (
    <div className="app-card">
      <TopBar step={2} />

      <div className="heading-block">
        <h1>เพิ่มรายการสินค้า</h1>
        <p>ระบุรายการและราคาย่อยของแต่ละคน</p>
      </div>

      <div className="panel">
        <div className="field-row">
          <div className="field">
            <label>ชื่อคนซื้อ</label>
            <input
              type="text"
              placeholder="เช่น เก้"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="field">
            <label>รายการสินค้า</label>
            <input
              type="text"
              placeholder="เช่น กาแฟ"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label>ราคาย่อย (บาท) *</label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <button className="btn btn-secondary btn-block" type="button" disabled={!canAdd} onClick={handleAdd}>
          + เพิ่มรายการนี้
        </button>
      </div>

      <div className="panel">
        <div className="list-header">
          <span className="count">รายการที่เพิ่มแล้ว ({items.length})</span>
          <span className="total">ยอดรวม: {formatBaht(itemsTotal)} บาท</span>
        </div>

        <div className="items-list">
          {items.length === 0 && <div className="empty-state">ยังไม่มีรายการ — เพิ่มรายการแรกด้านบนได้เลย</div>}
          {items.map((it) => (
            <div className="item-row" key={it.id}>
              <div className="item-info">
                <span className="who">{it.name}</span>
                <span className="what">
                  {it.item_name} · {formatBaht(it.purchased_amount)} บาท
                </span>
              </div>
              <div className="item-right">
                <span className="amount">{formatBaht(it.purchased_amount)} ฿</span>
                <button className="remove-btn" type="button" onClick={() => handleRemove(it.id)} aria-label="ลบรายการ">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && !isMatching && (
          <span className="field-error">
            ยอดรวมรายการ ({formatBaht(itemsTotal)} บาท) ยังไม่ตรงกับราคาเต็มทั้งหมด (
            {formatBaht(totalAmount)} บาท) — {diff > 0 ? `ขาดอีก ${formatBaht(diff)} บาท` : `เกินมา ${formatBaht(-diff)} บาท`}
          </span>
        )}
      </div>

      <div className="btn-row">
        <button className="btn btn-secondary" type="button" onClick={onBack}>
          ← ย้อนกลับ
        </button>
        <button className="btn btn-primary" type="button" disabled={items.length === 0 || !isMatching} onClick={onNext}>
          คำนวณยอดชำระคืน →
        </button>
      </div>
    </div>
  )
}
