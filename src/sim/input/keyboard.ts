import { useEffect, useRef } from "react";
import { FlightInput, Settings, ZERO_INPUT } from "../types";

export function useKeyboardInput(settings: Settings) {
  const keys = useRef<Set<string>>(new Set());
  const edge = useRef<Set<string>>(new Set()); // one-shot

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (!keys.current.has(e.code)) edge.current.add(e.code);
      keys.current.add(e.code);
      // Prevent page scroll on arrows/space
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
    };
    const onUp = (e: KeyboardEvent) => keys.current.delete(e.code);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  const read = (): FlightInput => {
    const b = settings.keyBindings;
    const held = (a: string) => keys.current.has(b[a]);
    const oneshot = (a: string) => {
      const code = b[a];
      if (edge.current.has(code)) {
        edge.current.delete(code);
        return true;
      }
      return false;
    };

    const inp: FlightInput = {
      ...ZERO_INPUT,
      pitch: (held("pitchUp") ? 1 : 0) + (held("pitchDown") ? -1 : 0),
      yaw:   (held("yawRight") ? 1 : 0) + (held("yawLeft") ? -1 : 0),
      roll:  (held("rollRight") ? 1 : 0) + (held("rollLeft") ? -1 : 0),
      throttleDelta: (held("throttleUp") ? 1 : 0) + (held("throttleDown") ? -1 : 0),
      boost: held("boost"),
      brake: held("brake"),
      fire: held("fire"),
      cycleTarget: oneshot("cycleTarget"),
      toggleView: oneshot("toggleView"),
    };
    return inp;
  };

  return { read };
}
