import React from "react";

export const extractLines = (code, error) => {
    const startLine = error.line;
    const endLine = error.endLine;
    const nodeType = error.nodeType;

    const lines = code.split('\n');
    //const indicator = findName(error.message);
    let errorIndicator = lines.slice(startLine - 1, endLine)[0];
    //declarationNode(indicator)
    // const dataNodeType = {
    //     "FunctionDeclaration": functionNode(code, errorIndicator),
    //     "ArrowFunctionExpression": functionNode(code, errorIndicator),
    // }

    // if (nodeType in dataNodeType) {
    //     errorIndicator = dataNodeType[nodeType];
    // }

    return errorIndicator;
}

export const findName = (msg) => {
    const regex = /'([^']*)'/g;
    let match;

    while ((match = regex.exec(msg)) !== null) {
        return match[1];
    }

    return null
}

export const functionNode = (code, indicator) => {
    const startOfFunc = code.indexOf(indicator);
    const endOfFunc = findEndOfFunction(code, startOfFunc);

    return code.substring(startOfFunc, endOfFunc + 1);
}

export const declarationNode = (code, indicator) => {
    const exextract = findEndOfVariableDeclaration(code, indicator);

    console.log(exextract)
}

export const isFixAble = (ruleId) => {
    const sol = [
        'no-unused-vars',
        'eqeqeq',
        'no-extra-semi',
        'no-trailing-spaces',
        'eol-last',
        'semi',
        'quotes'
    ];

    return sol.findIndex(w => w === ruleId) > -1;
}

const findEndOfFunction = (code, start) => {
    let stack = [];
    let inString = false;
    let stringChar = '';
    let inComment = false;
    let commentType = '';

    for (let i = start; i < code.length; i++) {
        let char = code[i];
        let nextChar = code[i + 1];

        if (inString) {
            // Check for end of string
            if (char === stringChar && code[i - 1] !== '\\') {
                inString = false;
                stringChar = '';
            }
        } else if (inComment) {
            // Check for end of comment
            if (commentType === 'single' && char === '\n') {
                inComment = false;
            } else if (commentType === 'multi' && char === '*' && nextChar === '/') {
                inComment = false;
                i++;
            }
        } else {
            // Check for start of string
            if (char === '"' || char === '\'' || char === '`') {
                inString = true;
                stringChar = char;
            } else if (char === '/' && nextChar === '/') {
                inComment = true;
                commentType = 'single';
                i++;
            } else if (char === '/' && nextChar === '*') {
                inComment = true;
                commentType = 'multi';
                i++;
            } else if (char === '{') {
                stack.push('{');
            } else if (char === '}') {
                stack.pop();
                if (stack.length === 0) {
                    return i;
                }
            }
        }
    }

    return -1; // In case no matching closing brace is found
}

const findEndOfVariableDeclaration = (code, variableName) => {
    const varRegex = new RegExp(`\\b(var|let|const)\\s+${variableName}\\b`);
    const match = code.match(varRegex);
    console.log(match)
    if (!match) {
        return ''; // Variable declaration not found
    }

    // Find the index where the variable declaration starts
    const declarationStartIndex = match.index;
    let declarationEndIndex = declarationStartIndex;

    // Define a flag for whether we are inside a string
    let inString = false;
    let stringChar = '';

    for (let i = declarationStartIndex; i < code.length; i++) {
        const char = code[i];

        // Handle strings to ensure we don't incorrectly identify the end of the declaration within a string
        if (inString) {
            if (char === stringChar && code[i - 1] !== '\\') {
                inString = false;
                stringChar = '';
            }
            continue;
        } else if (char === '"' || char === '\'' || char === '`') {
            inString = true;
            stringChar = char;
            continue;
        }

        // Check for the end of the declaration (semicolon or end of line)
        if (char === ';') {
            declarationEndIndex = i + 1;
            break;
        }
    }
    const linesBeforeDeclaration = code.substring(0, declarationStartIndex).split(/\r\n|\r|\n/).length;
    return [code.substring(declarationStartIndex, declarationEndIndex).trim(), linesBeforeDeclaration];
}

export const addCommentsToEachLine = (inputString) => {
    // Split the input string into an array of lines
    const lines = inputString.split('\n');

    // Add // to the beginning of each line
    const commentedLines = lines.map(line => `// ${line}`);

    // Join the array of commented lines back into a single string
    const result = commentedLines.join('\n');

    return result;
}

// Context analysis utilities for Phase 2 rules
export const analyzeContext = (line, column) => {
    let inString = false;
    let stringChar = '';
    let inComment = false;
    
    for (let i = 0; i < column && i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (inString) {
            // Check for end of string (handle escaped quotes)
            if (char === stringChar && line[i - 1] !== '\\') {
                inString = false;
                stringChar = '';
            }
        } else if (inComment) {
            // Single line comments continue to end of line
            continue;
        } else {
            // Check for start of string
            if (char === '"' || char === "'" || char === '`') {
                inString = true;
                stringChar = char;
            }
            // Check for start of comment
            else if (char === '/' && nextChar === '/') {
                inComment = true;
                i++; // Skip next char
            }
        }
    }
    
    return { inString, inComment, stringChar };
}

export const isInsideStringOrComment = (line, column) => {
    const context = analyzeContext(line, column);
    return context.inString || context.inComment;
}