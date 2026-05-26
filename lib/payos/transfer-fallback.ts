import { getSepayBankDisplay, isSepayConfigured } from '@/lib/sepay/client'
import { formatPayosDescription } from '@/lib/payos/client'

/** Hướng dẫn CK thủ công khi QR PayOS không đối soát (cùng TK SePay) */
export function getPayosManualTransferHint(orderCode: number, amountVnd: number) {
  const memo = formatPayosDescription(orderCode)
  const sepayOn = isSepayConfigured()
  const bank = sepayOn ? getSepayBankDisplay() : null

  return {
    transferMemo: memo,
    amountVnd,
    bank,
    sepayReconcileEnabled: sepayOn,
    hintVi: sepayOn
      ? `Nếu QR PayOS chuyển thẳng vào TK ngân hàng: ghi nội dung CK đúng "${memo}" và đúng ${amountVnd.toLocaleString('vi-VN')}đ. SePay sẽ xác nhận đơn (PayOS có thể vẫn PENDING trên trang PayOS).`
      : `Ghi nội dung CK đúng "${memo}" khi chuyển khoản. Cần bật SePay webhook hoặc liên kết TK ảo trên PayOS.`,
  }
}
