/**
 * Lazy images load only as the scroll nears them, so a fast scroll can find
 * one still arriving. Once the page has loaded and the browser is idle, this
 * starts every lazy image on the page fetching, top to bottom, so they're
 * there before the scroll is. Skipped when the visitor's browser asks to save
 * data or the connection is slow (2G).
 */
export function warmImages() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (connection?.saveData || /2g$/.test(connection?.effectiveType ?? "")) return;
  let idleId = 0;
  let live = true;
  const warm = () => {
    if (!live) return;
    for (const img of document.querySelectorAll<HTMLImageElement>('img[loading="lazy"]')) img.loading = "eager";
  };
  const start = () => {
    if (typeof requestIdleCallback === "function") idleId = requestIdleCallback(warm, { timeout: 4000 });
    else setTimeout(warm, 2000);
  };
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
  return () => {
    live = false;
    window.removeEventListener("load", start);
    if (idleId) cancelIdleCallback(idleId);
  };
}
