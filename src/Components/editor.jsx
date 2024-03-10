import React, { useState, useEffect, useContext, useRef } from 'react';
import Editor from "@monaco-editor/react";
import axios from 'axios';
import FileTab from './fileTab';
import { dataContext, Filelist, openedFile } from './../Context/context';

const defaultfiles = {
    "newfile.js": {
        name: "newfile.js",
        language: "javascript",
        value: ""
    }
}

const EditForm = () => {
    let [analizeData, setAnalyzeData] = useContext(dataContext);
    let [fileName, setFileName] = useContext(openedFile);
    const [files, setFile] = useContext(Filelist);
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

    const handleAnalysis = async () => {
        if (!files) {
            alert('Please select a file for analysis.');
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
        const inpFile = f;
        //const id = generateFiveDigitID();

        //intitail data for upload file
        defaultfiles[inpFile.name] = {
            name: inpFile.name,
            language: "javascript",
            value: ""
        };

        //set value (data in file) to defaultfiles (array of file)
        fr.onload = function () {
            defaultfiles[inpFile.name].value = fr.result; //<-- set data
        }

        fr.readAsText(inpFile);
    };

    const openSelectFileDialog = () => {
        inputRef.current.click();
    };

    const handleEditorDidMount = (editor) => {
        editorRef.current = editor;
    };

    // function getEditorValue() {
    //     alert(editorRef.current.getValue());
    // }

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


                    <div className="pt-5">
                        <FileTab />
                    </div>
                    {/* <button onClick={() => getEditorValue()}>
                Get Editor Value
            </button> */}
                </div>
            </div>

            {/* <button onClick={() => setFileName("newfile.js")}>
                        newfile.js
                    </button> */}
        </div>
    )
}

export default EditForm
