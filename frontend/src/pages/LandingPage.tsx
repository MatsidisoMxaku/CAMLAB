import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  // WebGL shader background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function syncSize() {
      const w = canvas!.clientWidth || 1280;
      const h = canvas!.clientHeight || 720;
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w;
        canvas!.height = h;
      }
    }

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(syncSize);
      resizeObserver.observe(canvas);
    }
    syncSize();

    const gl =
      (canvas.getContext("webgl") as WebGLRenderingContext | null) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return;

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

    const fs = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
varying vec2 v_texCoord;

void main() {
    vec2 uv = v_texCoord;
    vec2 centered_uv = (uv - 0.5) * 2.0;
    centered_uv.x *= u_resolution.x / u_resolution.y;

    float background = 0.05;

    // Grid lines
    vec2 grid = fract(uv * 20.0);
    float gridLine = smoothstep(0.02, 0.0, grid.x) + smoothstep(0.02, 0.0, grid.y);
    gridLine += smoothstep(0.98, 1.0, grid.x) + smoothstep(0.98, 1.0, grid.y);

    // Mathematical curves (Sine waves)
    float wave1 = sin(centered_uv.x * 3.0 + u_time * 0.5) * 0.5;
    float wave2 = cos(centered_uv.x * 2.0 - u_time * 0.3) * 0.3;

    float dist1 = abs(centered_uv.y - wave1);
    float dist2 = abs(centered_uv.y - wave2);

    float glow1 = smoothstep(0.1, 0.0, dist1) * 0.5;
    float glow2 = smoothstep(0.08, 0.0, dist2) * 0.4;

    vec3 color = vec3(0.02, 0.04, 0.08); // Deep navy
    color += gridLine * 0.02;
    color += glow1 * vec3(0.14, 0.38, 1.0); // Electric blue
    color += glow2 * vec3(0.13, 0.82, 0.93); // Cyan

    gl_FragColor = vec4(color, 1.0);
}`;

    function compileShader(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      return s;
    }

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const pos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes = gl.getUniformLocation(prog, "u_resolution");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");

    const mouse = { x: canvas.width / 2, y: canvas.height / 2 };

    function handleMouseMove(event: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mouse.x = nx * canvas!.width;
        mouse.y = ny * canvas!.height;
      }
    }
    window.addEventListener("mousemove", handleMouseMove);

    let animationFrameId: number;
    function render(t: number) {
      if (typeof ResizeObserver === "undefined") syncSize();
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
      if (uTime) gl!.uniform1f(uTime, t * 0.001);
      if (uRes) gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      if (uMouse) gl!.uniform2f(uMouse, mouse.x, mouse.y);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    }
    render(0);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (resizeObserver) resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Parallax effect for floating equations
  useEffect(() => {
    function handleParallax(e: MouseEvent) {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      document.querySelectorAll<HTMLElement>(".latex-float").forEach((el, i) => {
        const speed = (i + 1) * 15;
        el.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
      });
    }
    window.addEventListener("mousemove", handleParallax);
    return () => window.removeEventListener("mousemove", handleParallax);
  }, []);

  // Button press micro-interaction
  useEffect(() => {
    const buttons = document.querySelectorAll<HTMLButtonElement>("button");
    const down = (e: Event) => ((e.currentTarget as HTMLElement).style.transform = "scale(0.98)");
    const up = (e: Event) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)");
    buttons.forEach((btn) => {
      btn.addEventListener("mousedown", down);
      btn.addEventListener("mouseup", up);
      btn.addEventListener("mouseleave", up);
    });
    return () => {
      buttons.forEach((btn) => {
        btn.removeEventListener("mousedown", down);
        btn.removeEventListener("mouseup", up);
        btn.removeEventListener("mouseleave", up);
      });
    };
  }, []);

  return (
    <div className="bg-background text-on-surface font-body-md text-body-md overflow-x-hidden scientific-grid">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-margin-desktop py-4 bg-background/80 backdrop-blur-xl border-b border-outline-variant/30">
        <div className="text-headline-md font-headline-md font-bold text-primary">CAMLab</div>
        <div className="hidden md:flex gap-xl items-center">
          <a className="font-label-md text-label-md text-primary border-b-2 border-primary pb-1 hover:text-secondary transition-colors duration-200" href="#">Features</a>
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors duration-200" href="#">University Solutions</a>
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors duration-200" href="#">Pricing</a>
        </div>
        <button
          onClick={() => navigate("/login")}
          className="font-label-md text-label-md bg-primary-container text-on-primary-container px-lg py-sm rounded-lg active:scale-95 transition-transform"
        >
          Login
        </button>
      </nav>

      {/* Hero Section */}
      <main className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-xl px-margin-desktop overflow-hidden">
        {/* Background Shader */}
        <div className="absolute inset-0 w-full h-full opacity-40 mix-blend-screen">
          <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
        </div>

        {/* Floating Equations
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="latex-float absolute top-[20%] left-[10%] font-math-display text-math-display text-primary/60">
            {"i\\hbar\\frac{\\partial}{\\partial t}\\Psi = \\hat{H}\\Psi"}
          </div>
          <div className="latex-float absolute top-[65%] right-[15%] font-math-display text-math-display text-secondary/50" style={{ animationDelay: "-2s" }}>
            {"\\rho(\\frac{\\partial \\mathbf{u}}{\\partial t} + \\mathbf{u} \\cdot \\nabla \\mathbf{u}) = -\\nabla p + \\mu \\nabla^2 \\mathbf{u} + \\mathbf{f}"}
          </div>
          <div className="latex-float absolute bottom-[15%] left-[20%] font-math-display text-math-display text-tertiary/40" style={{ animationDelay: "-4s" }}>
            {"\\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t}"}
          </div>
          <div className="latex-float absolute top-[30%] right-[25%] font-math-display text-math-display text-primary/30" style={{ animationDelay: "-1s" }}>
            {"\\frac{\\partial u}{\\partial t} = \\alpha \\nabla^2 u"}
          </div>
        </div> */}

        {/* Content */}
        <div className="relative z-10 text-center max-w-5xl mx-auto">
          <h1 className="font-display-lg text-display-lg md:text-[64px] mb-lg leading-tight tracking-tight text-on-surface">
            Interactive Computational Platform for <span className="text-primary-container">Applied Mathematics</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl mx-auto mb-xl">
            Visualize, solve, and understand differential equations, perturbation methods, numerical methods, and complex mathematical models in a high-fidelity laboratory environment.
          </p>
          <div className="flex flex-col sm:flex-row gap-md justify-center items-center">
            <button
              onClick={() => navigate("/login")}
              className="bg-primary-container text-on-primary-container px-xl py-md rounded-lg font-headline-md text-headline-md hover:brightness-110 transition-all flex items-center gap-sm"
            >
              Try CAMLab
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>
      </main>

      {/* Bento/Glassmorphic Features Section */}
      <section className="relative py-32 px-margin-desktop bg-surface-dim">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-xl">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">Precision Modules</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Explore the core computational engines of CAMLab.</p>
            </div>
            <div className="font-label-md text-label-md text-primary-container cursor-pointer hover:underline">View Documentation →</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
            {/* Feature 1: ODE Solver */}
            <div className="md:col-span-8 glass-panel p-xl rounded-xl relative overflow-hidden group">
              <div className="relative z-10">
                <div className="material-symbols-outlined text-primary text-[48px] mb-md">functions</div>
                <h3 className="font-headline-md text-headline-md mb-sm">Advanced ODE Solver</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-lg max-w-lg">
                  Utilize Runge-Kutta, Adams-Bashforth, and adaptive step-size algorithms with real-time phase portrait visualization and stability analysis.
                </p>
                <div className="flex gap-sm">
                  <span className="px-sm py-xs bg-surface-container-highest rounded font-label-md text-label-md text-on-surface">RK4</span>
                  <span className="px-sm py-xs bg-surface-container-highest rounded font-label-md text-label-md text-on-surface">Adaptive</span>
                </div>
              </div>
              <div className="absolute right-0 top-0 h-full w-1/2 opacity-20 group-hover:opacity-40 transition-opacity">
                <img
                  className="w-full h-full object-cover"
                  alt="A complex mathematical visualization of an attractor or a vector field in three-dimensional space, rendered as glowing neon threads of electric blue and cyan against a deep obsidian background."
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBYhp3Ph73azYIZAvXGjqWCcFTOYqS_3bnYPSn3MJ36amzEK_m8YrUmjupA57JbqADV7-D9CcpugRUmrKRUfEWOoKQ4VsnT89fpnJmlihJXlHe9EuzReKSB7UYFzIFVqc2IILQ2jY2CS1N8TvTMLbhS5VWwq0DJZrE8ZBuyS_khtef_ZV5m64Weve8TY_1QwOqxgAjSDfTtwkRKAwkyrlddOHMw86M_-IzQE0ANnnEsqoasqOGkt3WJfY-opCUrJ3rOU1sZDz7PpRE"
                />
              </div>
            </div>

            {/* Feature 2: Perturbation Lab */}
            <div className="md:col-span-4 glass-panel p-xl rounded-xl">
              <div className="material-symbols-outlined text-secondary text-[48px] mb-md">waves</div>
              <h3 className="font-headline-md text-headline-md mb-sm">Perturbation Lab</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
                Asymptotic expansions, boundary layer analysis, and multiple scales for singular perturbations.
              </p>
              <button className="font-label-md text-label-md text-secondary border-b border-secondary/50">Explore Methods</button>
            </div>

            {/* Feature 3: Numerical Methods */}
            <div className="md:col-span-4 glass-panel p-xl rounded-xl">
              <div className="material-symbols-outlined text-tertiary text-[48px] mb-md">calculate</div>
              <h3 className="font-headline-md text-headline-md mb-sm">Numerical Methods</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
                High-order finite difference, spectral methods, and FEM implementations for rigid academic rigor.
              </p>
              <div className="w-full h-24 bg-surface-container-lowest/50 rounded-lg flex items-center justify-center overflow-hidden">
                <div className="w-full h-full bg-gradient-to-r from-tertiary/10 to-transparent" />
              </div>
            </div>

            {/* Feature 4: PDE Visualizer */}
            <div className="md:col-span-8 glass-panel p-xl rounded-xl relative overflow-hidden group">
              <div className="relative z-10">
                <div className="material-symbols-outlined text-primary text-[48px] mb-md">grid_view</div>
                <h3 className="font-headline-md text-headline-md mb-sm">Real-time PDE Visualization</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-lg max-w-lg">
                  Interactive heatmaps and 3D surface plots for parabolic, hyperbolic, and elliptic partial differential equations.
                </p>
              </div>
              <div className="absolute right-0 bottom-0 h-4/5 w-1/3 opacity-30 group-hover:opacity-60 transition-opacity">
                <img
                  className="w-full h-full object-cover"
                  alt="A high-tech digital surface plot representing a thermal heat map, with peaks and valleys illuminated by a spectrum of deep blues to vibrant violets over a thin wireframe grid, on a dark charcoal background."
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGYuSC70Gv8GaE11MAWPi5fyk6VZ9vdJsXSESGY9fNt5yz4-7GNPQxXt_xd_H7wZnnjPPZiMOHUD0HPVwF-h147b2atAYCu5QHb_zb-8hHUcozLbgDSqjuYag_heEgrepn_KqYl17-ccY6i3HS0eVlTr6EHMlPj9KQyiUGyUFjFYH3c-Ng0dv1dIvJSSozkL0AsFBA8TGJNTmpzEWglz62i0g80L8mzRyAJ5tAC9OA_Szr6KzK8p9LLJ0kaW-rOG9vFH6uf35czzY"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lab Canvas Preview */}
      <section className="py-32 px-margin-desktop bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl border border-outline-variant/20">
            <div className="bg-surface-container-high px-lg py-sm flex items-center justify-between">
              <div className="flex items-center gap-md">
                <div className="flex gap-xs">
                  <div className="w-3 h-3 rounded-full bg-error" />
                  <div className="w-3 h-3 rounded-full bg-secondary" />
                  <div className="w-3 h-3 rounded-full bg-primary" />
                </div>
                <span className="font-label-md text-label-md text-on-surface-variant italic">current_workspace / lorenz_attractor.clab</span>
              </div>
              <div className="flex items-center gap-md text-on-surface-variant">
                <span className="material-symbols-outlined cursor-pointer hover:text-primary">play_arrow</span>
                <span className="material-symbols-outlined cursor-pointer hover:text-primary">save</span>
                <span className="material-symbols-outlined cursor-pointer hover:text-primary">settings</span>
              </div>
            </div>

            <div className="h-[500px] bg-[#050a14] relative grid grid-cols-12">
              {/* Dashboard Sidebar (Simulated) */}
              <div className="col-span-3 border-r border-outline-variant/10 p-md flex flex-col gap-md">
                <div className="space-y-sm">
                  <label className="font-label-md text-label-md text-primary block">Parameters</label>
                  <div className="h-1 bg-outline-variant/30 rounded-full relative">
                    <div className="absolute left-0 top-0 h-full w-2/3 bg-primary rounded-full" />
                    <div className="absolute left-2/3 top-1/2 -translate-y-1/2 w-3 h-3 bg-on-surface rounded-full" />
                  </div>
                  <div className="flex justify-between text-[12px] font-label-md text-on-surface-variant">
                    <span>Sigma: 10.0</span>
                    <span>ρ: 28.0</span>
                  </div>
                </div>
                <div className="p-sm bg-surface-container rounded-lg border border-outline-variant/20">
                  <code className="font-label-md text-[12px] text-on-surface italic">
                    dx/dt = σ(y - x)<br />
                    dy/dt = x(ρ - z) - y<br />
                    dz/dt = xy - βz
                  </code>
                </div>
              </div>

              {/* Main Plot Area (Simulated) */}
              <div className="col-span-9 relative flex items-center justify-center">
                <div className="absolute inset-0 scientific-grid opacity-20" />
                <img
                  className="w-4/5 h-4/5 object-contain rounded-xl opacity-80"
                  alt="A breathtaking view of complex planetary light trails and data visualization streams flowing across a dark cosmos in electric blue, cyan, and deep navy, with thin white geometric lines forming a digital framework."
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0KJJbpWdBqacA4jt0SwBkKSYL2Qzigu05us3qvFVwLNUINZq2nIibWC5UfGuTWizHqhoVII0KbBsTf6z8izkT_taLkIVOc9fuDazV1P1zpAaNoh-sNiWpzSr1GoH9iGZ2Sqc0_Omm9y0e9iM4ppWI-cmcyiPzoJt2pua5waj0W4v9G7peMVnHehE9bMpqjD3SjIp3rmXn8YXG5Oak1RWwwcGY1XBUdmwbojJZRGxQ5sizT885dLX5tYcBSb-yvLeBeYqgTbUwIbs"
                />
                <div className="absolute bottom-md right-md bg-background/80 backdrop-blur-md px-md py-sm rounded border border-outline-variant/30 font-label-md text-label-md text-secondary">
                  Status: Converged | Step: 0.001s
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-xl px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-md bg-background border-t border-outline-variant/30">
        <div className="flex flex-col gap-xs">
          <div className="font-headline-md text-on-surface font-bold">CAMLab</div>
          <div className="font-body-md text-body-md text-on-surface-variant">© 2026 CAMLab. Computational And Applied Mathematics.</div>
        </div>
        <div className="flex gap-lg">
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors duration-200" href="#">Documentation</a>
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors duration-200" href="#">University Partners</a>
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors duration-200" href="#">Research Ethics</a>
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors duration-200" href="#">API Reference</a>
        </div>
        <div className="flex gap-md">
          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary">language</span>
          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary">terminal</span>
          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary">hub</span>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;