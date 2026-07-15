from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
import re
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
)


def fix_latex_escapes(raw: str) -> str:
    def double_backslashes_in_string(m: re.Match) -> str:
        content = m.group(1)
        fixed = re.sub(r'(?<!\\)\\(?!\\)', r'\\\\', content)
        return f'"{fixed}"'
    return re.sub(r'"((?:[^"\\]|\\.)*)"', double_backslashes_in_string, raw)


# ─── Perturbation endpoint ────────────────────────────────────────────────────

PERTURBATION_SYSTEM_PROMPT = """You are an expert applied mathematics tutor specialising in perturbation methods for ODEs. Return a SINGLE JSON object with no markdown, no backticks, no extra text, with EXACTLY this shape:

{
  "classification": {
    "type": "...",
    "linearity": "...",
    "order": "...",
    "homogeneity": "...",
    "autonomy": "...",
    "degree": "..."
  },
  "method": "...",
  "breakdownEstimate": "...",
  "breakdownReason": "...",
  "steps": [
    {
      "title": "short step title",
      "explanation": "plain-English explanation of what this step does and WHY",
      "latex": "valid KaTeX string"
    }
  ],
  "explanation": "comprehensive plain-English summary",
  "tips": ["tip 1", "tip 2", "tip 3"],
  "similarQuestions": [
    { "equation": "valid KaTeX", "difficulty": "Easy", "hint": "one sentence" },
    { "equation": "valid KaTeX", "difficulty": "Medium", "hint": "one sentence" },
    { "equation": "valid KaTeX", "difficulty": "Hard", "hint": "one sentence" },
    { "equation": "valid KaTeX", "difficulty": "More Difficult", "hint": "one sentence" }
  ]
}

CRITICAL: ALL backslashes in LaTeX must be DOUBLED in JSON strings. Write \\\\frac not \\frac, \\\\varepsilon not \\varepsilon.

CLASSIFICATION:
- type: e.g. "Second-order ODE"
- linearity: "Linear" or "Nonlinear" or "Nonlinear (linear when epsilon=0)"
- order: "First", "Second", etc.
- homogeneity: "Homogeneous" or "Non-homogeneous"
- autonomy: "Autonomous" or "Non-autonomous"
- degree: integer degree of the ODE

DERIVATION — BE COMPLETELY EXHAUSTIVE, show every single algebraic step:
1. Identify and classify the small parameter
2. Write the perturbation ansatz y = y0 + eps*y1 + eps^2*y2 + ... up to requested order
3. Compute ALL derivatives of the ansatz term by term explicitly
4. Substitute into the ODE and expand every product fully
5. Collect and group ALL terms by order of epsilon
6. For each order from O(1) up to requested max order:
   a. Write the sub-problem ODE explicitly
   b. Show every step of solving including integration constants
   c. Apply initial conditions showing all substitution algebra
   d. State the fully solved yn explicitly
7. Assemble the full composite solution
8. For numeric epsilon: substitute the value and simplify
9. Compute validity condition |eps*y1/y0| and derive breakdown point algebraically
10. State the breakdown estimate clearly

BREAKDOWN: give a specific numerical or algebraic x or t value where approximation fails.
SIMILAR QUESTIONS: exactly 4, one per difficulty. All equations in valid KaTeX with doubled backslashes.
Return ONLY the JSON."""


class SolveRequest(BaseModel):
    equation: str
    epsilon: str
    epsilonMode: str
    y0: str
    yPrime0: str
    maxOrder: int


@app.get("/")
def health_check():
    return {"status": "CAMLab backend running"}


@app.post("/api/solve")
async def solve(req: SolveRequest):
    epsilon_desc = (
        f"epsilon = {req.epsilon} (use this numeric value throughout)"
        if req.epsilonMode == "numeric"
        else "epsilon is a small symbolic parameter (keep it symbolic)"
    )
    order_desc = (
        "Solve to O(1) only"
        if req.maxOrder == 0
        else f"Solve up to and including O(epsilon^{req.maxOrder}), computing "
        + ", ".join([f"y{i}" for i in range(req.maxOrder + 1)])
    )

    user_message = f"""Solve this ODE using perturbation methods:

Equation: {req.equation}
{epsilon_desc}
Initial conditions: y(0) = {req.y0}, y'(0) = {req.yPrime0}
{order_desc}

Remember: ALL LaTeX backslashes must be doubled in JSON output.
Return the complete JSON solution."""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": PERTURBATION_SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.2,
            max_tokens=4000,
        )

        raw = response.choices[0].message.content.strip()

        if "```" in raw:
            parts = raw.split("```")
            for part in parts:
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:].strip()
                if part.startswith("{"):
                    raw = part
                    break
        raw = raw.strip()

        try:
            result = json.loads(raw)
        except json.JSONDecodeError:
            fixed = fix_latex_escapes(raw)
            result = json.loads(fixed)

        return result

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Model returned invalid JSON: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Index Notation endpoint ──────────────────────────────────────────────────

INDEX_NOTATION_SYSTEM_PROMPT = """You are an expert applied mathematics tutor specialising in index notation, Einstein summation convention, tensor algebra, and vector identities. Return a SINGLE JSON object with no markdown, no backticks, no extra text, with EXACTLY this shape:

{
  "classification": {
    "expressionType": "...",
    "problemCategory": "...",
    "indicesPresent": "...",
    "tensorRank": "...",
    "dimension": "...",
    "conventions": "..."
  },
  "result": "final result as valid KaTeX string",
  "steps": [
    {
      "title": "short step title",
      "explanation": "plain-English explanation of what this step does and WHY",
      "latex": "valid KaTeX string"
    }
  ],
  "explanation": "comprehensive plain-English summary",
  "tips": ["tip 1", "tip 2", "tip 3"],
  "similarQuestions": [
    { "expression": "valid KaTeX", "difficulty": "Easy", "hint": "one sentence" },
    { "expression": "valid KaTeX", "difficulty": "Medium", "hint": "one sentence" },
    { "expression": "valid KaTeX", "difficulty": "Hard", "hint": "one sentence" },
    { "expression": "valid KaTeX", "difficulty": "More Difficult", "hint": "one sentence" }
  ]
}

CRITICAL: ALL backslashes in LaTeX must be DOUBLED in JSON strings. Write \\\\varepsilon not \\varepsilon, \\\\delta not \\delta.

CLASSIFICATION:
- expressionType: e.g. "Levi-Civita contraction", "Kronecker delta trace", "Vector identity"
- problemCategory: "Simplification", "Identity Proof", "Full Expansion", or "Delta/Epsilon Manipulation"
- indicesPresent: e.g. "Free: j,k — Dummy: i"
- tensorRank: e.g. "Scalar (rank 0)", "Vector (rank 1)", "Rank-2 tensor"
- dimension: e.g. "3D", "2D", "n-dimensional"
- conventions: "Einstein summation convention" plus any other relevant conventions

DERIVATION — BE COMPLETELY EXHAUSTIVE:
For simplification: identify indices, state identity used, apply it explicitly, expand sums, collect terms.
For expansion: write every term in the sum explicitly with component values.
For identity proofs: start from LHS, apply identities step by step, arrive at RHS.
For delta/epsilon manipulation: state the identity, apply it, use delta contraction rules, simplify.

KEY IDENTITIES (always state which you are using):
- epsilon_ijk * epsilon_imn = delta_jm*delta_kn - delta_jn*delta_km
- epsilon_ijk * epsilon_ijk = 6 (3D)
- epsilon_ijk * epsilon_ijl = 2*delta_kl
- delta_ii = n (dimension)
- delta_ij * A_j = A_i
- epsilon_ijk = -epsilon_jik = -epsilon_ikj

SIMILAR QUESTIONS: exactly 4, one per difficulty. All in valid KaTeX with doubled backslashes.
Return ONLY the JSON."""


class IndexNotationRequest(BaseModel):
    expression: str
    problemType: str
    dimension: str
    context: str


@app.post("/api/index-notation")
async def solve_index_notation(req: IndexNotationRequest):
    problem_type_desc = {
        "simplify": "Simplify this index notation expression as far as possible",
        "prove": "Prove this identity using index notation",
        "expand": "Expand this expression to its full explicit form",
        "manipulate": "Perform the Kronecker delta and Levi-Civita manipulations",
    }.get(req.problemType, "Solve this index notation problem")

    user_message = f"""{problem_type_desc}:

Expression: {req.expression}
Dimension: {req.dimension}
{f"Additional context: {req.context}" if req.context.strip() else ""}

Remember: ALL LaTeX backslashes must be doubled in JSON output.
Return the complete JSON solution."""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": INDEX_NOTATION_SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.2,
            max_tokens=4000,
        )

        raw = response.choices[0].message.content.strip()

        if "```" in raw:
            parts = raw.split("```")
            for part in parts:
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:].strip()
                if part.startswith("{"):
                    raw = part
                    break
        raw = raw.strip()

        try:
            result = json.loads(raw)
        except json.JSONDecodeError:
            fixed = fix_latex_escapes(raw)
            result = json.loads(fixed)

        return result

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Model returned invalid JSON: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))