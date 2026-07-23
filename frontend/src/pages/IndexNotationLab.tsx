import { useState } from "react";
import { useNavigate } from "react-router-dom";
import KaTeXRenderer from "../components/KaTeXRenderer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Classification {
  expressionType: string;
  problemCategory: string;
  indicesPresent: string;
  tensorRank: string;
  dimension: string;
  conventions: string;
}

interface DerivationStep {
  title: string;
  explanation: string;
  latex: string;
}

interface SimilarQuestion {
  expression: string;
  difficulty: "Easy" | "Medium" | "Hard" | "More Difficult";
  hint: string;
}

interface IndexResult {
  classification: Classification;
  result: string;
  steps: DerivationStep[];
  explanation: string;
  tips: string[];
  similarQuestions: SimilarQuestion[];
}

// ─── Problem type options ─────────────────────────────────────────────────────

const PROBLEM_TYPES = [
  { value: "simplify", label: "Simplify expression", icon: "compress" },
  { value: "prove", label: "Prove identity", icon: "verified" },
  { value: "expand", label: "Expand to full form", icon: "expand" },
  { value: "manipulate", label: "δ & ε manipulation", icon: "calculate" },
];

const DIMENSIONS = ["2", "3", "n"];

const difficultyColor: Record<string, string> = {
  Easy: "text-secondary border-secondary/40",
  Medium: "text-primary border-primary/40",
  Hard: "text-tertiary border-tertiary/40",
  "More Difficult": "text-error border-error/40",
};

// ─── API call ─────────────────────────────────────────────────────────────────

async function solveIndexNotation(
  expression: string,
  problemType: string,
  dimension: string,
  context: string
): Promise<IndexResult> {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/index-notation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expression, problemType, dimension, context }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "Backend error");
  }

  return await response.json() as IndexResult;
}

// ─── Component ────────────────────────────────────────────────────────────────

function IndexNotationLab() {
  const navigate = useNavigate();

  const [expression, setExpression] = useState("\\varepsilon_{ijk} \\varepsilon_{imn}");
  const [problemType, setProblemType] = useState("simplify");
  const [dimension, setDimension] = useState("3");
  const [context, setContext] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IndexResult | null>(null);

  const handleSolve = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await solveIndexNotation(expression, problemType, dimension, context);
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
            Index Notation Lab
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">

          {/* ── Left: Problem Setup ── */}
          <div className="lg:col-span-1">
            <div className="glass-panel rounded-xl p-xl sticky top-xl">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-md">
                Problem Setup
              </h2>

              {/* Problem type selector */}
              <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">
                Problem type
              </label>
              <div className="flex flex-col gap-xs mb-md">
                {PROBLEM_TYPES.map((pt) => (
                  <button
                    key={pt.value}
                    onClick={() => setProblemType(pt.value)}
                    className={`text-left px-md py-sm rounded-lg font-label-md text-label-md transition-all flex items-center gap-sm ${
                      problemType === pt.value
                        ? "bg-primary-container text-on-primary-container"
                        : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{pt.icon}</span>
                    {pt.label}
                  </button>
                ))}
              </div>

              {/* Expression input */}
              <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">
                Expression (LaTeX)
              </label>
              <textarea
                rows={3}
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-md py-sm font-label-md text-label-md text-on-surface mb-sm focus:outline-none focus:border-primary resize-none"
                placeholder="e.g. \varepsilon_{ijk}\varepsilon_{imn}"
              />
              {/* Live preview */}
              <div className="mb-md bg-surface-container-lowest/50 rounded-lg px-md py-sm min-h-[2.5rem] flex items-center justify-center overflow-x-auto">
                <KaTeXRenderer math={expression} display />
              </div>

              {/* Dimension */}
              <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">
                Dimension
              </label>
              <div className="flex gap-sm mb-md">
                {DIMENSIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDimension(d)}
                    className={`flex-1 py-sm rounded-lg font-label-md text-label-md transition-all ${
                      dimension === d
                        ? "bg-primary-container text-on-primary-container"
                        : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    {d === "n" ? "n-dim" : `${d}D`}
                  </button>
                ))}
              </div>

              {/* Optional context */}
              <label className="font-label-md text-label-md text-on-surface-variant block mb-xs">
                Additional context{" "}
                <span className="text-on-surface-variant/50">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-md py-sm font-label-md text-label-md text-on-surface mb-lg focus:outline-none focus:border-primary resize-none"
                placeholder="e.g. assume symmetric tensor, or prove this equals δ_{jm}δ_{kn} - δ_{jn}δ_{km}"
              />

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
                    <span className="material-symbols-outlined text-[20px]">functions</span>
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
                <span className="material-symbols-outlined text-[64px] text-on-surface-variant/40 mb-md">functions</span>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Enter an index notation expression and press Solve to see a full step-by-step solution.
                </p>
                <div className="mt-lg grid grid-cols-2 gap-sm w-full max-w-sm">
                  {[
                    "\\varepsilon_{ijk}\\varepsilon_{imn}",
                    "\\delta_{ii}",
                    "a_i b_i",
                    "\\varepsilon_{ijk} A_{jk}",
                  ].map((ex) => (
                    <button
                      key={ex}
                      onClick={() => setExpression(ex)}
                      className="bg-surface-container hover:bg-surface-container-high rounded-lg px-sm py-xs transition-colors overflow-x-auto"
                    >
                      <KaTeXRenderer math={ex} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="glass-panel rounded-xl p-xl flex flex-col items-center justify-center min-h-[300px] text-center">
                <span className="material-symbols-outlined text-[64px] text-primary animate-pulse mb-md">functions</span>
                <p className="font-body-md text-body-md text-on-surface-variant">Solving...</p>
              </div>
            )}

            {result && (
              <>
                {/* Classification */}
                <div className="glass-panel rounded-xl p-xl">
                  <h2 className="font-headline-md text-headline-md text-on-surface mb-md">
                    Expression Classification
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-sm">
                    {(
                      [
                        ["Expression Type", result.classification.expressionType],
                        ["Problem Category", result.classification.problemCategory],
                        ["Indices Present", result.classification.indicesPresent],
                        ["Tensor Rank", result.classification.tensorRank],
                        ["Dimension", result.classification.dimension],
                        ["Conventions", result.classification.conventions],
                      ] as [string, string][]
                    ).map(([label, value]) => (
                      <div key={label} className="bg-surface-container rounded-lg p-md">
                        <p className="font-label-md text-label-md text-on-surface-variant mb-xs">{label}</p>
                        <p className="font-body-md text-body-md text-on-surface">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Result */}
                <div className="glass-panel rounded-xl p-xl">
                  <h2 className="font-headline-md text-headline-md text-on-surface mb-md">Result</h2>
                  <div className="bg-surface-container-lowest rounded-lg px-lg py-md overflow-x-auto">
                    <KaTeXRenderer math={result.result} display />
                  </div>
                </div>

                {/* Step-by-step */}
                <div className="glass-panel rounded-xl p-xl">
                  <h2 className="font-headline-md text-headline-md text-on-surface mb-lg">
                    Step-by-Step Solution
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
                    Tips for Index Notation
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
                        onClick={() => setExpression(q.expression)}
                        className="text-left bg-surface-container hover:bg-surface-container-high rounded-lg px-md py-sm transition-colors group"
                      >
                        <div className="flex items-center justify-between mb-xs">
                          <span className={`font-label-md text-label-md border rounded-full px-sm py-[2px] ${difficultyColor[q.difficulty]}`}>
                            {q.difficulty}
                          </span>
                          <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:text-primary transition-colors">north_east</span>
                        </div>
                        <div className="overflow-x-auto mb-xs">
                          <KaTeXRenderer math={q.expression} display />
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

export default IndexNotationLab;