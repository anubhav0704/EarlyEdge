import React, { useState, useEffect, useRef, useMemo, useContext } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-python.js';
import 'prismjs/components/prism-c.js';
import 'prismjs/components/prism-cpp.js';
import 'prismjs/components/prism-java.js';
import 'prismjs/components/prism-sql.js';
import { AuthContext } from '../context/AuthContext.jsx';
import {
  generateFullDsaQuestions,
  generateFullSqlQuestions,
  generateFullOopsQuestions
} from '../data/practiceQuestionsPool.js';
import { getThreeSampleTestCases } from '../data/dsaTestCases.js';
import OpenCompilerModal from '../components/OpenCompilerModal.jsx';

const LANGUAGE_CONFIGS = {
  python: { id: 'python', label: 'Python 3.12', icon: 'fa-brands fa-python', color: '#38bdf8', prismLang: 'python', tabSpaces: '    ' },
  cpp: { id: 'cpp', label: 'C++ 20 (g++)', icon: 'fa-solid fa-code', color: '#f59e0b', prismLang: 'cpp', tabSpaces: '    ' },
  java: { id: 'java', label: 'Java 21 (OpenJDK)', icon: 'fa-brands fa-java', color: '#ef4444', prismLang: 'java', tabSpaces: '    ' },
  javascript: { id: 'javascript', label: 'JavaScript (Node 20)', icon: 'fa-brands fa-js', color: '#facc15', prismLang: 'javascript', tabSpaces: '  ' },
  sql: { id: 'sql', label: 'ANSI SQL', icon: 'fa-solid fa-database', color: '#06b6d4', prismLang: 'sql', tabSpaces: '  ' }
};

const DEFAULT_TEMPLATES = {
  python: `from typing import List, Dict, Tuple, Set, Optional
import collections
import heapq
import math

class Solution:
    def solve(self):
        # Write your logic here
        pass
`,
  cpp: `#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <map>
#include <set>
#include <queue>
#include <stack>
#include <algorithm>
#include <cmath>
#include <climits>

using namespace std;

class Solution {
public:
    void solve() {
        // Write your logic here
        
    }
};
`,
  java: `import java.util.*;
import java.io.*;

class Solution {
    public void solve() {
        // Write your logic here
        
    }
}
`,
  javascript: `/**
 * Write your solution logic below
 */
function solve() {
  // Write your logic here
  
}
`,
  sql: `-- Write your ANSI SQL query statement below
SELECT 
    
`
};

export default function PracticeArena() {
  const { user, apiFetch } = useContext(AuthContext);

  // Active track: 'dsa' | 'sql' | 'oops'
  const [activeCategory, setActiveCategory] = useState('dsa');

  // Pre-seed 500+ DSA, 120+ SQL, 120+ OOPS
  const [dsaList, setDsaList] = useState(() => generateFullDsaQuestions());
  const [sqlList, setSqlList] = useState(() => generateFullSqlQuestions());
  const [oopsList, setOopsList] = useState(() => generateFullOopsQuestions());

  // Search & Google-style suggestions
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = useState(-1);
  const searchContainerRef = useRef(null);

  // Filters
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Selected Problem ID
  const [selectedProblemId, setSelectedProblemId] = useState('dsa_1');
  const [activeSampleCaseIndex, setActiveSampleCaseIndex] = useState(0);

  // Editor & Compiler State
  const [selectedLang, setSelectedLang] = useState('python');
  const [codeByLang, setCodeByLang] = useState({ ...DEFAULT_TEMPLATES });
  const [code, setCode] = useState(DEFAULT_TEMPLATES.python);
  const [stdin, setStdin] = useState('');
  const [activeTestTab, setActiveTestTab] = useState(0); // 0 = STDIN / Test Cases, 1 = Terminal Output, 2 = Submissions History
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilerOutput, setCompilerOutput] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInput, setCopiedInput] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOpenCompilerOpen, setIsOpenCompilerOpen] = useState(false);
  const [isDriverCodeOpen, setIsDriverCodeOpen] = useState(false);
  const [activeProblemTab, setActiveProblemTab] = useState('description'); // 'description' | 'explanation'

  // User Stats & Solved Tracking
  const [practiceStats, setPracticeStats] = useState({
    totalSolved: 0,
    totalAttempts: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
    dsaSolved: 0,
    sqlSolved: 0,
    oopsSolved: 0
  });
  const [progressMap, setProgressMap] = useState({});
  const [submissionHistory, setSubmissionHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Background AI auto-fetching state
  const autoFetchedCategoriesRef = useRef(new Set());
  const [isAutoFetchingAi, setIsAutoFetchingAi] = useState(false);
  const [aiMessage, setAiMessage] = useState(null);

  // -------------------------------------------------------------
  // RESIZABLE SPLITTERS STATE (HORIZONTAL & VERTICAL)
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

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch user practice stats & progress from backend
  const fetchStats = async () => {
    try {
      const res = await apiFetch('/api/practice/stats');
      const data = await res.json();
      if (data.success) {
        setPracticeStats(data.stats || {});
        setProgressMap(data.progressMap || {});
      }
    } catch (err) {
      console.warn('Could not load practice stats from backend:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Questions for active category
  const currentCategoryList = useMemo(() => {
    if (activeCategory === 'sql') return sqlList;
    if (activeCategory === 'oops') return oopsList;
    return dsaList;
  }, [activeCategory, dsaList, sqlList, oopsList]);

  // Ensure selectedProblemId matches category when switching tabs
  useEffect(() => {
    if (currentCategoryList.length > 0) {
      const exists = currentCategoryList.some(p => p.id === selectedProblemId);
      if (!exists) {
        setSelectedProblemId(currentCategoryList[0].id);
      }
    }
  }, [activeCategory, currentCategoryList]);

  // Active Problem strictly resolved from selectedProblemId (NEVER jumps while typing in search)
  const activeProblem = useMemo(() => {
    return currentCategoryList.find(p => p.id === selectedProblemId) || currentCategoryList[0] || {};
  }, [currentCategoryList, selectedProblemId]);

  // Current problem index in the current category list
  const currentProblemIndex = useMemo(() => {
    const idx = currentCategoryList.findIndex(p => p.id === activeProblem.id);
    return idx >= 0 ? idx : 0;
  }, [currentCategoryList, activeProblem.id]);

  // Unique topics in current category for filter dropdown
  const uniqueTopics = useMemo(() => {
    const set = new Set();
    currentCategoryList.forEach(p => { if (p.topic) set.add(p.topic); });
    return Array.from(set).sort();
  }, [currentCategoryList]);

  // Filtered Questions for difficulty/topic/status filters
  const filteredQuestions = useMemo(() => {
    return currentCategoryList.filter(p => {
      // Difficulty filter
      if (selectedDifficulty !== 'All' && p.difficulty !== selectedDifficulty) {
        return false;
      }

      // Topic filter
      if (selectedTopic !== 'All' && p.topic !== selectedTopic) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'All') {
        const prog = progressMap[p.id];
        const status = prog?.status || 'Unsolved';
        if (selectedStatus === 'Solved' && status !== 'Solved') return false;
        if (selectedStatus === 'Attempted' && status !== 'Attempted') return false;
        if (selectedStatus === 'Unsolved' && status === 'Solved') return false;
      }

      return true;
    });
  }, [currentCategoryList, selectedDifficulty, selectedTopic, selectedStatus, progressMap]);

  // Google Search-style live suggestions (Matches by #number, title, topic, difficulty)
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim().replace('#', '');
    return currentCategoryList.filter(p => {
      const numStr = String(p.number || '');
      const title = (p.title || '').toLowerCase();
      const topic = (p.topic || '').toLowerCase();
      const diff = (p.difficulty || '').toLowerCase();
      return numStr.includes(q) || title.includes(q) || topic.includes(q) || diff.includes(q);
    }).slice(0, 8); // Top 8 suggestions
  }, [currentCategoryList, searchQuery]);

  // Problem Selection Handler: Only changes problem when user explicitly selects a suggestion
  const handleSelectProblem = (prob) => {
    if (!prob) return;
    setSelectedProblemId(prob.id);
    setSearchQuery(prob.title);
    setShowSuggestions(false);
    setHighlightedSuggestionIndex(-1);
  };

  // Keyboard navigation inside search bar
  const handleSearchInputKeyDown = (e) => {
    if (!showSuggestions || searchSuggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (searchSuggestions.length > 0) {
          handleSelectProblem(searchSuggestions[0]);
        }
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedSuggestionIndex(prev => (prev + 1) % searchSuggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedSuggestionIndex(prev => (prev - 1 + searchSuggestions.length) % searchSuggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = highlightedSuggestionIndex >= 0 ? searchSuggestions[highlightedSuggestionIndex] : searchSuggestions[0];
      if (target) {
        handleSelectProblem(target);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Search Button Click Handler
  const handleSearchButtonClick = () => {
    if (highlightedSuggestionIndex >= 0 && searchSuggestions[highlightedSuggestionIndex]) {
      handleSelectProblem(searchSuggestions[highlightedSuggestionIndex]);
    } else if (searchSuggestions.length > 0) {
      handleSelectProblem(searchSuggestions[0]);
    } else {
      setShowSuggestions(false);
    }
  };

  // Sample test cases for active problem
  const sampleTestCases = useMemo(() => {
    return getThreeSampleTestCases(activeProblem);
  }, [activeProblem]);

  // Background Auto-fetch questions via Groq AI (automatically without manual button)
  useEffect(() => {
    if (autoFetchedCategoriesRef.current.has(activeCategory)) return;
    autoFetchedCategoriesRef.current.add(activeCategory);

    let isMounted = true;
    const autoFetchAiQuestions = async () => {
      setIsAutoFetchingAi(true);
      try {
        const startNum = currentCategoryList.length + 1;
        const res = await apiFetch('/api/practice/generate-questions', {
          method: 'POST',
          body: JSON.stringify({
            category: activeCategory,
            topic: activeCategory === 'sql' ? 'Advanced Analytics & Windowing' : activeCategory === 'oops' ? 'Enterprise Design Patterns' : 'Graph Algorithms & Dynamic Programming',
            difficulty: 'Medium',
            startNumber: startNum,
            count: 6
          })
        });
        const data = await res.json();
        if (isMounted && data.success && data.questions && data.questions.length > 0) {
          if (activeCategory === 'sql') {
            setSqlList(prev => [...prev, ...data.questions]);
          } else if (activeCategory === 'oops') {
            setOopsList(prev => [...prev, ...data.questions]);
          } else {
            setDsaList(prev => [...prev, ...data.questions]);
          }
        }
      } catch (err) {
        // Silently keep using the built-in 500+ library
      } finally {
        if (isMounted) setIsAutoFetchingAi(false);
      }
    };

    const timer = setTimeout(autoFetchAiQuestions, 1000);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [activeCategory, currentCategoryList.length]);

  // Sync function starter code when switching problem or category
  useEffect(() => {
    const targetLang = activeCategory === 'sql' ? 'sql' : (selectedLang === 'sql' ? 'python' : selectedLang);
    if (targetLang !== selectedLang) {
      setSelectedLang(targetLang);
    }
    const starter = activeProblem?.starterCode?.[targetLang] || DEFAULT_TEMPLATES[targetLang] || '';
    setCode(starter);
    setCodeByLang(prev => ({ ...prev, [targetLang]: starter }));
    setIsDriverCodeOpen(false); // Reset driver code view to minimized
  }, [activeCategory, activeProblem?.id]);

  // Sync STDIN and reset compiler output when changing problem
  useEffect(() => {
    if (sampleTestCases && sampleTestCases.length > 0) {
      setStdin(sampleTestCases[0]?.input || '');
      setActiveSampleCaseIndex(0);
    }
    setCompilerOutput(null);
  }, [activeProblem?.id]);

  // Fetch problem submission history
  const fetchHistory = async (probId) => {
    if (!probId) return;
    setLoadingHistory(true);
    try {
      const res = await apiFetch(`/api/practice/history/${probId}`);
      const data = await res.json();
      if (data.success) {
        setSubmissionHistory(data.history || []);
      }
    } catch (err) {
      console.warn('Could not fetch submission history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeProblem?.id) {
      fetchHistory(activeProblem.id);
    }
  }, [activeProblem?.id]);

  // -------------------------------------------------------------
  // RESIZE DRAGGING EVENT LISTENERS
  // -------------------------------------------------------------
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingH && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const newRatio = Math.max(22, Math.min(78, (offsetX / rect.width) * 100));
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
  const updateCursorPosition = (ta) => {
    if (!ta) return;
    const textBefore = ta.value.substring(0, ta.selectionStart);
    const lines = textBefore.split('\n');
    setCursorPos({ line: lines.length, col: lines[lines.length - 1].length + 1 });
  };

  // Synchronize scrolling between textarea and pre layer
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

  // Keyboard navigation & smart editing
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
      const spaces = LANGUAGE_CONFIGS[selectedLang]?.tabSpaces || '  ';
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
      const nextCode = updated[langId] || activeProblem?.starterCode?.[langId] || DEFAULT_TEMPLATES[langId] || '';
      setCode(nextCode);
      return updated;
    });
    setSelectedLang(langId);
    setCompilerOutput(null);
  };

  // Reset Function Template
  const handleResetTemplate = () => {
    if (window.confirm(`Reset code to standard ${LANGUAGE_CONFIGS[selectedLang]?.label} function stub?`)) {
      const def = activeProblem?.starterCode?.[selectedLang] || DEFAULT_TEMPLATES[selectedLang] || '';
      setCode(def);
      setCodeByLang(prev => ({ ...prev, [selectedLang]: def }));
      setCompilerOutput(null);
    }
  };

  // Compile, Run & Record Practice Submission
  const handleCompileAndRun = async () => {
    setIsCompiling(true);
    setCompilerOutput(null);
    setActiveTestTab(1); // Auto-focus output tab
    const startTime = performance.now();

    // Prepare complete runnable code by wrapping with pre-written driver code if needed
    let runnableCode = code;
    const driver = activeProblem?.mainFunction?.[selectedLang];
    if (driver) {
      if (selectedLang === 'python' && !code.includes('__main__')) {
        runnableCode = `${code}\n\n${driver}`;
      } else if (selectedLang === 'cpp' && !code.includes('main(')) {
        runnableCode = `${code}\n\n${driver}`;
      } else if (selectedLang === 'java' && !code.includes('public static void main')) {
        if (code.includes('public class') && code.trim().endsWith('}')) {
          const lastBrace = code.lastIndexOf('}');
          runnableCode = `${code.substring(0, lastBrace)}\n    ${driver}\n}`;
        } else {
          runnableCode = `${code}\n\n${driver}`;
        }
      } else if (selectedLang === 'javascript' && !code.includes('console.log(')) {
        runnableCode = `${code}\n\n${driver}`;
      }
    }

    try {
      const res = await apiFetch('/api/ai/compile-run', {
        method: 'POST',
        body: JSON.stringify({
          language: selectedLang,
          code: runnableCode,
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

      // Record to backend practice tracking!
      try {
        const submitRes = await apiFetch('/api/practice/submit', {
          method: 'POST',
          body: JSON.stringify({
            problemId: activeProblem.id,
            problemNumber: activeProblem.number || 1,
            title: activeProblem.title,
            category: activeCategory,
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
          setProgressMap(prev => ({
            ...prev,
            [activeProblem.id]: submitData.record
          }));
          fetchStats(); // Update totals
          fetchHistory(activeProblem.id); // Update history tab
        }
      } catch (subErr) {
        console.warn('Could not record submission to database:', subErr);
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

  // Generate / Fetch Fresh Questions via Groq AI
  const handleFetchAiQuestions = async () => {
    setIsGeneratingAi(true);
    setAiMessage(null);
    try {
      const startNum = currentCategoryList.length + 1;
      const res = await apiFetch('/api/practice/generate-questions', {
        method: 'POST',
        body: JSON.stringify({
          category: activeCategory,
          topic: selectedTopic !== 'All' ? selectedTopic : 'Dynamic Programming & Advanced Structures',
          difficulty: selectedDifficulty !== 'All' ? selectedDifficulty : 'Medium',
          startNumber: startNum,
          count: 5
        })
      });
      const data = await res.json();
      if (data.success && data.questions && data.questions.length > 0) {
        if (activeCategory === 'sql') {
          setSqlList(prev => [...data.questions, ...prev]);
        } else if (activeCategory === 'oops') {
          setOopsList(prev => [...data.questions, ...prev]);
        } else {
          setDsaList(prev => [...data.questions, ...prev]);
        }
        setAiMessage(`Successfully fetched ${data.questions.length} new practice questions via Groq AI!`);
        setSelectedProblemIndex(0);
      } else {
        setAiMessage('Loaded latest algorithm bank successfully.');
      }
    } catch (err) {
      setAiMessage('Failed to connect to AI generator. Using built-in 500+ library.');
    } finally {
      setIsGeneratingAi(false);
      setTimeout(() => setAiMessage(null), 4000);
    }
  };

  // Highlight code
  const currentLangConfig = LANGUAGE_CONFIGS[selectedLang] || LANGUAGE_CONFIGS.python;
  const highlightedCode = useMemo(() => {
    const prismLang = Prism.languages[currentLangConfig.prismLang] || Prism.languages.javascript;
    return Prism.highlight(code || '', prismLang, currentLangConfig.prismLang);
  }, [code, currentLangConfig]);

  const lineCount = useMemo(() => {
    return Math.max(1, code.split('\n').length);
  }, [code]);

  // Current problem progress status
  const currentProblemProgress = progressMap[activeProblem?.id];

  return (
    <div
      className="vscode-ide-workbench arena-layout"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: isFullscreen ? '100vh' : 'calc(100vh - 75px)',
        position: isFullscreen ? 'fixed' : 'relative',
        inset: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 99999 : 1,
        background: 'var(--arena-bg, #090d16)',
        color: 'var(--arena-text, #e2e8f0)',
        overflow: 'hidden'
      }}
    >
      {/* ============================================================ */}
      {/* CLEAN TOP NAVBAR: BRANDING, TRACKS, SEARCH, AND ACTIONS       */}
      {/* ============================================================ */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.45rem 1.2rem',
          background: 'var(--arena-header-bg, #0d121d)',
          borderBottom: '1px solid var(--arena-border, #1a2335)',
          gap: '0.8rem',
          minHeight: '44px',
          flexWrap: 'wrap'
        }}
      >
        {/* Left: Branding & Track Switcher Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'rgba(20, 184, 166, 0.15)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
                border: '1px solid rgba(20, 184, 166, 0.3)'
              }}
            >
              <i className="fa-solid fa-laptop-code"></i>
            </div>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--arena-text, #f8fafc)', letterSpacing: '-0.01em' }}>
              Code Arena
            </span>
          </div>

          {/* Compact Track Switcher Dropdown */}
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="arena-select"
            style={{
              background: 'var(--arena-select-bg, #121826)',
              color: 'var(--arena-text, #e2e8f0)',
              border: '1px solid var(--arena-border, #1f2737)',
              borderRadius: '6px',
              padding: '0.22rem 0.6rem',
              fontSize: '0.76rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="dsa">⌨ DSA ({dsaList.length})</option>
            <option value="sql">⊞ SQL ({sqlList.length})</option>
            <option value="oops">◈ OOPS ({oopsList.length})</option>
          </select>
        </div>

        {/* Center: Google-Style Search with Suggestions Dropdown */}
        <div ref={searchContainerRef} style={{ position: 'relative', flex: '0 1 360px', width: '100%' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <i
              className="fa-solid fa-magnifying-glass"
              style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '0.75rem' }}
            ></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
                setHighlightedSuggestionIndex(-1);
              }}
              onFocus={() => {
                if (searchQuery.trim()) setShowSuggestions(true);
              }}
              onKeyDown={handleSearchInputKeyDown}
              placeholder={`Search ${currentCategoryList.length} questions...`}
              style={{
                width: '100%',
                padding: '0.3rem 1.8rem 0.3rem 2rem',
                background: '#121826',
                border: showSuggestions && searchSuggestions.length > 0 ? '1px solid #38bdf8' : '1px solid #1f2737',
                borderRadius: '6px',
                color: '#e2e8f0',
                fontSize: '0.76rem',
                outline: 'none',
                boxShadow: showSuggestions && searchSuggestions.length > 0 ? '0 0 0 2px rgba(56, 189, 248, 0.2)' : 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setShowSuggestions(false);
                }}
                style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.72rem' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && searchQuery.trim() && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 5px)',
                left: 0,
                right: 0,
                background: '#0e1420',
                border: '1px solid #223049',
                borderRadius: '8px',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.85), 0 0 1px 1px rgba(56, 189, 248, 0.2)',
                zIndex: 99999,
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.68rem',
                  color: '#94a3b8',
                  background: '#090d16',
                  borderBottom: '1px solid #1b263b',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>
                  <i className="fa-solid fa-lightbulb" style={{ color: '#facc15', marginRight: '0.35rem' }}></i>
                  Suggestions ({searchSuggestions.length})
                </span>
                <span style={{ fontSize: '0.62rem', color: '#64748b' }}>↑↓ to navigate • Enter to select</span>
              </div>

              {searchSuggestions.length > 0 ? (
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {searchSuggestions.map((prob, idx) => {
                    const isHighlighted = idx === highlightedSuggestionIndex;
                    const isSol = progressMap[prob.id]?.status === 'Solved';
                    return (
                      <div
                        key={prob.id || idx}
                        onMouseEnter={() => setHighlightedSuggestionIndex(idx)}
                        onClick={() => handleSelectProblem(prob)}
                        style={{
                          padding: '0.45rem 0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.8rem',
                          cursor: 'pointer',
                          background: isHighlighted ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                          borderLeft: isHighlighted ? '3px solid #38bdf8' : '3px solid transparent',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                          <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.74rem', minWidth: '30px' }}>
                            #{prob.number}
                          </span>
                          <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.76rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {prob.title}
                          </span>
                        </div>

                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            background:
                              prob.difficulty === 'Easy'
                                ? 'rgba(34, 197, 94, 0.15)'
                                : prob.difficulty === 'Hard'
                                ? 'rgba(239, 68, 68, 0.15)'
                                : 'rgba(245, 158, 11, 0.15)',
                            color:
                              prob.difficulty === 'Easy'
                                ? '#4ade80'
                                : prob.difficulty === 'Hard'
                                ? '#f87171'
                                : '#fbbf24'
                          }}
                        >
                          {prob.difficulty}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '0.8rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>
                  No matching practice questions
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Solved Stats Pill, Open Compiler, Fullscreen */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
              fontSize: '0.72rem',
              color: '#4ade80',
              fontWeight: 700
            }}
          >
            <i className="fa-solid fa-circle-check"></i>
            <span>{practiceStats.totalSolved || 0} Solved</span>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={() => setIsOpenCompilerOpen(true)}
            title="Open Free Compiler Sandbox supporting all 11 programming languages"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.74rem',
              padding: '0.24rem 0.65rem',
              background: 'rgba(56, 189, 248, 0.1)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <i className="fa-solid fa-terminal" style={{ color: '#38bdf8' }}></i>
            <span>Open Compiler</span>
          </button>

          <button
            type="button"
            className="btn btn-sm btn-glass"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Enter Full Screen'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.74rem',
              padding: '0.24rem 0.55rem'
            }}
          >
            <i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
          </button>
        </div>
      </div>

      {/* AI Notification Banner if any */}
      {aiMessage && (
        <div style={{ background: 'rgba(20, 184, 166, 0.15)', color: 'var(--primary)', padding: '0.25rem 1rem', fontSize: '0.72rem', textAlign: 'center', borderBottom: '1px solid var(--primary)' }}>
          <i className="fa-solid fa-circle-check" style={{ marginRight: '0.35rem' }}></i> {aiMessage}
        </div>
      )}

      {/* ============================================================ */}
      {/* SECONDARY TOOLBAR: PROBLEM SELECTOR & CATEGORY FILTERS        */}
      {/* ============================================================ */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.3rem 1.2rem',
          background: '#090d15',
          borderBottom: '1px solid #161e2e',
          gap: '0.6rem',
          minHeight: '35px',
          flexWrap: 'wrap'
        }}
      >
        {/* Left: Problem Quick Navigator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            type="button"
            className="btn btn-sm btn-glass"
            disabled={currentProblemIndex <= 0}
            onClick={() => {
              if (currentProblemIndex > 0) {
                const prevProb = currentCategoryList[currentProblemIndex - 1];
                if (prevProb) handleSelectProblem(prevProb);
              }
            }}
            style={{ padding: '0.18rem 0.45rem', fontSize: '0.68rem', opacity: currentProblemIndex <= 0 ? 0.4 : 1 }}
            title="Previous Problem"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>

          <select
            value={activeProblem.id}
            onChange={(e) => {
              const target = currentCategoryList.find(p => p.id === e.target.value);
              if (target) handleSelectProblem(target);
            }}
            style={{
              background: '#121826',
              color: '#e2e8f0',
              border: '1px solid #1f2737',
              borderRadius: '5px',
              padding: '0.2rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              maxWidth: '280px',
              cursor: 'pointer'
            }}
          >
            {filteredQuestions.map((q, idx) => {
              const isSol = progressMap[q.id]?.status === 'Solved';
              return (
                <option key={q.id || idx} value={q.id}>
                  {isSol ? '✓ ' : ''}#{q.number || idx + 1}. {q.title} ({q.difficulty})
                </option>
              );
            })}
          </select>

          <button
            type="button"
            className="btn btn-sm btn-glass"
            disabled={currentProblemIndex >= currentCategoryList.length - 1}
            onClick={() => {
              if (currentProblemIndex < currentCategoryList.length - 1) {
                const nextProb = currentCategoryList[currentProblemIndex + 1];
                if (nextProb) handleSelectProblem(nextProb);
              }
            }}
            style={{ padding: '0.18rem 0.45rem', fontSize: '0.68rem', opacity: currentProblemIndex >= currentCategoryList.length - 1 ? 0.4 : 1 }}
            title="Next Problem"
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>

          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '0.12rem 0.45rem',
              borderRadius: '4px',
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
                  : '#fbbf24'
            }}
          >
            {activeProblem.difficulty || 'Medium'}
          </span>
          <span style={{ fontSize: '0.68rem', color: '#94a3b8', background: 'rgba(255,255,255,0.04)', padding: '0.12rem 0.45rem', borderRadius: '4px' }}>
            {activeProblem.topic || 'General'}
          </span>
        </div>

        {/* Right: Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            style={{ background: '#121826', color: '#cbd5e1', border: '1px solid #1f2737', borderRadius: '5px', padding: '0.18rem 0.45rem', fontSize: '0.72rem' }}
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            style={{ background: '#121826', color: '#cbd5e1', border: '1px solid #1f2737', borderRadius: '5px', padding: '0.18rem 0.45rem', fontSize: '0.72rem', maxWidth: '160px' }}
          >
            <option value="All">All Topics ({uniqueTopics.length})</option>
            {uniqueTopics.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ background: '#121826', color: '#cbd5e1', border: '1px solid #1f2737', borderRadius: '5px', padding: '0.18rem 0.45rem', fontSize: '0.72rem' }}
          >
            <option value="All">All Statuses</option>
            <option value="Solved">✓ Solved</option>
            <option value="Attempted">Attempted</option>
            <option value="Unsolved">Unsolved</option>
          </select>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MAIN WORKSPACE: RESIZABLE HORIZONTAL & VERTICAL SPLIT PANELS */}
      {/* ============================================================ */}
      <div
        ref={containerRef}
        className="arena-split-container"
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* ========================================================== */}
        {/* LEFT PANEL: QUESTION DETAILS, 3 TEST CASES, SOLVED STATUS */}
        {/* ========================================================== */}
        <div
          className="arena-left-panel"
          style={{
            width: `${splitRatioH}%`,
            minWidth: '280px',
            maxWidth: '80%',
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
              padding: '1.2rem 1.4rem',
              borderBottom: '1px solid var(--arena-border, #192233)',
              background: 'var(--arena-header-bg, #111724)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--arena-text-subtle, #64748b)', fontWeight: 700 }}>
                    #{activeProblem.number || selectedProblemIndex + 1}
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--arena-text, #f8fafc)' }}>
                    {activeProblem.title}
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
                  <span style={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                    {activeProblem.topic || 'General'}
                  </span>
                </div>
              </div>

              {/* Solved Status & Acceptance Badge */}
              <div style={{ textAlign: 'right' }}>
                {currentProblemProgress?.status === 'Solved' ? (
                  <div
                    style={{
                      padding: '0.3rem 0.65rem',
                      borderRadius: '6px',
                      background: 'rgba(34, 197, 94, 0.15)',
                      color: '#4ade80',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <i className="fa-solid fa-circle-check"></i>
                    <span>Solved ({currentProblemProgress.acceptedCount || 1}x Accepted)</span>
                  </div>
                ) : currentProblemProgress?.status === 'Attempted' ? (
                  <div
                    style={{
                      padding: '0.3rem 0.65rem',
                      borderRadius: '6px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#fbbf24',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <i className="fa-solid fa-rotate"></i>
                    <span>Attempted ({currentProblemProgress.attemptsCount} tries)</span>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Unsolved</span>
                )}

                {currentProblemProgress?.lastSolvedAt && (
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                    Solved: {new Date(currentProblemProgress.lastSolvedAt).toLocaleDateString()} {new Date(currentProblemProgress.lastSolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Problem Body */}
          <div style={{ padding: '1.4rem', flex: 1 }}>
            {/* Navigation Tabs: Problem & Cases vs. Solution Approach */}
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.2rem', borderBottom: '1px solid var(--arena-border, #1a2233)', paddingBottom: '0.4rem' }}>
              <button
                type="button"
                onClick={() => setActiveProblemTab('description')}
                style={{
                  padding: '0.35rem 0.8rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: activeProblemTab === 'description' ? 'var(--arena-tab-active-bg, rgba(20, 184, 166, 0.2))' : 'transparent',
                  color: activeProblemTab === 'description' ? 'var(--arena-tab-active-color, var(--primary))' : 'var(--arena-text-muted, #94a3b8)'
                }}
              >
                <i className="fa-solid fa-file-lines"></i>
                <span>Problem & Test Cases</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveProblemTab('explanation')}
                style={{
                  padding: '0.35rem 0.8rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: activeProblemTab === 'explanation' ? 'var(--arena-tab-active-bg, rgba(56, 189, 248, 0.2))' : 'transparent',
                  color: activeProblemTab === 'explanation' ? 'var(--arena-tab-active-color, #38bdf8)' : 'var(--arena-text-muted, #94a3b8)'
                }}
              >
                <i className="fa-solid fa-lightbulb"></i>
                <span>Approach & Explanation</span>
              </button>
            </div>

            {activeProblemTab === 'explanation' ? (
              // TAB: APPROACH & EXPLANATION
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {/* Intuition */}
                <div style={{ background: 'var(--arena-card-bg, #121826)', borderRadius: '8px', border: '1px solid var(--arena-card-border, #1f2737)', padding: '1rem' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--secondary, #38bdf8)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <i className="fa-solid fa-brain"></i> Core Intuition & Concept
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--arena-text, #cbd5e1)', lineHeight: '1.6' }}>
                    {activeProblem.explanation?.intuition || 'Understand the underlying algorithm pattern or relational concept to achieve optimal time and space execution.'}
                  </p>
                </div>

                {/* Approach */}
                <div style={{ background: 'var(--arena-card-bg, #121826)', borderRadius: '8px', border: '1px solid var(--arena-card-border, #1f2737)', padding: '1rem' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--arena-output-text, #4ade80)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <i className="fa-solid fa-list-check"></i> Step-by-Step Approach
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--arena-text, #cbd5e1)', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                    {activeProblem.explanation?.approach || '1. Analyze boundary conditions.\n2. Apply optimal traversal or relational operators.\n3. Validate output against test vector assertions.'}
                  </div>
                </div>

                {/* Complexity Analysis */}
                {activeProblem.explanation?.complexity && (
                  <div style={{ background: 'var(--arena-card-bg, #121826)', borderRadius: '8px', border: '1px solid var(--arena-card-border, #1f2737)', padding: '1rem' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--warning, #f59e0b)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <i className="fa-solid fa-chart-line"></i> Complexity Analysis
                    </div>
                    <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                      <div style={{ background: 'var(--arena-pre-bg, #090d14)', padding: '0.5rem 0.8rem', borderRadius: '6px', border: '1px solid var(--arena-border, #1a2233)', flex: '1 1 200px' }}>
                        <span style={{ color: 'var(--arena-text-muted, #94a3b8)', fontSize: '0.74rem', display: 'block' }}>Time Complexity:</span>
                        <strong style={{ color: 'var(--arena-text, #f1f5f9)', fontSize: '0.85rem' }}>{activeProblem.explanation.complexity.time}</strong>
                      </div>
                      <div style={{ background: 'var(--arena-pre-bg, #090d14)', padding: '0.5rem 0.8rem', borderRadius: '6px', border: '1px solid var(--arena-border, #1a2233)', flex: '1 1 200px' }}>
                        <span style={{ color: 'var(--arena-text-muted, #94a3b8)', fontSize: '0.74rem', display: 'block' }}>Space Complexity:</span>
                        <strong style={{ color: 'var(--arena-text, #f1f5f9)', fontSize: '0.85rem' }}>{activeProblem.explanation.complexity.space}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // TAB: PROBLEM DESCRIPTION & LEETCODE SCHEMAS
              <>
                <div style={{ fontSize: '0.9rem', lineHeight: '1.7', color: 'var(--arena-text, #cbd5e1)', whiteSpace: 'pre-line', marginBottom: '1.5rem' }}>
                  {activeProblem.description}
                </div>

                {/* LEETCODE / GFG SQL DATABASE SCHEMAS (TABLE DEFINITIONS) */}
                {activeProblem.schemaTables && activeProblem.schemaTables.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--secondary, #38bdf8)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <i className="fa-solid fa-table"></i> Database Schema (Tables):
                    </div>
                    {activeProblem.schemaTables.map((tbl, tIdx) => (
                      <div key={tIdx} style={{ marginBottom: '0.8rem', background: 'var(--arena-card-bg, #090d14)', border: '1px solid var(--arena-card-border, #1f2737)', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ background: 'var(--arena-header-bg, #131926)', padding: '0.4rem 0.8rem', fontSize: '0.76rem', fontWeight: 700, color: 'var(--arena-text, #f1f5f9)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Table: <code style={{ color: 'var(--secondary, #38bdf8)' }}>{tbl.name}</code></span>
                          {tbl.description && <span style={{ fontSize: '0.68rem', color: 'var(--arena-text-muted, #94a3b8)' }}>{tbl.description}</span>}
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem' }}>
                          <thead>
                            <tr style={{ background: 'var(--arena-card-hover, rgba(255, 255, 255, 0.02))', borderBottom: '1px solid var(--arena-border, #1a2233)', color: 'var(--arena-text-muted, #94a3b8)', textAlign: 'left' }}>
                              <th style={{ padding: '0.4rem 0.8rem' }}>Column Name</th>
                              <th style={{ padding: '0.4rem 0.8rem' }}>Type</th>
                              <th style={{ padding: '0.4rem 0.8rem' }}>Key / Attribute</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tbl.columns.map((col, cIdx) => (
                              <tr key={cIdx} style={{ borderBottom: '1px solid var(--arena-border, rgba(255, 255, 255, 0.04))' }}>
                                <td style={{ padding: '0.4rem 0.8rem', fontFamily: 'monospace', color: 'var(--secondary, #38bdf8)' }}>{col.name}</td>
                                <td style={{ padding: '0.4rem 0.8rem', color: 'var(--arena-text, #cbd5e1)' }}>{col.type}</td>
                                <td style={{ padding: '0.4rem 0.8rem' }}>
                                  {col.isPk && (
                                    <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, marginRight: '0.3rem' }}>
                                      PK
                                    </span>
                                  )}
                                  {col.isFk && (
                                    <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, marginRight: '0.3rem' }}>
                                      FK
                                    </span>
                                  )}
                                  <span style={{ color: 'var(--arena-text-muted, #94a3b8)', fontSize: '0.7rem' }}>{col.note || ''}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                )}

                {/* Constraints */}
                {activeProblem.constraints && (
                  <div
                    style={{
                      marginBottom: '1.5rem',
                      padding: '0.9rem 1rem',
                      background: 'var(--arena-explanation-bg, rgba(0, 0, 0, 0.3))',
                      borderRadius: '8px',
                      border: '1px solid var(--arena-border, rgba(255, 255, 255, 0.06))'
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--arena-text-muted, #94a3b8)', marginBottom: '0.4rem' }}>
                      <i className="fa-solid fa-lock" style={{ marginRight: '0.35rem', color: 'var(--warning, #f59e0b)' }}></i> Constraints:
                    </div>
                    <pre style={{ margin: 0, fontSize: '0.78rem', color: 'var(--arena-text-muted, #94a3b8)', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                      {activeProblem.constraints}
                    </pre>
                  </div>
                )}
              </>
            )}

            {/* 3 SAMPLE TEST CASES SECTION */}
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--arena-text, #f1f5f9)' }}>
                  <i className="fa-solid fa-flask-vial" style={{ color: 'var(--primary)', marginRight: '0.4rem' }}></i>
                  Sample Test Cases (3 Cases)
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--arena-text-subtle, #64748b)' }}>Click case to inspect</span>
              </div>

              {/* Tabs: Case 1 | Case 2 | Case 3 */}
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.8rem' }}>
                {sampleTestCases.map((tc, idx) => (
                  <button
                    key={tc.id || idx}
                    type="button"
                    onClick={() => {
                      setActiveSampleCaseIndex(idx);
                      if (tc.input) setStdin(tc.input);
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
                      background: activeSampleCaseIndex === idx ? 'var(--arena-tab-active-bg, rgba(20, 184, 166, 0.2))' : 'var(--arena-card-hover, rgba(255, 255, 255, 0.04))',
                      color: activeSampleCaseIndex === idx ? 'var(--arena-tab-active-color, var(--primary))' : 'var(--arena-text-muted, #94a3b8)',
                      border: activeSampleCaseIndex === idx ? '1px solid var(--arena-tab-active-border, var(--primary))' : '1px solid var(--arena-border, rgba(255, 255, 255, 0.08))'
                    }}
                  >
                    <span>Sample {idx + 1}</span>
                  </button>
                ))}
              </div>

              {/* Active Case Details */}
              {sampleTestCases[activeSampleCaseIndex] && (
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
                          navigator.clipboard.writeText(sampleTestCases[activeSampleCaseIndex].input);
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
                        fontFamily: "'JetBrains Mono', Consolas, 'Courier New', monospace",
                        fontSize: '0.82rem',
                        color: 'var(--arena-input-text, #38bdf8)',
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
                        fontFamily: "'JetBrains Mono', Consolas, 'Courier New', monospace",
                        fontSize: '0.82rem',
                        color: 'var(--arena-output-text, #4ade80)',
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
                        {sampleTestCases[activeSampleCaseIndex].explanation}
                      </div>
                    </div>
                  )}

                  {/* Load to STDIN action */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.2rem' }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-glass"
                      onClick={() => setStdin(sampleTestCases[activeSampleCaseIndex].input)}
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
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* DRAGGABLE VERTICAL GUTTER (LEFT-RIGHT RESIZING)             */}
        {/* ========================================================== */}
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
          {/* COMPILER TOP TOOLBAR: LANGUAGE SELECTION & RUN ACTION */}
          <div
            className="arena-toolbar"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.35rem 1rem',
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
                className={LANGUAGE_CONFIGS[selectedLang]?.icon || 'fa-solid fa-code'}
                style={{
                  position: 'absolute',
                  left: '0.55rem',
                  color: LANGUAGE_CONFIGS[selectedLang]?.color || 'var(--primary)',
                  fontSize: '0.78rem',
                  pointerEvents: 'none',
                  zIndex: 2
                }}
              />
              <select
                id="practice-arena-lang-select"
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
                {Object.values(LANGUAGE_CONFIGS)
                  .filter(l => activeCategory === 'sql' ? l.id === 'sql' : l.id !== 'sql')
                  .map(lang => (
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

            {/* Actions: Reset, Copy, Run Code */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-sm btn-glass"
                onClick={handleResetTemplate}
                title="Reset Code Template"
                style={{ fontSize: '0.73rem', padding: '0.25rem 0.55rem', whiteSpace: 'nowrap' }}
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
                style={{ fontSize: '0.73rem', padding: '0.25rem 0.55rem', whiteSpace: 'nowrap' }}
              >
                <i className={copiedCode ? 'fa-solid fa-check' : 'fa-regular fa-copy'} style={{ marginRight: '0.25rem' }}></i>
                {copiedCode ? 'Copied' : 'Copy'}
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCompileAndRun}
                disabled={isCompiling}
                style={{
                  padding: '0.3rem 0.9rem',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  borderRadius: '6px',
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
                placeholder={`// Implement your ${currentLangConfig.label} solution here...`}
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
                      const d = activeProblem.mainFunction?.[selectedLang] || '';
                      navigator.clipboard.writeText(d);
                    }}
                    style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}
                  >
                    Copy Driver Code
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
                  {activeProblem.mainFunction?.[selectedLang] || '// Pre-written execution harness invokes your solution logic.'}
                </pre>
              </div>
            )}
          </div>

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

          {/* BOTTOM PANEL: TABS FOR STDIN, OUTPUT, & SUBMISSION HISTORY */}
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

                <button
                  type="button"
                  onClick={() => setActiveTestTab(2)}
                  style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: '4px',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: 'none',
                    background: activeTestTab === 2 ? 'var(--arena-card-hover, rgba(255, 255, 255, 0.1))' : 'transparent',
                    color: activeTestTab === 2 ? 'var(--arena-text, #ffffff)' : 'var(--arena-text-muted, #94a3b8)'
                  }}
                >
                  <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: '0.35rem' }}></i>
                  Submissions ({submissionHistory.length})
                </button>
              </div>

              {/* Status Badge */}
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
                    border: `1px solid ${compilerOutput.status === 'Accepted' ? '#16a34a' : '#dc2626'}`
                  }}
                >
                  {compilerOutput.isMatch ? '✓ Passed (Matches Output)' : compilerOutput.status}
                  {compilerOutput.executionTime ? ` • ${compilerOutput.executionTime}` : ''}
                </span>
              )}
            </div>

            {/* Tab Contents */}
            <div style={{ flex: 1, padding: '0.8rem 1rem', overflowY: 'auto' }}>
              {activeTestTab === 0 ? (
                // TAB 0: STDIN / TEST CASES
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--arena-text-muted, #94a3b8)' }}>
                      Standard Input Vector (stdin):
                    </span>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      {sampleTestCases.map((tc, i) => (
                        <button
                          key={i}
                          type="button"
                          className="btn btn-sm btn-glass"
                          onClick={() => setStdin(tc.input)}
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
                    placeholder="Enter custom input test vector here..."
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
              ) : activeTestTab === 1 ? (
                // TAB 1: TERMINAL OUTPUT
                <div>
                  {!compilerOutput && !isCompiling && (
                    <div style={{ color: 'var(--arena-text-subtle, #64748b)', fontStyle: 'italic', padding: '0.8rem 0', fontSize: '0.82rem' }}>
                      Press &quot;Run Code&quot; (Ctrl+Enter) to compile and execute against custom input.
                    </div>
                  )}

                  {isCompiling && (
                    <div style={{ color: 'var(--primary)', padding: '0.8rem 0', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      Compiling and running against execution engine...
                    </div>
                  )}

                  {compilerOutput && (
                    <div>
                      {/* Match Banner */}
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
                            <span><i className="fa-solid fa-circle-check" style={{ marginRight: '0.4rem' }}></i> Test case passed! Actual output matches expected result.</span>
                          ) : (
                            <span><i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '0.4rem' }}></i> Expected output: <code>{compilerOutput.expectedOutput}</code></span>
                          )}
                        </div>
                      )}

                      {/* STDOUT */}
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

                      {/* STDERR */}
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
              ) : (
                // TAB 2: SUBMISSIONS HISTORY
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--arena-text, #f1f5f9)' }}>
                      Submission History for #{activeProblem.number || ''} {activeProblem.title}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-glass"
                      onClick={() => fetchHistory(activeProblem.id)}
                      style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem' }}
                    >
                      <i className="fa-solid fa-rotate-right" style={{ marginRight: '0.2rem' }}></i> Refresh
                    </button>
                  </div>

                  {loadingHistory ? (
                    <div style={{ color: 'var(--arena-text-muted, #94a3b8)', fontSize: '0.8rem', padding: '1rem 0' }}>
                      <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.4rem' }}></i> Loading submission records...
                    </div>
                  ) : submissionHistory.length === 0 ? (
                    <div style={{ color: 'var(--arena-text-subtle, #64748b)', fontStyle: 'italic', padding: '1rem 0', fontSize: '0.8rem' }}>
                      No submissions recorded yet for this problem. Click &quot;Run Code&quot; to execute and log your first attempt!
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {submissionHistory.map((sub, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: 'var(--arena-card-bg, #090d14)',
                            border: '1px solid var(--arena-border, #1a2233)',
                            borderRadius: '6px',
                            padding: '0.6rem 0.8rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.75rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span
                              style={{
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                background: sub.status === 'Accepted' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: sub.status === 'Accepted' ? '#16a34a' : '#dc2626'
                              }}
                            >
                              {sub.status}
                            </span>
                            <span style={{ color: 'var(--arena-text-muted, #94a3b8)' }}>
                              {sub.language ? sub.language.toUpperCase() : 'PYTHON'}
                            </span>
                            <span style={{ color: 'var(--arena-text-subtle, #64748b)' }}>
                              Runtime: {sub.executionTime || '0.04s'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <span style={{ color: 'var(--arena-text-subtle, #64748b)', fontSize: '0.7rem' }}>
                              {sub.timestamp ? new Date(sub.timestamp).toLocaleString() : ''}
                            </span>
                            {sub.code && (
                              <button
                                type="button"
                                className="btn btn-sm btn-glass"
                                onClick={() => {
                                  setCode(sub.code);
                                  if (sub.language) setSelectedLang(sub.language);
                                }}
                                style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}
                                title="Load this past submission code into editor"
                              >
                                Restore Code
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Status Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.2rem 0.8rem',
                background: 'var(--arena-status-bg, #0284c7)',
                borderTop: '1px solid var(--arena-border, #192233)',
                fontSize: '0.7rem',
                color: 'var(--arena-status-text, #ffffff)'
              }}
            >
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
                <span>{currentLangConfig.label}</span>
                <span>Split: H:{Math.round(splitRatioH)}% V:{Math.round(splitRatioV)}%</span>
              </div>
              <div>
                <span>Ctrl+Enter to Run Code • Esc to Exit Fullscreen</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OPEN COMPILER MODAL (SUPPORTS ALL 11 PROGRAMMING LANGUAGES) */}
      <OpenCompilerModal
        isOpen={isOpenCompilerOpen}
        onClose={() => setIsOpenCompilerOpen(false)}
      />
    </div>
  );
}
