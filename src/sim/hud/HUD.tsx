import { CameraMode, ShipState } from "../types";
import { PLANETS } from "../scene/Planets";
import { Vector3 } from "three";

type Props = {
  ship: ShipState;
  cameraMode: CameraMode;
  targetIndex: number;
  gamepadName?: string;
  isHOTAS?: boolean;
};

const _tmp = new Vector3();

export function HUD({ ship, cameraMode, targetIndex, gamepadName, isHOTAS }: Props) {
  const speed = Math.round(ship.speed);
  const throttlePct = Math.round(ship.throttle * 100);
  const target = PLANETS[targetIndex % PLANETS.length];
  const targetPos = _tmp.set(...target.position);
  const distance = Math.round(targetPos.distanceTo(ship.position));

  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-mono-hud text-hud-glow select-none">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex justify-between p-4 text-[11px]">
        <div className="hud-panel px-3 py-1.5 rounded-sm">
          <span className="font-display text-glow tracking-widest">NEBULA WING</span>
          <span className="ml-3 text-muted-foreground">MK-VII STARFIGHTER</span>
        </div>
        <div className="hud-panel px-3 py-1.5 rounded-sm flex items-center gap-3">
          <span className="text-muted-foreground">CAM</span>
          <span className="text-glow uppercase">{cameraMode}</span>
          <span className="text-muted-foreground">| V to toggle</span>
        </div>
      </div>

      {/* Center reticle */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-72 h-72">
          <div className="absolute inset-0 border border-hud-glow/40 rounded-full" />
          <div className="absolute inset-8 border border-hud-glow/30 rounded-full" />
          {/* Crosshair */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-hud-glow/60" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-hud-glow/60" />
          <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-hud-glow shadow-[0_0_10px_hsl(var(--hud-glow))]" />
          {/* Tick marks */}
          {[0, 90, 180, 270].map(deg => (
            <div key={deg} className="absolute inset-0" style={{ transform: `rotate(${deg}deg)` }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-4 bg-hud-glow" />
            </div>
          ))}
        </div>
      </div>

      {/* Left panel — Ship status */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-56 hud-panel rounded-sm p-3 space-y-3 relative scanline">
        <div className="text-[10px] font-display text-glow border-b border-hud-glow/40 pb-1">SHIP STATUS</div>
        <BarStat label="SHIELD" value={ship.shield} color="ok" />
        <BarStat label="ENERGY" value={ship.energy} color={ship.energy < 25 ? "warn" : "glow"} />
        <BarStat label="THROTTLE" value={throttlePct} color="glow" />
        <div className="pt-2 border-t border-hud-glow/30 text-[11px] flex justify-between">
          <span className="text-muted-foreground">HULL</span>
          <span className="text-glow">100%</span>
        </div>
      </div>

      {/* Right panel — Target lock */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 w-56 hud-panel rounded-sm p-3 space-y-2 relative scanline">
        <div className="text-[10px] font-display text-glow border-b border-hud-glow/40 pb-1 flex justify-between">
          <span>TARGET LOCK</span>
          <span className="animate-hud-pulse">●</span>
        </div>
        <div className="text-lg font-display text-glow tracking-widest">{target.name.toUpperCase()}</div>
        <div className="text-[11px] text-muted-foreground">CLASS: PLANETARY BODY</div>
        <div className="flex justify-between text-[11px]">
          <span className="text-muted-foreground">DIST</span>
          <span className="text-glow">{distance.toLocaleString()} u</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-muted-foreground">RADIUS</span>
          <span className="text-glow">{target.radius} u</span>
        </div>
        <div className="pt-2 border-t border-hud-glow/30 text-[10px] text-muted-foreground">
          T = cycle target
        </div>
      </div>

      {/* Bottom left — Speed / throttle bars */}
      <div className="absolute left-4 bottom-4 hud-panel rounded-sm p-3 w-56">
        <div className="text-[10px] font-display text-glow border-b border-hud-glow/40 pb-1 mb-2">VELOCITY</div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-display text-glow font-bold">{speed}</span>
          <span className="text-[11px] text-muted-foreground">u/s</span>
        </div>
        <div className="mt-2 h-1.5 bg-muted rounded-sm overflow-hidden">
          <div className="h-full bg-hud-glow shadow-[0_0_8px_hsl(var(--hud-glow))]" style={{ width: `${Math.min(100, (ship.speed / 600) * 100)}%` }} />
        </div>
      </div>

      {/* Bottom right — Attitude / radar */}
      <div className="absolute right-4 bottom-4 hud-panel rounded-sm p-3 w-56">
        <div className="text-[10px] font-display text-glow border-b border-hud-glow/40 pb-1 mb-2">NAV / RADAR</div>
        <div className="relative w-full aspect-square hud-frame rounded-full overflow-hidden">
          <div className="absolute inset-1/2 w-1 h-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-hud-glow shadow-[0_0_6px_hsl(var(--hud-glow))]" />
          <div className="absolute inset-0 animate-radar-sweep origin-center" style={{
            background: `conic-gradient(from 0deg, transparent 0deg, hsl(var(--hud-glow) / 0.35) 30deg, transparent 60deg)`,
          }} />
          {PLANETS.map((p, i) => {
            const dx = p.position[0] - ship.position.x;
            const dz = p.position[2] - ship.position.z;
            const d = Math.hypot(dx, dz);
            const scale = Math.min(1, 400 / Math.max(400, d));
            const x = 50 + (dx / Math.max(1, d)) * 45 * scale;
            const y = 50 + (dz / Math.max(1, d)) * 45 * scale;
            return <div key={p.name} className={`absolute w-1.5 h-1.5 rounded-full ${i === targetIndex % PLANETS.length ? 'bg-hud-warn shadow-[0_0_6px_hsl(var(--hud-warn))]' : 'bg-hud-glow/80'}`} style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }} />;
          })}
        </div>
      </div>

      {/* Top-center gamepad indicator */}
      {gamepadName && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 hud-panel px-3 py-1 rounded-sm text-[10px]">
          <span className="text-muted-foreground">INPUT</span>
          <span className="ml-2 text-glow uppercase">{isHOTAS ? "HOTAS" : "GAMEPAD"}</span>
          <span className="ml-2 text-muted-foreground truncate max-w-[280px] inline-block align-middle">{gamepadName}</span>
        </div>
      )}
    </div>
  );
}

function BarStat({ label, value, color }: { label: string; value: number; color: "glow" | "warn" | "ok" }) {
  const clr = color === "warn" ? "hud-warn" : color === "ok" ? "hud-ok" : "hud-glow";
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span className="text-muted-foreground tracking-widest">{label}</span>
        <span className={`text-${clr}`}>{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-sm overflow-hidden">
        <div className={`h-full bg-${clr}`} style={{ width: `${Math.max(0, Math.min(100, value))}%`, boxShadow: `0 0 8px hsl(var(--${clr}))` }} />
      </div>
    </div>
  );
}
