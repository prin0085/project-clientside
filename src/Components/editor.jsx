import React, { useState, useEffect } from 'react';
import Editor from "@monaco-editor/react";
import axios from 'axios';
//import * as ReactDOM from 'react-dom';

const defaultfiles = {
    "newfile.js": {
        name: "newfile.js",
        language: "javascript",
        value: ""
    }
}

const EditForm = () => {
    const [fileName, setFileName] = useState('newfile.js');
    const [files, setFile] = useState(null);
    const [dataAnalyze, setDataAnalyze] = useState(null);
    const editorRef = React.useRef(null);
    const inputRef = React.useRef(null);
    const file = defaultfiles[fileName];
    const apiUrl = 'http://localhost:3001/upload';

    useEffect(() => {
        if (dataAnalyze) {
            console.log(dataAnalyze.data.messages);
        }
    }, [dataAnalyze]);

    const handleAnalysis = async () => {
        if (!files) {
            alert('Please select a file for analysis.');
            return;
        }

        const formData = new FormData();
        formData.append('file', files);

        await axios
            .post(apiUrl, formData)
            .then((res) => setDataAnalyze(res))
            .catch(err => {
                console.error(err);
            });
    };

    const handleFileChange = (event) => {
        let fr = new FileReader();
        const divBtn = document.getElementById('divBtn');

        const btnDiv = document.createElement('div');
        const tabnameDiv = document.createElement('div');
        const tabnameSpan = document.createElement('span');
        const closetabDiv = document.createElement('div');

        const inpFile = event.target.files[0];

        btnDiv.className = 'inline-flex tab';
        tabnameDiv.className = 'flex items-center';
        tabnameSpan.className = 'font-bold w-100 truncate overflow-hidden';
        tabnameSpan.innerHTML = inpFile.name;
        tabnameDiv.append(tabnameSpan);

        closetabDiv.className = 'icon-button'
        closetabDiv.innerHTML = 'X';

        tabnameDiv.onclick = () => {
            setFileName(inpFile.name)
        }

        closetabDiv.onclick = () => {
            setFileName('newfile.js')
            inputRef.current.value = '';
            btnDiv.remove();
            delete defaultfiles[inpFile.name];
        }

        defaultfiles[inpFile.name] = {
            name: inpFile.name,
            language: "javascript",
            value: ""
        };

        fr.onload = function () {
            const a = defaultfiles[inpFile.name];
            a.value = fr.result;
            btnDiv.append(tabnameDiv);
            btnDiv.append(closetabDiv);
            divBtn.append(btnDiv);
        }

        setFile(inpFile);
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
        <div className="App">
            <button onClick={() => openSelectFileDialog()}>
                อัปโหลด
            </button>
            <button onClick={handleAnalysis}>Analyze File</button>
            <input type="file" ref={inputRef} className='hidden' onChange={handleFileChange} />
            <div className='pt-5' id='divBtn'>
                <button onClick={() => setFileName("newfile.js")}>
                    newfile.js
                </button>
            </div>

            {/* <button onClick={() => getEditorValue()}>
                Get Editor Value
            </button> */}
            <Editor
                height="100vh"
                width="100%"
                theme="vs-dark"
                onMount={handleEditorDidMount}
                path={file.name}
                defaultLanguage={file.language}
                defaultValue={file.value}
            />
        </div>
    )
}

export default EditForm
