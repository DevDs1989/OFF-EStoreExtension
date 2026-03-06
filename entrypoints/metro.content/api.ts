export async function fetchFromBackground(ean: string): Promise<any | null> {
  try {
    const resp: any = await browser.runtime.sendMessage({
      type: "OFF_FETCH",
      ean,
    });
    return resp?.ok ? resp : null;
  } catch (err) {
    console.error("OFF fetch error:", err);
    return null;
  }
}
