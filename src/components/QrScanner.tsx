import { CameraView } from 'expo-camera';
import { StyleSheet } from 'react-native';

type Props = { paused: boolean; onScanned: (data: string) => void };

// Android/iOS: the native scanner (ML Kit / AVFoundation) handles dense receipt QR codes well.
export function QrScanner({ paused, onScanned }: Props) {
  return (
    <CameraView
      style={StyleSheet.absoluteFill}
      facing="back"
      autofocus="on"
      barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      onBarcodeScanned={paused ? undefined : ({ data }) => onScanned(data)}
    />
  );
}
