export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return 'Không xác định';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function formatPrice(price?: number | string | null): string {
  if (price === undefined || price === null || price === 0 || price === '0') {
    return '0 ₫ (FREE)';
  }
  if (typeof price === 'number') {
    return `${price.toLocaleString('vi-VN')} ₫`;
  }
  return `${price}`;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 2000
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < retries - 1) {
        await sleep(delayMs * (i + 1));
      }
    }
  }
  throw lastError;
}
