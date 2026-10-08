"use client";

import { useState } from "react";

type SimulatorProps = { topic: string };

export function ElectricalMiniSimulator({ topic }: SimulatorProps) {
  if (topic === "חשמל — חוק אוהם") return <OhmSimulator />;
  if (topic === "חשמל — הספק") return <PowerSimulator />;
  return null;
}

function OhmSimulator() {
  const [voltage, setVoltage] = useState(12);
  const [resistance, setResistance] = useState(6);
  const current = voltage / resistance;
  const brightness = Math.min(100, Math.max(8, current * 22));

  return (
    <section className="miniSimulator" aria-label="סימולטור חוק אוהם">
      <div className="simHeader">
        <div><span className="simKicker">⚡ מעבדה קטנה</span><h3>בוא נראה את חוק אוהם בפעולה</h3></div>
        <div className="simFormula" dir="ltr">I = U / R</div>
      </div>
      <p className="simIntro">שנה את המתח או ההתנגדות וראה מיד מה קורה לזרם.</p>
      <div className="ohmVisual">
        <div className="batterySymbol"><span>🔋</span><b>{voltage}V</b></div>
        <div className="circuitWire"><i style={{ opacity: 0.25 + Math.min(0.75, current / 3) }} /></div>
        <div className="lamp" style={{ ["--lamp-brightness" as string]: brightness + "%" }} aria-label={"עוצמת הנורה " + Math.round(brightness) + " אחוז"}><span>💡</span></div>
        <div className="circuitWire"><i style={{ opacity: 0.25 + Math.min(0.75, current / 3) }} /></div>
        <div className="resistorSymbol"><span>▰</span><b>{resistance}Ω</b></div>
      </div>
      <div className="simControls">
        <label><span><b>מתח U</b><output dir="ltr">{voltage} V</output></span><input type="range" min="1" max="24" value={voltage} onChange={(e) => setVoltage(Number(e.target.value))} /></label>
        <label><span><b>התנגדות R</b><output dir="ltr">{resistance} Ω</output></span><input type="range" min="1" max="24" value={resistance} onChange={(e) => setResistance(Number(e.target.value))} /></label>
      </div>
      <div className="simResult" dir="ltr"><span>I</span><strong>=</strong><strong>{current.toFixed(2)}</strong><span>A</span></div>
      <div className="simCoach">ספארקי: כשהמתח עולה הזרם עולה, וכשההתנגדות עולה הזרם יורד.</div>
    </section>
  );
}

function PowerSimulator() {
  const [voltage, setVoltage] = useState(10);
  const [current, setCurrent] = useState(2);
  const power = voltage * current;

  return (
    <section className="miniSimulator" aria-label="סימולטור הספק חשמלי">
      <div className="simHeader">
        <div><span className="simKicker">🔋 מעבדה קטנה</span><h3>נראה מה קורה להספק</h3></div>
        <div className="simFormula" dir="ltr">P = U × I</div>
      </div>
      <p className="simIntro">שנה את המתח או הזרם וראה איך ההספק משתנה בזמן אמת.</p>
      <div className="powerVisual">
        <div className="powerOrb" style={{ ["--power-level" as string]: Math.min(100, Math.max(10, power / 2)) + "%" }}>⚡</div>
        <div className="powerReadout" dir="ltr"><strong>{power.toFixed(0)}</strong><span>W</span></div>
      </div>
      <div className="simControls">
        <label><span><b>מתח U</b><output dir="ltr">{voltage} V</output></span><input type="range" min="1" max="30" value={voltage} onChange={(e) => setVoltage(Number(e.target.value))} /></label>
        <label><span><b>זרם I</b><output dir="ltr">{current} A</output></span><input type="range" min="1" max="10" value={current} onChange={(e) => setCurrent(Number(e.target.value))} /></label>
      </div>
      <div className="simCoach">ספארקי: ההספק הוא תוצאה של הכפלת המתח בזרם. שנה אחד מהם ובדוק איך המספר משתנה.</div>
    </section>
  );
}
