"use client";

import { useState } from "react";
import { electricalMiniSimulatorConfigForExercise } from "../lib/lesson-visual";

type SimulatorProps = { topic: string; exerciseId: string };

export function ElectricalMiniSimulator({ topic, exerciseId }: SimulatorProps) {
  const config = electricalMiniSimulatorConfigForExercise({ topic, id: exerciseId });
  if (!config) return null;
  return <OhmSimulator key={exerciseId} initialVoltage={config.voltage} initialResistance={config.resistance} />;
}

function OhmSimulator({ initialVoltage, initialResistance }: { initialVoltage: number; initialResistance: number }) {
  const [voltage, setVoltage] = useState(initialVoltage);
  const [resistance, setResistance] = useState(initialResistance);
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

