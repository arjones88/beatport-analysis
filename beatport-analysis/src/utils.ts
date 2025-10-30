export function slugFromUrl(url: string) {
  try {
    const m = url.match(/\/genre\/([^/]+)/);
    return m ? m[1] : "";
  } catch {
    return "";
  }
}