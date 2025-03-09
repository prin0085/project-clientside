import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Editor from "@monaco-editor/react";
import "./fileUpload.css";
import ruleDescriptions from "../Utilities/RuleDescription.json";

const FileUpload = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFileContent, setSelectedFileContent] = useState({});
  const [selectedLintContent, setSelectedLintContent] = useState(null);
  const [lintingResults, setLintingResults] = useState([]);
  const [editedFiles, setEditedFiles] = useState([]);
  const [expandedError, setExpandedError] = useState(null);

  const fileInputRef = useRef(null);
  const monacoObjects = useRef(null);

  const editorDidMount = (editor, monaco) => {
    monacoObjects.current = {
      editor,
      monaco,
    };
  };

  // useEffect(() => {
  //   if (!monacoObjects.current) return;
  //   const { monaco, editor } = monacoObjects.current;
  //   const r = new monaco.Range(1, 1, 1, 1);
  //   console.log(
  //     editor.createDecorationsCollection([
  //       {
  //         range: r,
  //         options: {
  //           inlineClassName: "myInlineDecoration",
  //         },
  //       },
  //     ])
  //   );
  // }, [lintingResults]);

  const handleFileChange = async (event) => {
    if (Array.from(event.target.files).length > 0) {
      const newFiles = Array.from(event.target.files);
      setFiles(newFiles);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert("Please select files first.");
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    setUploading(true);
    try {
      const response = await axios.post(
        "http://localhost:3001/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      console.log("Upload Successful:", response.data);
      setLintingResults(response.data); // Store linting results 
    } catch (error) {
      console.error("Error uploading file:", error);
    }
    setUploading(false);
  };

  const handleFileClick = (file) => {
    const selectedFile = editedFiles.find((w) => w.name === file.name);
    if (selectedFile) {
      const fileLintResults = lintingResults.find(
        (result) => result.originalname === file.name
      );
      setSelectedLintContent(fileLintResults || null);
      setSelectedFileContent({
        name: file.name,
        source: selectedFile.source,
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newFile = {
          name: file.name,
          source: e.target.result,
        };

        setSelectedFileContent(newFile);

        const fileLintResults = lintingResults.find(
          (result) => result.originalname === file.name
        );
        setSelectedLintContent(fileLintResults || null);

        setEditedFiles((prev) => [...prev, newFile]);
      };
      reader.readAsText(file);
    }
  };


  //   const getLintingDecorations = () => {
  //     const decorations = [];
  //     lintingResults.forEach((file) => {
  //       file.lintResult.messages.forEach((message) => {
  //         if (message.line) {
  //           decorations.push({
  //             range: new monaco.Range(message.line, 1, message.line, 1),
  //             options: {
  //               isWholeLine: true,
  //               className: message.severity === 1 ? "warning-line" : "error-line",
  //             },
  //           });
  //         }
  //       });
  //     });
  //     return decorations;
  //   };

  const removeUnusedVariable = (code, line, endColumn) => {
    const codeLines = code.split("\n"); // Split code into lines

    if (line > codeLines.length) return code; // Ensure line exists

    const targetLine = codeLines[line - 1]; // Get the target line (ESLint is 1-based)
    const declarationRegex = /^(let|const|var)\s+/;

    if (!declarationRegex.test(targetLine)) return code; // Not a variable declaration

    const keywordMatch = targetLine.match(declarationRegex);
    if (!keywordMatch) return code;

    const keyword = keywordMatch[0]; // "let ", "const ", or "var "
    const variables = targetLine
      .replace(keyword, "")
      .split(",")
      .map((v) => v.trim());

    // Find the variable to remove based on `endColumn`
    let columnIndex = endColumn - 1;
    let charCount = targetLine.indexOf(keyword) + keyword.length;

    let variableToRemove = null;
    for (let i = 0; i < variables.length; i++) {
      charCount += variables[i].length;
      if (columnIndex <= charCount) {
        variableToRemove = variables[i]; // Found variable to remove
        break;
      }
      charCount++; // Account for commas and spaces
    }

    if (!variableToRemove) return code; // No match found

    // Remove the selected variable
    const updatedVariables = variables.filter((v) => v !== variableToRemove);

    if (updatedVariables.length === 0) {
      // If no variables remain, remove the entire line
      codeLines.splice(line - 1, 1);
    } else {
      // Reconstruct the declaration without the removed variable
      codeLines[line - 1] = `${keyword}${updatedVariables.join(", ")}`;
    }

    return codeLines.join("\n"); // Reconstruct updated code
  };

  const removeUnusedFunctionArgument = (code, line, endColumn) => {
    const codeLines = code.split("\n");
    console.log(code, line, endColumn);
    if (line > codeLines.length) return code;

    let targetLine = codeLines[line - 1];
    const functionRegex =
      /(function\s+\w+\s*\(|\w+\s*=>|\w+\s*=\s*\(.*\)\s*=>)/;

    if (!functionRegex.test(targetLine)) return code;

    const paramsMatch = targetLine.match(/\(([^)]*)\)/);
    if (!paramsMatch) return code;

    let params = paramsMatch[1].split(","); //.map((p) => p.trim());
    if (params.length === 0) return code;

    let columnIndex = endColumn - 1;
    let charCount = targetLine.indexOf("(") + 1;

    let argToRemove = null;
    for (let i = 0; i < params.length; i++) {
      charCount += params[i].length;
      if (columnIndex <= charCount) {
        argToRemove = params[i];
        break;
      }
      charCount++;
    }

    if (!argToRemove) return code;

    params = params.filter((param) => param !== argToRemove);

    const updatedParams =
      params.length > 0 ? `(${params.map((p) => p.trim()).join(", ")})` : "()";
    targetLine = targetLine.replace(/\([^)]*\)/, updatedParams);

    codeLines[line - 1] = targetLine;
    return codeLines.join("\n");
  };

  const removeUnusedVars = (code, line, endColumn) => {
    const isFunctionArgument =
      code.split("\n")[line - 1].includes("(") &&
      code.split("\n")[line - 1].includes(")");

    console.log(isFunctionArgument);
    if (isFunctionArgument) {
      return removeUnusedFunctionArgument(code, line, endColumn);
    } else {
      return removeUnusedVariable(code, line, endColumn);
    }
  };

  const applyFix = async (message) => {
    if (!selectedFileContent.source) return;

    let updatedCode = selectedFileContent.source;

    switch (message.ruleId) {
      case "no-unused-vars":
        updatedCode = removeUnusedVars(
          updatedCode,
          message.line,
          message.endColumn
        );
        break;

      // case "no-unused-function-argument":
      //   updatedCode = removeUnusedFunctionArgument(
      //     updatedCode,
      //     message.line,
      //     message.endColumn
      //   );
      //   break;

      default:
        console.warn(`No automatic fix available for rule: ${message.ruleId}`);
        alert(`No automatic fix available for this issue: ${message.ruleId}`);
        return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3001/lint",
        { code: updatedCode },
        { headers: { "Content-Type": "application/json" } }
      );

      setSelectedFileContent((prev) => ({
        ...prev,
        source: updatedCode,
      }));

      setEditedFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.name === selectedFileContent.name ? { ...file, source: updatedCode } : file
        )
      );

      setSelectedLintContent((prev) => ({
        ...prev,
        lintResult: response.data.lintResult,
      }));

      setLintingResults((prevLint) =>
        prevLint.map((file) =>
          file.originalname === selectedFileContent.name ? { ...file, lintResult: response.data.lintResult } : file
        )
      );
    } catch (error) {
      console.error("Error re-linting file:", error);
    }
  };

  const downloadModifiedFile = () => {
    if (!selectedFileContent.source) {
      alert("No modified content available for download.");
      return;
    }

    const blob = new Blob([selectedFileContent.source], {
      type: "text/javascript",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = selectedFileContent.name.replace(".js", "_fixed.js"); // Append _fixed
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

  return (
    <div className="container">
      <div className="file-upload-container height-100">
        <div className="file-list">
          <h3>Selected Files:</h3>
          <ul>
            {files.map((file, index) => (
              <li key={index}>
                <button
                  onClick={() => handleFileClick(file)}
                  className={`file-button ${selectedFileContent.name == file.name ? "active" : ""
                    }`}
                >
                  {file.name}
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
            value={selectedFileContent.source}
            onChange={(value) =>
              setSelectedFileContent((prev) => ({ ...prev, source: value }))
            }
            options={{
              readOnly: false,
              lineNumbers: "on",
            }}
            onMount={editorDidMount}
          />
        </div>

        <div className="linting-results">
          <div className="flex items-center justify-between">
            <h3>Linting Results:</h3>
            {selectedLintContent && (<button onClick={() => downloadModifiedFile(selectedLintContent)}>
              Download Fixed File
            </button>
            )}
          </div>
          {selectedLintContent ? (
            <div className="linting-results-container">
              <div className="mt-3">
                {selectedLintContent.lintResult?.messages?.map((message, idx) => {
                  const ruleDetails = getRuleDetails(message.ruleId);
                  return (
                    <div className="lint-result-container" key={idx}>
                      <div className={"lint-result-header"}>
                        <div className={"error-toggle truncate"} onClick={() => toggleExpand(idx)}>
                          <span className="text-underline">
                            {message.line}:{message.endColumn}
                          </span>
                          <span>{message.message}</span>
                        </div>

                        <button className="btn-applyfix" onClick={() => applyFix(message)}>
                          Apply Fix
                        </button>
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
          Choose File
        </button>
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="upload-button"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>
    </div >
  );
};

export default FileUpload;
