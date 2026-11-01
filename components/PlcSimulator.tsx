"use client";

import { useMemo, useState } from "react";
import {
  DEFAULT_PLC_INPUTS,
  DEFAULT_PLC_RULES,
  PLC_INPUT_IDS,
  PLC_OUTPUT_IDS,
  PLC_PRACTICE_SCENARIOS,
  checkPlcPractice,
  evaluatePlcRule,
  type PlcInputId,
  type PlcInputs,
  type PlcOperator,
  type PlcOutputId,
  type PlcRule,
} from "../lib/plc-simulator";

function InputToggle({
  inputId,
  active,
  onToggle,
}: {
  inputId: PlcInputId;
  active: boolean;
  onToggle: (inputId: PlcInputId) => void;
}) {
  return (
    <button
      type="button"
      className="plcInputToggle"
      aria-pressed={active}
      aria-label={`כניסה ${inputId}, ${active ? "פעילה" : "כבויה"}; לשינוי מצב`}
      onClick={() => onToggle(inputId)}
    >
      <span className="plcInputId" dir="ltr">{inputId}</span>
      <strong>{active ? "פעיל" : "כבוי"}</strong>
      <small>לחץ לשינוי מצב</small>
    </button>
  );
}

function RuleEditor({
  outputId,
  rule,
  onChange,
}: {
  outputId: PlcOutputId;
  rule: PlcRule;
  onChange: (nextRule: PlcRule) => void;
}) {
  return (
    <div className="plcRuleFields">
      <label>
        <span>פעולה לוגית</span>
        <select
          aria-label={`פעולה לוגית עבור ${outputId}`}
          value={rule.operator}
          onChange={(event) => onChange({ ...rule, operator: event.target.value as PlcOperator })}
        >
          <option value="AND">AND — וגם</option>
          <option value="OR">OR — או</option>
          <option value="NOT">NOT — היפוך</option>
        </select>
      </label>
      <label>
        <span>כניסה ראשונה</span>
        <select
          aria-label={`כניסה ראשונה עבור ${outputId}`}
          value={rule.inputA}
          onChange={(event) => onChange({ ...rule, inputA: event.target.value as PlcInputId })}
        >
          {PLC_INPUT_IDS.map((inputId) => <option key={inputId} value={inputId}>{inputId}</option>)}
        </select>
      </label>
      <label>
        <span>כניסה שנייה</span>
        <select
          aria-label={`כניסה שנייה עבור ${outputId}`}
          value={rule.inputB}
          disabled={rule.operator === "NOT"}
          onChange={(event) => onChange({ ...rule, inputB: event.target.value as PlcInputId })}
        >
          {PLC_INPUT_IDS.map((inputId) => <option key={inputId} value={inputId}>{inputId}</option>)}
        </select>
        {rule.operator === "NOT" && <small className="plcFieldHint">NOT משתמש רק בכניסה הראשונה.</small>}
      </label>
    </div>
  );
}

export function PlcSimulator() {
  const [inputs, setInputs] = useState<PlcInputs>(() => ({ ...DEFAULT_PLC_INPUTS }));
  const [rules, setRules] = useState<Record<PlcOutputId, PlcRule>>(() => ({
    "Q0.0": { ...DEFAULT_PLC_RULES["Q0.0"] },
    "Q0.1": { ...DEFAULT_PLC_RULES["Q0.1"] },
  }));
  const [activeScenarioId, setActiveScenarioId] = useState(PLC_PRACTICE_SCENARIOS[0].id);
  const [feedback, setFeedback] = useState<{ passed: boolean; message: string } | null>(null);

  const evaluations = useMemo(() => ({
    "Q0.0": evaluatePlcRule(rules["Q0.0"], inputs),
    "Q0.1": evaluatePlcRule(rules["Q0.1"], inputs),
  }), [inputs, rules]);

  const activeScenario = PLC_PRACTICE_SCENARIOS.find((scenario) => scenario.id === activeScenarioId)
    ?? PLC_PRACTICE_SCENARIOS[0];

  function updateRule(outputId: PlcOutputId, nextRule: PlcRule) {
    setRules((current) => ({ ...current, [outputId]: nextRule }));
    setFeedback(null);
  }

  function toggleInput(inputId: PlcInputId) {
    setInputs((current) => ({ ...current, [inputId]: !current[inputId] }));
    setFeedback(null);
  }

  function loadScenario(scenarioId: string) {
    const scenario = PLC_PRACTICE_SCENARIOS.find((item) => item.id === scenarioId);
    if (!scenario) return;
    setActiveScenarioId(scenario.id);
    setRules((current) => ({ ...current, [scenario.outputId]: { ...scenario.rule } }));
    setInputs((current) => ({ ...current, ...scenario.inputs }));
    setFeedback(null);
  }

  function checkPractice() {
    setFeedback(checkPlcPractice(rules[activeScenario.outputId], inputs, activeScenario));
  }

  function resetSimulator() {
    setInputs({ ...DEFAULT_PLC_INPUTS });
    setRules({
      "Q0.0": { ...DEFAULT_PLC_RULES["Q0.0"] },
      "Q0.1": { ...DEFAULT_PLC_RULES["Q0.1"] },
    });
    setActiveScenarioId(PLC_PRACTICE_SCENARIOS[0].id);
    setFeedback(null);
  }

  return (
    <section className="plcSimulator" dir="rtl" aria-labelledby="plc-simulator-title">
      <style>{plcStyles}</style>
      <header className="plcSimHeader">
        <div>
          <span className="plcSimKicker">מעבדה אינטראקטיבית · PLC</span>
          <h2 id="plc-simulator-title">סימולטור PLC דיגיטלי</h2>
          <p>בחר מצבי כניסה, בנה תנאי לוגי וצפה מיד בתוצאה של כל יציאה.</p>
        </div>
        <span className="plcSoftwareBadge">מודל תוכנה מבודד</span>
      </header>

      <section className="plcSimSection" aria-labelledby="plc-inputs-title">
        <div className="plcSectionHeading">
          <div><span>שלב 1</span><h3 id="plc-inputs-title">כניסות דיגיטליות</h3></div>
          <p>לחץ על כניסה כדי לשנות בין 0 (כבוי) ל־1 (פעיל).</p>
        </div>
        <div className="plcInputGrid">
          {PLC_INPUT_IDS.map((inputId) => (
            <InputToggle key={inputId} inputId={inputId} active={inputs[inputId]} onToggle={toggleInput} />
          ))}
        </div>
      </section>

      <section className="plcSimSection" aria-labelledby="plc-logic-title">
        <div className="plcSectionHeading">
          <div><span>שלב 2</span><h3 id="plc-logic-title">בניית תנאי לוגי</h3></div>
          <p>לכל יציאה אפשר לבחור פעולה ושתי כניסות. NOT משתמש בכניסה אחת.</p>
        </div>
        <div className="plcOutputGrid">
          {PLC_OUTPUT_IDS.map((outputId) => {
            const evaluation = evaluations[outputId];
            return (
              <article className="plcOutputCard" key={outputId}>
                <div className="plcOutputHeader">
                  <span className="plcOutputId" dir="ltr">{outputId}</span>
                  <div
                    className={evaluation.output ? "plcOutputState active" : "plcOutputState"}
                    data-testid={`plc-output-${outputId}`}
                    aria-label={`מצב ${outputId}: ${evaluation.output ? "פעילה" : "כבויה"}`}
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    <span className="plcOutputLamp" aria-hidden="true" />
                    <strong>{evaluation.output ? "פעילה (1)" : "כבויה (0)"}</strong>
                  </div>
                </div>
                <RuleEditor outputId={outputId} rule={rules[outputId]} onChange={(nextRule) => updateRule(outputId, nextRule)} />
                <section className="plcTrace" aria-label={`תהליך הלוגיקה של ${outputId}`}>
                  <h4>תהליך החישוב</h4>
                  <ol>
                    {evaluation.trace.map((step, index) => (
                      <li key={step.id}>
                        <span>{index + 1}. {step.label}</span>
                        <strong>{step.value ? "1 · אמת" : "0 · שקר"}</strong>
                      </li>
                    ))}
                  </ol>
                </section>
              </article>
            );
          })}
        </div>
      </section>

      <section className="plcSimSection" aria-labelledby="plc-practice-title">
        <div className="plcSectionHeading">
          <div><span>שלב 3</span><h3 id="plc-practice-title">תרחישי תרגול</h3></div>
          <p>טען תרחיש, בדוק את התנאי ואת מצבי הכניסות וקבל משוב.</p>
        </div>
        <div className="plcScenarioGrid" role="group" aria-label="בחירת תרחיש תרגול">
          {PLC_PRACTICE_SCENARIOS.map((scenario) => (
            <button
              type="button"
              key={scenario.id}
              className={activeScenarioId === scenario.id ? "plcScenarioButton selected" : "plcScenarioButton"}
              aria-pressed={activeScenarioId === scenario.id}
              onClick={() => loadScenario(scenario.id)}
            >
              {scenario.title}
            </button>
          ))}
        </div>
        <div className="plcPracticePrompt">
          <p>{activeScenario.instruction}</p>
          <button type="button" className="plcCheckButton" onClick={checkPractice}>בדיקת התרגול</button>
          {feedback && (
            <p className={feedback.passed ? "plcFeedback success" : "plcFeedback"} role="status">
              {feedback.message}
            </p>
          )}
        </div>
      </section>

      <div className="plcSimFooter">
        <p>היציאות מתעדכנות אוטומטית בכל שינוי. כל הערכים והחישובים נשארים בתוך הסימולציה בדפדפן.</p>
        <button type="button" className="plcResetButton" onClick={resetSimulator}>איפוס המעבדה</button>
      </div>
      <aside className="plcSafetyNotice">
        <strong>הבהרת בטיחות</strong>
        <p>זהו מודל תוכנה לימודי ומבודד בלבד. הכניסות והיציאות הן משתנים וירטואליים; אין חיבור לבקר פיזי, הוראות חיבור או הפעלה, העלאת תוכנית, תקשורת או שליטה בציוד אמיתי.</p>
      </aside>
    </section>
  );
}

const plcStyles = `
  .plcSimulator{margin:20px 0 24px;padding:22px;background:#f1f6fb;border:1px solid #cfdeeb;border-radius:20px;color:#17324c}
  .plcSimHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:20px}
  .plcSimKicker{font-size:11px;font-weight:800;color:#3b6f9b}
  .plcSimHeader h2{font-size:clamp(21px,3vw,27px);margin:5px 0 7px}
  .plcSimHeader p,.plcSectionHeading p{margin:0;color:#5b7187;font-size:14px;line-height:1.65}
  .plcSoftwareBadge{background:#e0f2e9;color:#236246;border:1px solid #b8dfca;border-radius:999px;padding:7px 11px;font-size:12px;font-weight:800}
  .plcSimSection{margin-top:18px}
  .plcSectionHeading{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap;margin-bottom:12px}
  .plcSectionHeading>div>span{font-size:10px;color:#5b82a4;font-weight:800}
  .plcSectionHeading h3{margin:2px 0 0;font-size:17px}
  .plcInputGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
  .plcInputToggle{display:flex;flex-direction:column;align-items:center;gap:5px;border:1px solid #c9d8e6;border-radius:13px;background:#fff;color:#24425f;padding:13px 8px;min-width:0}
  .plcInputToggle[aria-pressed="true"]{background:#e7f5ee;border-color:#6bb48c;color:#1d6844}
  .plcInputId,.plcOutputId{font-weight:900;font-size:15px}
  .plcInputToggle strong{font-size:14px}
  .plcInputToggle small{font-size:10px;color:#71869a}
  .plcOutputGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
  .plcOutputCard{background:#fff;border:1px solid #d4e0ea;border-radius:15px;padding:15px;min-width:0}
  .plcOutputHeader{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:14px}
  .plcOutputState{display:flex;align-items:center;gap:7px;background:#f0f2f5;color:#657385;border-radius:999px;padding:6px 10px;font-size:12px}
  .plcOutputState.active{background:#e1f4e9;color:#206a45}
  .plcOutputLamp{width:9px;height:9px;border-radius:50%;background:#aab4bf;display:inline-block}
  .plcOutputState.active .plcOutputLamp{background:#25a66a;box-shadow:0 0 0 4px #c9ebd8}
  .plcRuleFields{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
  .plcRuleFields label{display:flex;flex-direction:column;gap:6px;font-size:12px;font-weight:700;color:#506981;min-width:0}
  .plcRuleFields select{width:100%;min-width:0;border:1px solid #cbd9e6;border-radius:8px;background:#fff;color:#203d58;padding:9px 7px;font:inherit}
  .plcRuleFields select:disabled{background:#edf1f5;color:#8493a2}
  .plcFieldHint{font-size:10px;font-weight:400}
  .plcTrace{margin-top:14px;padding:11px;background:#f5f8fb;border-radius:10px}
  .plcTrace h4{margin:0 0 7px;font-size:12px}
  .plcTrace ol{list-style:none;padding:0;margin:0;display:grid;gap:6px}
  .plcTrace li{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;font-size:11px;color:#526a81}
  .plcTrace li strong{white-space:nowrap;color:#254b70}
  .plcScenarioGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  .plcScenarioButton{border:1px solid #cbd9e6;border-radius:10px;background:#fff;color:#294864;padding:11px;font:inherit;font-size:12px;font-weight:700;text-align:right}
  .plcScenarioButton.selected{background:#e5f0fa;border-color:#4c82b2;color:#174d7a}
  .plcPracticePrompt{margin-top:11px;background:#fff;border:1px solid #d8e3ed;border-radius:12px;padding:13px}
  .plcPracticePrompt p{margin:0 0 10px;line-height:1.7;font-size:13px;color:#3e5870}
  .plcCheckButton,.plcResetButton{border:0;border-radius:9px;background:#1d527b;color:#fff;padding:10px 15px;font:inherit;font-size:13px;font-weight:800}
  .plcFeedback{margin:10px 0 0!important;padding:10px;border-radius:8px;background:#fff1e8;color:#8a4d1d!important}
  .plcFeedback.success{background:#e7f5ec;color:#236343!important}
  .plcSimFooter{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-top:15px}
  .plcSimFooter p{margin:0;color:#62788c;font-size:11px;line-height:1.6}
  .plcResetButton{background:#e5edf4;color:#294864;border:1px solid #cbd9e6}
  .plcSafetyNotice{margin-top:14px;background:#fff7e8;border:1px solid #efd8aa;border-right:4px solid #d39a38;border-radius:10px;padding:12px 14px;color:#74511e}
  .plcSafetyNotice strong{font-size:12px}
  .plcSafetyNotice p{margin:5px 0 0;font-size:12px;line-height:1.7}
  .plcSimulator button:focus-visible,.plcSimulator select:focus-visible{outline:3px solid #1e78bd;outline-offset:2px}
  @media(max-width:760px){.plcOutputGrid{grid-template-columns:1fr}.plcRuleFields{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:480px){.plcSimulator{padding:14px}.plcInputGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.plcScenarioGrid{grid-template-columns:1fr}.plcRuleFields{grid-template-columns:1fr}.plcOutputHeader{align-items:flex-start;flex-direction:column}}
`;
