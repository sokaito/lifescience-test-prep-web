import os
import json
import re
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

json_dir = r"c:\Users\sahus\Downloads\stitch\lifescience-test-prep\public\repository\pyq\csir_net"
files = [f for f in os.listdir(json_dir) if f.endswith('.json')]

# Matches statement lines like "A. ", "B) ", "C- ", "a. " etc.
statement_start_pat = re.compile(r'^\s*([A-Ea-e])\s*[\.\-\u2013\u2014\u2022\xb7\)]\s+(.+)$')

# Patterns that indicate the statement block has ended (concluding questions, explanations, options, etc.)
conclude_pat = re.compile(
    r'^\s*('
    r'[1-9]\d*[\.\)\s]'                     # Numbered options like "1. ", "2) "
    r'|Which|Choose|Based|Column|Match|Question|Answer'
    r'|Select|Identify|Find|Show|Determine|What|Correct|Incorrect|Only'
    r'|The|This|If|In|As|Since|Therefore|Hence|Thus'
    r'|Statements|Unlike|An|A\b|During|Here|On|At|By|From|About|Under|After|Before'
    r'|Among|Assuming|Although|All|Both|Note|Given|For|So|Now|Then|However|Moreover'
    r'|Furthermore|Additionally|Consequently|Nevertheless|F\.'   # Explanation lines like "F. "
    r'|Source|Experiment|Consider|With|Without|Option|each|Nomenclature'
    r'|Using|Whether|When|Where|Why|How|Who|Some|Many|Most|Such|No|Not'
    r'|Normal|Cancer|Actively|High|Low|Red|This|These|Those|Its|Their'
    r')',
    re.IGNORECASE
)


def format_statement_questions(text):
    if not text:
        return ""

    # Pre-clean known garbage/header lines
    lines = []
    for line in text.split('\n'):
        line_clean = line.strip()
        if not line_clean:
            continue
        # Skip page marker lines
        if re.match(r'^===\s*Page\s*\d+\s*===', line_clean):
            continue
        # Skip Pathfinder Academy watermark lines
        if "Pathfinder Academy" in line_clean or "9818063394" in line_clean:
            continue
        lines.append(line_clean)

    new_lines = []
    in_statement_block = False
    statement_block_lines = []

    i = 0
    while i < len(lines):
        line = lines[i]
        m = statement_start_pat.match(line)
        if m:
            letter = m.group(1).upper()
            content = m.group(2).strip()

            # Look ahead to collect multi-line statement content
            stmt_text = content
            j = i + 1
            while j < len(lines):
                next_line = lines[j].strip()
                # Next statement starts -> stop
                if statement_start_pat.match(next_line):
                    break
                # Concluding question/explanation pattern -> stop
                if conclude_pat.match(next_line):
                    break
                # If first character is uppercase and line is reasonably long, likely a new sentence -> stop
                if next_line and next_line[0].isupper() and len(next_line) > 20:
                    break
                stmt_text += " " + next_line
                j += 1

            statement_block_lines.append((letter, stmt_text.strip()))
            i = j
            in_statement_block = True
        else:
            if in_statement_block:
                # Only emit HTML block if there are at least 2 statements (avoid false positives)
                if len(statement_block_lines) >= 2:
                    html_block = '<div class="my-4 space-y-2 pl-4 border-l-2 border-slate-200 dark:border-slate-700">'
                    for letter, content in statement_block_lines:
                        html_block += (
                            f'<div class="flex items-start gap-2">'
                            f'<span class="font-bold shrink-0 text-teal-600 dark:text-teal-400">{letter}.</span>'
                            f'<span>{content}</span>'
                            f'</div>'
                        )
                    html_block += '</div>'
                    new_lines.append(html_block)
                else:
                    # Single statement — emit as plain text
                    for letter, content in statement_block_lines:
                        new_lines.append(f"{letter}. {content}")

                statement_block_lines = []
                in_statement_block = False

            new_lines.append(line)
            i += 1

    # Flush any remaining statement block at end of text
    if in_statement_block and statement_block_lines:
        if len(statement_block_lines) >= 2:
            html_block = '<div class="my-4 space-y-2 pl-4 border-l-2 border-slate-200 dark:border-slate-700">'
            for letter, content in statement_block_lines:
                html_block += (
                    f'<div class="flex items-start gap-2">'
                    f'<span class="font-bold shrink-0 text-teal-600 dark:text-teal-400">{letter}.</span>'
                    f'<span>{content}</span>'
                    f'</div>'
                )
            html_block += '</div>'
            new_lines.append(html_block)
        else:
            for letter, content in statement_block_lines:
                new_lines.append(f"{letter}. {content}")

    return "\n".join(new_lines)


total_questions_formatted = 0
total_files_modified = 0

for filename in sorted(files):
    path = os.path.join(json_dir, filename)
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    file_count = 0
    modified = False
    for q in data:
        original = q.get("question", "")
        formatted = format_statement_questions(original)
        if formatted != original:
            q["question"] = formatted
            file_count += 1
            modified = True

    if modified:
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        total_files_modified += 1

    total_questions_formatted += file_count
    print(f"[{'MODIFIED' if modified else 'UNCHANGED'}] {filename}: {file_count} questions formatted.")

print()
print(f"Done! {total_questions_formatted} questions formatted across {total_files_modified} files.")
