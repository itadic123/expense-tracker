import { useEffect, useRef } from 'react';

import { decodeQrFromImageData } from '../lib/qr';

type Props = { paused: boolean; onScanned: (data: string) => void };

const SCAN_INTERVAL_MS = 250;
// Fiscal receipt QR codes are dense; decode a high-resolution centre crop instead of a scaled-down frame.
const CROP_FRACTION = 0.8;
const MAX_CROP_PX = 1200;

// Browser scanner: high-resolution back camera + ZXing (WebAssembly), which reads dense codes
// more reliably than the browser's built-in detector at preview resolution.
export function QrScanner({ paused, onScanned }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pausedRef = useRef(paused);
  const onScannedRef = useRef(onScanned);

  useEffect(() => {
    pausedRef.current = paused;
    onScannedRef.current = onScanned;
  });

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });

    async function tick() {
      const video = videoRef.current;
      if (!stopped && video && context && !pausedRef.current && video.readyState >= 2 && video.videoWidth) {
        const side = Math.min(video.videoWidth, video.videoHeight) * CROP_FRACTION;
        const size = Math.min(side, MAX_CROP_PX);
        canvas.width = size;
        canvas.height = size;
        const sx = (video.videoWidth - side) / 2;
        const sy = (video.videoHeight - side) / 2;
        context.drawImage(video, sx, sy, side, side, 0, 0, size, size);
        try {
          const text = await decodeQrFromImageData(context.getImageData(0, 0, size, size));
          if (text && !pausedRef.current) onScannedRef.current(text);
        } catch {
          // Decoder still loading or frame unreadable; try the next one.
        }
      }
      if (!stopped) timer = setTimeout(tick, SCAN_INTERVAL_MS);
    }

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            // Not in the TS lib yet, but Chrome-based Android browsers honour it.
            advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet],
          },
        });
        if (stopped) return stream.getTracks().forEach((t) => t.stop());
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        tick();
      } catch {
        // Permission denied or no camera; the screen's other options still work.
      }
    })();

    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <video
      ref={videoRef}
      muted
      playsInline
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
}
