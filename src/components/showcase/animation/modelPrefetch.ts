/**
 * The Wild West models' files, fetched ahead: once the page is idle after
 * loading, AnimationSection starts the GLBs, the Draco decoder and the scene's
 * code (three.js) downloading in the background, so when the models' row
 * nears there's nothing left to wait for but the GPU. Downloads don't hold up
 * the page; only the GPU steps are kept for when the page is still.
 */
const bytes = new Map<string, Promise<ArrayBuffer>>();

/** A model's bytes: the prefetched ones if they've been asked for, else fetched now. */
export function modelBytes(url: string) {
  let got = bytes.get(url);
  if (!got) {
    got = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`${url}: ${r.status}`);
      return r.arrayBuffer();
    });
    // A failed prefetch shouldn't stick: the scene asks again.
    got.catch(() => bytes.delete(url));
    bytes.set(url, got);
  }
  return got;
}

/** The Draco decoder's files (DRACOLoader fetches them itself, from the browser's cache once these are in). */
const DECODER = ["/draco/draco_wasm_wrapper.js", "/draco/draco_decoder.wasm"];

/** Starts everything downloading: the models, the decoder, and the scene's code. */
export function prefetchModels(glbs: string[]) {
  for (const url of glbs) modelBytes(url).catch(() => {});
  for (const url of DECODER) fetch(url).catch(() => {});
  import("./stumpScene").catch(() => {});
}
