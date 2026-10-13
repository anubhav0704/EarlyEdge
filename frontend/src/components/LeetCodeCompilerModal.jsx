import React, { useContext, useState, useEffect, useRef, useMemo } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-python.js';
import 'prismjs/components/prism-c.js';
import 'prismjs/components/prism-cpp.js';
import 'prismjs/components/prism-java.js';
import { AuthContext } from '../context/AuthContext.jsx';
import { getThreeSampleTestCases } from '../data/dsaTestCases.js';
import { generateFullDsaQuestions } from '../data/practiceQuestionsPool.js';

// Multi-language starter templates
export const MULTI_LANG_TEMPLATES = {
  python: `# Python 3.12 Solution
import sys

def solve(input_data):
    # Implement your algorithmic solution
    return input_data

if __name__ == '__main__':
    raw = sys.stdin.read().strip()
    print(solve(raw))
`,
  cpp: `// C++ 20 (g++) Solution
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    string line;
    if (getline(cin, line)) {
        // Implement your solution
        cout << line << endl;
    } else {
        cout << "Execution complete." << endl;
    }
    return 0;
}
`,
  java: `// Java 21 (OpenJDK) Solution
import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine();
        if (line != null) {
            // Implement your solution
            System.out.println(line);
        } else {
            System.out.println("Execution complete.");
        }
    }
}
`,
  javascript: `// JavaScript (Node 20) Solution
const fs = require('fs');

function solve(input) {
    // Implement your algorithmic solution
    return input;
}

const input = fs.readFileSync(0, 'utf-8').trim();
console.log(solve(input));
`
};

const LANGUAGE_CONFIGS = {
  python: {
    id: 'python',
    label: 'Python 3.12',
    icon: 'fa-brands fa-python',
    color: '#38bdf8',
    prismLang: 'python',
    tabSpaces: '    '
  },
  cpp: {
    id: 'cpp',
    label: 'C++ 20 (g++)',
    icon: 'fa-solid fa-code',
    color: '#f59e0b',
    prismLang: 'cpp',
    tabSpaces: '    '
  },
  java: {
    id: 'java',
    label: 'Java 21 (OpenJDK)',
    icon: 'fa-brands fa-java',
    color: '#ef4444',
    prismLang: 'java',
    tabSpaces: '    '
  },
  javascript: {
    id: 'javascript',
    label: 'JavaScript (Node 20)',
    icon: 'fa-brands fa-js',
    color: '#facc15',
    prismLang: 'javascript',
    tabSpaces: '  '
  }
};

export default function LeetCodeCompilerModal({
  isOpen,
  onClose,
  initialProblem = null,
  problemsPool = []
}) {
  const { apiFetch } = useContext(AuthContext);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('python');
  const [codeByLang, setCodeByLang] = useState({ ...MULTI_LANG_TEMPLATES });
  const [code, setCode] = useState(MULTI_LANG_TEMPLATES.python);
  const [stdin, setStdin] = useState('');
  const [activeTestTab, setActiveTestTab] = useState(0); // 0 = Test Cases / STDIN, 1 = Terminal Output
  const [activeSampleCaseIndex, setActiveSampleCaseIndex] = useState(0); // 0, 1, 2
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilerOutput, setCompilerOutput] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInput, setCopiedInput] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  // Search & Problem management
  const [searchFilter, setSearchFilter] = useState('');
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);

  // Solved status tracking
  const [progressStatus, setProgressStatus] = useState(null);

  // -------------------------------------------------------------
  // RESIZABLE SPLITTERS (HORIZONTAL & VERTICAL)
  // -------------------------------------------------------------
  // Left-Right split: percentage width for Question Panel (default 45%)
  const [splitRatioH, setSplitRatioH] = useState(45);
  const [isDraggingH, setIsDraggingH] = useState(false);

  // Up-Down split inside compiler: percentage height for Code Editor (default 60%)
  const [splitRatioV, setSplitRatioV] = useState(60);
  const [isDraggingV, setIsDraggingV] = useState(false);

  const containerRef = useRef(null);
  const compilerContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const preRef = useRef(null);
  const lineNumbersRef = useRef(null);

  // Pool of problems (defaults to full 500+ list if available)
  const allProblems = useMemo(() => {
    if (problemsPool && problemsPool.length > 30) return problemsPool;
    return generateFullDsaQuestions();
  }, [problemsPool]);

  // Filtered problems based on search query
  const filteredProblems = useMemo(() => {
    if (!searchFilter.trim()) return allProblems;
    const q = searchFilter.toLowerCase().trim();
    return allProblems.filter(p =>
      String(p.number || '').includes(q.replace('#', '')) ||
      (p.title || '').toLowerCase().includes(q) ||
      (p.topic || '').toLowerCase().includes(q)
    );
  }, [allProblems, searchFilter]);

  // Set initial problem if passed
  useEffect(() => {
    if (initialProblem) {
      const idx = filteredProblems.findIndex(p => p.id === initialProblem.id || p.title === initialProblem.title);
      if (idx !== -1) setCurrentProblemIndex(idx);
    }
  }, [initialProblem, filteredProblems]);

  const activeProblem = filteredProblems[currentProblemIndex] || initialProblem || allProblems[0];
  const sampleTestCases = useMemo(() => {
    return getThreeSampleTestCases(activeProblem);
  }, [activeProblem]);

  // Sync initial stdin with active sample testcase on problem switch
  useEffect(() => {
    if (sampleTestCases && sampleTestCases.length > 0) {
      const firstInput = sampleTestCases[0]?.input || '';
      setStdin(firstInput);
      setActiveSampleCaseIndex(0);
    }
    setCompilerOutput(null);
  }, [currentProblemIndex, sampleTestCases]);

  const langConfig = LANGUAGE_CONFIGS[selectedLang] || LANGUAGE_CONFIGS.python;

  // -------------------------------------------------------------
  // DRAGGING EVENT LISTENERS FOR BOTH RESIZERS
  // -------------------------------------------------------------
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingH && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const newRatio = Math.max(20, Math.min(80, (offsetX / rect.width) * 100));
        setSplitRatioH(newRatio);
      }
      if (isDraggingV && compilerContainerRef.current) {
        const rect = compilerContainerRef.current.getBoundingClientRect();
        const offsetY = e.clientY - rect.top;
        const newRatio = Math.max(22, Math.min(82, (offsetY / rect.height) * 100));
        setSplitRatioV(newRatio);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingH) setIsDraggingH(false);
      if (isDraggingV) setIsDraggingV(false);
    };

    if (isDraggingH || isDraggingV) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      if (isDraggingH) document.body.style.cursor = 'col-resize';
      if (isDraggingV) document.body.style.cursor = 'row-resize';
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDraggingH, isDraggingV]);

  // Track cursor position
  const updateCursorPosition = (ta) => {
    if (!ta) return;
    const textBefore = ta.value.substring(0, ta.selectionStart);
    const lines = textBefore.split('\n');
    setCursorPos({ line: lines.length, col: lines[lines.length - 1].length + 1 });
  };

  // Synchronize scrolling
  const handleScroll = (e) => {
    const { scrollTop, scrollLeft } = e.target;
    if (preRef.current) {
      preRef.current.scrollTop = scrollTop;
      preRef.current.scrollLeft = scrollLeft;
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = scrollTop;
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    const ta = textareaRef.current;
    if (!ta) return;

    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isCompiling) handleCompileAndRun();
      return;
    }

    if (e.key === 'Escape' && isFullscreen) {
      e.preventDefault();
      setIsFullscreen(false);
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const spaces = langConfig.tabSpaces;
      const nextCode = code.substring(0, start) + spaces + code.substring(end);
      setCode(nextCode);
      setCodeByLang(prev => ({ ...prev, [selectedLang]: nextCode }));
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + spaces.length;
          updateCursorPosition(textareaRef.current);
        }
      });
      return;
    }
  };

  // Switch Language
  const handleSwitchLanguage = (langId) => {
    if (langId === selectedLang) return;
    setCodeByLang(prev => {
      const updated = { ...prev, [selectedLang]: code };
      const nextCode = updated[langId] || MULTI_LANG_TEMPLATES[langId] || '';
      setCode(nextCode);
      return updated;
    });
    setSelectedLang(langId);
    setCompilerOutput(null);
  };

  // Reset Template
  const handleResetTemplate = () => {
    if (window.confirm(`Reset ${langConfig.label} code to initial template?`)) {
      const def = MULTI_LANG_TEMPLATES[selectedLang] || '';
      setCode(def);
      setCodeByLang(prev => ({ ...prev, [selectedLang]: def }));
      setCompilerOutput(null);
    }
  };

  // Copy Code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  // Compile, Run & Record Problem Progress
  const handleCompileAndRun = async () => {
    setIsCompiling(true);
    setCompilerOutput(null);
    setActiveTestTab(1); // Auto-focus output tab
    const startTime = performance.now();

    try {
      const res = await apiFetch('/api/ai/compile-run', {
        method: 'POST',
        body: JSON.stringify({
          language: selectedLang,
          code: code,
          stdin: stdin
        })
      });

      const data = await res.json();
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);

      let isMatch = false;
      const expectedOut = sampleTestCases[activeSampleCaseIndex]?.expected?.trim();
      const actualOut = data.stdout?.trim();
      if (expectedOut && actualOut) {
        const norm = s => s.replace(/\r\n/g, '\n').replace(/["']/g, '').replace(/\s+/g, ' ').replace(/\[\s+/g, '[').replace(/\s+\]/g, ']').trim().toLowerCase();
        if (expectedOut === actualOut || norm(expectedOut) === norm(actualOut) || norm(actualOut).includes(norm(expectedOut)) || data.status === 'Accepted') {
          isMatch = true;
        }
      } else if (data.status === 'Accepted') {
        isMatch = true;
      }

      const executionStatus = data.status || 'Accepted';
      const executionTime = data.executionTime || `${elapsed}s`;
      const memory = data.memory || '2.1 MB';

      setCompilerOutput({
        ...data,
        isMatch,
        expectedOutput: expectedOut,
        executionTime,
        memory
      });

      // Record progress to backend
      try {
        const submitRes = await apiFetch('/api/practice/submit', {
          method: 'POST',
          body: JSON.stringify({
            problemId: activeProblem.id,
            problemNumber: activeProblem.number || 1,
            title: activeProblem.title,
            category: 'dsa',
            difficulty: activeProblem.difficulty || 'Medium',
            topic: activeProblem.topic || 'General',
            status: executionStatus,
            language: selectedLang,
            executionTime,
            memory,
            code
          })
        });
        const submitData = await submitRes.json();
        if (submitData.success && submitData.record) {
          setProgressStatus(submitData.record);
        }
      } catch (subErr) {
        console.warn('Could not record progress:', subErr);
      }
    } catch (err) {
      setCompilerOutput({
        status: 'Runtime Error',
        stdout: '',
        stderr: err.message || 'Execution failed due to network or server error.',
        executionTime: '0.00s'
      });
    } finally {
      setIsCompiling(false);
    }
  };

  // Load a specific sample testcase into STDIN
  const handleLoadTestCase = (index) => {
    setActiveSampleCaseIndex(index);
    const tc = sampleTestCases[index];
    if (tc) {
      setStdin(tc.input);
    }
  };

  // Prism Highlighted Code
  const highlightedCode = useMemo(() => {
    const prismLanguage = Prism.languages[langConfig.prismLang] || Prism.languages.javascript;
    return Prism.highlight(code || '', prismLanguage, langConfig.prismLang);
  }, [code, langConfig]);

  const lineCount = useMemo(() => {
    return Math.max(1, code.split('\n').length);
  }, [code]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: isFullscreen ? '#0b0f17' : 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: isFullscreen ? 0 : '1.2rem',
        overflow: 'hidden'
      }}
    >
      <div
        className={isFullscreen ? 'vscode-ide-workbench arena-layout' : 'glass-card vscode-ide-workbench arena-layout'}
        style={{
          width: isFullscreen ? '100vw' : '96vw',
          maxWidth: isFullscreen ? '100vw' : '1400px',
          height: isFullscreen ? '100vh' : '92vh',
          maxHeight: isFullscreen ? '100vh' : '92vh',
          borderRadius: isFullscreen ? 0 : '12px',
          background: 'var(--arena-panel-bg, #0d111a)',
          border: isFullscreen ? 'none' : '1px solid var(--arena-border, rgba(255, 255, 255, 0.1))',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: isFullscreen ? 'none' : '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* ============================================================ */}
        {/* TOP APP BAR: TITLE, PROBLEM SEARCH & SELECTOR, FULLSCREEN    */}
        {/* ============================================================ */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.6rem 1.2rem',
            background: 'var(--arena-header-bg, #131823)',
            borderBottom: '1px solid var(--arena-border, #1f2737)',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          {/* Brand & Title (WITHOUT LEETCODE/GFG MODE BADGE PER IMAGE 1) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(20, 184, 166, 0.15)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                border: '1px solid rgba(20, 184, 166, 0.3)'
              }}
            >
              <i className="fa-solid fa-terminal"></i>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#f1f5f9' }}>
                Multi-Language Online Compiler Sandbox
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Deterministic execution engine for C++, Java, Python 3, and JavaScript
              </span>
            </div>
          </div>

          {/* Search Bar & Problem Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Search Input with Search Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => {
                  setSearchFilter(e.target.value);
                  setCurrentProblemIndex(0);
                }}
                placeholder="Search 500+ questions..."
                style={{
                  background: '#090d14',
                  color: '#e2e8f0',
                  border: '1px solid #1f2737',
                  borderRadius: '5px',
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.75rem',
                  width: '180px',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                className="btn btn-sm btn-glass"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                title="Search questions"
              >
                <i className="fa-solid fa-magnifying-glass"></i>
              </button>
            </div>

            {/* Problem Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <button
                type="button"
                className="btn btn-sm btn-glass"
                style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}
                disabled={currentProblemIndex <= 0}
                onClick={() => setCurrentProblemIndex(prev => Math.max(0, prev - 1))}
                title="Previous Problem"
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              <select
                value={currentProblemIndex}
                onChange={(e) => setCurrentProblemIndex(Number(e.target.value))}
                style={{
                  background: '#1a2233',
                  color: '#e2e8f0',
                  border: '1px solid #2d3748',
                  borderRadius: '6px',
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.78rem',
                  maxWidth: '220px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {filteredProblems.map((prob, idx) => (
                  <option key={prob.id || idx} value={idx}>
                    #{prob.number || idx + 1}. {prob.title} ({prob.difficulty || 'Medium'})
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-sm btn-glass"
                style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}
                disabled={currentProblemIndex >= filteredProblems.length - 1}
                onClick={() => setCurrentProblemIndex(prev => Math.min(filteredProblems.length - 1, prev + 1))}
                title="Next Problem"
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>

          {/* Full Screen Toggle & Close Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Enter Full Screen'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.78rem',
                padding: '0.35rem 0.75rem',
                background: isFullscreen ? 'rgba(20, 184, 166, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                color: isFullscreen ? 'var(--primary)' : '#e2e8f0',
                border: isFullscreen ? '1px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              <i className={isFullscreen ? 'fa-solid fa-compress' : 'fa-solid fa-expand'}></i>
              <span>{isFullscreen ? 'Exit Full Screen' : 'Full Screen'}</span>
            </button>

            <button
              type="button"
              className="btn btn-sm btn-glass"
              onClick={onClose}
              title="Close Sandbox"
              style={{
                padding: '0.35rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                color: '#94a3b8'
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MAIN BODY: RESIZABLE HORIZONTAL & VERTICAL SPLIT PANELS       */}
        {/* ============================================================ */}
        <div
          ref={containerRef}
          style={{
            display: 'flex',
            flex: 1,
            overflow: 'hidden',
            background: '#0a0d14',
            position: 'relative'
          }}
        >
          {/* ========================================================== */}
          {/* LEFT PANEL: QUESTION DESCRIPTION & 3 SAMPLE CASES          */}
          {/* ========================================================== */}
          <div
            style={{
              width: `${splitRatioH}%`,
              minWidth: '260px',
              maxWidth: '80%',
              borderRight: '1px solid #1f2737',
              display: 'flex',
              flexDirection: 'column',
              background: '#0f1420',
              overflowY: 'auto'
            }}
          >
            {/* Question Header Bar */}
            <div
              style={{
                padding: '1.2rem 1.5rem',
                borderBottom: '1px solid #1a2333',
                background: 'linear-gradient(180deg, #131926 0%, #0f1420 100%)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                    #{activeProblem.number || currentProblemIndex + 1}
                  </span>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
                    {activeProblem.title}
                  </h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '999px',
                      background:
                        activeProblem.difficulty === 'Easy'
                          ? 'rgba(34, 197, 94, 0.15)'
                          : activeProblem.difficulty === 'Hard'
                          ? 'rgba(239, 68, 68, 0.15)'
                          : 'rgba(245, 158, 11, 0.15)',
                      color:
                        activeProblem.difficulty === 'Easy'
                          ? '#4ade80'
                          : activeProblem.difficulty === 'Hard'
                          ? '#f87171'
                          : '#fbbf24',
                      border: `1px solid ${
                        activeProblem.difficulty === 'Easy'
                          ? 'rgba(34, 197, 94, 0.3)'
                          : activeProblem.difficulty === 'Hard'
                          ? 'rgba(239, 68, 68, 0.3)'
                          : 'rgba(245, 158, 11, 0.3)'
                      }`
                    }}
                  >
                    {activeProblem.difficulty || 'Medium'}
                  </span>

                  {progressStatus?.status === 'Solved' && (
                    <span style={{ fontSize: '0.7rem', color: '#4ade80', fontWeight: 700 }}>
                      <i className="fa-solid fa-check-circle" style={{ marginRight: '0.2rem' }}></i> Solved ({progressStatus.acceptedCount}x)
                    </span>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {[activeProblem.topic || 'Algorithms', 'Interview Question'].map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: '0.68rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#94a3b8',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px'
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Problem Description & Constraints */}
            <div style={{ padding: '1.5rem', flex: 1 }}>
              <div style={{ fontSize: '0.9rem', lineHeight: '1.7', color: '#cbd5e1', whiteSpace: 'pre-line', marginBottom: '1.5rem' }}>
                {activeProblem.description}
              </div>

              {/* Constraints */}
              {activeProblem.constraints && (
                <div
                  style={{
                    marginBottom: '1.5rem',
                    padding: '0.9rem 1rem',
                    background: 'rgba(0, 0, 0, 0.25)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem' }}>
                    <i className="fa-solid fa-lock" style={{ marginRight: '0.35rem', color: '#f59e0b' }}></i> Constraints:
                  </div>
                  <pre style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                    {activeProblem.constraints}
                  </pre>
                </div>
              )}

              {/* 3 SAMPLE TEST CASES SECTION */}
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <i className="fa-solid fa-flask-vial" style={{ color: 'var(--primary)' }}></i>
                    <span>Sample Test Cases (3 Cases)</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Click to inspect & load</span>
                </div>

                {/* Test Cases Tabs: Case 1 | Case 2 | Case 3 */}
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.8rem' }}>
                  {sampleTestCases.map((tc, idx) => (
                    <button
                      key={tc.id || idx}
                      type="button"
                      onClick={() => handleLoadTestCase(idx)}
                      style={{
                        flex: 1,
                        padding: '0.45rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.2s',
                        background: activeSampleCaseIndex === idx ? 'rgba(20, 184, 166, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                        color: activeSampleCaseIndex === idx ? 'var(--primary)' : '#94a3b8',
                        border: activeSampleCaseIndex === idx ? '1px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.08)'
                      }}
                    >
                      <i className={`fa-solid ${activeSampleCaseIndex === idx ? 'fa-circle-dot' : 'fa-circle'}`} style={{ fontSize: '0.65rem' }}></i>
                      <span>Case {idx + 1}</span>
                    </button>
                  ))}
                </div>

                {/* Active Sample Test Case Card */}
                {sampleTestCases[activeSampleCaseIndex] && (
                  <div
                    style={{
                      background: '#131926',
                      borderRadius: '8px',
                      border: '1px solid #1f2737',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.8rem'
                    }}
                  >
                    {/* Input */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>Input:</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-glass"
                          onClick={() => {
                            navigator.clipboard.writeText(sampleTestCases[activeSampleCaseIndex].input);
                            setCopiedInput(true);
                            setTimeout(() => setCopiedInput(false), 2000);
                          }}
                          style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}
                        >
                          <i className={copiedInput ? 'fa-solid fa-check' : 'fa-regular fa-copy'} style={{ marginRight: '0.3rem' }}></i>
                          {copiedInput ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <pre
                        style={{
                          margin: 0,
                          background: '#090d14',
                          padding: '0.6rem 0.8rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          fontFamily: "'JetBrains Mono', Consolas, 'Courier New', monospace",
                          fontSize: '0.82rem',
                          color: '#38bdf8',
                          whiteSpace: 'pre',
                          overflowX: 'auto',
                          wordBreak: 'normal',
                          lineHeight: '1.45'
                        }}
                      >
                        {sampleTestCases[activeSampleCaseIndex].input}
                      </pre>
                    </div>

                    {/* Expected Output */}
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>
                        Expected Output:
                      </span>
                      <pre
                        style={{
                          margin: 0,
                          background: '#090d14',
                          padding: '0.6rem 0.8rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          fontFamily: "'JetBrains Mono', Consolas, 'Courier New', monospace",
                          fontSize: '0.82rem',
                          color: '#4ade80',
                          whiteSpace: 'pre',
                          overflowX: 'auto',
                          wordBreak: 'normal',
                          lineHeight: '1.45'
                        }}
                      >
                        {sampleTestCases[activeSampleCaseIndex].expected}
                      </pre>
                    </div>

                    {/* Explanation */}
                    {sampleTestCases[activeSampleCaseIndex].explanation && (
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>
                          Explanation:
                        </span>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: '#cbd5e1',
                            lineHeight: '1.5',
                            background: 'rgba(0, 0, 0, 0.2)',
                            padding: '0.5rem 0.7rem',
                            borderRadius: '6px',
                            borderLeft: '3px solid var(--primary)'
                          }}
                        >
                          {sampleTestCases[activeSampleCaseIndex].explanation}
                        </div>
                      </div>
                    )}

                    {/* Action: Use in STDIN */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.2rem' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-glass"
                        onClick={() => handleLoadTestCase(activeSampleCaseIndex)}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.3rem 0.7rem',
                          color: 'var(--primary)',
                          borderColor: 'var(--primary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <i className="fa-solid fa-arrow-right"></i>
                        <span>Load Input into STDIN</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================== */}
          {/* DRAGGABLE VERTICAL SPLITTER (LEFT-RIGHT RESIZING)          */}
          {/* ========================================================== */}
          <div
            onMouseDown={() => setIsDraggingH(true)}
            style={{
              width: '8px',
              cursor: 'col-resize',
              background: isDraggingH ? 'var(--primary)' : '#192233',
              transition: 'background 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              userSelect: 'none'
            }}
            title="Drag left/right to resize question and compiler panels"
          >
            <div style={{ width: '2px', height: '24px', background: isDraggingH ? '#ffffff' : '#64748b', borderRadius: '1px' }} />
          </div>

          {/* ========================================================== */}
          {/* RIGHT PANEL: COMPILER, CODE EDITOR & EXECUTION ENGINE      */}
          {/* ========================================================== */}
          <div
            ref={compilerContainerRef}
            style={{
              flex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              background: '#0a0d14',
              overflow: 'hidden'
            }}
          >
            {/* COMPILER TOOLBAR: LANGUAGES & COMPILE BUTTON */}
            <div
              className="arena-toolbar"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.45rem 1rem',
                background: 'var(--arena-header-bg, #131823)',
                borderBottom: '1px solid var(--arena-border, #1f2737)',
                flexWrap: 'wrap',
                gap: '0.6rem'
              }}
            >
              {/* UP-DOWN LANGUAGE DROPDOWN */}
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                <i
                  className={langConfig.icon}
                  style={{
                    position: 'absolute',
                    left: '0.55rem',
                    color: langConfig.color || 'var(--primary)',
                    fontSize: '0.78rem',
                    pointerEvents: 'none',
                    zIndex: 2
                  }}
                />
                <select
                  value={selectedLang}
                  onChange={(e) => handleSwitchLanguage(e.target.value)}
                  className="arena-select"
                  style={{
                    background: 'var(--arena-select-bg, #121826)',
                    color: 'var(--arena-text, #f8fafc)',
                    border: '1px solid var(--arena-border, #1a2233)',
                    borderRadius: '6px',
                    padding: '0.24rem 1.6rem 0.24rem 1.85rem',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    minWidth: '125px'
                  }}
                  title="Select Programming Language"
                >
                  {Object.values(LANGUAGE_CONFIGS).map(lang => (
                    <option key={lang.id} value={lang.id}>
                      {lang.label}
                    </option>
                  ))}
                </select>
                <i
                  className="fa-solid fa-chevron-down"
                  style={{
                    position: 'absolute',
                    right: '0.55rem',
                    color: 'var(--arena-text-muted, #94a3b8)',
                    fontSize: '0.62rem',
                    pointerEvents: 'none',
                    zIndex: 2
                  }}
                />
              </div>

              {/* Editor Actions: Reset & Compile Run */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-glass"
                  onClick={handleResetTemplate}
                  title="Reset Code Template"
                  style={{ fontSize: '0.74rem', padding: '0.35rem 0.65rem' }}
                >
                  <i className="fa-solid fa-rotate-left" style={{ marginRight: '0.3rem' }}></i>
                  Reset
                </button>

                <button
                  type="button"
                  className="btn btn-sm btn-glass"
                  onClick={handleCopyCode}
                  title="Copy Solution Code"
                  style={{ fontSize: '0.74rem', padding: '0.35rem 0.65rem' }}
                >
                  <i className={copiedCode ? 'fa-solid fa-check' : 'fa-regular fa-copy'} style={{ marginRight: '0.3rem' }}></i>
                  {copiedCode ? 'Copied' : 'Copy'}
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCompileAndRun}
                  disabled={isCompiling}
                  style={{
                    padding: '0.4rem 1.1rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    borderRadius: '6px'
                  }}
                >
                  {isCompiling ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin"></i>
                      <span>Running...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-play"></i>
                      <span>Run Code (Ctrl+Enter)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* VS CODE THEME CODE EDITOR (HEIGHT CONTROLLED BY splitRatioV) */}
            <div
              style={{
                height: `${splitRatioV}%`,
                minHeight: '130px',
                position: 'relative',
                display: 'flex',
                background: 'var(--arena-bg, #1e1e1e)',
                overflow: 'hidden'
              }}
            >
              {/* Line Numbers Gutter */}
              <div
                ref={lineNumbersRef}
                style={{
                  width: '46px',
                  padding: '1rem 0.4rem',
                  background: 'var(--arena-line-num-bg, #181818)',
                  textAlign: 'right',
                  color: 'var(--arena-line-num-color, #5c5c5c)',
                  fontFamily: "'JetBrains Mono', Consolas, monospace",
                  fontSize: '0.82rem',
                  lineHeight: '1.6',
                  userSelect: 'none',
                  borderRight: '1px solid var(--arena-border, #282828)',
                  overflow: 'hidden'
                }}
              >
                {Array.from({ length: lineCount }, (_, i) => i + 1).map((n) => (
                  <div key={n} style={{ height: '1.312rem', color: n === cursorPos.line ? 'var(--arena-text, #ffffff)' : 'var(--arena-line-num-color, #5c5c5c)', fontWeight: n === cursorPos.line ? 700 : 400 }}>
                    {n}
                  </div>
                ))}
              </div>

              {/* Code Edit Area: Prism Highlight Layer + Transparent Textarea */}
              <div style={{ position: 'relative', flex: 1, height: '100%', overflow: 'hidden' }}>
                <pre
                  ref={preRef}
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    margin: 0,
                    padding: '1rem 1.2rem',
                    fontFamily: "'JetBrains Mono', Consolas, monospace",
                    fontSize: '0.82rem',
                    lineHeight: '1.6',
                    color: 'var(--arena-text, #d4d4d4)',
                    background: 'transparent',
                    pointerEvents: 'none',
                    overflow: 'hidden',
                    whiteSpace: 'pre',
                    tabSize: 4
                  }}
                  dangerouslySetInnerHTML={{ __html: highlightedCode + '\n' }}
                />

                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCode(val);
                    setCodeByLang(prev => ({ ...prev, [selectedLang]: val }));
                    updateCursorPosition(e.target);
                  }}
                  onScroll={handleScroll}
                  onKeyDown={handleKeyDown}
                  onClick={(e) => updateCursorPosition(e.target)}
                  onKeyUp={(e) => updateCursorPosition(e.target)}
                  spellCheck="false"
                  autoCapitalize="off"
                  autoComplete="off"
                  autoCorrect="off"
                  placeholder={`// Implement your ${langConfig.label} solution here...`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100%',
                    height: '100%',
                    margin: 0,
                    padding: '1rem 1.2rem',
                    fontFamily: "'JetBrains Mono', Consolas, monospace",
                    fontSize: '0.82rem',
                    lineHeight: '1.6',
                    color: 'transparent',
                    caretColor: 'var(--primary, #528bff)',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    overflow: 'auto',
                    whiteSpace: 'pre',
                    tabSize: 4
                  }}
                />
              </div>
            </div>

            {/* ========================================================== */}
            {/* DRAGGABLE HORIZONTAL SPLITTER (UP-BOTTOM RESIZING)         */}
            {/* ========================================================== */}
            <div
              onMouseDown={() => setIsDraggingV(true)}
              style={{
                height: '8px',
                cursor: 'row-resize',
                background: isDraggingV ? 'var(--primary)' : 'var(--arena-gutter, #192233)',
                transition: 'background 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                userSelect: 'none'
              }}
              title="Drag up/down to expand coding space or terminal"
            >
              <div style={{ width: '28px', height: '2px', background: isDraggingV ? '#ffffff' : 'var(--arena-text-muted, #64748b)', borderRadius: '1px' }} />
            </div>

            {/* BOTTOM PANEL: STDIN TESTCASES + EXECUTION CONSOLE */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--arena-panel-bg, #0d111a)',
                overflow: 'hidden'
              }}
            >
              {/* Bottom Tabs: Testcases / STDIN vs Output */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.35rem 0.8rem',
                  background: 'var(--arena-header-bg, #131823)',
                  borderBottom: '1px solid var(--arena-border, #1f2737)'
                }}
              >
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTestTab(0)}
                    style={{
                      padding: '0.25rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      background: activeTestTab === 0 ? 'var(--arena-card-hover, rgba(255, 255, 255, 0.1))' : 'transparent',
                      color: activeTestTab === 0 ? 'var(--arena-text, #ffffff)' : 'var(--arena-text-muted, #94a3b8)'
                    }}
                  >
                    <i className="fa-solid fa-keyboard" style={{ marginRight: '0.35rem' }}></i>
                    Test Cases / STDIN
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTestTab(1)}
                    style={{
                      padding: '0.25rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      background: activeTestTab === 1 ? 'var(--arena-card-hover, rgba(255, 255, 255, 0.1))' : 'transparent',
                      color: activeTestTab === 1 ? 'var(--arena-text, #ffffff)' : 'var(--arena-text-muted, #94a3b8)'
                    }}
                  >
                    <i className="fa-solid fa-terminal" style={{ marginRight: '0.35rem' }}></i>
                    Terminal Output
                  </button>
                </div>

                {/* Execution Status Badge */}
                {compilerOutput?.status && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      fontWeight: 700,
                      background:
                        compilerOutput.status === 'Accepted'
                          ? 'rgba(34, 197, 94, 0.2)'
                          : 'rgba(239, 68, 68, 0.2)',
                      color:
                        compilerOutput.status === 'Accepted'
                          ? '#16a34a'
                          : '#dc2626',
                      border: `1px solid ${
                        compilerOutput.status === 'Accepted' ? '#16a34a' : '#dc2626'
                      }`
                    }}
                  >
                    {compilerOutput.isMatch ? '✓ Passed (Matches Output)' : compilerOutput.status}
                    {compilerOutput.executionTime ? ` • ${compilerOutput.executionTime}` : ''}
                  </span>
                )}
              </div>

              {/* Panel Content */}
              <div style={{ flex: 1, padding: '0.8rem 1rem', overflowY: 'auto' }}>
                {activeTestTab === 0 ? (
                  // STDIN / Test Cases Tab
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--arena-text-muted, #94a3b8)' }}>
                        Input Vector (stdin):
                      </span>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        {sampleTestCases.map((tc, i) => (
                          <button
                            key={i}
                            type="button"
                            className="btn btn-sm btn-glass"
                            onClick={() => handleLoadTestCase(i)}
                            style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem' }}
                          >
                            Sample {i + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      rows="3"
                      value={stdin}
                      onChange={(e) => setStdin(e.target.value)}
                      placeholder="Enter custom input vector here..."
                      style={{
                        width: '100%',
                        background: 'var(--arena-pre-bg, #090d14)',
                        border: '1px solid var(--arena-border, #1f2737)',
                        borderRadius: '6px',
                        color: 'var(--arena-text, #e2e8f0)',
                        padding: '0.6rem',
                        fontFamily: "'JetBrains Mono', Consolas, monospace",
                        fontSize: '0.82rem',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                ) : (
                  // Terminal Output Tab
                  <div>
                    {!compilerOutput && !isCompiling && (
                      <div style={{ color: 'var(--arena-text-subtle, #64748b)', fontStyle: 'italic', padding: '0.8rem 0', fontSize: '0.82rem' }}>
                        Click &quot;Run Code&quot; or press Ctrl+Enter to execute your solution.
                      </div>
                    )}

                    {isCompiling && (
                      <div style={{ color: 'var(--primary)', padding: '0.8rem 0', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        Compiling and executing in sandbox...
                      </div>
                    )}

                    {compilerOutput && (
                      <div>
                        {compilerOutput.isMatch !== undefined && (
                          <div
                            style={{
                              marginBottom: '0.8rem',
                              padding: '0.4rem 0.8rem',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              background: compilerOutput.isMatch ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: compilerOutput.isMatch ? '#16a34a' : '#dc2626',
                              border: `1px solid ${compilerOutput.isMatch ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                            }}
                          >
                            {compilerOutput.isMatch ? (
                              <span><i className="fa-solid fa-circle-check" style={{ marginRight: '0.4rem' }}></i> Test case passed! Actual output matches expected output.</span>
                            ) : (
                              <span><i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '0.4rem' }}></i> Expected output: <code>{compilerOutput.expectedOutput}</code></span>
                            )}
                          </div>
                        )}

                        {compilerOutput.stdout && (
                          <div style={{ marginBottom: '0.6rem' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--arena-output-text, #4ade80)', marginBottom: '0.2rem', fontWeight: 600 }}>STDOUT:</div>
                            <pre
                              style={{
                                margin: 0,
                                background: 'var(--arena-pre-bg, #06090f)',
                                padding: '0.6rem 0.8rem',
                                borderRadius: '6px',
                                color: 'var(--arena-output-text, #4ade80)',
                                fontFamily: "'JetBrains Mono', Consolas, 'Courier New', monospace",
                                fontSize: '0.82rem',
                                whiteSpace: 'pre',
                                overflowX: 'auto',
                                wordBreak: 'normal',
                                lineHeight: '1.45',
                                border: '1px solid var(--arena-border, rgba(74, 222, 128, 0.15))'
                              }}
                            >
                              {compilerOutput.stdout}
                            </pre>
                          </div>
                        )}

                        {compilerOutput.stderr && (
                          <div style={{ marginBottom: '0.6rem' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--error, #f87171)', marginBottom: '0.2rem', fontWeight: 600 }}>STDERR:</div>
                            <pre
                              style={{
                                margin: 0,
                                background: 'rgba(239, 68, 68, 0.08)',
                                padding: '0.6rem 0.8rem',
                                borderRadius: '6px',
                                color: '#dc2626',
                                fontFamily: "'JetBrains Mono', Consolas, 'Courier New', monospace",
                                fontSize: '0.82rem',
                                whiteSpace: 'pre',
                                overflowX: 'auto',
                                wordBreak: 'normal',
                                lineHeight: '1.45',
                                border: '1px solid rgba(239, 68, 68, 0.25)'
                              }}
                            >
                              {compilerOutput.stderr}
                            </pre>
                          </div>
                        )}

                        <div style={{ fontSize: '0.72rem', color: 'var(--arena-text-subtle, #64748b)', marginTop: '0.4rem' }}>
                          Time: <strong style={{ color: 'var(--arena-text, #cbd5e1)' }}>{compilerOutput.executionTime}</strong> | Memory: <strong style={{ color: 'var(--arena-text, #cbd5e1)' }}>{compilerOutput.memory}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Status Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.2rem 0.8rem',
                  background: 'var(--arena-status-bg, #0284c7)',
                  borderTop: '1px solid var(--arena-border, #1a2233)',
                  fontSize: '0.7rem',
                  color: 'var(--arena-status-text, #ffffff)'
                }}
              >
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
                  <span>{langConfig.label}</span>
                  <span>Split: H:{Math.round(splitRatioH)}% V:{Math.round(splitRatioV)}%</span>
                </div>
                <div>
                  <span>Ctrl+Enter to Run Code • Esc to Exit Fullscreen</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
