/**
 * Utility function to shuffle an array in place (returns a new shuffled array)
 */
export function shuffleArray<T>(array: T[]): T[] {
  if (!array || !Array.isArray(array)) return [];
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Standardizes a string for comparison by trimming and converting to lowercase.
 */
export function normalizeString(val: string | null | undefined): string {
  return (val || "").toString().trim().toLowerCase();
}

/**
 * Compares a user's answer with the correct answer, supporting wildcards (*), case-insensitivity, and numerical equivalence.
 */
export function compareAnswers(user: string | null | undefined, correct: string | null | undefined): boolean {
  const normUser = (user || "").toString().trim().toLowerCase();
  const normCorrect = (correct || "").toString().trim().toLowerCase();
  
  if (!normCorrect) return false;
  if (normCorrect === "*") return normUser !== "";
  if (normUser === normCorrect) return true;
  
  // Try numerical comparison
  const userNum = parseFloat(normUser);
  const correctNum = parseFloat(normCorrect);
  if (!isNaN(userNum) && !isNaN(correctNum)) {
    return userNum === correctNum;
  }
  
  return false;
}

function parseLetteredItems(str: string): string[] {
  const items: string[] = [];
  const regex = /\b([P-Zp-z])[\.\-\)]\s*(.+?)(?=\s*[P-Zp-z][\.\-\)]\s*|Column\s*II|$)/gi;
  let match;
  while ((match = regex.exec(str)) !== null) {
    let content = match[2].trim();
    if (content.endsWith(',') || content.endsWith('.')) {
      content = content.slice(0, -1).trim();
    }
    items.push(content);
  }
  return items;
}

function parseNumberedItems(str: string): string[] {
  const items: string[] = [];
  const regex = /\b(\d+)[\.\-\)]\s*(.+?)(?=\s*\d+[\.\-\)]\s*|$)/gi;
  let match;
  while ((match = regex.exec(str)) !== null) {
    let content = match[2].trim();
    if (content.endsWith(',') || content.endsWith('.')) {
      content = content.slice(0, -1).trim();
    }
    items.push(content);
  }
  return items;
}

export interface ParsedMatchQuestion {
  preamble: string;
  list_1: string[];
  list_2: string[];
}

/**
 * Parses a Column I and Column II match question at runtime into dynamic list components.
 */
export function parseColumnMatchQuestion(qText: string): ParsedMatchQuestion | null {
  if (!qText) return null;
  const lowerText = qText.toLowerCase();
  const col1Match = qText.match(/column\s*i\s*(?::|\b\s*[P-Zp-z]\.)/i);
  const col2Match = qText.match(/column\s*ii\s*(?::|\b\s*\d)/i);

  if (!col1Match || !col2Match) {
    return null;
  }

  const col1Idx = col1Match.index;
  const col2Idx = col2Match.index;

  if (col1Idx === undefined || col2Idx === undefined || col1Idx > col2Idx) {
    return null;
  }

  const preamble = qText.substring(0, col1Idx).trim();
  const col1Str = qText.substring(col1Idx, col2Idx).trim();
  const col2Str = qText.substring(col2Idx).trim();

  const list_1 = parseLetteredItems(col1Str);
  const list_2 = parseNumberedItems(col2Str);

  if (list_1.length === 0 || list_2.length === 0) {
    return null;
  }

  return { preamble, list_1, list_2 };
}


