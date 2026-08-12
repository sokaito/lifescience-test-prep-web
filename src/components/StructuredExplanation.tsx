"use client";

import React from "react";
import { ClipboardList } from "lucide-react";

interface SolutionStructure {
  conceptText: string;
  givenData: string[];
  formulas: string[];
  steps: { title: string; text: string; math?: string }[];
  interpretation: string;
  finalAnswer: string;
  examTip: string;
  source: string;
}

export default function StructuredExplanation({ explanation }: { explanation: string }) {
  if (!explanation) return null;

  // 1. Parser to organize explanation text (supports tag-based and fallback regex)
  const parseSolution = (text: string): SolutionStructure => {
    const structure: SolutionStructure = {
      conceptText: "",
      givenData: [],
      formulas: [],
      steps: [],
      interpretation: "",
      finalAnswer: "",
      examTip: "",
      source: "",
    };

    const hasTags = /\[CONCEPT\]|\[GIVEN\]|\[FORMULA\]|\[STEPS\]|\[INTERPRETATION\]|\[ANSWER\]|\[TIP\]/i.test(text);

    if (hasTags) {
      // Split by section tags
      const sections = text.split(/\[(CONCEPT|GIVEN|FORMULA|STEPS|INTERPRETATION|ANSWER|TIP|SOURCE)\]/i);
      
      for (let i = 1; i < sections.length; i += 2) {
        const tag = sections[i].toUpperCase();
        const content = sections[i + 1].trim();
        if (!content) continue;

        switch (tag) {
          case "CONCEPT":
            structure.conceptText = content;
            break;
          case "GIVEN":
            structure.givenData = content
              .split("\n")
              .map(s => s.trim())
              .filter(Boolean)
              .map(s => s.replace(/^•\s*/, "").trim());
            break;
          case "FORMULA":
            // formula is optionally split by "||" for formula text and sub-description
            structure.formulas = content.split("||").map(s => s.trim()).filter(Boolean);
            break;
          case "STEPS":
            const stepBlocks = content.split(/Step\s*(\d+)\s*:\s*/i);
            for (let j = 1; j < stepBlocks.length; j += 2) {
              const stepNum = stepBlocks[j];
              const stepBody = stepBlocks[j + 1].trim();
              if (!stepBody) continue;

              const lines = stepBody.split("\n");
              const title = lines[0].trim();
              const math = lines.slice(1).join("\n").trim();
              structure.steps.push({
                title: title, // Use title directly
                text: "",
                math: math || undefined
              });
            }
            break;
          case "INTERPRETATION":
            structure.interpretation = content;
            break;
          case "ANSWER":
            structure.finalAnswer = content;
            break;
          case "TIP":
            structure.examTip = content;
            break;
          case "SOURCE":
            structure.source = content;
            break;
        }
      }
      return structure;
    }

    // FALLBACK REGEX PARSER (For unstructured plain text solutions)
    let cleaned = text.replace(/\r\n/g, "\n").trim();
    cleaned = cleaned.replace(/^[\t\s•\-\*]/gm, "•");
    
    const lines = cleaned.split("\n");
    const paragraphs: string[] = [];
    let currentParagraph = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        if (currentParagraph) {
          paragraphs.push(currentParagraph.trim());
          currentParagraph = "";
        }
        continue;
      }

      const isNewBlock = 
        /^(?:Source|Note|Warning|Tip|Exam Tip|Given|Formula|Step \d+|Therefore|Hence|Thus|However|Unlike|In contrast|kcat\s*=|\bE\s*=|\b[a-zA-Z]+\s*=\s*)/i.test(line) ||
        /^•/.test(line);

      if (isNewBlock) {
        if (currentParagraph) {
          paragraphs.push(currentParagraph.trim());
        }
        currentParagraph = line;
      } else {
        if (currentParagraph) {
          const lastChar = currentParagraph.trim().slice(-1);
          const isMathContinuation = /^[=\+\-\*\/]/.test(line) || /^[=\+\-\*\/]/.test(lastChar) || /\d$/.test(lastChar) && /^\d/.test(line);
          if (isMathContinuation) {
            currentParagraph += "\n" + line;
          } else {
            currentParagraph += " " + line;
          }
        } else {
          currentParagraph = line;
        }
      }
    }
    if (currentParagraph) {
      paragraphs.push(currentParagraph.trim());
    }

    let inGivenBlock = false;

    for (const para of paragraphs) {
      const lowerPara = para.toLowerCase();

      if (lowerPara.startsWith("source:")) {
        structure.source = para.replace(/^source\s*:\s*/i, "").trim();
        continue;
      }

      if (lowerPara.startsWith("exam tip:") || lowerPara.startsWith("tip:")) {
        structure.examTip = para.replace(/^(?:exam tip|tip)\s*:\s*/i, "").trim();
        continue;
      }
      if (lowerPara.startsWith("note:")) {
        structure.examTip = para.replace(/^note\s*:\s*/i, "").trim();
        continue;
      }

      if (lowerPara.startsWith("given:") || lowerPara.startsWith("given data:")) {
        inGivenBlock = true;
        const content = para.replace(/^given(?:\s+data)?\s*:\s*/i, "").trim();
        if (content) {
          const subLines = content.split(/[•\n]/).map(s => s.trim()).filter(Boolean);
          structure.givenData.push(...subLines);
        }
        continue;
      }

      if (para.startsWith("•")) {
        structure.givenData.push(para.replace(/^•\s*/, "").trim());
        continue;
      }

      if (inGivenBlock && /^[a-zA-Z0-9_𝜇𝑞𝑟𝐷\s\-\(\)]+\s*=\s*/.test(para) && para.length < 80) {
        structure.givenData.push(para);
        continue;
      }

      const isFormula = 
        /^(?:formula|principle|equation|law)\s*:/i.test(para) ||
        (/^[a-zA-Z_𝑞𝑟𝐷𝐸]+\s*=\s*[^=]+$/i.test(para) && (para.includes("/") || para.includes("*") || para.includes("⋅") || para.includes("vmax")) && para.length < 80);
      
      if (isFormula) {
        const formulaVal = para.replace(/^(?:formula|principle|equation|law)\s*:\s*/i, "").trim();
        structure.formulas.push(formulaVal);
        continue;
      }

      const stepMatch = para.match(/^step\s*(\d+)\s*:\s*(.*)$/i);
      if (stepMatch) {
        const stepNum = stepMatch[1];
        const stepContent = stepMatch[2].trim();
        
        const stepLines = stepContent.split("\n");
        const textLines: string[] = [];
        const mathLines: string[] = [];
        for (const line of stepLines) {
          if (/^[a-zA-Z_𝑞𝑟𝐷𝐸\s\-\(\)\d]+[=≈]/.test(line.trim())) {
            mathLines.push(line.trim());
          } else {
            textLines.push(line.trim());
          }
        }

        structure.steps.push({
          title: `Step ${stepNum}: ${textLines.join(" ")}`,
          text: "",
          math: mathLines.join("\n")
        });
        inGivenBlock = false;
        continue;
      }

      const isInterpretation = 
        /^(?:this indicates|this means|which means|hence|therefore|thus|a high|biologically|meaning that)\b/i.test(para);
      if (isInterpretation) {
        if (structure.interpretation) {
          structure.interpretation += "\n\n" + para;
        } else {
          structure.interpretation = para;
        }
        continue;
      }

      const isFinalAnswerCandidate = 
        /^(?:kcat|ans|answer|final|result|value|difference|ΔE)\s*[=≈:]/i.test(para) ||
        lowerPara.includes("final answer") ||
        lowerPara.includes("is closest to") ||
        lowerPara.startsWith("closest to");

      if (isFinalAnswerCandidate && para.length < 150) {
        structure.finalAnswer = para.replace(/^(?:final answer|answer|ans)\s*[:=]\s*/i, "").trim();
        continue;
      }

      const isMathCalculation = /^[a-zA-Z_𝑞𝑟𝐷𝐸\s\-\(\)\d≈]+[=≈]/.test(para);
      if (isMathCalculation && para.length < 200) {
        const stepIndex = structure.steps.length + 1;
        let text = "Calculation step.";
        let math = para;

        if (para.includes("must be") || para.includes("given") || para.includes("in molar")) {
          text = para;
          math = "";
        }

        structure.steps.push({
          title: text,
          text: "",
          math
        });
        inGivenBlock = false;
        continue;
      }

      if (para.length > 35) {
        if (structure.conceptText) {
          structure.conceptText += "\n\n" + para;
        } else {
          structure.conceptText = para;
        }
      }
    }

    if (!structure.conceptText && structure.steps.length > 0) {
      const first = structure.steps[0];
      if (first.text && !first.math) {
        structure.conceptText = first.text;
        structure.steps.shift();
      }
    }

    if (!structure.finalAnswer && structure.steps.length > 0) {
      const lastStep = structure.steps[structure.steps.length - 1];
      if (lastStep.math) {
        structure.finalAnswer = lastStep.math.split("\n").pop() || "";
      }
    }

    if (structure.finalAnswer) {
      structure.finalAnswer = structure.finalAnswer.replace(/^(?:hence|therefore|thus|so|consequently)[\s,]+/i, "").trim();
    }

    return structure;
  };

  const s = parseSolution(explanation);

  return (
    <div className="w-full bg-white dark:bg-slate-900 border-2 border-blue-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 transition-all duration-300 animate-in fade-in">
      
      {/* 📘 SOLUTION Header */}
      <div className="flex items-center space-x-2.5 pb-4 border-b border-blue-200 dark:border-slate-800">
        <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="font-black text-lg uppercase tracking-wider text-blue-700 dark:text-blue-400">SOLUTION</h3>
      </div>

      {/* 🧠 Concept / Explanation */}
      {s.conceptText && (
        <div className="bg-blue-50/20 dark:bg-blue-950/5 border border-blue-100 dark:border-slate-800 rounded-2xl p-5 space-y-2">
          <h4 className="flex items-center font-bold text-blue-700 dark:text-blue-400 text-sm tracking-tight gap-2">
            <span className="text-base select-none">🧠</span> Concept / Explanation
          </h4>
          <p 
            className="text-slate-600 dark:text-slate-300 text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-normal"
            dangerouslySetInnerHTML={{ __html: s.conceptText }}
          />
        </div>
      )}

      {/* 📌 Given & ⚖️ Formula Two-Column Grid */}
      {(s.givenData.length > 0 || s.formulas.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Given Data */}
          {s.givenData.length > 0 && (
            <div className="bg-green-50/10 dark:bg-emerald-950/5 border border-green-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col">
              <div>
                <h4 className="flex items-center font-bold text-green-700 dark:text-green-400 text-sm tracking-tight gap-2 mb-2">
                  <span>📋</span> Given Data / Information
                </h4>
                <ul className="space-y-2 text-xs md:text-sm text-slate-700 dark:text-slate-300 font-medium">
                  {s.givenData.map((data, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-slate-400 shrink-0 select-none">•</span>
                      <span dangerouslySetInnerHTML={{ __html: data }} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Formula */}
          {s.formulas.length > 0 && (
            <div className="bg-amber-50/10 dark:bg-amber-950/5 border border-amber-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="flex items-center font-bold text-amber-700 dark:text-amber-400 text-sm tracking-tight gap-2 mb-3">
                  <span>⚖️</span> Formula / Principle Used
                </h4>
                {/* Highlighted math box */}
                <div 
                  className="py-4 px-5 bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-800 rounded-xl text-center text-sm md:text-base text-slate-800 dark:text-slate-200 shadow-sm flex items-center justify-center font-semibold"
                  dangerouslySetInnerHTML={{ __html: s.formulas[0] }}
                />
                {s.formulas[1] && (
                  <p 
                    className="text-xs text-slate-500 dark:text-slate-400 leading-normal mt-3"
                    dangerouslySetInnerHTML={{ __html: s.formulas[1] }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🔹 Stepwise Solution */}
      {s.steps.length > 0 && (
        <div className="bg-purple-50/10 dark:bg-purple-950/5 border border-purple-100 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <h4 className="flex items-center font-bold text-purple-700 dark:text-purple-400 text-sm tracking-tight gap-2">
            <span>📋</span> Stepwise Solution
          </h4>
          <div className="flex flex-col">
            {s.steps.map((step, idx) => {
              const isLast = idx === s.steps.length - 1;
              return (
                <div key={idx} className="flex items-stretch">
                  {/* Left tracker dot & line */}
                  <div className="flex flex-col items-center mr-4">
                    <div className="w-7 h-7 rounded-full bg-purple-600 border border-white dark:border-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-sm shrink-0 select-none">
                      {idx + 1}
                    </div>
                    {!isLast && (
                      <div className="w-0.5 border-l-2 border-dashed border-purple-200 dark:border-purple-900/50 flex-1 my-2" />
                    )}
                  </div>
                  {/* Right content card */}
                  <div className="flex-1 pb-6 space-y-2">
                    <h5 className="font-bold text-purple-800 dark:text-purple-300 text-xs md:text-sm pt-0.5 leading-snug">
                      {step.title}
                    </h5>
                    {step.text && (
                      <p 
                        className="text-slate-600 dark:text-slate-300 text-xs md:text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: step.text }}
                      />
                    )}
                    {step.math && (
                      <div 
                        className="p-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs md:text-sm text-slate-800 dark:text-slate-200 shadow-sm overflow-x-auto max-w-full font-medium"
                        dangerouslySetInnerHTML={{ __html: step.math }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 🔍 Biological Interpretation / Logic */}
      {s.interpretation && (
        <div className="bg-blue-50/20 dark:bg-blue-950/5 border border-blue-100 dark:border-slate-800 rounded-2xl p-5 space-y-2">
          <h4 className="flex items-center font-bold text-blue-700 dark:text-blue-400 text-sm tracking-tight gap-2">
            <span className="text-base select-none">🔍</span> Biological Interpretation / Logic
          </h4>
          <p 
            className="text-slate-600 dark:text-slate-300 text-xs md:text-sm leading-relaxed font-normal italic"
            dangerouslySetInnerHTML={{ __html: s.interpretation }}
          />
        </div>
      )}

      {/* ✅ Final Answer */}
      <div className="bg-green-50/10 dark:bg-emerald-950/5 border border-green-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-center items-center">
        <h4 className="flex items-center justify-center font-black text-green-700 dark:text-green-400 text-xs uppercase tracking-widest gap-2">
          <span>✅</span> Final Answer
        </h4>
        <div className="flex justify-center w-full">
          <div 
            className="inline-block py-3.5 px-8 bg-white dark:bg-slate-900 border border-green-500 dark:border-green-800/80 rounded-xl font-bold text-lg md:text-2xl text-slate-800 dark:text-slate-100 shadow-sm text-center min-w-[200px]"
            dangerouslySetInnerHTML={{ __html: s.finalAnswer || "Correct Answer Confirmed" }}
          />
        </div>
      </div>

      {/* 💡 Exam Tip (Optional) */}
      {s.examTip && (
        <div className="bg-amber-50/20 dark:bg-amber-950/5 border border-dashed border-amber-200 dark:border-slate-800 rounded-2xl p-5 flex items-start space-x-3 text-xs md:text-sm text-slate-500 dark:text-slate-400">
          <span className="text-base select-none">💡</span>
          <div>
            <span className="font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest text-[10px] block mb-1">Exam Tip</span>
            <p 
              className="leading-relaxed font-medium"
              dangerouslySetInnerHTML={{ __html: s.examTip }}
            />
          </div>
        </div>
      )}

      {/* Source Reference Badge */}
      {s.source && (
        <div className="flex flex-wrap items-center gap-1.5 pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] md:text-xs">
          <span className="text-slate-500 font-black uppercase tracking-widest opacity-60 mr-1 select-none">Source:</span>
          <span className="px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-slate-700 dark:text-slate-300 font-bold transition-all hover:bg-slate-100 dark:hover:bg-slate-800">
            {s.source}
          </span>
        </div>
      )}

    </div>
  );
}
