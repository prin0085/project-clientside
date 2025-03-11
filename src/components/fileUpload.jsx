import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Editor from "@monaco-editor/react";
import "./fileUpload.css";
import ruleDescriptions from "../Utilities/RuleDescription.json";
import { isFixAble } from './globalFunction';
import { removeUnusedVars } from './codeFixer/removeUnusedVar'

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

  const applyFix = async (message) => {
    if (!selectedFileContent.source) return;

    let updatedCode = selectedFileContent.source;

    switch (message.ruleId) {
      case "no-unused-vars":
        updatedCode = removeUnusedVars(updatedCode, message);
        break;

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

      // update source code in monoeditor
      setSelectedFileContent((prev) => ({
        ...prev,
        source: updatedCode,
      }));

      // update source code
      setEditedFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.name === selectedFileContent.name ? { ...file, source: updatedCode } : file
        )
      );

      // update lint result that display right now
      setSelectedLintContent((prev) => ({
        ...prev,
        lintResult: response.data.lintResult,
      }));

      // update lint result for that file
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
    // if (!selectedFileContent.source) {
    //   alert("No modified content available for download.");
    //   return;
    // }

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
            onChange={(value) => {
              setSelectedFileContent((prev) => ({ ...prev, source: value }));
              setEditedFiles((prevFiles) =>
                prevFiles.map((file) =>
                  file.name === selectedFileContent.name ? { ...file, source: value } : file
                )
              );
            }}
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

                        {isFixAble(message.ruleId) && <button className="btn-applyfix" onClick={() => applyFix(message)}>
                          Apply Fix
                        </button>}
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
