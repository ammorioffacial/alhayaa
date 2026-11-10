"use client";

import { useEffect, useId, useReducer, useRef, useState, useSyncExternalStore } from "react";
import { Pause, Play } from "lucide-react";

type Mood = "welcome" | "idle" | "lookAtPointer" | "smile" | "wave";
type Event = "REST" | "LOOK" | "GREET";
function controller(state: Mood, event: Event): Mood {
  if (event === "GREET") return state === "wave" ? "smile" : "wave";
  if (event === "LOOK") return state === "wave" || state === "welcome" ? state : "lookAtPointer";
  return "idle";
}
function subscribeMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const motionSnapshot = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const serverSnapshot = () => true;

/** Original layered artwork. Facial parts move independently; no bitmap or WebGL rig. */
export default function MedicalMascot() {
  const uid = useId().replaceAll(":", "");
  const paint = (name: string) => `url(#${uid}-${name})`;
  const [mood, dispatch] = useReducer(controller, "welcome");
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const reduced = useSyncExternalStore(subscribeMotion, motionSnapshot, serverSnapshot);
  const stage = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const running = !paused && !reduced && visible;

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    let inView = true;
    const update = () => setVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; update(); });
    observer.observe(element);
    document.addEventListener("visibilitychange", update);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); cancelAnimationFrame(frame.current); };
  }, []);
  useEffect(() => {
    if (!running || mood === "idle" || mood === "lookAtPointer") return;
    const timeout = setTimeout(() => dispatch("REST"), mood === "smile" ? 1600 : 2400);
    return () => clearTimeout(timeout);
  }, [running, mood]);
  function resetLook() {
    cancelAnimationFrame(frame.current);
    stage.current?.style.setProperty("--look-x", "0px");
    stage.current?.style.setProperty("--look-y", "0px");
    stage.current?.style.setProperty("--head-turn", "0deg");
  }

  return (
    <div className="medical-mascot" ref={stage} data-state={mood} data-running={running} data-reduced={reduced}>
      <div className="mascot-halo" aria-hidden="true" />
      <div className="mascot-greeting" aria-hidden="true">
        <span className="mascot-status-dot" />
        {mood === "wave" || mood === "smile" ? "هلا بيكِ!" : "عنايتكِ تبدأ من هنا"}
      </div>
      <button
        className="mascot-interact"
        aria-label="حيّي مساعدة حياة المجد"
        aria-describedby={`${uid}-hint`}
        onPointerEnter={() => { if (running) dispatch("LOOK"); }}
        onPointerMove={(event) => {
          if (!running || event.pointerType === "touch") return;
          const bounds = event.currentTarget.getBoundingClientRect();
          const x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
          const y = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
          cancelAnimationFrame(frame.current);
          frame.current = requestAnimationFrame(() => {
            stage.current?.style.setProperty("--look-x", `${x * 7}px`);
            stage.current?.style.setProperty("--look-y", `${y * 4}px`);
            stage.current?.style.setProperty("--head-turn", `${x * 5}deg`);
          });
        }}
        onPointerLeave={() => { resetLook(); if (mood === "lookAtPointer") dispatch("REST"); }}
        onClick={() => { if (!paused) dispatch("GREET"); }}
      >
        <svg className="mascot-art" viewBox="0 0 480 530" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-shell`} x1="145" y1="100" x2="330" y2="340" gradientUnits="userSpaceOnUse"><stop stopColor="#fff"/><stop offset=".55" stopColor="#f7fbff"/><stop offset="1" stopColor="#b9ccd9"/></linearGradient>
            <linearGradient id={`${uid}-coat`} x1="168" y1="284" x2="318" y2="460" gradientUnits="userSpaceOnUse"><stop stopColor="#fff"/><stop offset=".55" stopColor="#f2f8fa"/><stop offset="1" stopColor="#b4c9d8"/></linearGradient>
            <linearGradient id={`${uid}-pink`} x1="139" y1="100" x2="330" y2="265" gradientUnits="userSpaceOnUse"><stop stopColor="#f8dfe3"/><stop offset=".55" stopColor="#dcb4c0"/><stop offset="1" stopColor="#ae7c98"/></linearGradient>
            <linearGradient id={`${uid}-face`} x1="170" y1="150" x2="310" y2="285" gradientUnits="userSpaceOnUse"><stop stopColor="#fffdfa"/><stop offset=".7" stopColor="#fbeee9"/><stop offset="1" stopColor="#e8c7c8"/></linearGradient>
            <linearGradient id={`${uid}-navy`} x1="184" y1="290" x2="277" y2="466" gradientUnits="userSpaceOnUse"><stop stopColor="#406b84"/><stop offset="1" stopColor="#16374c"/></linearGradient>
            <radialGradient id={`${uid}-eye`}><stop stopColor="#4e879b"/><stop offset=".65" stopColor="#21465f"/><stop offset="1" stopColor="#102c43"/></radialGradient>
            <radialGradient id={`${uid}-cheek`}><stop stopColor="#e8a7ad" stopOpacity=".7"/><stop offset="1" stopColor="#e8a7ad" stopOpacity="0"/></radialGradient>
            <linearGradient id={`${uid}-gold`} x1="206" y1="105" x2="244" y2="151" gradientUnits="userSpaceOnUse"><stop stopColor="#e7cc9e"/><stop offset="1" stopColor="#ab895a"/></linearGradient>
            <filter id={`${uid}-shadow`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
          </defs>
          <ellipse className="mascot-ground" cx="246" cy="485" rx="100" ry="13" fill="#375971" opacity=".16" filter={paint("shadow")} />
          <g className="mascot-float">
            <g className="mascot-body">
              <path d="M207 417 L203 459 Q201 474 218 474 L230 474 L237 419" fill={paint("navy")}/>
              <path d="M252 419 L258 473 L275 474 Q290 471 283 456 L278 416" fill={paint("navy")}/>
              <path d="M202 455 Q216 453 231 459 L231 477 Q211 485 190 478 Q184 473 191 465Z" fill={paint("shell")}/>
              <path d="M257 459 Q268 454 282 456 L297 469 Q303 478 291 481 L259 479Z" fill={paint("shell")}/>
              <path d="M179 309 C157 310 145 337 147 365 L153 395 Q156 405 172 402 L188 354Z" fill={paint("coat")} stroke="#c6d5dc" strokeWidth="1.5"/>
              <ellipse cx="162" cy="405" rx="16" ry="19" fill={paint("shell")} transform="rotate(-14 162 405)"/>
              <g className="mascot-wave-arm">
                <path d="M294 309 C314 303 322 319 332 333 L348 303 Q357 294 369 304 Q380 312 373 328 L355 362 Q344 382 328 373 L296 350Z" fill={paint("coat")} stroke="#bcced9" strokeWidth="1.5"/>
                <path d="M348 307 L344 286 Q341 272 350 272 Q356 272 359 285 L361 263 Q362 253 369 257 L375 281 L378 267 Q381 261 386 266 L387 286 L392 278 Q398 275 399 282 Q398 304 378 316Z" fill={paint("shell")} stroke="#c6d5df" strokeWidth="1.5"/>
                <path d="M353 306 Q364 313 376 313" stroke="#a4bdcb" strokeWidth="3"/>
              </g>
              <path d="M187 300 Q240 278 290 301 Q307 347 307 418 Q249 446 177 419 Q177 344 187 300Z" fill={paint("coat")} stroke="#c8d8e1" strokeWidth="1.5"/>
              <path d="M216 295 L240 338 L269 296 Q245 283 216 295Z" fill={paint("navy")}/>
              <path d="M214 295 L239 337 L221 353 L204 321Z" fill="#fff"/>
              <path d="M271 295 L240 337 L259 354 L284 320Z" fill="#fff"/>
              <path d="M240 341 L240 428" stroke="#c3d3dc" strokeWidth="1.5"/>
              <circle cx="247" cy="368" r="3" fill="#9eb5c3"/><circle cx="247" cy="389" r="3" fill="#9eb5c3"/>
              <path d="M208 304 C193 347 202 365 217 363 C230 360 229 344 222 335" stroke="#456c80" strokeWidth="5" strokeLinecap="round"/>
              <path d="M273 304 C280 326 282 348 273 368" stroke="#456c80" strokeWidth="5" strokeLinecap="round"/>
              <circle cx="272" cy="372" r="11" fill="#9bb6c6" stroke="#f8fcff" strokeWidth="3"/><circle cx="272" cy="372" r="5" fill="#365d75"/>
              <path d="M191 381 L222 381 L222 404 Q207 411 191 403Z" fill="#e7f0f5" stroke="#bfced7"/>
              <rect x="202" y="385" width="7" height="17" rx="2" fill={paint("gold")}/><rect x="197" y="390" width="17" height="7" rx="2" fill={paint("gold")}/>
            </g>
            <g className="mascot-head-idle"><g className="mascot-head-track">
              <rect x="224" y="267" width="38" height="36" rx="14" fill="#c8d8df"/><path d="M228 286 Q243 294 258 286" stroke="#9fb6c4" strokeWidth="3"/>
              <ellipse cx="151" cy="219" rx="18" ry="27" fill={paint("pink")}/><ellipse cx="333" cy="219" rx="18" ry="27" fill={paint("pink")}/>
              <ellipse cx="148" cy="217" rx="9" ry="16" fill="#fcf7f8"/><ellipse cx="336" cy="217" rx="9" ry="16" fill="#fcf7f8"/>
              <path d="M145 202 C135 138 164 87 235 86 C310 80 346 128 338 204 L325 263 Q243 307 161 265Z" fill={paint("pink")} stroke="#bc95a8" strokeWidth="1.5"/>
              <path d="M157 193 C153 143 182 119 237 117 C295 114 324 144 326 191 L322 235 Q315 286 243 288 Q171 285 161 239Z" fill={paint("shell")} stroke="#fff" strokeWidth="2"/>
              <path d="M172 194 Q174 160 208 158 L277 158 Q307 163 310 194 L309 231 Q302 270 244 273 Q185 269 175 234Z" fill={paint("face")} stroke="#dcced0" strokeWidth="1.5"/>
              <path d="M155 179 Q154 121 206 110 Q220 110 235 121 Q213 161 166 177Z" fill={paint("pink")}/>
              <path d="M232 120 Q286 105 318 161 L324 182 Q267 178 232 120Z" fill={paint("pink")}/>
              <path d="M169 139 Q186 116 209 117" stroke="#ffedf0" strokeWidth="5" strokeLinecap="round" opacity=".8"/>
              <path d="M191 112 L187 84 Q235 55 286 84 L281 114 Q239 102 191 112Z" fill={paint("shell")} stroke="#fff" strokeWidth="2"/>
              <rect x="231" y="79" width="12" height="28" rx="3" fill={paint("gold")}/><rect x="223" y="87" width="28" height="12" rx="3" fill={paint("gold")}/>
              <ellipse cx="193" cy="235" rx="20" ry="14" fill={paint("cheek")}/><ellipse cx="290" cy="235" rx="20" ry="14" fill={paint("cheek")}/>
              <path d="M191 188 Q202 182 214 188 M267 188 Q279 182 291 189" stroke="#816774" strokeWidth="3" strokeLinecap="round"/>
              <g className="mascot-eyes">
                <g className="mascot-eye mascot-eye-right"><ellipse cx="204" cy="211" rx="13" ry="17" fill="#fff"/><g className="mascot-pupils"><ellipse cx="206" cy="211" rx="9" ry="13" fill={paint("eye")}/><circle cx="209" cy="206" r="3.5" fill="white"/><circle cx="202" cy="216" r="1.5" fill="#a8d6de"/></g><path d="M190 204 Q198 193 211 197" stroke="#4c5262" strokeWidth="3" strokeLinecap="round"/></g>
                <g className="mascot-eye mascot-eye-left"><ellipse cx="279" cy="211" rx="13" ry="17" fill="#fff"/><g className="mascot-pupils"><ellipse cx="277" cy="211" rx="9" ry="13" fill={paint("eye")}/><circle cx="280" cy="206" r="3.5" fill="white"/><circle cx="273" cy="216" r="1.5" fill="#a8d6de"/></g><path d="M272 197 Q286 193 294 204" stroke="#4c5262" strokeWidth="3" strokeLinecap="round"/></g>
              </g>
              <path d="M239 218 Q234 227 242 228" stroke="#d5b4b4" strokeWidth="2.5" strokeLinecap="round"/>
              <path className="mascot-mouth-rest" d="M229 241 Q242 254 256 240" stroke="#9b5e72" strokeWidth="3.5" strokeLinecap="round"/>
              <g className="mascot-mouth-smile"><path d="M226 239 Q242 246 259 238 Q255 261 242 260 Q229 259 226 239Z" fill="#73465d"/><path d="M230 242 Q242 246 255 241 L253 247 Q242 251 232 247Z" fill="white"/><path d="M235 257 Q242 251 249 257" fill="#e5a6b5"/></g>
              <circle cx="324" cy="228" r="4" fill="#fff"/><path d="M328 237 Q321 253 298 253" stroke="#a6bcca" strokeWidth="3" strokeLinecap="round"/><rect x="290" y="249" width="13" height="7" rx="3.5" fill="#6d8d9f"/>
            </g></g>
          </g>
        </svg>
      </button>
      <div className="mascot-controls">
        <span id={`${uid}-hint`}>اضغطي لتلقي التحية</span>
        <button className="mascot-pause" aria-label={paused ? "تشغيل حركة الشخصية" : "إيقاف حركة الشخصية"} aria-pressed={paused || reduced} disabled={reduced} onClick={() => { resetLook(); setPaused((value) => !value); }}>
          {paused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
          <span>{reduced ? "حركة مخفّضة" : paused ? "تشغيل" : "إيقاف الحركة"}</span>
        </button>
      </div>
    </div>
  );
}
