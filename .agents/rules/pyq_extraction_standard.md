# PYQ Extraction & Question Bank Upload Standard

Whenever the user provides an exam paper (PDF, images, text, or OCR) for CSIR NET, GATE (Botany, Zoology, Biochemistry, Chemistry, etc.), DBT BET, or other exams, follow this automated workflow:

## 1. Directory & File Naming Structure
- All JSON files are stored under:
  `public/repository/pyq/<exam>/<subject_or_category>/<Chapter or Year Name>.json`
  - Examples:
    - `public/repository/pyq/gate/chemistry/Atomic Structure and Periodicity.json`
    - `public/repository/pyq/gate/botany/Plant Anatomy.json`
    - `public/repository/pyq/gate/biochemistry/Metabolism.json`
    - `public/repository/pyq/csir_net/2024_june_shift1.json`

## 2. Standard Question JSON Schema
Each question object MUST strictly adhere to this schema:
```json
{
  "id": 1,
  "question": "Question text with clear Unicode math/chemical symbols (e.g. H₂O, Fe³⁺, ΔG°, α, β).",
  "options": [
    "Option 1",
    "Option 2",
    "Option 3",
    "Option 4"
  ],
  "correct_answer": "Exact matching string from options array",
  "explanation": "[CONCEPT]\nStep 1: First logical explanation step...\nStep 2: Mathematical formula or mechanism...\nStep 3: Concluding answer reason."
}
```

### Critical Rules:
1. **4 Options Always**: Every question must have exactly 4 choices in the `options` array. If the original question was Numerical Answer Type (NAT) or Fill-in-the-Blanks, synthesize 4 clean, distinct options including the correct answer.
2. **Strict Matching**: `correct_answer` MUST be an exact character-for-character match with one of the entries in `options`.
3. **Structured Explanations**: Always start with `[CONCEPT]` and provide step-by-step numbered lines (`Step 1:`, `Step 2:`, etc.) for clean rendering by the `StructuredExplanation` UI component.
4. **Rich Typography & Math**: Use proper Unicode superscripts/subscripts (e.g. ⁰¹²³⁴⁵⁶⁷⁸⁹, ₀₁₂₃₄₅₆₇₈₉, ⁺, ⁻, ⇌, →, ∝, Δ, π, μ, ℏ) rather than raw broken OCR glyphs.

## 3. Paper Registration
Always register any new papers in `src/lib/pyqRepository.ts` under `AVAILABLE_PAPERS`:
```typescript
{ exam: '<exam>', year: '<subject_or_category>/<Chapter Name>' },
```

## 4. Automation Helper
Use `scripts/pyq_importer.py` to validate and write JSON files and keep `pyqRepository.ts` synchronized automatically.
