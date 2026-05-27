/** Thời gian phản hồi tối thiểu để hạn chế đoán account tồn tại qua timing */
const LOGIN_MIN_MS = 2500
const LOGIN_JITTER_MS = 900

export async function withConstantLoginTiming<T>(fn: () => Promise<T>): Promise<T> {
  const start = Date.now()
  const target = LOGIN_MIN_MS + Math.floor(Math.random() * LOGIN_JITTER_MS)
  try {
    return await fn()
  } finally {
    const wait = target - (Date.now() - start)
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait))
    }
  }
}

/** Hash bcrypt giả — luôn chạy compare khi user không tồn tại */
export const DUMMY_PASSWORD_HASH =
  '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'
