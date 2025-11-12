import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Editor from "@monaco-editor/react";
import "./fileUpload.css";
import ruleDescriptions from "../Utilities/RuleDescription.json";
import { fixerRegistry } from './codeFixer/registry/fixerRegistry';
import BatchFixProcessor from './codeFixer/shared/batchFixProcessor';
import FixStatusIndicator from './FixStatusIndicator';
import BatchFixControls from './BatchFixControls';
import CodeHighlighter from './CodeHighlighter';
import { removeUnusedVars } from './codeFixer/removeUnusedVar'
import { eqeqeq } from "./codeFixer/eqeqeq";
import { noExtraSemi } from './codeFixer/noExtraSemi';
import { noTrailingSpaces } from './codeFixer/noTrailingSpaces';
import { eolLast } from './codeFixer/eolLast';
import { semi } from './codeFixer/semi';
import { quotes } from './codeFixer/quotes';
import { MdClose } from 'react-icons/md';

const FileUpload = () => {
  const [files, setFiles] = useState([]);

  const [selectedFileContent, setSelectedFileContent] = useState({});
  const [selectFileEditContent, setSelectFileEditContent] = useState({});
  const [editedFiles, setEditedFiles] = useState([]);

  const [selectedLintContent, setSelectedLintContent] = useState(null);
  const [lintingResults, setLintingResults] = useState([]);

  const [expandedError, setExpandedError] = useState(null);
  // const [batchProgress, setBatchProgress] = useState(null);
  const [applyingFixes, setApplyingFixes] = useState(new Set());
  const [fixResults, setFixResults] = useState(new Map());
  const [appliedFixes, setAppliedFixes] = useState([]);

  const [originalCodeForDiff, setOriginalCodeForDiff] = useState('');

  const fileInputRef = useRef(null);
  const monacoObjects = useRef(null);

  const editorDidMount = (editor, monaco) => {
    monacoObjects.current = { editor, monaco };
  };

  // Initialize fixer registry on component mount
  useEffect(() => {
    const initializeFixers = async () => {
      try {
        // Auto-discover and register all fixers
        await fixerRegistry.autoDiscoverFixers();

        // Register existing fixers manually for backward compatibility
        // These will be replaced by the new fixer system gradually
        const existingFixers = {
          'no-unused-vars': removeUnusedVars,
          'eqeqeq': eqeqeq,
          'no-extra-semi': noExtraSemi,
          'no-trailing-spaces': noTrailingSpaces,
          'eol-last': eolLast,
          'semi': semi,
          'quotes': quotes
        };

        // For now, we'll keep the existing functions available
        // but mark them as registered in the registry
        Object.keys(existingFixers).forEach(ruleId => {
          if (!fixerRegistry.isFixable(ruleId)) {
            console.log(`Marking existing fixer as available: ${ruleId}`);
          }
        });

        console.log('Fixer registry initialized successfully');
      } catch (error) {
        console.error('Failed to initialize fixer registry:', error);
      }
    };

    initializeFixers();
  }, []);

  useEffect(() => {
    if (selectedFileContent?.source === undefined) { return; }

    const { editor } = monacoObjects.current;
    const model = editor.getModel();

    model.setValue(selectedFileContent.source);
  }, [selectedFileContent.source]);

  // Use registry-based approach for checking if a rule is fixable
  const isFixAble = (ruleId) => {
    // First check the registry
    if (fixerRegistry.isFixable(ruleId)) {
      return true;
    }

    // Fallback to existing fixers for backward compatibility
    const existingFixableRules = [
      'no-unused-vars',
      'eqeqeq',
      'no-extra-semi',
      'no-trailing-spaces',
      'eol-last',
      'semi',
      'quotes'
    ];

    return existingFixableRules.includes(ruleId);
  };

  const handleFileChange = async (event) => {
    if (Array.from(event.target.files).length > 0) {
      const newFiles = Array.from(event.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const goToLine = (lineNumber) => {
    if (monacoObjects.current?.editor) {
      monacoObjects.current.editor.revealLineInCenter(lineNumber);
      monacoObjects.current.editor.setPosition({ lineNumber, column: 1 });
      monacoObjects.current.editor.focus();
    }
  }

  const handleUpload = async (file) => {
    setExpandedError(null);
    const formData = new FormData();

    // If there's a selected file with current editor content, use that
    if (file.name && file.source) {
      const codeBlob = new Blob([file.source], { type: "text/plain" });
      const codeFile = new File([codeBlob], file.name, { type: "text/plain" });
      formData.append("files", codeFile);
    }

    try {
      const response = await axios.post(
        "http://localhost:3001/lint",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      storeLintResult(response.data);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handleFileClick = (file) => {
    if (file.name === selectedFileContent.name) { return; }

    // Clear applied fixes and diff highlighting when switching files
    setAppliedFixes([]);
    setOriginalCodeForDiff('');
    // console.log(files);

    const selectedFile = editedFiles.find((w) => w.name === file.name);
    if (selectedFile) {
      const newFile = {
        name: file.name,
        source: selectedFile.source,
      };

      onSelectFileClick(newFile);
      handleUpload(newFile);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newFile = {
          name: file.name,
          source: e.target.result,
        };

        onSelectFileClick(newFile);
        handleUpload(newFile);
      };

      reader.readAsText(file);
    }
  };

  const storeLintResult = (value) => {
    setLintingResults((prevLint) => {
      const exists = prevLint.some(item => item.originalname === value.originalname);
      if (exists) {
        return prevLint.map((file) =>
          file.originalname === selectedFileContent.name ? { ...file, lintResult: value.lintResult } : file
        );
      } else {
        return [...prevLint, value];
      }
    });

    setSelectedLintContent(value);
  }

  const onSelectFileClick = (file) => {
    setSelectedFileContent(file);
    setSelectFileEditContent(file);
    setEditedFiles((prev) => {
      const exists = prev.some(item => item.name === file.name);
      if (exists) {
        // update the existing item
        return prev.map(item =>
          item.name === file.name ? { ...item, source: file.source } : item
        );
      } else {
        // add new item
        return [...prev, file];
      }
    });
  }

  const applyFix = async (message) => {
    if (!selectFileEditContent.source) return;

    const fixKey = `${message.ruleId}-${message.line}-${message.column}`;

    // Set applying state
    setApplyingFixes(prev => new Set([...prev, fixKey]));
    setFixResults(prev => new Map(prev.set(fixKey, null)));

    // Store original code for diff highlighting
    const editedFile = editedFiles.find(w => w.name == selectFileEditContent.name);
    if (!originalCodeForDiff) {
      setOriginalCodeForDiff(selectFileEditContent.source);
    }

    let updatedCode = selectFileEditContent.source;

    // Try to get fixer from registry first
    const fixer = fixerRegistry.getFixer(message.ruleId);

    if (fixer) {
      try {
        // Use the new fixer system
        const fixResult = fixer.fix(updatedCode, message);

        if (fixResult.success) {
          updatedCode = fixResult.code;

          // Store successful fix result
          setFixResults(prev => new Map(prev.set(fixKey, fixResult)));

          // Add to applied fixes for highlighting
          const appliedFix = {
            ruleId: message.ruleId,
            line: message.line,
            column: message.column,
            endLine: message.endLine,
            endColumn: message.endColumn,
            message: message.message,
            timestamp: new Date()
          };
          setAppliedFixes(prev => [...prev, appliedFix]);

          if (fixResult.warnings && fixResult.warnings.length > 0) {
            console.warn(`Warnings for ${message.ruleId}:`, fixResult.warnings);
          }
        } else {
          console.warn(`Fix failed for rule ${message.ruleId}: ${fixResult.message}`);

          // Store failed fix result
          setFixResults(prev => new Map(prev.set(fixKey, fixResult)));

          alert(`Fix failed: ${fixResult.message}`);

          // Clear applying state
          setApplyingFixes(prev => {
            const newSet = new Set(prev);
            newSet.delete(fixKey);
            return newSet;
          });
          return;
        }
      } catch (error) {
        console.error(`Error applying fix for rule ${message.ruleId}:`, error);

        // Store error result
        setFixResults(prev => new Map(prev.set(fixKey, {
          success: false,
          message: error.message,
          code: updatedCode
        })));

        alert(`Error applying fix: ${error.message}`);

        // Clear applying state
        setApplyingFixes(prev => {
          const newSet = new Set(prev);
          newSet.delete(fixKey);
          return newSet;
        });
        return;
      }
    } else {
      // Fallback to existing switch-case for backward compatibility
      switch (message.ruleId) {
        case "no-unused-vars":
          updatedCode = removeUnusedVars(updatedCode, message);
          break;
        case "eqeqeq":
          updatedCode = eqeqeq(updatedCode, message);
          break;
        case "no-extra-semi":
          updatedCode = noExtraSemi(updatedCode, message);
          break;
        case "no-trailing-spaces":
          updatedCode = noTrailingSpaces(updatedCode, message);
          break;
        case "eol-last":
          updatedCode = eolLast(updatedCode, message);
          break;
        case "semi":
          updatedCode = semi(updatedCode, message);
          break;
        case "quotes":
          updatedCode = quotes(updatedCode, message);
          break;

        default:
          console.warn(`No automatic fix available for rule: ${message.ruleId}`);

          // Store not-fixable result
          setFixResults(prev => new Map(prev.set(fixKey, {
            success: false,
            message: `No automatic fix available for rule: ${message.ruleId}`,
            code: updatedCode
          })));

          alert(`No automatic fix available for this issue: ${message.ruleId}`);

          // Clear applying state
          setApplyingFixes(prev => {
            const newSet = new Set(prev);
            newSet.delete(fixKey);
            return newSet;
          });
          return;
      }
    }

    try {
      const codeBlob = new Blob([updatedCode], { type: "text/plain" });
      const codeFile = new File([codeBlob], selectFileEditContent.name, { type: "text/plain" });
      const formData = new FormData();
      formData.append("files", codeFile);
      const response = await axios.post(
        "http://localhost:3001/lint",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const newFile = {
        name: selectedFileContent.name,
        source: response.data.lintResult.source
      };

      onSelectFileClick(newFile);
      handleUpload(newFile);

      // Highlight the applied fix in the editor
      if (monacoObjects.current?.editor?.codeHighlighter) {
        const appliedFix = {
          ruleId: message.ruleId,
          line: message.line,
          column: message.column,
          endLine: message.endLine,
          endColumn: message.endColumn,
          message: message.message
        };
        monacoObjects.current.editor.codeHighlighter.addFixHighlight(appliedFix);
      }
    } catch (error) {
      console.error("Error re-linting file:", error);

      // Store error result
      setFixResults(prev => new Map(prev.set(fixKey, {
        success: false,
        message: `Re-linting failed: ${error.message}`,
        code: updatedCode
      })));
    } finally {
      // Clear applying state
      setApplyingFixes(prev => {
        const newSet = new Set(prev);
        newSet.delete(fixKey);
        return newSet;
      });
    }
  };

  const downloadModifiedFile = () => {
    const blob = new Blob([selectFileEditContent.source], {
      type: "text/javascript",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = selectFileEditContent.name.replace(".js", "_fixed.js"); // Append _fixed
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleExpand = (ruleId) => {
    setExpandedError((prev) => (prev === ruleId ? null : ruleId));
  };

  const getRuleDetails = (ruleId) => {
    return ruleDescriptions.find((rule) => rule.ruleId === ruleId);
  };

  const handleRemoveFile = (fileToRemove, event) => {
    event.stopPropagation(); // Prevent triggering file click

    // Remove from files list
    setFiles((prevFiles) => prevFiles.filter((file) => file.name !== fileToRemove.name));

    // Remove from edited files
    setEditedFiles((prevFiles) => prevFiles.filter((file) => file.name !== fileToRemove.name));

    // Remove from linting results
    setLintingResults((prevResults) => prevResults.filter((result) => result.originalname !== fileToRemove.name));

    // Clear selected file if it's the one being removed
    if (selectedFileContent.name === fileToRemove.name) {
      setSelectedFileContent(prev => ({ ...prev, source: "" }));
      setSelectedFileContent({});
      setSelectedLintContent(null);
      setAppliedFixes([]);
      setOriginalCodeForDiff('');
    }
  };

  return (
    <div className="container">
      <div className="file-upload-container height-100">
        <div className="file-list">
          <div className="button-container">
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              style={{ display: "none" }}
              ref={fileInputRef}
            />
            <button
              onClick={() => fileInputRef.current.click()}
              className="choose-file-button"
            >
              เลือกไฟล์
            </button>
            {/* <button
              onClick={handleUpload}
              disabled={uploading}
              className="upload-button"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button> */}
          </div>

          <ul>
            {files.map((file, index) => (
              <li key={index} className={`file-list-item ${selectedFileContent.name == file.name ? "active" : ""
                }`}>
                <button
                  onClick={() => handleFileClick(file)}
                  className="file-button"
                >
                  {file.name}
                </button>
                <button
                  onClick={(e) => handleRemoveFile(file, e)}
                  className="remove-file-button"
                  title="Remove file"
                  aria-label={`Remove ${file.name}`}
                >
                  <MdClose />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="editor-container">
          <Editor
            height="100%"
            theme="vs-dark"
            defaultLanguage="javascript"
            value={selectFileEditContent.source}
            onChange={(value) => {
              setSelectFileEditContent((prev) => ({ ...prev, source: value }));
              setEditedFiles((prevFiles) =>
                prevFiles.map((file) =>
                  file.name === selectedFileContent.name ? { ...file, source: value } : file
                )
              );
              // Clear applied fixes when user manually edits code
              if (appliedFixes.length > 0) {
                setAppliedFixes([]);
                setOriginalCodeForDiff('');
              }
            }}
            options={{
              readOnly: false,
              lineNumbers: "on",
              glyphMargin: true, // Enable glyph margin for fix indicators
              folding: true,
              minimap: { enabled: true },
              overviewRulerBorder: true,
              overviewRulerLanes: 3
            }}
            onMount={editorDidMount}
          />

          {/* Code Highlighter for applied fixes */}
          {monacoObjects.current && (
            <CodeHighlighter
              editor={monacoObjects.current.editor}
              monaco={monacoObjects.current.monaco}
              appliedFixes={appliedFixes}
              originalCode={originalCodeForDiff}
              modifiedCode={selectedFileContent.source}
            />
          )}
        </div>

        <div className="linting-results">
          <div className="flex items-center justify-between">
            <h3>Linting Results: {selectedLintContent?.lintResult?.errorCount | 0}</h3>
            <div className="flex gap-2">
              {selectedLintContent && (
                <button onClick={() => handleUpload({
                  name: selectFileEditContent.name,
                  source: selectFileEditContent.source
                })}>
                  Analyze
                </button>
              )}

              {selectedLintContent && (
                <button onClick={() => downloadModifiedFile(selectedLintContent)}>
                  Download Fixed File
                </button>
              )}
            </div>
          </div>

          {/* Enhanced Batch Fix Controls */}
          {/* {selectedLintContent?.lintResult?.messages && (
            <BatchFixControls
              fixableCount={selectedLintContent.lintResult.messages.filter(msg => isFixAble(msg.ruleId)).length}
              totalCount={selectedLintContent.lintResult.messages.length}
              onBatchFix={applyBatchFix}
              isProcessing={batchProcessing}
              batchProgress={batchProgress}
              disabled={false}
            />
          )} */}

          {selectedLintContent?.lintResult?.errorCount > 0 ? (
            <div className="linting-results-container">
              <div className="mt-3">
                {selectedLintContent.lintResult.messages.map((message, idx) => {
                  const ruleDetails = getRuleDetails(message.ruleId);
                  const isRuleFixable = isFixAble(message.ruleId);
                  const fixKey = `${message.ruleId}-${message.line}-${message.column}`;
                  const isApplying = applyingFixes.has(fixKey);
                  const fixResult = fixResults.get(fixKey);

                  return (
                    <div className="lint-result-container" key={idx} style={{
                      borderLeft: isRuleFixable ? '4px solid #4CAF50' : '4px solid #ff9800'
                    }}>
                      <div className={"lint-result-header"}>
                        <div className={"error-toggle truncate"} >
                          <span className="text-underline" onClick={() => goToLine(message.line)}>
                            {message.line}:{message.endColumn}
                          </span>
                          <span onClick={() => toggleExpand(idx)}>
                            {message.message}
                          </span>
                          <FixStatusIndicator
                            isFixable={isRuleFixable}
                            isApplying={isApplying}
                            fixResult={fixResult}
                            ruleId={message.ruleId}
                            severity={message.severity}
                          />
                        </div>

                        {isRuleFixable && (
                          <button
                            className="btn-applyfix"
                            onClick={() => applyFix(message)}
                            disabled={isApplying}
                            style={{
                              opacity: isApplying ? 0.6 : 1,
                              cursor: isApplying ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {isApplying ? 'Applying...' : 'Apply Fix'}
                          </button>
                        )}
                      </div>

                      <div className={`error-description ${expandedError === idx ? "active" : ""}`}>
                        {expandedError === idx && ruleDetails && (
                          <>
                            <strong>{ruleDetails.title}</strong>
                            <p>{ruleDetails.description}</p>
                            <p>{ruleDetails.message}</p>
                            {ruleDetails.solution && (
                              <ul>
                                {Object.values(ruleDetails.solution).map((sol, i) => (
                                  <li key={i}>{sol}</li>
                                ))}
                              </ul>
                            )}
                            <div className="text-right">ref: {idx}</div>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <p>No linting errors found.</p>
          )}
        </div>
      </div>
    </div >
  );
};

export default FileUpload;
