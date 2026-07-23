import { useState } from "react";
import { useNavigate } from "react-router-dom";
import KaTeXRenderer from "../components/KaTeXRenderer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Classification {
  type: string;
  linearity: string;
  order: string;
  homogeneity: string;
  autonomy: string;
  degree: string;
}

interface DerivationStep {
  title: string;
  explanation: string;
  latex: string;
}

interface SimilarQuestion {
  equation: string;
  difficulty: "Easy" | "Medium" | "Hard" | "More Difficult";
  hint: string;
}

interface SolveResult {
  classification: Classification;
  method: string;
  breakdownEstimate: string;
  breakdownReason: string;
  steps: DerivationStep[];
  explanation: string;
  tips: string[];
  similarQuestions: SimilarQuestion[];
}

// ─── API call ─────────────────────────────────────────────────────────────────

async function solveWithGroq(
  equation: string,
  epsilon: string,
  epsilonMode: "symbolic" | "numeric",
  y0: string,
  yPrime0: string,
  maxOrder: number
): Promise<SolveResult> {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/solve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      equation,
      epsilon,
      epsilonMode,
      y0,
      yPrime0,
      maxOrder,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "Backend error");
  }

  return await response.json() as SolveResult;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const difficultyColor: Record<string, string> = {
  Easy: "text-secondary border-secondary/40",
  Medium: "text-primary border-primary/40",
  Hard: "text-tertiary border-tertiary/40",
  "More Difficult": "text-error border-error/40",
};

const orderOptions = [
  { label: "O(1) only", value: 0 },
  { label: "Up to O(ε)", value: 1 },
  { label: "Up to O(ε²)", value: 2 },
];

// ─── Component ────────────────────────────────────────────────────────────────

function PerturbationLab() {
  const navigate = useNavigate();

  // Inputs
  const [equation, setEquation] = useState("y'' + \\varepsilon y y' = 0");
  const [epsilon, setEpsilon] = useState("0.1");
  const [epsilonMode, setEpsilonMode] = useState<"symbolic" | "numeric">("numeric");
  const [y0, setY0] = useState("1");
  const [yPrime0, setYPrime0] = useState("1");
  const [maxOrder, setMaxOrder] = useState(1);

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SolveResult | null>(null);

  const handleSolve = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await solveWithGroq(
        equation,
        epsilon,
        epsilonMode,
        y0,
        yPrime0,
        maxOrder
      );
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background scientific-grid">
      <div className="max-w-7xl mx-auto px-margin-desktop py-xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-xl">
          <div>
            <button
              onClick={() => navigate("/dashboard")}
              className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors mb-sm flex items-center gap-xs"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to Dashboard
            </button>
            <div className="font-headline-md text-headline-md font-bold text-primary">CAMLab</div>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface hidden md:block">
            Perturbation Lab
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">

          {/* ── Left: Problem Setup ── */}
          <div className="lg:col-span-1">
            <div className="glass-panel rounded-xl p-xl sticky top-xl">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-md">
                Problem Setup
              </h2>

              {/* Equation input */}
              <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">
                Equation (LaTeX or plain text)
              </label>
              <textarea
                rows={2}
                value={equation}
                onChange={(e) => setEquation(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-md py-sm font-label-md text-label-md text-on-surface mb-sm focus:outline-none focus:border-primary resize-none"
              />
              {/* Live preview */}
              <div className="mb-md bg-surface-container-lowest/50 rounded-lg px-md py-sm min-h-[2.5rem] flex items-center justify-center overflow-x-auto">
                <KaTeXRenderer math={equation} display />
              </div>

              {/* Epsilon mode toggle */}
              <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">
                ε (epsilon) mode
              </label>
              <div className="flex gap-sm mb-sm">
                <button
                  onClick={() => setEpsilonMode("numeric")}
                  className={`flex-1 py-sm rounded-lg font-label-md text-label-md transition-all ${
                    epsilonMode === "numeric"
                      ? "bg-primary-container text-on-primary-container"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  Numeric
                </button>
                <button
                  onClick={() => setEpsilonMode("symbolic")}
                  className={`flex-1 py-sm rounded-lg font-label-md text-label-md transition-all ${
                    epsilonMode === "symbolic"
                      ? "bg-primary-container text-on-primary-container"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  Symbolic
                </button>
              </div>

              {epsilonMode === "numeric" ? (
                <>
                  <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">
                    ε value
                  </label>
                  <input
                    type="text"
                    value={epsilon}
                    onChange={(e) => setEpsilon(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-md py-sm font-label-md text-label-md text-on-surface mb-md focus:outline-none focus:border-primary"
                  />
                </>
              ) : (
                <div className="mb-md bg-surface-container/50 rounded-lg px-md py-sm">
                  <p className="font-label-md text-label-md text-on-surface-variant">
                    ε treated as a small symbolic parameter — solution expressed in terms of ε.
                  </p>
                </div>
              )}

              {/* Order selector */}
              <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">
                Orders to solve
              </label>
              <div className="flex flex-col gap-xs mb-md">
                {orderOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setMaxOrder(opt.value)}
                    className={`text-left px-md py-sm rounded-lg font-label-md text-label-md transition-all ${
                      maxOrder === opt.value
                        ? "bg-primary-container text-on-primary-container"
                        : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Initial conditions */}
              <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">
                Initial conditions
              </label>
              <div className="grid grid-cols-2 gap-sm mb-lg">
                <div>
                  <label className="font-label-md text-[12px] text-on-surface-variant block mb-xs">y(0)</label>
                  <input
                    type="text"
                    value={y0}
                    onChange={(e) => setY0(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-md py-sm font-label-md text-label-md text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-label-md text-[12px] text-on-surface-variant block mb-xs">y'(0)</label>
                  <input
                    type="text"
                    value={yPrime0}
                    onChange={(e) => setYPrime0(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-md py-sm font-label-md text-label-md text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Solve button */}
              <button
                onClick={handleSolve}
                disabled={loading}
                className="w-full bg-primary-container text-on-primary-container px-xl py-md rounded-lg font-headline-md text-headline-md hover:brightness-110 transition-all disabled:opacity-60 flex items-center justify-center gap-sm"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                    Solving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">calculate</span>
                    Solve
                  </>
                )}
              </button>

              {error && (
                <p className="font-label-md text-label-md text-error mt-md">{error}</p>
              )}
            </div>
          </div>

          {/* ── Right: Results ── */}
          <div className="lg:col-span-2 flex flex-col gap-gutter">

            {/* Empty state */}
            {!result && !loading && (
              <div className="glass-panel rounded-xl p-xl flex flex-col items-center justify-center min-h-[300px] text-center">
                <span className="material-symbols-outlined text-[64px] text-on-surface-variant/40 mb-md">waves</span>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Enter an equation and press Solve to see a full step-by-step perturbation solution.
                </p>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="glass-panel rounded-xl p-xl flex flex-col items-center justify-center min-h-[300px] text-center">
                <span className="material-symbols-outlined text-[64px] text-primary animate-pulse mb-md">calculate</span>
                <p className="font-body-md text-body-md text-on-surface-variant">Solving...</p>
              </div>
            )}

            {result && (
              <>
                {/* Classification */}
                <div className="glass-panel rounded-xl p-xl">
                  <h2 className="font-headline-md text-headline-md text-on-surface mb-md">
                    Equation Classification
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-sm">
                    {(
                      [
                        ["Type", result.classification.type],
                        ["Linearity", result.classification.linearity],
                        ["Order", result.classification.order],
                        ["Homogeneity", result.classification.homogeneity],
                        ["Autonomy", result.classification.autonomy],
                        ["Degree", result.classification.degree],
                      ] as [string, string][]
                    ).map(([label, value]) => (
                      <div key={label} className="bg-surface-container rounded-lg p-md">
                        <p className="font-label-md text-label-md text-on-surface-variant mb-xs">{label}</p>
                        <p className="font-body-md text-body-md text-on-surface">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Method + Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                  <div className="glass-panel rounded-xl p-xl">
                    <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">Method</h2>
                    <p className="font-body-md text-body-md text-secondary">{result.method}</p>
                  </div>
                  <div className="glass-panel rounded-xl p-xl">
                    <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">Breakdown Estimate</h2>
                    <p className="font-body-md text-body-md text-on-surface mb-sm">{result.breakdownEstimate}</p>
                    <p className="font-label-md text-label-md text-on-surface-variant">{result.breakdownReason}</p>
                  </div>
                </div>

                {/* Step-by-step derivation */}
                <div className="glass-panel rounded-xl p-xl">
                  <h2 className="font-headline-md text-headline-md text-on-surface mb-lg">
                    Step-by-Step Derivation
                  </h2>
                  <div className="flex flex-col gap-lg">
                    {result.steps.map((step, i) => (
                      <div key={i} className="flex gap-md">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center font-label-md text-label-md text-primary">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-label-md text-label-md text-primary mb-xs">{step.title}</p>
                          <p className="font-body-md text-body-md text-on-surface-variant mb-sm">{step.explanation}</p>
                          <div className="bg-surface-container-lowest rounded-lg px-md py-sm overflow-x-auto">
                            <KaTeXRenderer math={step.latex} display />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Explanation */}
                <div className="glass-panel rounded-xl p-xl">
                  <h2 className="font-headline-md text-headline-md text-on-surface mb-md">Full Explanation</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    {result.explanation}
                  </p>
                </div>

                {/* Tips */}
                <div className="glass-panel rounded-xl p-xl">
                  <h2 className="font-headline-md text-headline-md text-on-surface mb-md">
                    Tips for This Problem Type
                  </h2>
                  <div className="flex flex-col gap-sm">
                    {result.tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-sm">
                        <span className="material-symbols-outlined text-secondary text-[20px] mt-[2px] flex-shrink-0">lightbulb</span>
                        <p className="font-body-md text-body-md text-on-surface-variant">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Similar questions */}
                <div className="glass-panel rounded-xl p-xl">
                  <h2 className="font-headline-md text-headline-md text-on-surface mb-md">
                    Similar Questions to Practice
                  </h2>
                  <div className="flex flex-col gap-sm">
                    {result.similarQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => setEquation(q.equation)}
                        className="text-left bg-surface-container hover:bg-surface-container-high rounded-lg px-md py-sm transition-colors group"
                      >
                        <div className="flex items-center justify-between mb-xs">
                          <span className={`font-label-md text-label-md border rounded-full px-sm py-[2px] ${difficultyColor[q.difficulty]}`}>
                            {q.difficulty}
                          </span>
                          <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:text-primary transition-colors">north_east</span>
                        </div>
                        <div className="overflow-x-auto mb-xs">
                          <KaTeXRenderer math={q.equation} display />
                        </div>
                        <p className="font-label-md text-label-md text-on-surface-variant">Hint: {q.hint}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PerturbationLab;