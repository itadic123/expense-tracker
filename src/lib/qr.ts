import { scanFromURLAsync } from 'expo-camera';

// Native: decode a QR code from a picked photo.
export async function decodeQrFromImageUri(uri: string): Promise<string[]> {
  const codes = await scanFromURLAsync(uri, ['qr']);
  return codes.map((c) => c.data);
}

// Only the web scanner decodes raw frames; the native camera scans by itself.
export async function decodeQrFromImageData(image: ImageData): Promise<string | null> {
  void image;
  return null;
}
