import React, { useState, useEffect, useRef, useMemo } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-python.js';
import 'prismjs/components/prism-c.js';
import 'prismjs/components/prism-cpp.js';
import 'prismjs/components/prism-java.js';
import { getThreeSampleTestCases } from '../data/dsaTestCases.js';

const LANGUAGE_CONFIGS = {
  python: {
    id: 'python',
    name: 'Python',
    label: 'Python',
    version: '3.12',
    fileName: 'solution.py',
    prismLang: 'python',
    icon: 'fa-brands fa-python',
    iconColor: '#38bdf8',
    tabSpaces: '    '
  },
  cpp: {
    id: 'cpp',
    name: 'C++',
    label: 'C++',
    version: 'g++ 20',
    fileName: 'solution.cpp',
    prismLang: 'cpp',
    icon: 'fa-solid fa-code',
    iconColor: '#f59e0b',
    tabSpaces: '    '
  },
  java: {
    id: 'java',
    name: 'Java',
    label: 'Java',
    version: 'OpenJDK 21',
    fileName: 'Solution.java',
    prismLang: 'java',
    icon: 'fa-brands fa-java',
    iconColor: '#ef4444',
    tabSpaces: '    '
  },
  javascript: {
    id: 'javascript',
    name: 'JavaScript',
    label: 'JavaScript',
    version: 'Node 20',
    fileName: 'solution.js',
    prismLang: 'javascript',
    icon: 'fa-brands fa-js',
    iconColor: '#facc15',
    tabSpaces: '  '
  }
};

export default function CodeEditor({
  code,
  onChange,
  language = 'python',
  onSelectLanguage,
  onReset,
  onRun,
  isCompiling = false,
  compilerOutput = null,
  customStdin = '',
  onChangeStdin = null,
  minHeight = '720px',
  problem = null,
  onSubmitTest = null,
  submitting = false
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInput, setCopiedInput] = useState(false);
  const [copiedDriver, setCopiedDriver] = useState(false);
  const [activeProblemTab, setActiveProblemTab] = useState('description'); // 'description' | 'explanation'
  const [activeSampleIndex, setActiveSampleIndex] = useState(0);
  const [activeTerminalTab, setActiveTerminalTab] = useState(0); // 0: Test Cases/STDIN, 1: Output
  const [splitRatioH, setSplitRatioH] = useState(46); // Left question vs Right editor in %
  const [splitRatioV, setSplitRatioV] = useState(58); // Top editor vs Bottom terminal in %
  const [isDraggingH, setIsDraggingH] = useState(false);
  const [isDraggingV, setIsDraggingV] = useState(false);
  const [isDriverCodeOpen, setIsDriverCodeOpen] = useState(false);

  const sampleTestCases = useMemo(() => {
    return getThreeSampleTestCases(problem);
  }, [problem]);

  const textareaRef = useRef(null);
  const preRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const containerRef = useRef(null);
  const compilerContainerRef = useRef(null);

  const config = LANGUAGE_CONFIGS[language] || LANGUAGE_CONFIGS.python;

  // Auto-switch terminal tab to output on compilation or result
  useEffect(() => {
    if (isCompiling || compilerOutput) {
      setActiveTerminalTab(1);
    }
  }, [isCompiling, compilerOutput]);

  // Synchronize STDIN when sample test cases change or initial load
  useEffect(() => {
    if (sampleTestCases && sampleTestCases.length > 0 && !customStdin && onChangeStdin) {
      onChangeStdin(sampleTestCases[0].input || '');
    }
  }, [problem?.id, problem?.title]);

  // Draggable Split Event Listeners (both in normal and fullscreen modes)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingH && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const newRatio = Math.max(24, Math.min(76, (offsetX / rect.width) * 100));
        setSplitRatioH(newRatio);
      }
      if (isDraggingV && compilerContainerRef.current) {
        const rect = compilerContainerRef.current.getBoundingClientRect();
        const offsetY = e.clientY - rect.top;
        const newRatio = Math.max(25, Math.min(82, (offsetY / rect.height) * 100));
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
  const updateCursorPosition = (el) => {
    if (!el) return;
    const textBefore = el.value.substring(0, el.selectionStart);
    const lines = textBefore.split('\n');
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1
    });
  };

  // Keyboard shortcut handlers
  const handleKeyDown = (e) => {
    // Ctrl+Enter or Cmd+Enter: Run Code
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (onRun && !isCompiling) onRun();
      return;
    }

    // Escape: Exit Fullscreen
    if (e.key === 'Escape' && isFullscreen) {
      e.preventDefault();
      setIsFullscreen(false);
      return;
    }

    const { selectionStart, selectionEnd, value } = e.target;

    // Tab key: indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const tabStr = config.tabSpaces;
      if (e.shiftKey) {
        // Shift+Tab: Dedent
        const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
        if (value.substring(lineStart, lineStart + tabStr.length) === tabStr) {
          const nextVal = value.substring(0, lineStart) + value.substring(lineStart + tabStr.length);
          onChange(nextVal);
          setTimeout(() => {
            if (textareaRef.current) {
              const newPos = Math.max(lineStart, selectionStart - tabStr.length);
              textareaRef.current.selectionStart = newPos;
              textareaRef.current.selectionEnd = newPos;
              updateCursorPosition(textareaRef.current);
            }
          }, 0);
        }
      } else {
        // Tab: Insert spaces
        const nextVal = value.substring(0, selectionStart) + tabStr + value.substring(selectionEnd);
        onChange(nextVal);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = selectionStart + tabStr.length;
            textareaRef.current.selectionEnd = selectionStart + tabStr.length;
            updateCursorPosition(textareaRef.current);
          }
        }, 0);
      }
      return;
    }

    // Auto-close pairs: (), [], {}, "", ''
    const pairs = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };
    if (pairs[e.key] && selectionStart === selectionEnd) {
      e.preventDefault();
      const closeChar = pairs[e.key];
      const nextVal = value.substring(0, selectionStart) + e.key + closeChar + value.substring(selectionEnd);
      onChange(nextVal);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = selectionStart + 1;
          textareaRef.current.selectionEnd = selectionStart + 1;
          updateCursorPosition(textareaRef.current);
        }
      }, 0);
      return;
    }

    // Enter key: maintain indentation
    if (e.key === 'Enter') {
      const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
      const currentLine = value.substring(lineStart, selectionStart);
      const matchIndent = currentLine.match(/^\s*/);
      const indent = matchIndent ? matchIndent[0] : '';

      const lastChar = currentLine.trim().slice(-1);
      const extraIndent = (lastChar === ':' || lastChar === '{') ? config.tabSpaces : '';

      e.preventDefault();
      const insert = '\n' + indent + extraIndent;
      const nextVal = value.substring(0, selectionStart) + insert + value.substring(selectionEnd);
      onChange(nextVal);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = selectionStart + insert.length;
          textareaRef.current.selectionEnd = selectionStart + insert.length;
          updateCursorPosition(textareaRef.current);
        }
      }, 0);
    }
  };

  // Sync scroll between textarea, syntax overlay, and line numbers
  const handleScroll = (e) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.target.scrollTop;
      preRef.current.scrollLeft = e.target.scrollLeft;
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.target.scrollTop;
    }
  };

  // Syntax highlighting
  const highlightedCode = useMemo(() => {
    const prismLang = Prism.languages[config.prismLang] || Prism.languages.javascript;
    return Prism.highlight(code || '', prismLang, config.prismLang);
  }, [code, config]);

  const lineCount = useMemo(() => {
    return Math.max(1, (code || '').split('\n').length);
  }, [code]);

  const hasApproach = Boolean(
    problem?.explanation?.approach ||
    problem?.explanation?.intuition ||
    problem?.approach ||
    problem?.explanation?.complexity
  );

  return (
    <div
      className="vscode-ide-workbench arena-layout"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: isFullscreen ? '100vh' : minHeight,
        position: isFullscreen ? 'fixed' : 'relative',
        inset: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 99999 : 1,
        background: 'var(--arena-bg, #090d16)',
        color: 'var(--arena-text, #e2e8f0)',
        borderRadius: isFullscreen ? 0 : '10px',
        border: isFullscreen ? 'none' : '1px solid var(--arena-border, #1f2737)',
        boxShadow: isFullscreen ? 'none' : '0 10px 30px rgba(0, 0, 0, 0.45)',
        overflow: 'hidden',
        transition: 'all 0.15s ease'
      }}
    >
      {/* ============================================================ */}
      {/* MAIN WORKSPACE: RESIZABLE QUESTION & COMPILER SPLIT PANELS   */}
      {/* ============================================================ */}
      <div
        ref={containerRef}
        className="arena-split-container"
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          height: 'calc(100% - 24px)'
        }}
      >
        {/* ========================================================== */}
        {/* LEFT PANEL: QUESTION DETAILS, 3 TEST CASES, CONSTRAINTS    */}
        {/* ========================================================== */}
        {problem && (
          <div
            className="arena-left-panel"
            style={{
              width: `${splitRatioH}%`,
              minWidth: '280px',
              maxWidth: '75%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--arena-panel-bg, #0d121c)',
              overflowY: 'auto'
            }}
          >
            {/* Problem Header */}
            <div
              style={{
                padding: '1rem 1.3rem',
                borderBottom: '1px solid var(--arena-border, #192233)',
                background: 'var(--arena-header-bg, #111724)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.6rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--arena-text-subtle, #64748b)', fontWeight: 700 }}>
                      #{problem.number || 1}
                    </span>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--arena-text, #f8fafc)' }}>
                      {problem.title}
                    </h3>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '999px',
                        background:
                          problem.difficulty === 'Easy'
                            ? 'rgba(34, 197, 94, 0.15)'
                            : problem.difficulty === 'Hard'
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(245, 158, 11, 0.15)',
                        color:
                          problem.difficulty === 'Easy'
                            ? '#16a34a'
                            : problem.difficulty === 'Hard'
                            ? '#dc2626'
                            : '#d97706',
                        border: `1px solid ${
                          problem.difficulty === 'Easy'
                            ? 'rgba(34, 197, 94, 0.3)'
                            : problem.difficulty === 'Hard'
                            ? 'rgba(239, 68, 68, 0.3)'
                            : 'rgba(245, 158, 11, 0.3)'
                        }`
                      }}
                    >
                      {problem.difficulty || 'Medium'}
                    </span>
                    <span style={{ fontSize: '0.68rem', background: 'var(--arena-card-hover, rgba(255,255,255,0.05))', color: 'var(--arena-text-muted, #94a3b8)', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid var(--arena-border, transparent)' }}>
                      {problem.topic || 'Algorithmic DSA'}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--arena-text-subtle, #64748b)' }}>Unsolved</span>
                </div>
              </div>
            </div>

            {/* Problem Body */}
            <div style={{ padding: '1.2rem 1.3rem', flex: 1 }}>
              {/* Navigation Tabs: Problem & Cases vs. Approach & Explanation */}
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.1rem', borderBottom: '1px solid var(--arena-border, #1a2233)', paddingBottom: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveProblemTab('description')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: activeProblemTab === 'description' ? 'var(--arena-tab-active-bg, rgba(20, 184, 166, 0.2))' : 'transparent',
                    color: activeProblemTab === 'description' ? 'var(--primary)' : 'var(--arena-text-muted, #94a3b8)'
                  }}
                >
                  <i className="fa-solid fa-file-lines"></i>
                  <span>Problem & Test Cases</span>
                </button>

                {hasApproach && (
                  <button
                    type="button"
                    onClick={() => setActiveProblemTab('explanation')}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: activeProblemTab === 'explanation' ? 'var(--arena-tab-active-bg, rgba(56, 189, 248, 0.2))' : 'transparent',
                      color: activeProblemTab === 'explanation' ? 'var(--secondary)' : 'var(--arena-text-muted, #94a3b8)'
                    }}
                  >
                    <i className="fa-solid fa-lightbulb"></i>
                    <span>Approach & Explanation</span>
                  </button>
                )}
              </div>

              {activeProblemTab === 'explanation' && hasApproach ? (
                // TAB: APPROACH & EXPLANATION
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Intuition / Approach */}
                  <div style={{ background: 'var(--arena-card-bg, #121826)', borderRadius: '8px', border: '1px solid var(--arena-card-border, #1f2737)', padding: '1rem' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <i className="fa-solid fa-brain"></i> Algorithmic Approach & Intuition
                    </div>
                    <div style={{ fontSize: '0.82rem', lineHeight: '1.6', color: 'var(--arena-text, #cbd5e1)', whiteSpace: 'pre-line' }}>
                      {problem.explanation?.approach || problem.explanation?.intuition || problem.approach}
                    </div>
                  </div>

                  {/* Complexity */}
                  {problem.explanation?.complexity && (
                    <div style={{ background: 'var(--arena-card-bg, #121826)', borderRadius: '8px', border: '1px solid var(--arena-card-border, #1f2737)', padding: '1rem' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--warning)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <i className="fa-solid fa-chart-line"></i> Complexity Analysis
                      </div>
                      <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                        <div style={{ background: 'var(--arena-pre-bg, #090d14)', padding: '0.5rem 0.8rem', borderRadius: '6px', border: '1px solid var(--arena-border, #1a2233)', flex: '1 1 180px' }}>
                          <span style={{ color: 'var(--arena-text-muted, #94a3b8)', fontSize: '0.72rem', display: 'block' }}>Time Complexity:</span>
                          <strong style={{ color: 'var(--arena-text, #f1f5f9)', fontSize: '0.82rem' }}>{problem.explanation.complexity.time || 'O(n)'}</strong>
                        </div>
                        <div style={{ background: 'var(--arena-pre-bg, #090d14)', padding: '0.5rem 0.8rem', borderRadius: '6px', border: '1px solid var(--arena-border, #1a2233)', flex: '1 1 180px' }}>
                          <span style={{ color: 'var(--arena-text-muted, #94a3b8)', fontSize: '0.72rem', display: 'block' }}>Space Complexity:</span>
                          <strong style={{ color: 'var(--arena-text, #f1f5f9)', fontSize: '0.82rem' }}>{problem.explanation.complexity.space || 'O(1)'}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // TAB: PROBLEM DESCRIPTION & 3 SAMPLE TEST CASES
                <>
                  <div style={{ fontSize: '0.88rem', lineHeight: '1.65', color: 'var(--arena-text, #cbd5e1)', whiteSpace: 'pre-line', marginBottom: '1.3rem' }}>
                    {problem.description}
                  </div>

                  {/* Constraints */}
                  {problem.constraints && (
                    <div
                      style={{
                        marginBottom: '1.3rem',
                        padding: '0.8rem 1rem',
                        background: 'var(--arena-card-bg, rgba(0, 0, 0, 0.28))',
                        borderRadius: '7px',
                        border: '1px solid var(--arena-card-border, rgba(255, 255, 255, 0.06))'
                      }}
                    >
                      <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--arena-text-muted, #94a3b8)', marginBottom: '0.35rem' }}>
                        <i className="fa-solid fa-lock" style={{ marginRight: '0.35rem', color: 'var(--warning)' }}></i> Constraints:
                      </div>
                      <pre style={{ margin: 0, fontSize: '0.78rem', color: 'var(--arena-text-muted, #94a3b8)', fontFamily: "'JetBrains Mono', Consolas, monospace", whiteSpace: 'pre-wrap', lineHeight: '1.45' }}>
                        {problem.constraints}
                      </pre>
                    </div>
                  )}

                  {/* 3 SAMPLE TEST CASES SECTION (EXACT PRACTICE ARENADESIGN) */}
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--arena-text, #f1f5f9)' }}>
                        <i className="fa-solid fa-flask-vial" style={{ color: 'var(--primary)', marginRight: '0.4rem' }}></i>
                        Sample Test Cases (3 Cases)
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--arena-text-subtle, #64748b)' }}>Click case to inspect</span>
                    </div>

                    {/* Tabs: Sample 1 | Sample 2 | Sample 3 */}
                    <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.8rem' }}>
                      {sampleTestCases.map((tc, idx) => (
                        <button
                          key={tc.id || idx}
                          type="button"
                          onClick={() => {
                            setActiveSampleIndex(idx);
                            if (tc.input && onChangeStdin) onChangeStdin(tc.input);
                          }}
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
                            gap: '0.35rem',
                            background: activeSampleIndex === idx ? 'var(--arena-tab-active-bg, rgba(20, 184, 166, 0.2))' : 'var(--arena-card-hover, rgba(255, 255, 255, 0.04))',
                            color: activeSampleIndex === idx ? 'var(--arena-tab-active-color, var(--primary))' : 'var(--arena-text-muted, #94a3b8)',
                            border: activeSampleIndex === idx ? '1px solid var(--arena-tab-active-border, var(--primary))' : '1px solid var(--arena-border, rgba(255, 255, 255, 0.08))'
                          }}
                        >
                          <span>Sample {idx + 1}</span>
                        </button>
                      ))}
                    </div>

                    {/* Active Case Details */}
                    {sampleTestCases[activeSampleIndex] && (
                      <div
                        style={{
                          background: 'var(--arena-card-bg, #121826)',
                          borderRadius: '8px',
                          border: '1px solid var(--arena-card-border, #1f2737)',
                          padding: '1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.8rem'
                        }}
                      >
                        {/* Input */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--arena-text-muted, #94a3b8)' }}>Input:</span>
                            <button
                              type="button"
                              className="btn btn-sm btn-glass"
                              onClick={() => {
                                navigator.clipboard.writeText(sampleTestCases[activeSampleIndex].input);
                                setCopiedInput(true);
                                setTimeout(() => setCopiedInput(false), 2000);
                              }}
                              style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}
                            >
                              <i className={copiedInput ? 'fa-solid fa-check' : 'fa-regular fa-copy'} style={{ marginRight: '0.2rem' }}></i>
                              {copiedInput ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <pre
                            style={{
                              margin: 0,
                              background: 'var(--arena-pre-bg, #090d14)',
                              padding: '0.6rem 0.8rem',
                              borderRadius: '6px',
                              border: '1px solid var(--arena-border, rgba(255, 255, 255, 0.06))',
                              fontFamily: "'JetBrains Mono', Consolas, monospace",
                              fontSize: '0.82rem',
                              color: 'var(--arena-input-text, #38bdf8)',
                              whiteSpace: 'pre',
                              overflowX: 'auto',
                              wordBreak: 'normal',
                              lineHeight: '1.45'
                            }}
                          >
                            {sampleTestCases[activeSampleIndex].input}
                          </pre>
                        </div>

                        {/* Expected Output */}
                        <div>
                          <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--arena-text-muted, #94a3b8)', display: 'block', marginBottom: '0.3rem' }}>
                            Expected Output:
                          </span>
                          <pre
                            style={{
                              margin: 0,
                              background: 'var(--arena-pre-bg, #090d14)',
                              padding: '0.6rem 0.8rem',
                              borderRadius: '6px',
                              border: '1px solid var(--arena-border, rgba(255, 255, 255, 0.06))',
                              fontFamily: "'JetBrains Mono', Consolas, monospace",
                              fontSize: '0.82rem',
                              color: 'var(--arena-output-text, #4ade80)',
                              whiteSpace: 'pre',
                              overflowX: 'auto',
                              wordBreak: 'normal',
                              lineHeight: '1.45'
                            }}
                          >
                            {sampleTestCases[activeSampleIndex].expected}
                          </pre>
                        </div>

                        {/* Explanation */}
                        {sampleTestCases[activeSampleIndex].explanation && (
                          <div>
                            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--arena-text-muted, #94a3b8)', display: 'block', marginBottom: '0.3rem' }}>
                              Explanation:
                            </span>
                            <div
                              style={{
                                fontSize: '0.8rem',
                                color: 'var(--arena-text, #cbd5e1)',
                                lineHeight: '1.5',
                                background: 'var(--arena-explanation-bg, rgba(0, 0, 0, 0.2))',
                                padding: '0.5rem 0.7rem',
                                borderRadius: '6px',
                                borderLeft: '3px solid var(--primary)'
                              }}
                            >
                              {sampleTestCases[activeSampleIndex].explanation}
                            </div>
                          </div>
                        )}

                        {/* Load to STDIN action */}
                        {onChangeStdin && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.2rem' }}>
                            <button
                              type="button"
                              className="btn btn-sm btn-glass"
                              onClick={() => {
                                onChangeStdin(sampleTestCases[activeSampleIndex].input);
                                setActiveTerminalTab(0);
                              }}
                              style={{
                                fontSize: '0.74rem',
                                padding: '0.25rem 0.65rem',
                                color: 'var(--primary)',
                                borderColor: 'var(--primary)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}
                            >
                              <i className="fa-solid fa-arrow-right"></i>
                              <span>Load into STDIN</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* DRAGGABLE VERTICAL GUTTER (LEFT-RIGHT RESIZING)             */}
        {/* ========================================================== */}
        {problem && (
          <div
            className="arena-gutter-h"
            onMouseDown={() => setIsDraggingH(true)}
            style={{
              width: '8px',
              cursor: 'col-resize',
              background: isDraggingH ? 'var(--primary)' : 'var(--arena-gutter, #192233)',
              transition: 'background 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              userSelect: 'none'
            }}
            title="Drag left/right to resize question and compiler panels"
          >
            <div style={{ width: '2px', height: '24px', background: isDraggingH ? '#ffffff' : 'var(--arena-text-muted, #64748b)', borderRadius: '1px' }} />
          </div>
        )}

        {/* ========================================================== */}
        {/* RIGHT PANEL: COMPILER, CODE EDITOR, TERMINAL OUTPUT & STDIN */}
        {/* ========================================================== */}
        <div
          ref={compilerContainerRef}
          className="arena-right-panel"
          style={{
            flex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--arena-bg, #090d16)',
            overflow: 'hidden'
          }}
        >
          {/* COMPILER TOP TOOLBAR: LANGUAGE SELECTION & ACTIONS */}
          <div
            className="arena-toolbar"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.35rem 0.8rem',
              background: 'var(--arena-header-bg, #111724)',
              borderBottom: '1px solid var(--arena-border, #1a2233)',
              flexWrap: 'wrap',
              gap: '0.45rem',
              minHeight: '38px'
            }}
          >
            {/* UP-DOWN LANGUAGE DROPDOWN (Arranged vertically like DSA/SQL/OOPS track switcher) */}
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
              <i
                className={config.icon}
                style={{
                  position: 'absolute',
                  left: '0.55rem',
                  color: config.iconColor || 'var(--primary)',
                  fontSize: '0.78rem',
                  pointerEvents: 'none',
                  zIndex: 2
                }}
              />
              <select
                id="code-arena-lang-select"
                value={language}
                onChange={(e) => onSelectLanguage && onSelectLanguage(e.target.value)}
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
                    {lang.label} ({lang.version})
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

            {/* Actions: Reset, Copy, Run Code, Full Screen, Submit Assessment */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0, flexWrap: 'wrap' }}>
              {onReset && (
                <button
                  type="button"
                  className="btn btn-sm btn-glass"
                  onClick={onReset}
                  title="Reset Code Template"
                  style={{ fontSize: '0.72rem', padding: '0.22rem 0.5rem', whiteSpace: 'nowrap' }}
                >
                  <i className="fa-solid fa-rotate-left" style={{ marginRight: '0.2rem' }}></i>
                  Reset
                </button>
              )}

              <button
                type="button"
                className="btn btn-sm btn-glass"
                onClick={() => {
                  navigator.clipboard.writeText(code || '');
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                title="Copy code to clipboard"
                style={{ fontSize: '0.72rem', padding: '0.22rem 0.5rem', whiteSpace: 'nowrap' }}
              >
                <i className={copiedCode ? 'fa-solid fa-check' : 'fa-regular fa-copy'} style={{ marginRight: '0.2rem' }}></i>
                {copiedCode ? 'Copied' : 'Copy'}
              </button>

              {onRun && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onRun}
                  disabled={isCompiling}
                  title="Compile and run code (Ctrl+Enter)"
                  style={{
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    borderRadius: '5px',
                    whiteSpace: 'nowrap'
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
                      <span>Run Code</span>
                    </>
                  )}
                </button>
              )}

              {/* Fullscreen Toggle Button */}
              <button
                id="fullscreen-toggle-btn"
                type="button"
                className="btn btn-sm btn-glass"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Enter Full Screen'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.72rem',
                  padding: '0.22rem 0.55rem',
                  background: isFullscreen ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  color: isFullscreen ? '#38bdf8' : '#e2e8f0',
                  border: isFullscreen ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '5px',
                  whiteSpace: 'nowrap'
                }}
              >
                <i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
                <span>{isFullscreen ? 'Exit Full Screen' : 'Full Screen'}</span>
              </button>

              {/* Optional Submit Assessment Button in Toolbar (visible when fullscreen or during test) */}
              {onSubmitTest && isFullscreen && (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={onSubmitTest}
                  disabled={submitting}
                  title="Submit entire assessment"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.28rem 0.75rem',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <i className="fa-solid fa-check-double"></i>
                  <span>{submitting ? 'Submitting...' : 'Submit Test'}</span>
                </button>
              )}
            </div>
          </div>

          {/* CODE EDITOR CONTAINER (RESIZABLE VERTICALLY VIA SPLIT RATIO V) */}
          <div
            style={{
              height: `${splitRatioV}%`,
              minHeight: '120px',
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
              {Array.from({ length: lineCount }, (_, i) => i + 1).map(n => (
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
              >
                <code
                  className={`language-${config.prismLang}`}
                  dangerouslySetInnerHTML={{ __html: highlightedCode + '\n' }}
                />
              </pre>

              <textarea
                ref={textareaRef}
                value={code || ''}
                onChange={(e) => {
                  onChange(e.target.value);
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
                placeholder={`// Implement your ${config.name} solution here...`}
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
          {/* PRE-WRITTEN DRIVER / MAIN FUNCTION DRAWER (MINIMIZED)      */}
          {/* ========================================================== */}
          {problem?.mainFunction?.[language] && (
            <div style={{ background: 'var(--arena-header-bg, #111724)', borderTop: '1px solid var(--arena-border, #1a2233)', flexShrink: 0 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.35rem 1rem',
                  fontSize: '0.74rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--arena-text-muted, #94a3b8)' }}>
                  <i className="fa-solid fa-bolt" style={{ color: 'var(--warning, #f59e0b)' }}></i>
                  <span>
                    Driver / Main Function:{' '}
                    <strong style={{ color: isDriverCodeOpen ? 'var(--secondary, #38bdf8)' : 'var(--arena-output-text, #4ade80)' }}>
                      {isDriverCodeOpen ? 'Expanded' : 'Minimized'}
                    </strong>{' '}
                    (Handles I/O and calls your function logic)
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-glass"
                  onClick={() => setIsDriverCodeOpen(!isDriverCodeOpen)}
                  style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <i className={`fa-solid ${isDriverCodeOpen ? 'fa-chevron-down' : 'fa-code'}`}></i>
                  <span>{isDriverCodeOpen ? 'Minimize Driver Code' : 'View Driver Code (Minimized)'}</span>
                </button>
              </div>

              {isDriverCodeOpen && (
                <div
                  style={{
                    padding: '0.6rem 1rem 0.8rem',
                    background: 'var(--arena-pre-bg, #090d14)',
                    borderTop: '1px solid var(--arena-border, #1f2737)'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: 'var(--arena-text-subtle, #64748b)', marginBottom: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      <i className="fa-solid fa-circle-info" style={{ marginRight: '0.3rem' }}></i>
                      Pre-written execution harness that runs your function against test vectors.
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-glass"
                      onClick={() => {
                        const d = problem.mainFunction?.[language] || '';
                        navigator.clipboard.writeText(d);
                        setCopiedDriver(true);
                        setTimeout(() => setCopiedDriver(false), 2000);
                      }}
                      style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}
                    >
                      <i className={copiedDriver ? 'fa-solid fa-check' : 'fa-regular fa-copy'} style={{ marginRight: '0.2rem' }}></i>
                      {copiedDriver ? 'Copied' : 'Copy Driver Code'}
                    </button>
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      padding: '0.6rem 0.8rem',
                      background: 'var(--arena-card-bg, #141a29)',
                      borderRadius: '6px',
                      color: 'var(--arena-text, #cbd5e1)',
                      fontFamily: "'JetBrains Mono', Consolas, monospace",
                      fontSize: '0.78rem',
                      whiteSpace: 'pre',
                      overflowX: 'auto',
                      border: '1px solid var(--arena-border, rgba(255, 255, 255, 0.06))'
                    }}
                  >
                    {problem.mainFunction[language]}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* DRAGGABLE HORIZONTAL GUTTER (UP-BOTTOM RESIZING)           */}
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

          {/* ========================================================== */}
          {/* BOTTOM PANEL: TABS FOR STDIN & OUTPUT                      */}
          {/* ========================================================== */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--arena-panel-bg, #0d111a)',
              overflow: 'hidden'
            }}
          >
            {/* Bottom Tabs Bar */}
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
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setActiveTerminalTab(0)}
                  style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: '4px',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: 'none',
                    background: activeTerminalTab === 0 ? 'var(--arena-card-hover, rgba(255, 255, 255, 0.1))' : 'transparent',
                    color: activeTerminalTab === 0 ? 'var(--arena-text, #ffffff)' : 'var(--arena-text-muted, #94a3b8)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <i className="fa-solid fa-keyboard"></i>
                  <span>Test Cases / STDIN</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTerminalTab(1)}
                  style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: '4px',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: 'none',
                    background: activeTerminalTab === 1 ? 'var(--arena-card-hover, rgba(255, 255, 255, 0.1))' : 'transparent',
                    color: activeTerminalTab === 1 ? 'var(--arena-text, #ffffff)' : 'var(--arena-text-muted, #94a3b8)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <i className="fa-solid fa-terminal"></i>
                  <span>Terminal Output</span>
                </button>
              </div>

              {/* Status Badge */}
              {compilerOutput && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    fontWeight: 700,
                    background:
                      compilerOutput.isMatch || compilerOutput.status === 'Accepted'
                        ? 'rgba(34, 197, 94, 0.2)'
                        : 'rgba(239, 68, 68, 0.2)',
                    color:
                      compilerOutput.isMatch || compilerOutput.status === 'Accepted'
                        ? '#16a34a'
                        : '#dc2626',
                    border: `1px solid ${compilerOutput.isMatch || compilerOutput.status === 'Accepted' ? '#16a34a' : '#dc2626'}`
                  }}
                >
                  {compilerOutput.isMatch ? '✓ Passed (Matches Output)' : (compilerOutput.status || 'Wrong Answer')}
                  {compilerOutput.executionTime ? ` • ${compilerOutput.executionTime}` : ''}
                </span>
              )}
            </div>

            {/* Tab Contents */}
            <div style={{ flex: 1, padding: '0.8rem 1rem', overflowY: 'auto' }}>
              {activeTerminalTab === 0 ? (
                // TAB 0: TEST CASES / STDIN
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--arena-text-muted, #94a3b8)' }}>
                      Standard Input Vector (stdin):
                    </span>
                    {onChangeStdin && (
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        {sampleTestCases.map((tc, i) => (
                          <button
                            key={i}
                            type="button"
                            className="btn btn-sm btn-glass"
                            onClick={() => onChangeStdin(tc.input)}
                            style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}
                          >
                            Sample {i + 1}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <textarea
                    rows="3"
                    value={customStdin}
                    onChange={(e) => onChangeStdin && onChangeStdin(e.target.value)}
                    placeholder="Enter custom input test vector here, or click 'Sample 1/2/3' above..."
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
                  {sampleTestCases[activeSampleIndex] && (
                    <div style={{ marginTop: '0.6rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--arena-text-subtle, #64748b)', display: 'block', marginBottom: '0.2rem' }}>
                        Expected Output for active sample:
                      </span>
                      <pre
                        style={{
                          margin: 0,
                          background: 'var(--arena-pre-bg, #090d14)',
                          border: '1px solid var(--arena-border, rgba(255, 255, 255, 0.04))',
                          borderRadius: '4px',
                          padding: '0.4rem 0.6rem',
                          fontFamily: "'JetBrains Mono', Consolas, monospace",
                          fontSize: '0.78rem',
                          color: 'var(--arena-output-text, #4ade80)',
                          whiteSpace: 'pre',
                          overflowX: 'auto'
                        }}
                      >
                        {sampleTestCases[activeSampleIndex].expected}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                // TAB 1: TERMINAL OUTPUT
                <div>
                  {!compilerOutput && !isCompiling && (
                    <div style={{ color: 'var(--arena-text-subtle, #64748b)', fontStyle: 'italic', padding: '0.8rem 0', fontSize: '0.82rem' }}>
                      Press &quot;Run&quot; (or Ctrl+Enter) to compile and execute code against input.
                    </div>
                  )}
                  {isCompiling && (
                    <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0', fontSize: '0.82rem' }}>
                      <i className="fa-solid fa-circle-notch fa-spin"></i>
                      Compiling with {config.name} ({config.version})...
                    </div>
                  )}
                  {compilerOutput && (
                    <div>
                      {compilerOutput.isMatch !== undefined && (
                        <div
                          style={{
                            marginBottom: '0.6rem',
                            padding: '0.45rem 0.7rem',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            background: compilerOutput.isMatch ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: compilerOutput.isMatch ? '#16a34a' : '#dc2626',
                            border: `1px solid ${compilerOutput.isMatch ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                          }}
                        >
                          {compilerOutput.isMatch ? (
                            <span><i className="fa-solid fa-circle-check" style={{ marginRight: '0.35rem' }}></i>Test case passed! Output matches expected.</span>
                          ) : (
                            <span><i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '0.35rem' }}></i>Expected: <code>{compilerOutput.expectedOutput}</code></span>
                          )}
                        </div>
                      )}
                      {compilerOutput.stdout && (
                        <div style={{ marginBottom: '0.6rem' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--arena-output-text, #4ade80)', marginBottom: '0.2rem', fontWeight: 600 }}>STDOUT:</div>
                          <pre style={{ margin: 0, color: 'var(--arena-output-text, #4ade80)', background: 'var(--arena-pre-bg, #090d14)', padding: '0.6rem', borderRadius: '6px', fontFamily: "'JetBrains Mono', Consolas, monospace", fontSize: '0.8rem', whiteSpace: 'pre', overflowX: 'auto', border: '1px solid var(--arena-border, rgba(74, 222, 128, 0.15))', lineHeight: '1.45' }}>
                            {compilerOutput.stdout}
                          </pre>
                        </div>
                      )}
                      {compilerOutput.stderr && (
                        <div style={{ marginBottom: '0.6rem' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--error, #ef4444)', marginBottom: '0.2rem', fontWeight: 600 }}>STDERR:</div>
                          <pre style={{ margin: 0, color: '#dc2626', background: 'rgba(239, 68, 68, 0.08)', padding: '0.6rem', borderRadius: '6px', fontFamily: "'JetBrains Mono', Consolas, monospace", fontSize: '0.8rem', whiteSpace: 'pre-wrap', border: '1px solid rgba(239, 68, 68, 0.25)', lineHeight: '1.45' }}>
                            {compilerOutput.stderr}
                          </pre>
                        </div>
                      )}
                      {!compilerOutput.stdout && !compilerOutput.stderr && (
                        <div style={{ color: 'var(--arena-text-subtle, #64748b)', fontStyle: 'italic', fontSize: '0.82rem' }}>Program finished with no output.</div>
                      )}
                      {compilerOutput.executionTime && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--arena-text-muted, #858585)', marginTop: '0.4rem' }}>
                          Execution time: <strong style={{ color: 'var(--arena-text, #ffffff)' }}>{compilerOutput.executionTime}</strong>
                          {compilerOutput.memory && <> | Memory: <strong style={{ color: 'var(--arena-text, #ffffff)' }}>{compilerOutput.memory}</strong></>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* VS CODE BOTTOM STATUS BAR                                    */}
      {/* ============================================================ */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--arena-status-bg, #0284c7)',
          color: 'var(--arena-status-text, #ffffff)',
          fontSize: '0.72rem',
          padding: '0 0.8rem',
          height: '24px',
          userSelect: 'none',
          flexShrink: 0
        }}
      >
        {/* Left Status Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>
            <i className="fa-solid fa-code-branch" style={{ marginRight: '0.3rem' }}></i>
            main
          </span>
          <span style={{ opacity: 0.9 }}>
            {config.fileName}
          </span>
        </div>

        {/* Right Status Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          <span>Spaces: {config.tabSpaces.length}</span>
          <span>UTF-8</span>
          <span>{config.name} ({config.version})</span>
          <span style={{ opacity: 0.85 }}>
            {isFullscreen ? 'Esc: Exit Fullscreen' : 'Ctrl+Enter: Run'}
          </span>
        </div>
      </div>
    </div>
  );
}
