"""
PYQ Importer & Validator Utility
Allows easy ingestion, schema validation, registration, and build verification of question papers.
"""

import json
import os
import re
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO_DIR = os.path.join(BASE_DIR, "public", "repository", "pyq")
PYQ_REPO_FILE = os.path.join(BASE_DIR, "src", "lib", "pyqRepository.ts")

def validate_question(q, idx):
    errors = []
    if "id" not in q:
        q["id"] = idx + 1
    if not q.get("question") or not isinstance(q["question"], str):
        errors.append(f"Q{q.get('id')}: Missing or invalid 'question' string.")
    
    options = q.get("options", [])
    if not isinstance(options, list) or len(options) != 4:
        errors.append(f"Q{q.get('id')}: 'options' must be an array of exactly 4 strings. Found {len(options) if isinstance(options, list) else 0}.")
    
    correct_ans = q.get("correct_answer")
    if not correct_ans or correct_ans not in options:
        errors.append(f"Q{q.get('id')}: 'correct_answer' ('{correct_ans}') does not match any of the 4 options.")
    
    explanation = q.get("explanation", "")
    if not explanation or not isinstance(explanation, str):
        q["explanation"] = "[CONCEPT]\nStep 1: Refer to standard reference textbook explanation."
    elif not explanation.startswith("[CONCEPT]"):
        q["explanation"] = f"[CONCEPT]\n{explanation}"
    
    return errors

def import_paper(exam: str, subfolder: str, paper_name: str, questions: list):
    """
    Validates questions, writes JSON to public/repository/pyq/<exam>/<subfolder>/<paper_name>.json,
    and ensures it is registered in src/lib/pyqRepository.ts.
    """
    all_errors = []
    for idx, q in enumerate(questions):
        errs = validate_question(q, idx)
        all_errors.extend(errs)
    
    if all_errors:
        print(f"Validation found {len(all_errors)} issues:")
        for err in all_errors[:10]:
            print(f" - {err}")
        if len(all_errors) > 10:
            print(f" ... and {len(all_errors) - 10} more.")
        return False
    
    # Write JSON file
    target_dir = os.path.join(REPO_DIR, exam, subfolder) if subfolder else os.path.join(REPO_DIR, exam)
    os.makedirs(target_dir, exist_ok=True)
    target_file = os.path.join(target_dir, f"{paper_name}.json")
    
    with open(target_file, "w", encoding="utf-8") as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    print(f"Successfully saved: {target_file} ({len(questions)} questions)")
    
    # Register in pyqRepository.ts
    year_entry = f"{subfolder}/{paper_name}" if subfolder else paper_name
    register_paper(exam, year_entry)
    return True

def register_paper(exam: str, year: str):
    if not os.path.exists(PYQ_REPO_FILE):
        return
    with open(PYQ_REPO_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    
    entry = f"{{ exam: '{exam}', year: '{year}' }}"
    if entry in content:
        print(f"Already registered in pyqRepository.ts: {entry}")
        return
    
    # Insert before closing bracket of AVAILABLE_PAPERS
    pattern = r"(const AVAILABLE_PAPERS:.*?=\s*\[)([\s\S]*?)(\];)"
    match = re.search(pattern, content)
    if match:
        papers_block = match.group(2)
        new_papers_block = papers_block.rstrip() + f"\n  {entry},\n"
        new_content = content[:match.start(2)] + new_papers_block + content[match.start(3):]
        with open(PYQ_REPO_FILE, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Registered {entry} in pyqRepository.ts")

if __name__ == "__main__":
    print("PYQ Importer ready.")
