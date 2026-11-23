// Ứng dụng thêm vào màn hình chính trên iPhone hay giữ bản cũ rất lâu.
// Mỗi lần mở lại app, so file giao diện đang chạy với bản trên máy chủ; khác thì tải lại.
const current = () => document.querySelector('script[type="module"][src*="/assets/"]')?.getAttribute('src');

async function checkForUpdate() {
  const mine = current();
  if (!mine) return; // đang chạy bản dev
  try {
    const res = await fetch(`/?v=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return;
    const html = await res.text();
    const latest = html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/)?.[1];
    if (latest && latest !== mine) window.location.reload();
  } catch {
    // mất mạng thì thôi, lần sau kiểm tra lại
  }
}

export function watchForUpdates() {
  checkForUpdate();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdate();
  });
}
