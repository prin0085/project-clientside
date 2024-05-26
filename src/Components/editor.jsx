import React, { useState, useEffect, useContext, useRef } from 'react';
import Editor from "@monaco-editor/react";
import axios from 'axios';
import { dataContext } from './../Context/context';

const defaultfiles = {
    "newfile.js": {
        name: "newfile.js",
        language: "javascript",
        value: ""
    }
}

const EditForm = () => {
    const [[analizeData, setAnalyzeData], [files, setFile], [fileName, setFileName]] = useContext(dataContext);
    const [dataAnalyze, setDataAnalyze] = useState(null);

    const editorRef = useRef(null);
    const inputRef = useRef(null);

    const file = defaultfiles[fileName];
    const apiUrl = 'http://localhost:3001/upload';

    useEffect(() => {
        if (dataAnalyze) {
            setAnalyzeData(dataAnalyze.data);
        }
    }, [dataAnalyze]);

    const generateFiveDigitID = () => {
        return Math.floor(10000 + Math.random() * 90000);
    }

    const handleAnalysis = async () => {
        if (!files) {
            alert('Please upload a file for analysis.');
            return;
        }

        const formData = new FormData();
        for (const file of files) {
            createFileTab(file);
            formData.append('files', file);
        }

        await axios
            .post(apiUrl, formData)
            .then((res) => {
                setDataAnalyze(res);
            })
            .catch(err => {
                console.error(err);
            });
    };

    const handleFileChange = (event) => {
        for (const file of event.target.files) {
            const fileExists = files.some(f => f.name === file.name);
            if (!fileExists) {
                createFileTab(file);
                setFile(prevFileData => [...prevFileData, file]);
            }
        }
    };

    const createFileTab = (f) => {
        let fr = new FileReader();
        //intitail data for upload file
        defaultfiles[f.name] = {
            name: f.name,
            language: "javascript",
            value: ""
        };

        //set value (data in file) to defaultfiles (array of file)
        fr.onload = function () {
            defaultfiles[f.name].value = fr.result; //<-- set data
        }

        fr.readAsText(f);
    };

    const openSelectFileDialog = () => {
        inputRef.current.click();
    };

    const handleEditorDidMount = (editor) => {
        editorRef.current = editor;
    };

    const onSavefileTemp = () => {
        const val = editorRef.current.getValue();
        const file = defaultfiles[fileName];

        file.value = val;

        const index = files.findIndex(f => f.name === file.name);
        const newFiles = [...files];
        newFiles[index] = new File([val], file.name, {
            type: "text/javascript",
        });
        setFile(newFiles);
    }

    const onChagneFile = (filename) => {
        const crrval = editorRef.current.getValue();
        const oldval = defaultfiles[filename].value;
        if (crrval != oldval) {
            onSavefileTemp();
        }

        setFileName(filename)
    }

    return (
        <div className="overflow-hidden">
            <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3">
                    <Editor
                        height="70vh"
                        theme="vs-dark"
                        onMount={handleEditorDidMount}
                        path={file.name}
                        defaultLanguage={file.language}
                        defaultValue={file.value}
                        autosize={true}
                    />
                </div>
                <div>
                    <button onClick={() => openSelectFileDialog()}>
                        อัปโหลด
                    </button>
                    <input type="file" ref={inputRef} className="hidden" multiple onChange={handleFileChange} />

                    <button onClick={handleAnalysis}>Analyze File</button>

                    <button onClick={onSavefileTemp}>
                        Save
                    </button>

                    <div className="pt-5">
                        {files.map((file) => (
                            <div className={`tab ${fileName == file.name ? 'active' : ''} cursor-pointer`}
                                onClick={() => onChagneFile(file.name)} key={generateFiveDigitID()}>
                                {file.name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* <button onClick={() => setFileName("newfile.js")}>
                        newfile.js
                    </button> */}
        </div>
    )
}

export default EditForm
