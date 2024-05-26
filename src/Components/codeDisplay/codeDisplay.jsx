/* eslint-disable react/prop-types */
import React, { useState, useEffect, useContext, useRef } from 'react';
import { dataContext } from '../../Context/context';

const CodeDisplay = ({ file, startLine, endLine }) => {
    const [[analizeData, setAnalyzeData], [files, setFile], [fileName, setFileName]] = useContext(dataContext);
    const [code, setCode] = useState('');
    const lineIndicate = useRef(null);

    const extractLines = (text, startLine, endLine) => {
        const lines = text.split('\n');
        const data = lines.slice(startLine - 1, endLine);
        const numLines = data.split('\n').length;
        lineIndicate.current.innerHTML = '';
        for (let i = 1; i <= numLines; i++) {
            const sp = document.createElement('span');
            sp.innerHTML = i
            sp.classList = 'line-number'
            const br = document.createElement('br');
            lineIndicate.current.appendChild(sp)
            lineIndicate.current.appendChild(br)
        }
        setCode(data);
    }

    const readFileFromBuffer = (file) => {
        const data = files.find(f => f.name === file.originalname);
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(data);
        });
    };

    const handleFileRead = async () => {
        try {
            const fileContent = await readFileFromBuffer(file);
            extractLines(fileContent, startLine, endLine);
        } catch (error) {
            console.error('Error reading the file:', error);
        }
    };

    useEffect(() => {
        if (file) {
            handleFileRead();
        }
    }, [file, startLine, endLine]);

    return (
        <div className='relative'>
            <pre className='codeDisplay language-js line-numbers-mode'>
                <code className='language-js'>
                    {code}
                </code>
                <div ref={lineIndicate} className="line-numbers-wrapper" aria-hidden="true">
                </div>
            </pre >
        </div>
    );
};

export default CodeDisplay;
