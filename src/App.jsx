import { useState } from 'react'
import PaymentSetup from './components/PaymentSetup.jsx'
import OrderInfo from './components/OrderInfo.jsx'
import Summary from './components/Summary.jsx'

const EMPTY_PAYMENT = { total_amount: '', government_support: '', paid_amount: '' }

export default function App() {
  const [step, setStep] = useState(1)
  const [payment, setPayment] = useState(EMPTY_PAYMENT)
  const [items, setItems] = useState([])

  function handleReset() {
    setPayment(EMPTY_PAYMENT)
    setItems([])
    setStep(1)
  }

  return (
    <div className="app-shell">
      {step === 1 && <PaymentSetup payment={payment} setPayment={setPayment} onNext={() => setStep(2)} />}

      {step === 2 && (
        <OrderInfo
          items={items}
          setItems={setItems}
          totalAmount={payment.total_amount}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && <Summary payment={payment} items={items} onReset={handleReset} />}
    </div>
  )
}
