import { useEffect, useRef, useState } from "react";
import { FlightInput, Settings, ZERO_INPUT } from "../types";

export type GamepadInfo = {
  id: string;
  index: number;
  axes: number;
  buttons: number;
  isHOTAS: boolean;
};

function detectHOTAS(id: string): boolean {
  const s = id.toLowerCase();
  return s.includes("hotas") || s.includes("thrustmaster") || s.includes("t.flight") ||
         s.includes("joystick") || s.includes("stick") || s.includes("t16000") ||
         s.includes("warthog") || s.includes("logitech extreme");
}

function applyDeadzone(v: number, dz: number): number {
  if (Math.abs(v) < dz) return 0;
  const sign = Math.sign(v);
  return sign * ((Math.abs(v) - dz) / (1 - dz));
}

export function useGamepadInput(settings: Settings) {
  const [devices, setDevices] = useState<GamepadInfo[]>([]);
  const activeIndex = useRef<number | null>(null);
  const prevButtons = useRef<boolean[]>([]);

  useEffect(() => {
    const scan = () => {
      const pads = navigator.getGamepads?.() ?? [];
      const list: GamepadInfo[] = [];
      for (const p of pads) {
        if (!p) continue;
        list.push({
          id: p.id, index: p.index, axes: p.axes.length,
          buttons: p.buttons.length, isHOTAS: detectHOTAS(p.id),
        });
      }
      setDevices(list);
      if (activeIndex.current == null && list.length > 0) activeIndex.current = list[0].index;
      if (activeIndex.current != null && !list.find(d => d.index === activeIndex.current)) {
        activeIndex.current = list[0]?.index ?? null;
      }
    };
    const onConn = () => scan();
    window.addEventListener("gamepadconnected", onConn);
    window.addEventListener("gamepaddisconnected", onConn);
    const t = setInterval(scan, 1000);
    scan();
    return () => {
      window.removeEventListener("gamepadconnected", onConn);
      window.removeEventListener("gamepaddisconnected", onConn);
      clearInterval(t);
    };
  }, []);

  const read = (): FlightInput => {
    if (activeIndex.current == null) return ZERO_INPUT;
    const pads = navigator.getGamepads?.() ?? [];
    const p = pads[activeIndex.current];
    if (!p) return ZERO_INPUT;

    const dz = settings.deadzone;
    const ax = settings.gamepadAxes;
    const inv = settings.gamepadInvert;
    const axis = (i: number) => (i < p.axes.length ? p.axes[i] : 0);

    let pitch = applyDeadzone(axis(ax.pitch), dz) * (inv.pitch ? -1 : 1);
    let yaw   = applyDeadzone(axis(ax.yaw), dz)   * (inv.yaw ? -1 : 1);
    let roll  = applyDeadzone(axis(ax.roll), dz)  * (inv.roll ? -1 : 1);
    let throttleRaw = axis(ax.throttle) * (inv.throttle ? -1 : 1); // -1..1

    // Buttons: 0 fire, 1 boost, 2 brake, 3 cycle target, 9 toggle view
    const btn = (i: number) => (i < p.buttons.length ? p.buttons[i].pressed : false);
    const newButtons: boolean[] = p.buttons.map(b => b.pressed);
    const edge = (i: number) => newButtons[i] && !prevButtons.current[i];

    const inp: FlightInput = {
      pitch, yaw, roll,
      // Map throttle axis directly to throttle by treating as delta target: scaled small
      throttleDelta: 0, // gamepad throttle handled specially below
      boost: btn(1),
      brake: btn(2),
      fire: btn(0),
      cycleTarget: edge(3),
      toggleView: edge(9),
    };
    // Encode absolute throttle in throttleDelta.magnitude sign convention:
    // We'll pass absolute target via a small hack: use throttleDelta > 1 to signal absolute.
    // Instead, expose via extra field:
    (inp as any).throttleAbsolute = (throttleRaw + 1) / 2; // 0..1

    prevButtons.current = newButtons;
    return inp;
  };

  return { read, devices, activeIndex: activeIndex.current, setActive: (i: number) => { activeIndex.current = i; } };
}
