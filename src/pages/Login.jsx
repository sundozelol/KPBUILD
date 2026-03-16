import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Loader2, Eye, EyeOff, Ticket } from "lucide-react";
import * as THREE from "three";

// ── Three.js scene ────────────────────────────────────────────────────────────
function useThreeScene(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 9);

    // ── Lights ──
    scene.add(new THREE.AmbientLight(0xffffff, 0.06));

    const back = new THREE.PointLight(0xffffff, 12, 20);
    back.position.set(0, 0, -6);
    scene.add(back);

    // Hover light — follows mouse, activates when over sphere
    const hoverLight = new THREE.PointLight(0xffffff, 0, 18);
    scene.add(hoverLight);

    // Raycaster for hover detection
    const raycaster = new THREE.Raycaster();
    const mouseNDC = new THREE.Vector2();


    // ── Faceted dark sphere ──
    const geo = new THREE.IcosahedronGeometry(3.5, 3);

    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x0d0d0d),
      metalness: 0.9,
      roughness: 0.25,
      flatShading: true,
    });


    const sphere = new THREE.Mesh(geo, mat);
    scene.add(sphere);

    // White edge lines
    const edgesMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.14 });
    sphere.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgesMat));


    // ── Particles ──
    const pCount = 280;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3]     = (Math.random() - 0.5) * 22;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({
      color: 0xffffff, size: 0.028, transparent: true, opacity: 0.3, sizeAttenuation: true,
    })));

    // ── Mouse ──
    const mouse = { x: 0, y: 0 };
    const sm = { x: 0, y: 0 };
    const cam = { x: 0, y: 0 };

    // Drag rotation state
    const drag = { active: false, lastX: 0, lastY: 0, velX: 0, velY: 0 };
    // Manual rotation accumulator (Euler offsets on top of auto-rotation)
    const manualRot = { x: 0, y: 0 };

    const onMouse = (e) => {
      mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
      mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };

    const onMouseDown = (e) => {
      drag.active = true;
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
      drag.velX = 0;
      drag.velY = 0;
      canvas.style.cursor = 'grabbing';
    };

    const onMouseMove = (e) => {
      onMouse(e);
      if (!drag.active) return;
      const dx = e.clientX - drag.lastX;
      const dy = e.clientY - drag.lastY;
      drag.velX = dx * 0.008;
      drag.velY = dy * 0.008;
      manualRot.y += drag.velX;
      manualRot.x += drag.velY;
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
    };

    const onMouseUp = () => {
      drag.active = false;
      canvas.style.cursor = 'grab';
    };

    // ── Click rays ──
    const rays = [];

    const onClickRay = (e) => {
      if (drag.velX > 0.01 || drag.velY > 0.01) return; // ignore drag-end clicks

      const ndcX = (e.clientX / window.innerWidth)  * 2 - 1;
      const ndcY = -(e.clientY / window.innerHeight) * 2 + 1;

      const vec = new THREE.Vector3(ndcX, ndcY, 0.5);
      vec.unproject(camera);
      const dir = vec.sub(camera.position).normalize();

      // Ray geometry: two points, start at sphere center, end extends outward
      const pts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)];
      const rayGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const rayMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1.0 });
      const ray = new THREE.Line(rayGeo, rayMat);
      scene.add(ray);

      // Flash light at hit direction
      const flashLight = new THREE.PointLight(0xffffff, 180, 14);
      flashLight.position.copy(dir.clone().multiplyScalar(6));
      scene.add(flashLight);

      rays.push({ ray, rayGeo, rayMat, dir, flashLight, progress: 0 });

      // Sphere pulse
      spherePulse.active = true;
      spherePulse.t = 0;
    };

    // Sphere pulse state
    const spherePulse = { active: false, t: 0 };

    canvas.style.cursor = 'grab';
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("click", onClickRay);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // ── Animation ──
    let animId;
    const clock = new THREE.Clock();
    const lerp = (a, b, t) => a + (b - a) * t;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      sm.x  = lerp(sm.x,  mouse.x, 0.04);
      sm.y  = lerp(sm.y,  mouse.y, 0.04);
      cam.x = lerp(cam.x, mouse.x, 0.022);
      cam.y = lerp(cam.y, mouse.y, 0.022);

      // Inertia — decay velocity when not dragging
      if (!drag.active) {
        manualRot.y += drag.velX;
        manualRot.x += drag.velY;
        drag.velX *= 0.92;
        drag.velY *= 0.92;
      }



      // ── Hover detection ──
      mouseNDC.set(mouse.x, mouse.y);
      raycaster.setFromCamera(mouseNDC, camera);
      const hits = raycaster.intersectObject(sphere);
      const hovered = hits.length > 0;
      const targetIntensity = hovered ? 30 : 0;
      hoverLight.intensity = lerp(hoverLight.intensity, targetIntensity, 0.08);
      if (hovered) {
        hoverLight.position.set(sm.x * 5, sm.y * 4, 6);
        edgesMat.opacity = lerp(edgesMat.opacity, 0.32, 0.06);
      } else {
        edgesMat.opacity = lerp(edgesMat.opacity, 0.14, 0.04);
      }

      // ── Rays animation ──
      for (let i = rays.length - 1; i >= 0; i--) {
        const r = rays[i];
        r.progress += 0.045;

        // Extend tip rapidly
        const len = Math.min(r.progress * 3, 1) * 9;
        const end = r.dir.clone().multiplyScalar(len);
        const pos = r.rayGeo.attributes.position;
        pos.setXYZ(1, end.x, end.y, end.z);
        pos.needsUpdate = true;

        // Fade out
        r.rayMat.opacity = Math.max(0, 1 - r.progress * 1.2);
        r.flashLight.intensity = Math.max(0, 180 * (1 - r.progress * 2.5));

        if (r.progress >= 1) {
          scene.remove(r.ray);
          scene.remove(r.flashLight);
          rays.splice(i, 1);
        }
      }

      // ── Sphere pulse on click ──
      if (spherePulse.active) {
        spherePulse.t += 0.055;
        const pulse = 1 + Math.sin(spherePulse.t * Math.PI) * 0.06;
        sphere.scale.setScalar(pulse);
        edgesMat.opacity = 0.14 + Math.sin(spherePulse.t * Math.PI) * 0.5;
        if (spherePulse.t >= 1) {
          sphere.scale.setScalar(1);
          spherePulse.active = false;
        }
      }

      // ── Camera parallax (disabled while dragging) ──
      if (!drag.active) {
        camera.position.x = lerp(camera.position.x, cam.x * 0.22, 0.03);
        camera.position.y = lerp(camera.position.y, cam.y * 0.15, 0.03);
        camera.lookAt(0, 0, 0);
      }

      // Auto-rotation + manual drag offset
      sphere.rotation.y = t * 0.055 + manualRot.y;
      sphere.rotation.x = t * 0.022 + manualRot.x;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("click", onClickRay);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
    };
  }, [canvasRef]);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", name: "", confirmPassword: "", inviteCode: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  useThreeScene(canvasRef);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (mode === "register") {
      if (!form.name.trim()) return setError("Введите имя");
      if (form.password !== form.confirmPassword) return setError("Пароли не совпадают");
      if (form.password.length < 6) return setError("Пароль минимум 6 символов");
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register(form.email, form.password, form.name, form.inviteCode);
      }
      navigate("/proposals");
    } catch (err) {
      setError(err.message || "Ошибка авторизации");
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "radial-gradient(ellipse 55% 55% at 50% 50%, #161616 0%, #080808 45%, #010101 100%)" }}>
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          display: flex;
          width: max-content;
          animation: marquee 54s linear infinite;
          will-change: transform;
        }
        .marquee-text {
          font-size: clamp(52px, 7vw, 96px);
          font-weight: 900;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          color: transparent;
          -webkit-text-stroke: 1.5px rgba(255,255,255,0.13);
          white-space: nowrap;
          padding-right: 80px;
          line-height: 1;
          user-select: none;
        }
        .glass-input {
          width: 100%;
          height: 40px;
          padding: 0 12px;
          border-radius: 12px;
          font-size: 14px;
          outline: none;
          transition: border 0.2s, box-shadow 0.2s, background 0.2s;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.9);
        }
        .glass-input::placeholder { color: rgba(255,255,255,0.25); }
        .glass-input:focus {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.35);
          box-shadow: 0 0 0 3px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .glow-btn {
          width: 100%;
          height: 40px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 8px;
          cursor: pointer;
          transition: all 0.2s;
          background: rgba(255,255,255,0.9);
          color: #050505;
          border: none;
          box-shadow: 0 0 20px rgba(255,255,255,0.2), 0 4px 12px rgba(0,0,0,0.5);
        }
        .glow-btn:hover:not(:disabled) {
          background: #ffffff;
          box-shadow: 0 0 32px rgba(255,255,255,0.35), 0 0 60px rgba(255,255,255,0.1), 0 4px 16px rgba(0,0,0,0.5);
          transform: translateY(-1px);
        }
        .glow-btn:disabled {
          background: rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.3);
          cursor: not-allowed;
          box-shadow: none;
        }
        .tab-btn {
          flex: 1;
          padding: 6px 0;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s;
          cursor: pointer;
          border: none;
        }
        .tab-active {
          background: rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.95);
          box-shadow: 0 0 10px rgba(255,255,255,0.08);
        }
        .tab-inactive {
          background: transparent;
          color: rgba(255,255,255,0.3);
        }
      `}</style>

      {/* Three.js canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }} />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        zIndex: 1,
        background: "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 30%, rgba(0,0,0,0.7) 100%)",
      }} />

      {/* Center content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">

        {/* Logo icon */}
        <div className="mb-7 select-none">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 0 20px rgba(255,255,255,0.08)",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
        </div>

        {/* Glass card */}
        <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          border: "1px solid rgba(255,255,255,0.09)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)",
        }}>
          {/* Header */}
          <div className="px-7 pt-6 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 className="text-lg font-semibold" style={{ color: "rgba(255,255,255,0.92)" }}>
              {mode === "login" ? "Вход в систему" : "Регистрация"}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.32)" }}>
              Доступ к коммерческим предложениям
            </p>
            <div className="flex gap-1 mt-4 p-0.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
              {["login", "register"].map(m => (
                <button key={m} onClick={() => { setMode(m); setError(""); }}
                  className={`tab-btn ${mode === m ? "tab-active" : "tab-inactive"}`}>
                  {m === "login" ? "Вход" : "Регистрация"}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-7 py-6 space-y-4">
            {mode === "register" && (
              <Field label="Ваше имя">
                <input className="glass-input" type="text" placeholder="Иван Иванов" value={form.name} onChange={set("name")} autoComplete="name" />
              </Field>
            )}

            <Field label="Email">
              <input className="glass-input" type="email" placeholder="you@company.ru" value={form.email} onChange={set("email")} autoComplete="email" required />
            </Field>

            <Field label="Пароль">
              <div className="relative">
                <input
                  className="glass-input"
                  type={showPass ? "text" : "password"}
                  placeholder={mode === "register" ? "Минимум 6 символов" : "Ваш пароль"}
                  value={form.password}
                  onChange={set("password")}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  style={{ paddingRight: "2.75rem" }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                  onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>

            {mode === "register" && (
              <>
                <Field label="Повторите пароль">
                  <input className="glass-input" type="password" placeholder="Повторите пароль" value={form.confirmPassword} onChange={set("confirmPassword")} autoComplete="new-password" />
                </Field>
                <Field label="Инвайт-код">
                  <div className="relative">
                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.22)" }} />
                    <input className="glass-input" type="text" placeholder="XXXX-XXXX"
                      value={form.inviteCode}
                      onChange={e => setForm(f => ({ ...f, inviteCode: e.target.value.toUpperCase() }))}
                      autoComplete="off" maxLength={9}
                      style={{ paddingLeft: "2.25rem", fontFamily: "monospace", letterSpacing: "0.1em" }} />
                  </div>
                  <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.22)" }}>Код выдаётся администратором</p>
                </Field>
              </>
            )}

            {error && (
              <div className="text-xs px-3 py-2.5 rounded-xl" style={{
                color: "rgba(255,120,120,0.9)",
                background: "rgba(255,80,80,0.08)",
                border: "1px solid rgba(255,80,80,0.18)",
              }}>{error}</div>
            )}

            <button type="submit" disabled={loading} className="glow-btn">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === "login" ? "Войти" : "Создать аккаунт"}
            </button>

            {mode === "login" && (
              <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                Нет аккаунта?{" "}
                <button type="button" onClick={() => { setMode("register"); setError(""); }}
                  style={{ color: "rgba(255,255,255,0.55)" }}
                  onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.85)"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.55)"}>
                  Зарегистрироваться
                </button>
              </p>
            )}
          </form>
        </div>

        <p className="mt-7 text-[10px] tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.14)" }}>
          Персональный доступ к предложениям компании
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
