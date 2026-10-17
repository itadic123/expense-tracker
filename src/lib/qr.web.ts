import { readBarcodes, setZXingModuleOverrides } from 'zxing-wasm/reader';

// Serve the decoder from our own site (public/zxing_reader.wasm) instead of a CDN that browsers may block.
setZXingModuleOverrides({
  locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? '/zxing_reader.wasm' : prefix + path),
});

const OPTIONS = { formats: ['QRCode' as const], tryHarder: true, tryInvert: false, maxNumberOfSymbols: 1 };

export async function decodeQrFromImageData(image: ImageData): Promise<string | null> {
  const results = await readBarcodes(image, OPTIONS);
  return results.find((r) => r.isValid)?.text ?? null;
}

// Photos of receipts are large; ZXing scales them down itself and retries harder if needed.
export async function decodeQrFromImageUri(uri: string): Promise<string[]> {
  const blob = await (await fetch(uri)).blob();
  const results = await readBarcodes(blob, { ...OPTIONS, maxNumberOfSymbols: 4, tryDownscale: true });
  return results.filter((r) => r.isValid).map((r) => r.text);
}
