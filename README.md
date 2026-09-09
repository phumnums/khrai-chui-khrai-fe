# ใครช่วยใคร (Khrai Chui Khrai) — Frontend

หน้าบ้าน React (Vite) สำหรับแอปหารบิลเพื่อนแบบ "ไทยช่วยไทย 60:40" ต่อกับ backend Go ที่มีอยู่แล้ว

3 ขั้นตอน:
1. **ข้อมูลการจ่ายเงินหลัก** — กรอกเอง หรืออัปโหลดสลิปให้ระบบอ่านให้ (OCR ฟรี ทำงานในเบราว์เซอร์)
2. **เพิ่มรายการสินค้า** — ระบุว่าใครซื้ออะไร ราคาเท่าไร
3. **สรุปยอด** — ยิง API ไปคำนวณ แล้วแสดงว่าแต่ละคนต้องจ่ายคืนเท่าไร พร้อมคัดลอกข้อความไปแชร์ในกลุ่ม

---

## 1. เริ่มรันในเครื่อง

ต้องมี [Node.js](https://nodejs.org) เวอร์ชัน 18 ขึ้นไป

```bash
npm install
cp .env.example .env
npm run dev
```

จะได้เว็บที่ `http://localhost:5173`

ค่าเริ่มต้นใน `.env` ชี้ไปที่ `http://localhost:3000` (backend Go ของคุณ) — ถ้า backend รันคนละพอร์ต แก้ค่า `VITE_API_BASE_URL` ในไฟล์ `.env` ได้เลย

### ⚠️ ต้องเปิด CORS ที่ backend Go ก่อน

หน้าบ้านรันที่ `localhost:5173` แต่ backend รันที่ `localhost:3000` คนละ origin กัน เบราว์เซอร์จะบล็อก request ถ้า backend ไม่อนุญาต CORS

ถ้าใช้ `net/http` ตรงๆ:

```go
func withCORS(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		h.ServeHTTP(w, r)
	})
}

// ตอน register: http.ListenAndServe(":3000", withCORS(mux))
```

ถ้าใช้ [Gin](https://gin-gonic.com/) กับ `gin-contrib/cors`:

```go
import "github.com/gin-contrib/cors"

router.Use(cors.New(cors.Config{
	AllowOrigins: []string{"http://localhost:5173"},
	AllowMethods: []string{"POST", "OPTIONS"},
	AllowHeaders: []string{"Content-Type"},
}))
```

ตอน deploy จริง อย่าลืมเปลี่ยน origin จาก `localhost:5173` เป็นโดเมนจริงของหน้าบ้าน

---

## 2. API ที่ใช้

`POST /api/v1/calculate`

**Request**
```json
{
  "total_amount": 100,
  "government_support": 60,
  "paid_amount": 40,
  "order_items": [
    { "name": "Titch", "item_name": "ชานม + พุดดิ้งช็อก", "purchased_amount": 33 }
  ]
}
```

**Response**
```json
{
  "data": [
    { "name": "Titch", "item_name": "ชานม + พุดดิ้งช็อก", "purchased_total": 33, "amount_to_pay": "13.20" }
  ]
}
```

หน้าบ้านจะ group ข้อมูลตาม `name` ให้อัตโนมัติ (คนเดียวกันซื้อหลายรายการ จะรวมยอด `amount_to_pay` ให้เป็นยอดเดียว) แล้วแสดงในหน้าสรุป

---

## 3. เกี่ยวกับฟีเจอร์ OCR อ่านสลิป

ใช้ [`tesseract.js`](https://github.com/naptha/tesseract.js) ซึ่ง **ฟรี 100% ทำงานฝั่งเบราว์เซอร์ ไม่ต้องมี API key หรือสมัครบัญชีใดๆ** ตัวไลบรารีจะโหลดไฟล์ language data (ภาษาไทย+อังกฤษ) จาก CDN ตอนใช้งานจริงครั้งแรก จึงต้องมีอินเทอร์เน็ต

**ข้อจำกัดที่ควรรู้:** OCR แบบฟรีนี้แม่นยำน้อยกว่าบริการ OCR เชิงพาณิชย์ (เช่น Google Vision, Typhoon OCR) โดยเฉพาะกับสลิปที่ตัวหนังสือเอียง/เบลอ/แสงไม่ดี ระบบจะพยายามเดา "ยอดรวม" จากคำใกล้เคียง เช่น "รวม", "total", "ยอดสุทธิ" แล้วให้ผู้ใช้กด **"แก้ไข"** เพื่อตรวจสอบและแก้ตัวเลขก่อนยืนยันเสมอ (ตามหน้าจอที่ออกแบบไว้) — จึงยังใช้งานได้จริงแม้ OCR อ่านผิดบ้าง

ถ้าในอนาคตอยากได้ความแม่นยำสูงขึ้นโดยยังฟรีอยู่ ตัวเลือกที่พอมี free tier ให้ใช้:
- **Google Cloud Vision API** — ฟรี 1,000 หน่วย/เดือน (ต้องสมัครบัตรเครดิตแต่ไม่โดนตัดถ้าไม่เกิน quota)
- **Typhoon OCR** (โมเดลไทยโดยเฉพาะจาก SCB 10X) — มี API ให้ทดลองใช้ฟรีในโควต้าจำกัด

---

## 4. Deploy ขึ้นจริง (เลือกเฉพาะบริการฟรี)

### Frontend (React)
แนะนำ **Vercel** หรือ **Cloudflare Pages** (ฟรีไม่จำกัด bandwidth ทั้งคู่)

**Vercel:**
1. Push โค้ดขึ้น GitHub
2. ไปที่ [vercel.com](https://vercel.com) → New Project → เลือก repo นี้
3. Build command: `npm run build`, Output directory: `dist`
4. ใส่ Environment Variable: `VITE_API_BASE_URL` = URL ของ backend ที่ deploy แล้ว
5. Deploy — จะได้โดเมนฟรี `xxx.vercel.app`

### Backend (Go)
แนะนำ **Render.com** free web service (มี sleep หลังไม่มีคนใช้ 15 นาที ซึ่งพอสำหรับโปรเจกต์ส่วนตัว/ทดสอบ)

1. Push โค้ด Go ขึ้น GitHub (แยก repo หรือ subfolder ก็ได้)
2. ไปที่ [render.com](https://render.com) → New → Web Service → เลือก repo
3. Runtime: Go, Build command: `go build -o app`, Start command: `./app`
4. หลัง deploy เสร็จจะได้ URL เช่น `https://your-app.onrender.com`
5. อย่าลืมแก้ CORS ให้อนุญาต origin ของหน้าบ้าน (โดเมน Vercel จริง ไม่ใช่ localhost แล้ว)
6. กลับไปตั้งค่า `VITE_API_BASE_URL` ที่ Vercel ให้ชี้มาที่ URL นี้ แล้ว redeploy frontend

ทางเลือกอื่นสำหรับ backend ที่มี free tier เหมือนกัน: **Fly.io** (มี free allowance เล็กๆ), **Google Cloud Run** (pay-per-use แต่มี free quota ต่อเดือนค่อนข้างเยอะ)

---

## โครงสร้างโปรเจกต์

```
src/
  api.js                 # เรียก POST /api/v1/calculate
  App.jsx                # ควบคุม step 1-2-3
  components/
    TopBar.jsx            # pill ขั้นตอน + โลโก้
    PaymentSetup.jsx       # step 1: กรอกเอง + OCR
    OrderInfo.jsx          # step 2: เพิ่มรายการสินค้า
    Summary.jsx            # step 3: เรียก API + สรุปผล
  utils/format.js         # ฟอร์แมตเงินบาท
  styles/index.css        # ธีมสี/สไตล์ทั้งหมด
```
