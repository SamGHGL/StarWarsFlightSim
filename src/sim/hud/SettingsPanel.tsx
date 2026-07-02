import { useState } from "react";
import { Settings } from "../types";
import { GamepadInfo } from "../input/gamepad";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { X, Settings as Gear } from "lucide-react";

type Props = {
  settings: Settings;
  setSettings: (s: Settings) => void;
  devices: GamepadInfo[];
  activeGamepad: number | null;
  setActiveGamepad: (i: number) => void;
};

export function SettingsPanel({ settings, setSettings, devices, activeGamepad, setActiveGamepad }: Props) {
  const [open, setOpen] = useState(false);
  const [rebinding, setRebinding] = useState<string | null>(null);
  const [calibratingAxis, setCalibratingAxis] = useState<keyof Settings["gamepadAxes"] | null>(null);

  // Rebind key
  const startRebind = (action: string) => {
    setRebinding(action);
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      setSettings({ ...settings, keyBindings: { ...settings.keyBindings, [action]: e.code } });
      setRebinding(null);
      window.removeEventListener("keydown", handler);
    };
    window.addEventListener("keydown", handler);
  };

  // Calibrate: press-largest-axis detection
  const startCalibrate = (axis: keyof Settings["gamepadAxes"]) => {
    if (activeGamepad == null) return;
    setCalibratingAxis(axis);
    const start = performance.now();
    let bestIdx = 0, bestVal = 0;
    const tick = () => {
      const pad = navigator.getGamepads?.()[activeGamepad];
      if (pad) {
        for (let i = 0; i < pad.axes.length; i++) {
          if (Math.abs(pad.axes[i]) > bestVal) { bestVal = Math.abs(pad.axes[i]); bestIdx = i; }
        }
      }
      if (performance.now() - start < 2500) requestAnimationFrame(tick);
      else {
        setSettings({ ...settings, gamepadAxes: { ...settings.gamepadAxes, [axis]: bestIdx } });
        setCalibratingAxis(null);
      }
    };
    requestAnimationFrame(tick);
  };

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="absolute top-4 right-1/2 translate-x-[380px] z-20 pointer-events-auto hud-panel rounded-sm p-2 text-hud-glow hover:bg-hud-glow/10 transition"
        aria-label="Settings"
      >
        <Gear className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/70 backdrop-blur-sm pointer-events-auto">
          <div className="hud-panel rounded p-6 w-[720px] max-h-[86vh] overflow-auto relative scanline">
            <button onClick={() => setOpen(false)} className="absolute top-3 right-3 text-hud-glow hover:text-hud-warn">
              <X className="w-4 h-4" />
            </button>
            <h2 className="font-display text-glow text-xl tracking-widest border-b border-hud-glow/40 pb-2 mb-4">FLIGHT CONFIGURATION</h2>

            <div className="grid grid-cols-2 gap-6">
              {/* Sensitivity */}
              <section>
                <h3 className="font-display text-glow text-sm mb-3">SENSITIVITY</h3>
                {(["pitch", "yaw", "roll"] as const).map(k => (
                  <div key={k} className="mb-3">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="uppercase text-muted-foreground">{k}</span>
                      <span className="text-glow">{settings.sensitivity[k].toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[settings.sensitivity[k]]} min={0.2} max={3} step={0.05}
                      onValueChange={(v) => setSettings({ ...settings, sensitivity: { ...settings.sensitivity, [k]: v[0] } })}
                    />
                  </div>
                ))}
                <div className="mb-3">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-muted-foreground">DEADZONE</span>
                    <span className="text-glow">{settings.deadzone.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[settings.deadzone]} min={0} max={0.4} step={0.01}
                    onValueChange={(v) => setSettings({ ...settings, deadzone: v[0] })}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground uppercase">Invert Pitch</span>
                  <Switch checked={settings.invertPitch} onCheckedChange={(c) => setSettings({ ...settings, invertPitch: c })} />
                </div>
              </section>

              {/* Key bindings */}
              <section>
                <h3 className="font-display text-glow text-sm mb-3">KEY BINDINGS</h3>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  {Object.entries(settings.keyBindings).map(([action, code]) => (
                    <button
                      key={action}
                      onClick={() => startRebind(action)}
                      className="flex justify-between items-center px-2 py-1 border border-hud-glow/30 hover:border-hud-glow rounded-sm text-left"
                    >
                      <span className="text-muted-foreground">{action}</span>
                      <span className={`font-mono ${rebinding === action ? 'text-hud-warn animate-hud-pulse' : 'text-glow'}`}>
                        {rebinding === action ? 'PRESS…' : code.replace(/^Key|^Arrow/, '')}
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Gamepad */}
              <section className="col-span-2">
                <h3 className="font-display text-glow text-sm mb-3">GAMEPAD / HOTAS</h3>
                {devices.length === 0 ? (
                  <div className="text-[11px] text-muted-foreground">
                    No device detected. Connect a gamepad, joystick or HOTAS and press any button.
                  </div>
                ) : (
                  <>
                    <div className="space-y-1 mb-4 text-[11px]">
                      {devices.map(d => (
                        <label key={d.index} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" checked={activeGamepad === d.index} onChange={() => setActiveGamepad(d.index)} />
                          <span className="text-glow">{d.isHOTAS ? "[HOTAS]" : "[PAD]"}</span>
                          <span className="text-muted-foreground truncate">{d.id}</span>
                          <span className="text-muted-foreground">· {d.axes} ax / {d.buttons} btn</span>
                        </label>
                      ))}
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {(["pitch", "yaw", "roll", "throttle"] as const).map(a => (
                        <div key={a} className="border border-hud-glow/30 rounded-sm p-2">
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="uppercase text-muted-foreground">{a}</span>
                            <span className="text-glow">AX {settings.gamepadAxes[a]}</span>
                          </div>
                          <Input
                            type="number" min={0} max={15}
                            value={settings.gamepadAxes[a]}
                            onChange={(e) => setSettings({ ...settings, gamepadAxes: { ...settings.gamepadAxes, [a]: parseInt(e.target.value) || 0 } })}
                            className="h-7 text-[11px]"
                          />
                          <div className="flex items-center justify-between text-[10px] mt-2">
                            <span className="text-muted-foreground">INV</span>
                            <Switch checked={settings.gamepadInvert[a]} onCheckedChange={(c) => setSettings({ ...settings, gamepadInvert: { ...settings.gamepadInvert, [a]: c } })} />
                          </div>
                          <Button
                            size="sm" variant="outline"
                            className="w-full mt-2 h-7 text-[10px]"
                            onClick={() => startCalibrate(a)}
                            disabled={calibratingAxis === a || activeGamepad == null}
                          >
                            {calibratingAxis === a ? "MOVE AXIS…" : "CALIBRATE"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </section>
            </div>

            <div className="mt-6 pt-4 border-t border-hud-glow/30 text-[10px] text-muted-foreground">
              Controls: W/S pitch · A/D yaw · ←/→ roll · Shift/Ctrl throttle · Space boost · X brake · T target · V camera
            </div>
          </div>
        </div>
      )}
    </>
  );
}
