import React, { useState, useEffect, useRef, useMemo, useContext } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-python.js';
import 'prismjs/components/prism-c.js';
import 'prismjs/components/prism-cpp.js';
import 'prismjs/components/prism-java.js';
import 'prismjs/components/prism-sql.js';
import { AuthContext } from '../context/AuthContext.jsx';
import { OPEN_COMPILER_LANGUAGES } from '../data/openCompilerConfig.js';

export default function OpenCompilerModal({ isOpen, onClose }) {
  const { apiFetch } = useContext(AuthContext);

  const [selectedLang, setSelectedLang] = useState('python');
  const [codeByLang, setCodeByLang] = useState(() => {
    const map = {};
    Object.keys(OPEN_COMPILER_LANGUAGES).forEach(k => {
      map[k] = OPEN_COMPILER_LANGUAGES[k].defaultCode;
    });
    return map;
  });
  const [code, setCode] = useState(OPEN_COMPILER_LANGUAGES.python.defaultCode);
  const [stdin, setStdin] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilerOutput, setCompilerOutput] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  const textareaRef = useRef(null);
  const preRef = useRef(null);
  const lineNumbersRef = useRef(null);

  const currentLangConfig = OPEN_COMPILER_LANGUAGES[selectedLang] || OPEN_COMPILER_LANGUAGES.python;

  // Sync code when switching languages
  const handleSwitchLanguage = (langId) => {
    if (langId === selectedLang) return;
    setCodeByLang(prev => {
      const updated = { ...prev, [selectedLang]: code };
      const nextCode = updated[langId] || OPEN_COMPILER_LANGUAGES[langId]?.defaultCode || '';
      setCode(nextCode);
      return updated;
    });
    setSelectedLang(langId);
    setCompilerOutput(null);
  };

  const handleReset = () => {
    const defaultSnippet = OPEN_COMPILER_LANGUAGES[selectedLang]?.defaultCode || '';
    setCode(defaultSnippet);
    setCodeByLang(prev => ({ ...prev, [selectedLang]: defaultSnippet }));
    setCompilerOutput(null);
  };

  // Scroll sync
  const handleScroll = (e) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.target.scrollTop;
      preRef.current.scrollLeft = e.target.scrollLeft;
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.target.scrollTop;
    }
  };

  const updateCursorPosition = (elem) => {
    if (!elem) return;
    const textBefore = elem.value.substring(0, elem.selectionStart);
    const lines = textBefore.split('\n');
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1
    });
  };

  const handleKeyDown = (e) => {
    // Run shortcut Ctrl + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
      return;
    }

    // Tab indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const spaces = currentLangConfig.tabSpaces || '    ';
      const next = code.substring(0, start) + spaces + code.substring(end);
      setCode(next);
      setCodeByLang(prev => ({ ...prev, [selectedLang]: next }));
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + spaces.length;
          updateCursorPosition(textareaRef.current);
        }
      });
    }
  };

  const handleRun = async () => {
    if (isCompiling) return;
    setIsCompiling(true);
    setCompilerOutput(null);

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

      setCompilerOutput({
        ...data,
        executionTime: data.executionTime || `${elapsed}s`,
        memory: data.memory || '2.4 MB'
      });
    } catch (err) {
      setCompilerOutput({
        status: 'Runtime Error',
        stdout: '',
        stderr: err.message || 'Network error running code compiler.',
        executionTime: '0.00s'
      });
    } finally {
      setIsCompiling(false);
    }
  };

  // Close on Escape when not full screen
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isFullscreen]);

  const highlightedCode = useMemo(() => {
    const prismLang = Prism.languages[currentLangConfig.prismLang] || Prism.languages.javascript;
    return Prism.highlight(code || '', prismLang, currentLangConfig.prismLang);
  }, [code, currentLangConfig]);

  const lineCount = useMemo(() => Math.max(1, code.split('\n').length), [code]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(5, 8, 15, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isFullscreen ? 0 : '1.5rem'
      }}
    >
      <div
        className="vscode-ide-workbench arena-layout"
        style={{
          width: isFullscreen ? '100vw' : '94vw',
          maxWidth: isFullscreen ? '100vw' : '1350px',
          height: isFullscreen ? '100vh' : '90vh',
          background: 'var(--arena-panel-bg, #0a0e17)',
          border: isFullscreen ? 'none' : '1px solid var(--arena-border, #1e293b)',
          borderRadius: isFullscreen ? 0 : '12px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(56, 189, 248, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem 1.25rem',
            background: 'var(--arena-header-bg, #0f172a)',
            borderBottom: '1px solid var(--arena-border, #1e293b)',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          {/* Title & Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(168, 85, 247, 0.2))',
                color: 'var(--secondary, #38bdf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}
            >
              <i className="fa-solid fa-terminal"></i>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--arena-text, #f8fafc)' }}>
                  Open Compiler & Execution Sandbox
                </h3>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '999px',
                    background: 'rgba(34, 197, 94, 0.15)',
                    color: '#16a34a',
                    border: '1px solid rgba(34, 197, 94, 0.3)'
                  }}
                >
                  All 11 Languages
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--arena-text-muted, #94a3b8)' }}>
                Free-form sandbox to write, test, and run code with custom input
              </span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Fullscreen toggle */}
            <button
              type="button"
              className="btn btn-sm btn-glass"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            >
              <i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
            </button>

            {/* Close Button */}
            <button
              type="button"
              className="btn btn-sm btn-glass"
              onClick={onClose}
              title="Close Compiler (Esc)"
              style={{ fontSize: '0.85rem', padding: '0.35rem 0.7rem', color: 'var(--error, #f87171)' }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        {/* LANGUAGE SELECTOR TOOLBAR */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.5rem 1.25rem',
            background: 'var(--arena-header-bg, #070a13)',
            borderBottom: '1px solid var(--arena-border, #161e2e)',
            gap: '0.8rem',
            flexWrap: 'wrap'
          }}
        >
          {/* UP-DOWN LANGUAGE DROPDOWN */}
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
            <i
              className={currentLangConfig.icon}
              style={{
                position: 'absolute',
                left: '0.55rem',
                color: currentLangConfig.color || 'var(--primary)',
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
                minWidth: '160px'
              }}
              title="Select Programming Language"
            >
              {Object.values(OPEN_COMPILER_LANGUAGES).map(lang => (
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

          {/* Quick Actions & Run Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
            <button
              type="button"
              className="btn btn-sm btn-glass"
              onClick={handleReset}
              title="Reset to starter template"
              style={{ fontSize: '0.74rem', padding: '0.3rem 0.6rem' }}
            >
              <i className="fa-solid fa-rotate-left" style={{ marginRight: '0.25rem' }}></i>
              Reset
            </button>

            <button
              type="button"
              className="btn btn-sm btn-glass"
              onClick={() => {
                navigator.clipboard.writeText(code);
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
              }}
              style={{ fontSize: '0.74rem', padding: '0.3rem 0.6rem' }}
            >
              <i className={copiedCode ? 'fa-solid fa-check' : 'fa-regular fa-copy'} style={{ marginRight: '0.25rem' }}></i>
              {copiedCode ? 'Copied' : 'Copy'}
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRun}
              disabled={isCompiling}
              style={{
                padding: '0.35rem 1.15rem',
                fontSize: '0.78rem',
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
                  <span>Executing...</span>
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

        {/* WORKSPACE BODY (SPLIT: CODE EDITOR ON LEFT/TOP, INPUT/OUTPUT ON RIGHT/BOTTOM) */}
        <div className="arena-split-container" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* LEFT: CODE EDITOR */}
          <div className="arena-left-panel" style={{ flex: '1 1 60%', display: 'flex', flexDirection: 'column', background: 'var(--arena-bg, #1e1e1e)', borderRight: '1px solid var(--arena-border, #1e293b)', overflow: 'hidden' }}>
            <div style={{ position: 'relative', flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* Line numbers */}
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

              {/* Editor + Highlight */}
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
                  placeholder={`// Write your ${currentLangConfig.label} code here...`}
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

            {/* Footer status bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.3rem 0.8rem',
                background: 'var(--arena-status-bg, #0284c7)',
                borderTop: '1px solid var(--arena-border, #1e293b)',
                fontSize: '0.7rem',
                color: 'var(--arena-status-text, #ffffff)'
              }}
            >
              <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
              <span>{currentLangConfig.label}</span>
              <span>Ctrl+Enter to Execute</span>
            </div>
          </div>

          {/* RIGHT: STDIN & TERMINAL OUTPUT */}
          <div className="arena-right-panel" style={{ flex: '1 1 40%', display: 'flex', flexDirection: 'column', background: 'var(--arena-panel-bg, #0a0e17)', overflow: 'hidden' }}>
            {/* STDIN SECTION */}
            <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid var(--arena-border, #1a2233)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--arena-text, #cbd5e1)' }}>
                  <i className="fa-solid fa-keyboard" style={{ marginRight: '0.35rem', color: 'var(--secondary, #38bdf8)' }}></i>
                  Standard Input (stdin)
                </span>
                {stdin && (
                  <button
                    type="button"
                    onClick={() => setStdin('')}
                    style={{ background: 'none', border: 'none', color: 'var(--arena-text-muted, #64748b)', fontSize: '0.7rem', cursor: 'pointer' }}
                  >
                    Clear Input
                  </button>
                )}
              </div>
              <textarea
                rows="4"
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Optional input passed to stdin..."
                style={{
                  width: '100%',
                  background: 'var(--arena-pre-bg, #06090f)',
                  border: '1px solid var(--arena-border, #1e293b)',
                  borderRadius: '6px',
                  color: 'var(--arena-text, #e2e8f0)',
                  padding: '0.5rem 0.7rem',
                  fontFamily: "'JetBrains Mono', Consolas, monospace",
                  fontSize: '0.8rem',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* TERMINAL OUTPUT SECTION */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0.8rem 1rem', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--arena-text, #cbd5e1)' }}>
                  <i className="fa-solid fa-terminal" style={{ marginRight: '0.35rem', color: 'var(--arena-output-text, #4ade80)' }}></i>
                  Execution Terminal
                </span>
                {compilerOutput && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      background: compilerOutput.status === 'Accepted' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: compilerOutput.status === 'Accepted' ? '#16a34a' : '#dc2626',
                      border: `1px solid ${compilerOutput.status === 'Accepted' ? '#16a34a' : '#dc2626'}`
                    }}
                  >
                    {compilerOutput.status}
                    {compilerOutput.executionTime ? ` • ${compilerOutput.executionTime}` : ''}
                  </span>
                )}
              </div>

              {!compilerOutput && !isCompiling && (
                <div style={{ color: 'var(--arena-text-subtle, #64748b)', fontStyle: 'italic', padding: '1.5rem 0', textAlign: 'center', fontSize: '0.82rem' }}>
                  Click &quot;Run Code&quot; (Ctrl+Enter) to compile and execute your code.
                </div>
              )}

              {isCompiling && (
                <div style={{ color: 'var(--primary)', padding: '1.5rem 0', textAlign: 'center', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  Compiling & running against engine...
                </div>
              )}

              {compilerOutput && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {compilerOutput.stdout && (
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--arena-output-text, #4ade80)', marginBottom: '0.2rem', fontWeight: 600 }}>STDOUT:</div>
                      <pre
                        style={{
                          margin: 0,
                          background: 'var(--arena-pre-bg, #06090f)',
                          padding: '0.65rem 0.8rem',
                          borderRadius: '6px',
                          color: 'var(--arena-output-text, #4ade80)',
                          fontFamily: "'JetBrains Mono', Consolas, monospace",
                          fontSize: '0.82rem',
                          whiteSpace: 'pre-wrap',
                          border: '1px solid var(--arena-border, rgba(74, 222, 128, 0.15))'
                        }}
                      >
                        {compilerOutput.stdout}
                      </pre>
                    </div>
                  )}

                  {compilerOutput.stderr && (
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--error, #f87171)', marginBottom: '0.2rem', fontWeight: 600 }}>STDERR:</div>
                      <pre
                        style={{
                          margin: 0,
                          background: 'rgba(239, 68, 68, 0.08)',
                          padding: '0.65rem 0.8rem',
                          borderRadius: '6px',
                          color: '#dc2626',
                          fontFamily: "'JetBrains Mono', Consolas, monospace",
                          fontSize: '0.82rem',
                          whiteSpace: 'pre-wrap',
                          border: '1px solid rgba(239, 68, 68, 0.25)'
                        }}
                      >
                        {compilerOutput.stderr}
                      </pre>
                    </div>
                  )}

                  <div style={{ fontSize: '0.7rem', color: 'var(--arena-text-subtle, #64748b)', marginTop: '0.4rem', borderTop: '1px solid var(--arena-border, #1a2233)', paddingTop: '0.4rem' }}>
                    Execution Time: <strong style={{ color: 'var(--arena-text, #cbd5e1)' }}>{compilerOutput.executionTime}</strong> • Memory: <strong style={{ color: 'var(--arena-text, #cbd5e1)' }}>{compilerOutput.memory}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
