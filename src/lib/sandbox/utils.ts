/** Simulate a realistic API delay for sandbox mode. */
export function simulateDelay(ms = 300): Promise<void> {
  const jitter = ms * 0.5;
  const delay = ms + Math.random() * jitter - jitter / 2;
  return new Promise((resolve) => setTimeout(resolve, Math.max(100, delay)));
}
