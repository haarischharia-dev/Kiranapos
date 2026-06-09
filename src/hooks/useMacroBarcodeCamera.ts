import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { Camera, CameraDevice } from 'react-native-vision-camera';
import { getCameraDevice, useCameraDevices, useCameraFormat } from 'react-native-vision-camera';

/** Default 2× optical/digital zoom for barcode close-ups. */
export const MACRO_ZOOM_FACTOR = 2;

const FOCUS_HUNT_Y_DP = [0, -8, 8, -14, 14] as const;

const MACRO_LOCK_MS = 1400;
const HUNT_IDLE_MS = 2200;
const FOCUS_BURST_GAP_MS = 400;

export type CameraLayout = { width: number; height: number };

/** Focus at the scanner reticle center (camera-view dp). */
export function getReticleFocusPoint(layout: CameraLayout, yOffsetDp = 0): { x: number; y: number } {
  const centerY = layout.height / 2 + yOffsetDp;
  return {
    x: layout.width / 2,
    y: Math.max(12, Math.min(layout.height - 12, centerY)),
  };
}

export function getMacroZoom(device: CameraDevice): number {
  const target = device.neutralZoom * MACRO_ZOOM_FACTOR;
  return Math.min(Math.max(target, device.minZoom), device.maxZoom);
}

/** Pick the back camera that can focus closest; fall back to multi-cam for optical 2×. */
export function selectBarcodeCameraDevice(devices: CameraDevice[]): CameraDevice | undefined {
  const backDevices = devices.filter((d) => d.position === 'back');
  if (backDevices.length === 0) return undefined;

  const macroCandidates = backDevices.filter((d) => d.minFocusDistance > 0);
  if (macroCandidates.length > 0) {
    return macroCandidates.sort((a, b) => a.minFocusDistance - b.minFocusDistance)[0];
  }

  return (
    getCameraDevice(devices, 'back', {
      physicalDevices: ['wide-angle-camera', 'telephoto-camera'],
    }) ??
    getCameraDevice(devices, 'back', {
      physicalDevices: ['wide-angle-camera'],
    }) ??
    backDevices[0]
  );
}

type UseMacroBarcodeCameraOptions = {
  cameraRef: React.RefObject<Camera | null>;
  isActive: boolean;
  cameraLayout: CameraLayout | null;
};

export function useMacroBarcodeCamera({ cameraRef, isActive, cameraLayout }: UseMacroBarcodeCameraOptions) {
  const devices = useCameraDevices();
  const device = useMemo(() => selectBarcodeCameraDevice(devices), [devices]);

  const format = useCameraFormat(device, [
    { videoResolution: { width: 1280, height: 720 } },
    { fps: 30 },
  ]);

  const macroZoom = device ? getMacroZoom(device) : MACRO_ZOOM_FACTOR;
  const lastCodeSeenAt = useRef(Date.now());
  const huntIndex = useRef(0);
  const previewReady = useRef(false);
  const focusChain = useRef(Promise.resolve());

  const markCodeSeen = useCallback(() => {
    lastCodeSeenAt.current = Date.now();
    huntIndex.current = 0;
  }, []);

  const applyMacroFocus = useCallback(
    (yOffsetDp = 0): Promise<boolean> => {
      if (!cameraRef.current || !device?.supportsFocus || !previewReady.current || !cameraLayout) {
        return Promise.resolve(false);
      }

      const point = getReticleFocusPoint(cameraLayout, yOffsetDp);

      focusChain.current = focusChain.current
        .catch(() => undefined)
        .then(async () => {
          try {
            await cameraRef.current!.focus(point);
            return true;
          } catch (error) {
            console.warn('📸 Macro focus rejected:', error);
            return false;
          }
        });

      return focusChain.current;
    },
    [cameraRef, cameraLayout, device?.supportsFocus],
  );

  const runFocusBurst = useCallback(async () => {
    if (!device?.supportsFocus || !cameraLayout) return;
    for (const yOffset of FOCUS_HUNT_Y_DP) {
      await applyMacroFocus(yOffset);
      await new Promise((resolve) => setTimeout(resolve, FOCUS_BURST_GAP_MS));
    }
  }, [applyMacroFocus, cameraLayout, device?.supportsFocus]);

  const onPreviewStarted = useCallback(() => {
    previewReady.current = true;
    const sample = cameraLayout ? getReticleFocusPoint(cameraLayout) : null;
    console.warn(
      `📸 Macro camera ready: id=${device?.id} minFocusCm=${device?.minFocusDistance} zoom=${macroZoom.toFixed(2)} focusDp=${sample ? `(${sample.x.toFixed(0)},${sample.y.toFixed(0)})` : 'pending-layout'}`,
    );
    void runFocusBurst();
  }, [cameraLayout, device?.id, device?.minFocusDistance, macroZoom, runFocusBurst]);

  const onPreviewStopped = useCallback(() => {
    previewReady.current = false;
  }, []);

  // Layout is measured after first paint; refocus once we know reticle dp coordinates.
  useEffect(() => {
    if (!isActive || !cameraLayout || !previewReady.current || !device?.supportsFocus) return;
    void applyMacroFocus(0);
  }, [cameraLayout, isActive, device?.supportsFocus, applyMacroFocus]);

  useEffect(() => {
    if (!isActive || !device?.supportsFocus || !cameraLayout) return;

    const interval = setInterval(() => {
      if (!previewReady.current) return;

      const idleFor = Date.now() - lastCodeSeenAt.current;
      const yOffset =
        idleFor >= HUNT_IDLE_MS ? FOCUS_HUNT_Y_DP[huntIndex.current % FOCUS_HUNT_Y_DP.length] : 0;
      if (idleFor >= HUNT_IDLE_MS) huntIndex.current += 1;

      void applyMacroFocus(yOffset);
    }, MACRO_LOCK_MS);

    return () => clearInterval(interval);
  }, [isActive, device?.supportsFocus, cameraLayout, applyMacroFocus]);

  return {
    device,
    format,
    macroZoom,
    markCodeSeen,
    onPreviewStarted,
    onPreviewStopped,
  };
}
