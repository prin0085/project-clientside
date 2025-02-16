/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import CodeDisplay from "../codeDisplay/codeDisplay";
import { extractLines, functionNode, findName, addCommentsToEachLine } from './../globalFunction';

const NoUnusedVar = ({ file, error, des }) => {
    const [code, setCode] = useState('');
    const [isInArgs, setInArgs] = useState(false);
    const varName = findName(error.message);
    const lineErrIndicate = extractLines(file, error);

    useEffect(() => {
        const regex = createVariableRegex(varName);
        // const results = separateDeclarations();
        // console.log(results.variableDeclarations[0])
        // if (results.variableDeclarations.length > 0) {
        //     setCode(results.variableDeclarations[0])
        // } else {
        const isArgs = isFuntionArgs();
        const matches = file.match(regex);
        setInArgs(false)
        if (isArgs) {
            setInArgs(true)
            setCode(lineErrIndicate);
        } else if (matches) {
            setCode(matches[0]);
        } else {
            setCode(functionNode(file, lineErrIndicate));
        }
        // }
    }, [error]);

    const isFuntionArgs = () => {
        const bracketStart = lineErrIndicate.indexOf("(");
        const bracketEnd = lineErrIndicate.indexOf(")");

        const variablePosition = lineErrIndicate.substring(bracketStart, bracketEnd).indexOf(varName);
        if (variablePosition != -1) {
            return true;
        }
        return false;
    }

    const removeVar = () => {
        const bracketStart = lineErrIndicate.indexOf("(");
        const bracketEnd = lineErrIndicate.indexOf(")");
        return lineErrIndicate.substring(0, bracketStart + 1) + lineErrIndicate.substring(bracketEnd)
    };

    // const separateDeclarations = (txt) => {
    //     // Regular expressions to capture variable declarations and function declarations
    //     const varDeclRegex = /\b(var|let|const)\s+[^;]*;/g;
    //     const funcDeclRegex = /\bfunction\s+\w+\s*\([^)]*\)\s*\{[^}]*\}/g;
    //     const arrowFuncRegex = /(var|let|const)\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{[^}]*\}/g;

    //     // Find all matches for variable declarations
    //     const varDeclarations = txt.match(varDeclRegex) || [];
    //     // Find all matches for function declarations
    //     const funcDeclarations = txt.match(funcDeclRegex) || [];
    //     // Find all matches for arrow function declarations
    //     const arrowFuncDeclarations = txt.match(arrowFuncRegex) || [];

    //     return {
    //         variableDeclarations: varDeclarations,
    //         functionDeclarations: [...funcDeclarations, ...arrowFuncDeclarations]
    //     };
    // }

    const removeFormfile = () => {
        //remove a variable
        const lineNumber = error.line;
        const textfile = file.split('\n');
        let declareLine = 0;
        // this is code where variable has been mod
        // but variable still didnt use anywhere
        if (lineErrIndicate.trim() != code) {
            for (const txt of textfile) {
                declareLine++;
                if (txt.includes(code)) {
                    break;
                }
            }
        }
        // if (!isInArgs) {
        // }

        removeLinesByNumbers([lineNumber, declareLine]);
    };

    function removeLinesByNumbers(lineNumbers) {
        // Split the text into an array of lines
        let lines = file.split('\n');

        // Sort the lineNumbers array in descending order
        lineNumbers.sort((a, b) => b - a);

        // Remove the specified lines
        for (let lineNumber of lineNumbers) {
            // Check if the lineNumber is within the valid range
            if (lineNumber >= 1 && lineNumber <= lines.length) {
                // Remove the specified line (lineNumber - 1 because arrays are 0-indexed)
                lines.splice(lineNumber - 1, 1);
            }
        }

        // Join the array back into a single string
        //return
        console.log(lines.join('\n'));
    }

    const createVariableRegex = (variableName) => {
        return new RegExp(`\\b(var|let|const)\\s+\\b${variableName}\\b[^;]*;`, 'g');
    }

    const example = '//จะเก็บไว้ใช้ภายหลัง' + '\n' + addCommentsToEachLine(code);
    const example1 = '//นำตัวแปรนั้นออกจาก Argument ของฟังก์ชัน' + '\n' + removeVar();

    return (
        <>
            <CodeDisplay codeTxt={code} />
            <div className="m-5">
                สามารถแก้ได้โดย
                <div className='pl-5'>
                    <strong> - {des.solution[1]} </strong>
                    <span onClick={() => removeFormfile()} className='clickable'>
                        คลิกเพื่อนำออก
                    </span>
                </div>
                <div className='pl-5'><strong> - {des.solution[2]} </strong></div>
            </div>
            {isInArgs ? <CodeDisplay codeTxt={example1} /> : <CodeDisplay codeTxt={example} />}
        </>
    );
};

export default NoUnusedVar;
