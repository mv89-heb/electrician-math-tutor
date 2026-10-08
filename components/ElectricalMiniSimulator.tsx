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
  const [apparentPower, setApparentPower] = useState(100);
  const [angle, setAngle] = useState(30);
  const radians = angle * Math.PI / 180;
  const activePower = apparentPower * Math.cos(radians);
  const reactivePower = apparentPower * Math.sin(radians);

  return (
    <section className="miniSimulator" aria-label="סימולטור משולש הספקים">
      <div className="simHeader">
        <div><span className="simKicker">🔋 מעבדה קטנה</span><h3>משולש ההספקים בפעולה</h3></div>
        <div className="simFormula" dir="ltr">S² = P² + Q²</div>
      </div>
      <p className="simIntro">שנה את ההספק המדומה ואת הזווית וראה איך P, Q ו־S משתנים יחד.</p>
      <div className="powerTriangle" style={{ ["--triangle-angle" as string]: angle + "deg" }}>
        <div className="triangleShape" aria-hidden="true"><span>P</span><span>Q</span><span>S</span></div>
        <div className="triangleReadout" dir="ltr">
          <div><b>P</b><strong>{activePower.toFixed(1)}</strong><span>W</span></div>
          <div><b>Q</b><strong>{reactivePower.toFixed(1)}</strong><span>var</span></div>
          <div><b>S</b><strong>{apparentPower.toFixed(1)}</strong><span>VA</span></div>
        </div>
      </div>
      <div className="simControls">
        <label><span><b>הספק מדומה S</b><output dir="ltr">{apparentPower} VA</output></span><input type="range" min="10" max="500" step="10" value={apparentPower} onChange={(e) => setApparentPower(Number(e.target.value))} /></label>
        <label><span><b>זווית φ</b><output dir="ltr">{angle}°</output></span><input type="range" min="0" max="80" step="1" value={angle} onChange={(e) => setAngle(Number(e.target.value))} /></label>
      </div>
      <div className="simCoach">ספארקי: כשהזווית גדלה, חלק גדול יותר מ־S הופך להספק תגובתי Q ופחות נשאר כהספק פעיל P.</div>
    </section>
  );
}
