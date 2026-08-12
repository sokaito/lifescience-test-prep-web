"""
fix_match_following_v2.py  — re-runs on already-converted AND unconverted questions.

Re-converts already-converted ones to fix their noisy `question` field.
For unconverted ones (image-only table): marks them as match_following_mcq with
empty list_1/list_2 so the UI can show a graceful fallback.
"""

import os, json, re, sys
try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

JSON_DIR = r"c:\Users\sahus\Downloads\stitch\lifescience-test-prep\public\repository\pyq\csir_net"

# Strictly match Column X/Y or List I/II questions only
MATCH_Q_PAT = re.compile(
    r'\bcolumn\s+(x|y|i|ii)\b|'
    r'\blist\s+(i|ii|1|2)\b|'
    r'\bmatch\s+the\b|'
    r'\bmatch\s+each\b|'
    r'\bcorrectly\s+match\b|'
    r'\bmatches?\b.{0,30}\bbetween\b.{0,30}\bcolumn\b|'
    r'\bmatched.{0,30}column\b',
    re.IGNORECASE
)

# Patterns for questions that mention "row" and "column" but are NOT match-the-following
# (e.g. sudoku/grid puzzles, table-reading questions)
NOT_MATCH_PAT = re.compile(
    r'\bgrid\b|\bsudoku\b|\brow\s+and\s+column\b|\beach\s+row\b|\beach\s+column\b',
    re.IGNORECASE
)


# A row inside a <span>: "Left content  i. Right"
PAIR_IN_SPAN = re.compile(r'^(.*?)\s{1,}([ivxlIVXL\d]+)\.\s+(.+)$')

OPTION_LINE_PAT = re.compile(r'^\s*[1-4]\s*[\.\)]\s+')
RAW_ROW_PAT = re.compile(
    r'^\s*([A-Ea-e])\s*[\.\)]\s+(.+?)\s{2,}([ivxlIVXL\d]+)\s*[\.\)]\s+(.+)$'
)

LABELS = ['(a)', '(b)', '(c)', '(d)', '(e)']

JUNK_PATTERNS = [
    re.compile(r'^===\s*Page\s*\d+\s*==='),
    re.compile(r'Pathfinder Academy'),
    re.compile(r'9818063394'),
    re.compile(r'^Column\s+X\s+Column\s+Y\s*$', re.IGNORECASE),
]

def strip_html(text):
    return re.sub(r'<[^>]+>', '', text)

def is_junk(line):
    return any(p.search(line) for p in JUNK_PATTERNS)

def extract_from_html_divs(txt):
    """Pull list_1 / list_2 from the statement-formatter HTML divs."""
    span_content_pat = re.compile(r'<span>([^<]+)</span>')
    items = span_content_pat.findall(txt)
    list_1, list_2 = [], []
    for item in items:
        item = item.strip()
        m = PAIR_IN_SPAN.match(item)
        if m:
            list_1.append(m.group(1).strip())
            list_2.append(m.group(3).strip())
    return list_1, list_2

def build_clean_question(txt):
    """
    Remove the HTML div block and any table-header/junk lines.
    Keep the preamble and the concluding question.
    """
    # Strip the full <div>…</div> block
    div_pat = re.compile(r'<div class="my-4[^>]*>.*?</div>', re.DOTALL)
    clean = div_pat.sub('', txt)
    clean = re.sub(r'<[^>]+>', '', clean)

    lines = [l.strip() for l in clean.split('\n')]
    good = []
    for line in lines:
        if not line:
            continue
        if is_junk(line):
            continue
        # Drop leftover table-header lines like "Method (Column X) Description (Column Y)"
        if re.match(r'^\w.*\(Column\s+[XY]\)', line, re.IGNORECASE) and len(line) < 80:
            continue
        # Drop generic table headers (two or three capitalized words only, like "Protein modification Function")
        if re.match(r'^[A-Z][a-z]+(\s+[a-z]+)*\s+[A-Z][a-z]+(\s+[a-z]+)*$', line) and len(line) < 60:
            continue
        # Drop plain column header lines: "Column X  Column Y"
        if re.match(r'^Column\s+[XY1I]\s+Column\s+[XY2II]', line, re.IGNORECASE):
            continue
        # Drop raw row residues: "B.polySUMOylation ii. Membrane anchoring..."
        if re.match(r'^[A-E]\s*[\.\)]\s*\S+.*[ivxlIVXL\d]+\.\s+\S+', line):
            continue
        # Drop lines that are purely option-like (numeric option lines)
        if OPTION_LINE_PAT.match(line):
            continue
        good.append(line)

    return '\n'.join(good).strip()

def rewrite_options(options):
    new_opts = []
    for idx, opt in enumerate(options):
        clean = re.sub(r'^\s*[1-4][\.\)]\s*', '', str(opt)).strip()
        clean = re.sub(r'^\s*\([a-d]\)\s*', '', clean).strip()
        label = LABELS[idx] if idx < len(LABELS) else f'({idx+1})'
        new_opts.append(f'{label} {clean}')
    return new_opts

def rewrite_correct_answer(answer, old_options, new_options):
    answer_str = str(answer).strip()
    # Single letter A-D
    if re.match(r'^[A-D]$', answer_str):
        idx = ord(answer_str) - ord('A')
        if 0 <= idx < len(new_options):
            return new_options[idx]
    # Single digit
    if re.match(r'^[1-4]$', answer_str):
        idx = int(answer_str) - 1
        if 0 <= idx < len(new_options):
            return new_options[idx]
    # Match by text
    ans_clean = re.sub(r'^\s*([1-4][\.\)]|\([a-d]\))\s*', '', answer_str).strip()
    for i, opt in enumerate(old_options):
        opt_clean = re.sub(r'^\s*([1-4][\.\)]|\([a-d]\))\s*', '', str(opt)).strip()
        if opt_clean.lower() == ans_clean.lower() and i < len(new_options):
            return new_options[i]
    for opt in new_options:
        opt_clean = re.sub(r'^\s*\([a-d]\)\s*', '', opt).strip()
        if opt_clean.lower() == ans_clean.lower():
            return opt
    return answer

def process_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    modified = 0

    for q in data:
        txt = q.get('question', '')
        already_converted = q.get('type') == 'match_following_mcq'

        # Only process if it's a match question (detected from original text or already tagged)
        raw_text = strip_html(txt)
        if not already_converted:
            if not MATCH_Q_PAT.search(raw_text):
                continue
            # Exclude false positives like grid/sudoku questions
            if NOT_MATCH_PAT.search(raw_text):
                continue

        # Re-extract list_1 / list_2 from HTML divs (for already-converted or freshly detected)
        list_1 = q.get('list_1', [])
        list_2 = q.get('list_2', [])

        if not list_1 or not list_2:
            list_1, list_2 = extract_from_html_divs(txt)

        if not list_1 or not list_2:
            # Try raw text parsing
            clean_lines = [l.strip() for l in strip_html(txt).split('\n') if l.strip()]
            tmp_l1, tmp_l2 = [], []
            for line in clean_lines:
                m = RAW_ROW_PAT.match(line)
                if m:
                    tmp_l1.append(m.group(2).strip())
                    tmp_l2.append(m.group(4).strip())
            if len(tmp_l1) >= 2:
                list_1, list_2 = tmp_l1, tmp_l2

        # Build a clean question string
        new_question = build_clean_question(txt)

        # Options
        old_opts = q.get('options', [])
        options_are_letters = old_opts and all(re.match(r'^[A-D]$', str(o).strip()) for o in old_opts)
        if options_are_letters:
            new_opts = old_opts
            new_correct = q.get('correct_answer', '')
        else:
            new_opts = rewrite_options(old_opts)
            new_correct = rewrite_correct_answer(q.get('correct_answer', ''), old_opts, new_opts)

        # Apply
        q['type'] = 'match_following_mcq'
        q['question'] = new_question
        q['list_1'] = list_1 if list_1 else []
        q['list_2'] = list_2 if list_2 else []
        q['options'] = new_opts
        q['correct_answer'] = new_correct
        modified += 1

    if modified > 0:
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    return modified

files = sorted(f for f in os.listdir(JSON_DIR) if f.endswith('.json'))
total = 0
for fname in files:
    path = os.path.join(JSON_DIR, fname)
    n = process_file(path)
    total += n
    print(f"[{'MODIFIED' if n else 'UNCHANGED'}] {fname}: {n} updated")

print(f"\nDone. {total} match-the-following questions updated.")
