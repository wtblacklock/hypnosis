"use client";
import { useEffect, useRef, useState } from "react";
import { VisualEngine } from "@/lib/visualEngine";
import type { VisualState } from "@/lib/sessionEngine";
import type { Settings } from "@/lib/settings";

export default function HypnoCanvas({
  settingsRef, visual, palette,
}: { settingsRef: React.MutableRefObject<Settings>; visual: VisualState; palette: number[][] }) {
  const gl = useRef<HTMLCanvasElement>(null);
  const fx = useRef<HTMLCanvasElement>(null);
  const eng = useRef<VisualEngine | null>(null);
  const [webgl, setWebgl] = useState(true);

  useEffect(() => {
    const e = new VisualEngine(gl.current!, fx.current!, () => settingsRef.current, visual);
    eng.current = e;
    setWebgl(e.webglOk);
    e.resize();
    e.setPalette(palette);
    e.start();
    const onResize = () => e.resize();
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); e.destroy(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { eng.current?.setPalette(palette); }, [palette]);

  return (
    <div className={"absolute inset-0 " + (webgl ? "bg-[#03040d]" : "fallback-bg")} aria-hidden>
      <canvas ref={gl} className="absolute inset-0 h-full w-full" />
      <canvas ref={fx} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
