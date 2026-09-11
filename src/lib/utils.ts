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
  col1Header?: string;
  col2Header?: string;
}

/**
 * Automatically formats statement-based questions (P., Q., R., S.) and 
 * matching columns into clean point-by-point lines at runtime for future questions.
 */
export function formatQuestionStatements(qText: string): string {
  if (!qText || typeof qText !== "string") return qText;

  let text = qText.trim();

  // 1. Separate Group / Column / Medium / List headers with double newlines
  text = text.replace(/([^\n])\s*((?:Group|Column|Medium|List|Table)\s*I(?:\s*\([^)]+\))?\s*:)/gi, '$1\n\n$2');
  text = text.replace(/([^\n])\s*((?:Group|Column|Medium|List|Table)\s*II(?:\s*\([^)]+\))?\s*:)/gi, '$1\n\n$2');

  // 2. Format P. Q. R. S. (T.) items onto separate lines if clustered together
  if (/\bP\.\s+.+?\bQ\.\s+.+?\bR\.\s+.+?\bS\.\s+/.test(text)) {
    text = text.replace(/([^\n])\s*\bP\.\s+/g, '$1\n\nP. ');
    text = text.replace(/([^\n])\s*\bQ\.\s+/g, '$1\nQ. ');
    text = text.replace(/([^\n])\s*\bR\.\s+/g, '$1\nR. ');
    text = text.replace(/([^\n])\s*\bS\.\s+/g, '$1\nS. ');
    text = text.replace(/([^\n])\s*\bT\.\s+/g, '$1\nT. ');
    text = text.replace(/([^\n])\s*\bU\.\s+/g, '$1\nU. ');
  }

  // 3. Format 1. 2. 3. 4. items onto separate lines if clustered in matching / statement lists
  if (/(?:Group\s*II|Column\s*II|Medium\s*II|List\s*II|statements|features|properties|below|following)[\s\S]*?\b1\.\s+[\s\S]+?\b2\.\s+[\s\S]+?\b3\.\s+/i.test(text)) {
    text = text.replace(/([^\n])\s*\b1\.\s+/g, '$1\n1. ');
    text = text.replace(/([^\n])\s*\b2\.\s+/g, '$1\n2. ');
    text = text.replace(/([^\n])\s*\b3\.\s+/g, '$1\n3. ');
    text = text.replace(/([^\n])\s*\b4\.\s+/g, '$1\n4. ');
    text = text.replace(/([^\n])\s*\b5\.\s+/g, '$1\n5. ');
    text = text.replace(/([^\n])\s*\b6\.\s+/g, '$1\n6. ');
    text = text.replace(/([^\n])\s*\b7\.\s+/g, '$1\n7. ');
  }

  return text.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Parses Column/Group/Medium/List I and II match questions at runtime into dynamic list components.
 */
export function parseColumnMatchQuestion(qText: string): ParsedMatchQuestion | null {
  if (!qText) return null;

  const col1Regex = /((?:Column|Group|Medium|List|Table)\s*I(?:\s*\([^)]+\))?)\s*(?::|\b\s*[P-Zp-z]\.)/i;
  const col2Regex = /((?:Column|Group|Medium|List|Table)\s*II(?:\s*\([^)]+\))?)\s*(?::|\b\s*\d)/i;

  const col1Match = qText.match(col1Regex);
  const col2Match = qText.match(col2Regex);

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

  const col1Header = col1Match[1]?.trim() || "List I";
  const col2Header = col2Match[1]?.trim() || "List II";

  const list_1 = parseLetteredItems(col1Str);
  const list_2 = parseNumberedItems(col2Str);

  if (list_1.length === 0 || list_2.length === 0) {
    return null;
  }

  return { preamble, list_1, list_2, col1Header, col2Header };
}


