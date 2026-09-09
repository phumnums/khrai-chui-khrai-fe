import { useRef, useState } from 'react'
import TopBar from './TopBar.jsx'
import { formatBaht, round2, toNumber } from '../utils/format.js'

const NUMBER_REGEX = /\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?/g
const KEYWORD_REGEX = /(รวม|total|ยอดสุทธิ|ยอดชำระ|net)/i

// เดา "ยอดรวม" จากข้อความที่ OCR อ่านได้ — เลือกตัวเลขที่อยู่ในบรรทัดที่มีคำว่า
// "รวม/total" ก่อน ถ้าไม่เจอค่อย fallback ไปหาตัวเลขที่มากที่สุดในสลิปทั้งใบ
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
  const [mode, setMode] = useState('manual') // 'manual' | 'ocr'
  const [ocrStage, setOcrStage] = useState('upload') // 'upload' | 'processing' | 'result' | 'edit'
  const [previewUrl, setPreviewUrl] = useState(null)
  const [progressLabel, setProgressLabel] = useState('')
  const [ocrError, setOcrError] = useState('')
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

    setOcrError('')
    setPreviewUrl(URL.createObjectURL(file))
    setOcrStage('processing')
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
        setOcrError('อ่านยอดเงินจากสลิปไม่สำเร็จ กรุณากรอกด้วยตัวเองหรือลองแก้ไขค่าที่ได้')
        setPayment({ total_amount: '', government_support: '', paid_amount: '' })
        setOcrStage('edit')
        return
      }

      const defaultGov = round2(guessed * 0.6)
      setPayment({
        total_amount: String(guessed),
        government_support: String(defaultGov),
        paid_amount: String(round2(guessed - defaultGov))
      })
      setOcrStage('result')
    } catch (err) {
      setOcrError('เกิดข้อผิดพลาดระหว่างอ่านสลิป กรุณาลองใหม่ หรือกรอกด้วยตัวเองแทน')
      setOcrStage('edit')
    }
  }

  function resetOcr() {
    setOcrStage('upload')
    setPreviewUrl(null)
    setOcrError('')
    setPayment({ total_amount: '', government_support: '', paid_amount: '' })
    if (fileInputRef.current) fileInputRef.current.value = ''
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

      {/* <div className="tabs">
        <button
          className={`tab ${mode === 'manual' ? 'active' : ''}`}
          onClick={() => setMode('manual')}
          type="button"
        >
          กรอกด้วยตัวเอง
        </button>
        <button
          className={`tab ${mode === 'ocr' ? 'active' : ''}`}
          onClick={() => setMode('ocr')}
          type="button"
        >
          อัปโหลดสลิป (OCR)
        </button>
      </div> */}

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

      {mode === 'ocr' && (
        <div className="panel">
          <label className="dropzone" htmlFor="slip-upload">
            {previewUrl ? (
              <img src={previewUrl} alt="สลิปที่อัปโหลด" className="preview-thumb" />
            ) : (
              <span className="emoji">📷</span>
            )}
            <p>เลือกรูปสลิปจากคลังภาพ / ถ่ายภาพ</p>
            <span>รองรับไฟล์ JPG, PNG (สลิปธนาคาร / ใบเสร็จ)</span>
            <span className="btn btn-secondary" style={{ marginTop: 4 }}>
              + อัปโหลดรูปสลิป
            </span>
            <input
              id="slip-upload"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelected}
            />
          </label>

          {ocrStage === 'processing' && (
            <div className="loading-block">
              <div className="spinner" />
              <span className="progress-text">{progressLabel}</span>
            </div>
          )}

          {ocrError && <div className="error-box">{ocrError}</div>}

          {ocrStage === 'result' && (
            <div className="ocr-result">
              <div className="ocr-result-header">
                <span>
                  <span className="dot" />
                  อ่านข้อมูลสำเร็จ (OCR Result)
                </span>
                <button className="btn-link" type="button" onClick={resetOcr}>
                  เปลี่ยนรูป
                </button>
              </div>
              <div className="ocr-row">
                <span className="label">ราคาเต็มในสลิป:</span>
                <span className="value">{formatBaht(total)} ฿</span>
              </div>
              <div className="ocr-row">
                <span className="label">สิทธิ์รัฐช่วยจ่าย (60%):</span>
                <span className="value deduct">-{formatBaht(gov)} ฿</span>
              </div>
              <div className="ocr-row">
                <span className="label">ยอดเราจ่ายจริง (40%):</span>
                <span className="value final">{formatBaht(paid)} ฿</span>
              </div>
              <div className="hint-box">
                <span className="icon">✨</span>
                <span>ข้อมูลถูกดึงจากสลิปเรียบร้อยแล้ว หากยอดเงินไม่ถูกต้อง คุณสามารถกดแก้ไขได้</span>
              </div>
              <button className="btn btn-secondary btn-block" type="button" onClick={() => setOcrStage('edit')}>
                แก้ไข
              </button>
            </div>
          )}

          {ocrStage === 'edit' && (
            <>
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
              <button
                className="btn btn-primary btn-block"
                type="button"
                disabled={!isValid}
                onClick={() => setOcrStage('result')}
              >
                ยืนยันการแก้ไข →
              </button>
            </>
          )}
        </div>
      )}

      {/* {(mode === 'manual' || ocrStage === 'result') && ( */}
      {(mode === 'manual') && (
        <button className="btn btn-primary btn-block" disabled={!isValid} onClick={onNext} type="button">
          {mode === 'ocr' ? 'ยืนยันและใส่รายการสินค้าต่อ →' : 'ใส่รายการสินค้าต่อ →'}
        </button>
      )}
    </div>
  )
}
