import { useRef, useState } from 'react'
import TopBar from './TopBar.jsx'
import { formatBaht, round2, toNumber } from '../utils/format.js'

const NUMBER_REGEX = /\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?/g
const KEYWORD_REGEX = /(รวม|total|ยอดสุทธิ|ยอดชำระ|net)/i

function guessTotalFromText(text) {
  const lines = text.split('\n')
  let candidates = []

  for (const line of lines) {
    if (KEYWORD_REGEX.test(line)) {
      const nums = line.match(NUMBER_REGEX)
      if (nums) candidates.push(...nums.map((n) => parseFloat(n.replace(/,/g, ''))))
    }
  }

  if (candidates.length === 0) {
    const allNums = text.match(NUMBER_REGEX)
    if (allNums) candidates = allNums.map((n) => parseFloat(n.replace(/,/g, '')))
  }

  candidates = candidates.filter((n) => !Number.isNaN(n) && n > 0)
  if (candidates.length === 0) return null
  return Math.max(...candidates)
}

export default function PaymentSetup({ payment, setPayment, onNext }) {
  const [mode, setMode] = useState('manual')
  const [previewUrl, setPreviewUrl] = useState(null)
  const [progressLabel, setProgressLabel] = useState('')
  const fileInputRef = useRef(null)

  const total = toNumber(payment.total_amount)
  const gov = toNumber(payment.government_support)
  const paid = toNumber(payment.paid_amount)

  const isValid = total > 0 && gov >= 0 && paid >= 0 && Math.abs(gov + paid - total) < 0.01

  function updateFromTotal(rawTotal) {
    const t = toNumber(rawTotal)
    const defaultGov = round2(t * 0.6)
    setPayment({
      total_amount: rawTotal,
      government_support: t > 0 ? String(defaultGov) : '',
      paid_amount: t > 0 ? String(round2(t - defaultGov)) : ''
    })
  }

  function updateFromGov(rawGov) {
    const g = toNumber(rawGov)
    setPayment((prev) => ({
      ...prev,
      government_support: rawGov,
      paid_amount: String(round2(total - g))
    }))
  }

  function updateFromPaid(rawPaid) {
    const p = toNumber(rawPaid)
    setPayment((prev) => ({
      ...prev,
      paid_amount: rawPaid,
      government_support: String(round2(total - p))
    }))
  }

  async function handleFileSelected(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setPreviewUrl(URL.createObjectURL(file))
    setProgressLabel('กำลังเตรียมอ่านข้อมูล...')

    try {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker('tha+eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgressLabel(`กำลังอ่านสลิป... ${Math.round((m.progress || 0) * 100)}%`)
          } else if (m.status) {
            setProgressLabel(m.status)
          }
        }
      })

      const {
        data: { text }
      } = await worker.recognize(file)
      await worker.terminate()

      const guessed = guessTotalFromText(text)

      if (!guessed) {
        setPayment({ total_amount: '', government_support: '', paid_amount: '' })
        return
      }

      const defaultGov = round2(guessed * 0.6)
      setPayment({
        total_amount: String(guessed),
        government_support: String(defaultGov),
        paid_amount: String(round2(guessed - defaultGov))
      })
    } catch (err) {

      console.error('Failed to process file:', err)
    }
  }

  return (
    <div className="app-card">
      <TopBar step={1} />

      <div className="heading-block">
        <h1>{mode === 'manual' ? 'ข้อมูลการจ่ายเงินหลัก' : 'อัปโหลดสลิปชำระเงิน'}</h1>
        <p>
          {mode === 'manual'
            ? 'ระบุยอดรวมจากสลิปหรือใบเสร็จหลัก'
            : 'ระบบจะอ่านยอดเงินและคำนวณส่วนลดให้อัตโนมัติ'}
        </p>
      </div>

      {mode === 'manual' && (
        <div className="panel">
          <div className="field">
            <label>ราคาเต็มทั้งหมด (บาท) *</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={payment.total_amount}
              onChange={(e) => updateFromTotal(e.target.value)}
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label>รัฐจ่าย (60%) *</label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={payment.government_support}
                onChange={(e) => updateFromGov(e.target.value)}
              />
            </div>
            <div className="field highlighted">
              <label>เราจ่ายจริง (40%) *</label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={payment.paid_amount}
                onChange={(e) => updateFromPaid(e.target.value)}
              />
            </div>
          </div>

          <div className="hint-box">
            <span className="icon">💡</span>
            <span>คำนวณยอดจ่ายจริงตามสัดส่วนสินค้า รองรับกรณีรัฐช่วยไม่เต็มจำนวน</span>
          </div>

          {!isValid && total > 0 && (
            <span className="field-error">
              ยอดรัฐช่วย + ยอดเราจ่ายจริง ต้องรวมกันเท่ากับราคาเต็มทั้งหมด
            </span>
          )}
        </div>
      )}

      {(mode === 'manual') && (
        <button className="btn btn-primary btn-block" disabled={!isValid} onClick={onNext} type="button">
          {mode === 'ocr' ? 'ยืนยันและใส่รายการสินค้าต่อ →' : 'ใส่รายการสินค้าต่อ →'}
        </button>
      )}
    </div>
  )
}