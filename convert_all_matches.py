import json
import glob
import os
import re

files = glob.glob("public/repository/pyq/**/*.json", recursive=True)
print(f"Auditing and converting match questions in {len(files)} files...")

def roman_to_int(r):
    r = r.lower().strip()
    mapping = {'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5, 'vi': 6}
    return mapping.get(r, 0)

def int_to_roman(val):
    mapping = {1: 'i', 2: 'ii', 3: 'iii', 4: 'iv', 5: 'v', 6: 'vi'}
    return mapping.get(val, '')

total_converted = 0

for fpath in files:
    with open(fpath, "r", encoding="utf-8") as f:
        qs = json.load(f)
    
    modified = False
    for q in qs:
        # Check if type is match_following or match_pairs exists
        is_old_match = (q.get("type") == "match_following") or ("match_pairs" in q)
        
        # Or if list_1/list_2 exist but are empty and correct_answer is match-like
        is_empty_list_match = (q.get("type") == "match_following_mcq" and (not q.get("list_1") or not q.get("list_2")))
        
        if is_old_match or is_empty_list_match:
            correct_ans = q.get("correct_answer", "")
            # Pattern like "A-iii, B-i, C-ii, D-iv"
            match_pattern = re.findall(r"([A-F])\s*-\s*([i|v|x]+)", correct_ans, re.IGNORECASE)
            
            if not match_pattern and q.get("match_pairs"):
                # Try simple match pairs from match_pairs
                # Let's see if we can construct list_1 and list_2
                pairs = q["match_pairs"]
                list_1 = list(pairs.keys())
                list_2 = list(pairs.values())
                # Correct answer can be constructed as A-i, B-ii, etc.
                correct_ans = ", ".join([f"{chr(65+idx)}-{int_to_roman(idx+1)}" for idx in range(len(list_1))])
                match_pattern = re.findall(r"([A-F])\s*-\s*([i|v|x]+)", correct_ans, re.IGNORECASE)
            
            if match_pattern:
                # Reconstruct lists
                # list_1 has LHS items in order A, B, C, D
                # list_2 will be ordered based on the roman indices in correct_answer
                # Let's extract LHS and RHS
                if q.get("match_pairs"):
                    pairs = q["match_pairs"]
                    lhs_items = list(pairs.keys())
                    # Ensure list_2 has correct size
                    rhs_items = [""] * len(lhs_items)
                    
                    for lhs_idx, (letter, roman) in enumerate(match_pattern):
                        letter_idx = ord(letter.upper()) - 65
                        roman_idx = roman_to_int(roman) - 1
                        if 0 <= letter_idx < len(lhs_items) and 0 <= roman_idx < len(rhs_items):
                            # The pair is lhs_items[letter_idx] matches to rhs_items[roman_idx]
                            pair_value = pairs.get(lhs_items[letter_idx])
                            if pair_value:
                                rhs_items[roman_idx] = pair_value
                    
                    # Fill any empty slots
                    for idx, val in enumerate(rhs_items):
                        if not val and list(pairs.values()):
                            rhs_items[idx] = list(pairs.values())[idx % len(pairs)]
                    
                    q["list_1"] = lhs_items
                    q["list_2"] = rhs_items
                else:
                    # If we don't have match_pairs but we have some options/question text containing lists
                    # Check if the question text has lettered/numbered items we can parse
                    from inspect_dbt import structured
                    # Try to parse list_1 and list_2 from question text
                    # We can use regex to find P., Q., R., S. or A., B., C., D. in question text
                    pass
                
                # Check if we successfully reconstructed list_1 and list_2
                if q.get("list_1") and q.get("list_2"):
                    # Generate options
                    # Option (a) should be the correct answer
                    correct_choice_str = ", ".join([f"{letter}-{roman}" for letter, roman in match_pattern])
                    
                    # Options
                    opts = [
                        f"(a) {correct_choice_str}",
                        f"(b) " + ", ".join([f"{letter}-{int_to_roman((roman_to_int(roman)) % 4 + 1)}" for letter, roman in match_pattern]),
                        f"(c) " + ", ".join([f"{letter}-{int_to_roman((roman_to_int(roman) + 1) % 4 + 1)}" for letter, roman in match_pattern]),
                        f"(d) " + ", ".join([f"{letter}-{int_to_roman((roman_to_int(roman) + 2) % 4 + 1)}" for letter, roman in match_pattern]),
                    ]
                    
                    q["options"] = opts
                    q["correct_answer"] = opts[0]
                    q["type"] = "match_following_mcq"
                    # Clean up old fields
                    if "match_pairs" in q:
                        del q["match_pairs"]
                        
                    total_converted += 1
                    modified = True
    
    if modified:
        with open(fpath, "w", encoding="utf-8") as f:
            json.dump(qs, f, indent=2, ensure_ascii=False)

print(f"Total old/empty match questions converted: {total_converted}")
