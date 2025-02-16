import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Editor from "@monaco-editor/react";
import "./fileUpload.css";

const FileUpload = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFileContent, setSelectedFileContent] = useState({});
  const [lintingResults, setLintingResults] = useState([]);

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
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedFileContent({
        name: file.name,
        source: e.target.result,
      });
    };
    reader.readAsText(file);
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
    const codeLines = code.split("\n"); // Split code into an array of lines

    if (line > codeLines.length) return code; // Ensure line exists

    const targetLine = codeLines[line - 1]; // Get the target line (ESLint is 1-based)
    const words = targetLine.split(/\s+/); // Split line by spaces

    // Detect if the line starts with let, const, or var
    const declarationRegex = /^(let|const|var)\s+/;
    if (!declarationRegex.test(targetLine)) return code; // If it's not a declaration, return unchanged

    // Extract variable names from the declaration
    const declarationMatch = targetLine.match(declarationRegex);
    if (!declarationMatch) return code; // Return if no match

    const keyword = declarationMatch[0]; // "let ", "const ", or "var "
    const variables = targetLine
      .replace(keyword, "")
      .split(",")
      .map((v) => v.trim());

    // Determine which variable should be removed based on the endColumn
    const columnIndex = endColumn - 1;
    let variableToRemove = null;
    let charCount = 0;

    for (let i = 0; i < variables.length; i++) {
      charCount += variables[i].length;
      if (columnIndex <= charCount) {
        variableToRemove = variables[i];
        break;
      }
      charCount++; // Account for the comma and space
    }

    if (!variableToRemove) return code; // No variable found to remove

    // Remove the selected variable
    const updatedVariables = variables.filter((v) => v !== variableToRemove);
    if (updatedVariables.length === 0) {
      // If no variables remain, remove the whole line
      codeLines.splice(line - 1, 1);
    } else {
      // Reconstruct the declaration without the removed variable
      codeLines[line - 1] = `${keyword}${updatedVariables.join(", ")}`;
    }

    return codeLines.join("\n"); // Reconstruct code
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
      console.log(params[i], charCount);
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

  const applyFix = async (message) => {
    if (!selectedFileContent.source) return;

    const updatedCode = removeUnusedFunctionArgument(
      selectedFileContent.source,
      message.line,
      message.endColumn
    );

    try {
      const response = await axios.post(
        "http://localhost:3001/lint", // Update API endpoint if needed
        { code: updatedCode },
        { headers: { "Content-Type": "application/json" } }
      );

      setSelectedFileContent((prev) => ({
        ...prev,
        source: updatedCode,
      }));

      setLintingResults((prevResults) => {
        return prevResults.map((file) =>
          file.originalname === selectedFileContent.name
            ? { ...file, lintResult: response.data.lintResult } // Update the lint result
            : file
        );
      });
      console.log(selectedFileContent.source);
    } catch (error) {
      console.error("Error re-linting file:", error);
    }
  };

  const downloadModifiedFile = (file) => {
    if (!file.lintResult || !file.lintResult.source) {
      alert("No modified content available for download.");
      return;
    }

    const blob = new Blob([file.lintResult.source], {
      type: "text/javascript",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = file.originalname + "_Update.js"; // Use the original file name
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container">
      <div className="file-upload-container">
        <div className="file-list">
          <h3>Selected Files:</h3>
          <ul>
            {files.map((file, index) => (
              <li key={index}>
                <button
                  onClick={() => handleFileClick(file)}
                  className={`file-button ${
                    selectedFileContent.name == file.name ? "active" : ""
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
            options={{
              readOnly: false,
              lineNumbers: "on",
            }}
            onMount={editorDidMount}
          />
        </div>

        <div className="linting-results">
          <h3>Linting Results:</h3>
          {lintingResults.length > 0 ? (
            <div>
              {lintingResults.map((file, index) => (
                <div key={index}>
                  <h4>{file.originalname}</h4> {/* Display file name */}
                  <button onClick={() => downloadModifiedFile(file)}>
                    Download Fixed File
                  </button>
                  <div>
                    {file.lintResult.messages.map((message, idx) => (
                      <div
                        key={idx}
                        className={`lint-result-container ${
                          message.severity === 1 ? "warning" : "error"
                        }`}
                      >
                        <span className="text-underline">
                          {message.line}:{message.endColumn}
                        </span>
                        <span>{message.message}</span>
                        {
                          <button onClick={() => applyFix(message)}>
                            Apply Fix
                          </button>
                        }
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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
    </div>
  );
};

export default FileUpload;
