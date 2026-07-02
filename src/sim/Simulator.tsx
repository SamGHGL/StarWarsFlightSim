import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { CameraMode, DEFAULT_SETTINGS, Settings } from "./types";
import { createShipState, stepShip } from "./physics/flight";
import { useKeyboardInput } from "./input/keyboard";
import { useGamepadInput } from "./input/gamepad";
import { SceneRoot } from "./scene/SceneRoot";
import { PLANETS } from "./scene/Planets";
import { HUD } from "./hud/HUD";
import { SettingsPanel } from "./hud/SettingsPanel";

/** Bridge component: runs the physics loop inside the R3F frame loop. */
function PhysicsBridge({
  ship,
  readInputs,
  onFrame,
}: {
  ship: ReturnType<typeof createShipState>;
  readInputs: () => void;
  onFrame: () => void;
}) {
  useFrame((_, dt) => {
    readInputs();
    onFrame();
    // dt is set by R3F; nothing further here
    void ship;
    void dt;
  });
  return null;
}

export function Simulator() {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const raw = localStorage.getItem("nw.settings");
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });
  useEffect(() => { try { localStorage.setItem("nw.settings", JSON.stringify(settings)); } catch {} }, [settings]);

  const shipRef = useRef(createShipState());
  const [cameraMode, setCameraMode] = useState<CameraMode>("cockpit");
  const [targetIndex, setTargetIndex] = useState(0);

  // Trigger HUD re-render at reasonable rate
  const [, setTick] = useState(0);

  const keyboard = useKeyboardInput(settings);
  const gamepad = useGamepadInput(settings);

  const activeDevice = useMemo(
    () => gamepad.devices.find(d => d.index === gamepad.activeIndex),
    [gamepad.devices, gamepad.activeIndex],
  );

  const stepAll = useCallback((dt: number) => {
    const k = keyboard.read();
    const g = gamepad.read();
    // Merge: prefer non-zero from either source
    const merged = {
      pitch: Math.abs(g.pitch) > Math.abs(k.pitch) ? g.pitch : k.pitch,
      yaw:   Math.abs(g.yaw)   > Math.abs(k.yaw)   ? g.yaw   : k.yaw,
      roll:  Math.abs(g.roll)  > Math.abs(k.roll)  ? g.roll  : k.roll,
      throttleDelta: k.throttleDelta,
      throttleAbsolute: (g as any).throttleAbsolute,
      boost: k.boost || g.boost,
      brake: k.brake || g.brake,
      fire: k.fire || g.fire,
      cycleTarget: k.cycleTarget || g.cycleTarget,
      toggleView: k.toggleView || g.toggleView,
    };
    if (merged.toggleView) setCameraMode(m => m === "cockpit" ? "third" : "cockpit");
    if (merged.cycleTarget) setTargetIndex(i => (i + 1) % PLANETS.length);

    stepShip(shipRef.current, merged, settings, Math.min(dt, 0.05));
  }, [keyboard, gamepad, settings]);

  // R3F frame delegates
  const lastTs = useRef(performance.now());
  const onFrame = useCallback(() => {
    const now = performance.now();
    const dt = (now - lastTs.current) / 1000;
    lastTs.current = now;
    stepAll(dt);
  }, [stepAll]);

  // HUD refresh
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 60);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden">
      <Canvas
        camera={{ fov: 75, position: [0, 0, 0] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <SceneRoot ship={shipRef.current} cameraMode={cameraMode} targetIndex={targetIndex} />
          <PhysicsBridge ship={shipRef.current} readInputs={() => {}} onFrame={onFrame} />
        </Suspense>
      </Canvas>

      <HUD
        ship={shipRef.current}
        cameraMode={cameraMode}
        targetIndex={targetIndex}
        gamepadName={activeDevice?.id}
        isHOTAS={activeDevice?.isHOTAS}
      />
      <SettingsPanel
        settings={settings}
        setSettings={setSettings}
        devices={gamepad.devices}
        activeGamepad={gamepad.activeIndex}
        setActiveGamepad={gamepad.setActive}
      />
    </div>
  );
}
