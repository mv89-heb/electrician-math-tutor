"use client";

import { useMemo, useState } from "react";
import { calculateOhmsLaw, calculateTwoResistorCircuit } from "../lib/electrical-labs";

function CircuitDiagram({ mode, resistance1, resistance2, voltage }: { mode: "single" | "series" | "parallel"; resistance1: number; resistance2?: number; voltage: number }) {
  if (mode === "single") {
    return (
      <div className="labDiagram">
        <svg viewBox="0 0 560 190" role="img" aria-label={`מעגל סגור עם מקור מתח של ${voltage} וולט ונגד של ${resistance1} אוהם`}>
          <path d="M105 35 H455 V155 H105 V115 M105 75 V35" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M83 76 H127 M92 114 H118" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <rect x="245" y="20" width="90" height="30" rx="6" fill="#dceaf7" stroke="#28669d" strokeWidth="3" />
          <text x="290" y="40" textAnchor="middle" fontSize="14" fontWeight="700" fill="#173e66">{resistance1} Ω</text>
          <text x="65" y="145" textAnchor="middle" fontSize="13" fill="currentColor">מקור</text>
          <text x="65" y="162" textAnchor="middle" fontSize="12" fill="currentColor">{voltage} V</text>
          <text x="290" y="88" textAnchor="middle" fontSize="13" fill="currentColor">נגד</text>
          <path d="M370 95 l13 -8 v16 z" fill="#2b8a63" />
          <text x="290" y="180" textAnchor="middle" fontSize="12" fill="currentColor">מסלול זרם במעגל סגור</text>
        </svg>
      </div>
    );
  }

  const parallel = mode === "parallel";
  return (
    <div className="labDiagram">
      <svg viewBox="0 0 560 220" role="img" aria-label={parallel
        ? `מעגל מקבילי עם שני ענפים, נגדים ${resistance1} ו-${resistance2} אוהם ומקור ${voltage} וולט`
        : `מעגל טורי עם שני נגדים ${resistance1} ו-${resistance2} אוהם ומקור ${voltage} וולט`}>
        {parallel ? (
          <>
            <path d="M90 35 H170 M90 185 H170 M170 35 V185 M390 35 V185 M390 35 H470 V185 H390" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M170 35 H225 M335 35 H390 M170 185 H225 M335 185 H390" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            <rect x="225" y="20" width="110" height="30" rx="6" fill="#dceaf7" stroke="#28669d" strokeWidth="3" />
            <rect x="225" y="170" width="110" height="30" rx="6" fill="#dceaf7" stroke="#28669d" strokeWidth="3" />
            <text x="280" y="40" textAnchor="middle" fontSize="14" fontWeight="700" fill="#173e66">R1 · {resistance1} Ω</text>
            <text x="280" y="190" textAnchor="middle" fontSize="14" fontWeight="700" fill="#173e66">R2 · {resistance2} Ω</text>
            <text x="280" y="12" textAnchor="middle" fontSize="12" fill="currentColor">ענף 1</text>
            <text x="280" y="215" textAnchor="middle" fontSize="12" fill="currentColor">ענף 2</text>
          </>
        ) : (
          <>
            <path d="M90 35 H145 M245 35 H300 M400 35 H470 V185 H90 V125 M90 75 V35" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="145" y="20" width="100" height="30" rx="6" fill="#dceaf7" stroke="#28669d" strokeWidth="3" />
            <rect x="300" y="20" width="100" height="30" rx="6" fill="#dceaf7" stroke="#28669d" strokeWidth="3" />
            <text x="195" y="40" textAnchor="middle" fontSize="14" fontWeight="700" fill="#173e66">{resistance1} Ω</text>
            <text x="350" y="40" textAnchor="middle" fontSize="14" fontWeight="700" fill="#173e66">{resistance2} Ω</text>
            <text x="270" y="12" textAnchor="middle" fontSize="12" fill="currentColor">אותו זרם עובר בשני הנגדים</text>
          </>
        )}
        <path d="M68 76 H112 M78 116 H102" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <text x="42" y="145" textAnchor="middle" fontSize="13" fill="currentColor">מקור</text>
        <text x="42" y="163" textAnchor="middle" fontSize="12" fill="currentColor">{voltage} V</text>
        <path d="M430 95 l13 -8 v16 z" fill="#2b8a63" />
      </svg>
    </div>
  );
}

function NumberControl({ label, value, min, max, step = 1, unit, onChange }: {
  label: string; value: number; min: number; max: number; step?: number; unit: string; onChange: (value: number) => void;
}) {
  return (
    <label className="labControl">
      <span>{label}: <strong>{value} {unit}</strong></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
      <span className="labScale"><small>{min} {unit}</small><small>{max} {unit}</small></span>
    </label>
  );
}

export function OhmsLawLab() {
  const [voltage, setVoltage] = useState(12);
  const [resistance, setResistance] = useState(6);
  const result = useMemo(() => calculateOhmsLaw(voltage, resistance), [voltage, resistance]);

  return (
    <section className="electricalLab" aria-label="סימולטור חוק אוהם">
      <style>{labStyles}</style>
      <div className="labHeading"><span>מעבדה אינטראקטיבית 01</span><h3>משחקים עם חוק אוהם</h3><p>שנה את המתח או את ההתנגדות וראה כיצד הזרם וההספק משתנים בזמן אמת.</p></div>
      <CircuitDiagram mode="single" resistance1={resistance} voltage={voltage} />
      <div className="labControls">
        <NumberControl label="מתח" value={voltage} min={0} max={48} unit="V" onChange={setVoltage} />
        <NumberControl label="התנגדות" value={resistance} min={1} max={100} unit="Ω" onChange={setResistance} />
      </div>
      <div className="labResults">
        <div><span>זרם מחושב</span><strong>{result.current.toFixed(3)} A</strong></div>
        <div><span>הספק מחושב</span><strong>{result.power.toFixed(2)} W</strong></div>
      </div>
      <div className="labFormula" dir="ltr"><strong>I = V ÷ R</strong><span>{voltage} ÷ {resistance} = {result.current.toFixed(3)} A</span></div>
      <p className="labInsight">{voltage === 0 ? "כאשר המתח אפס, הזרם במודל האידיאלי הוא אפס." : "נסה להכפיל את ההתנגדות ולראות כיצד הזרם קטן, כאשר המתח נשאר קבוע."}</p>
      <p className="labDisclaimer">סימולציה לימודית בלבד. הערכים אינם הוראות לחיבור, למדידה או לעבודה במתקן חשמלי אמיתי.</p>
    </section>
  );
}

export function DcCircuitLab() {
  const [mode, setMode] = useState<"series" | "parallel">("series");
  const [voltage, setVoltage] = useState(12);
  const [resistance1, setResistance1] = useState(6);
  const [resistance2, setResistance2] = useState(6);
  const result = useMemo(() => calculateTwoResistorCircuit(voltage, resistance1, resistance2, mode), [voltage, resistance1, resistance2, mode]);

  return (
    <section className="electricalLab" aria-label="סימולטור מעגלי זרם ישר">
      <style>{labStyles}</style>
      <div className="labHeading"><span>מעבדה אינטראקטיבית 02</span><h3>מעגל טורי מול מעגל מקבילי</h3><p>בחר את סוג החיבור, שנה את ערכי הנגדים והשווה בין ההתנגדות השקולה והזרם.</p></div>
      <div className="labMode" role="group" aria-label="סוג חיבור">
        <button type="button" aria-pressed={mode === "series"} className={mode === "series" ? "active" : ""} onClick={() => setMode("series")}>חיבור טורי</button>
        <button type="button" aria-pressed={mode === "parallel"} className={mode === "parallel" ? "active" : ""} onClick={() => setMode("parallel")}>חיבור מקבילי</button>
      </div>
      <CircuitDiagram mode={mode} resistance1={resistance1} resistance2={resistance2} voltage={voltage} />
      <div className="labControls">
        <NumberControl label="מתח המקור" value={voltage} min={0} max={48} unit="V" onChange={setVoltage} />
        <NumberControl label="נגד ראשון" value={resistance1} min={1} max={100} unit="Ω" onChange={setResistance1} />
        <NumberControl label="נגד שני" value={resistance2} min={1} max={100} unit="Ω" onChange={setResistance2} />
      </div>
      <div className="labResults">
        <div><span>התנגדות שקולה</span><strong>{result.equivalentResistance.toFixed(2)} Ω</strong></div>
        <div><span>זרם כולל</span><strong>{result.totalCurrent.toFixed(3)} A</strong></div>
        <div><span>הספק כולל</span><strong>{result.totalPower.toFixed(2)} W</strong></div>
      </div>
      <div className="labFormula" dir="ltr">
        <strong>{mode === "series" ? "Rₜ = R₁ + R₂" : "Rₜ = (R₁ × R₂) ÷ (R₁ + R₂)"}</strong>
        <span>{result.equivalentResistance.toFixed(2)} Ω · זרמי הענפים: {result.branchCurrents[0].toFixed(3)} A / {result.branchCurrents[1].toFixed(3)} A</span>
      </div>
      <p className="labInsight">{mode === "series" ? "בחיבור טורי הזרם זהה בשני הנגדים וההתנגדויות מתחברות." : "בחיבור מקבילי המתח על כל ענף זהה, הזרמים בענפים מסתכמים לזרם הכולל."}</p>
      <p className="labDisclaimer">סימולציה לימודית של רכיבים אידיאליים בלבד. אינה מתארת מתקן אמיתי ואינה הוראה לביצוע חיווט.</p>
    </section>
  );
}

const labStyles = `
  .electricalLab{background:#f5f9fd;border:1px solid #cddceb;border-radius:18px;padding:20px;margin:16px 0 20px;color:#19334f}
  .labHeading span{font-size:11px;font-weight:800;color:#3974a8;letter-spacing:.04em}
  .labHeading h3{font-size:20px;margin:5px 0}
  .labHeading p{font-size:14px;line-height:1.65;color:#526981;margin:0}
  .labDiagram{background:#fff;border:1px solid #dce6f0;border-radius:13px;padding:12px;margin-top:16px;overflow:hidden}
  .labDiagram svg{display:block;width:100%;height:auto;max-height:230px;color:#315a7d}
  .labControls{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:15px;margin:18px 0}
  .labControl{display:flex;flex-direction:column;gap:8px;font-size:14px}
  .labControl strong{color:#173e66}
  .labControl input{width:100%;accent-color:#28669d}
  .labScale{display:flex;justify-content:space-between;color:#72859a}
  .labResults{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:9px}
  .labResults div{background:white;border:1px solid #dce6f0;border-radius:12px;padding:12px}
  .labResults span{display:block;color:#657b91;font-size:12px;margin-bottom:5px}
  .labResults strong{font-size:20px;color:#173e66}
  .labFormula{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;background:#e7f0f8;border-radius:11px;padding:12px;margin-top:12px;color:#214b73}
  .labMode{display:flex;gap:8px;margin-top:14px}
  .labMode button{border:1px solid #cbd9e8;border-radius:9px;padding:9px 13px;background:white;color:#244663;font:inherit;cursor:pointer}
  .labMode button.active{background:#1c4d78;color:white;border-color:#1c4d78}
  .labInsight{font-size:13px!important;color:#315a7d!important;margin:12px 0 0!important}
  .labDisclaimer{font-size:12px!important;color:#805d24!important;background:#fff6e5;border-radius:9px;padding:10px;margin-top:12px!important}
  @media(max-width:600px){.electricalLab{padding:15px}.labResults strong{font-size:17px}}
`;
