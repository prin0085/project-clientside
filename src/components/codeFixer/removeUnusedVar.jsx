import { functionNode } from '../globalFunction';

export const isFunctionDeclaration = (line) => {
    const functionRegex = /^\s*function\s+\w+\s*\(.*\)\s*{/;

    const arrowFunctionRegex = /^\s*(const|let|var)\s+\w+\s*=\s*\(.*\)\s*=>\s*{/;

    return functionRegex.test(line) || arrowFunctionRegex.test(line);
};

export const removeUnusedVars = (code, error) => {
    const line = error.line;
    const endColumn = error.column;
    const codeLines = code.split("\n");
    const targetLine = codeLines[line - 1];

    var cat = categorizeLine(targetLine);

    // check if it was function argument... 
    if (cat.type === 'function-parameters') {
        console.log('is functionArgument');
        return removeUnusedFunctionArgument(code, line, endColumn);
        // } else if (isFunctionDeclaration(targetLine)) {
    } else if (cat.type === 'function-declaration') {
        console.log('is function declare');
        return removeUnusedFunction(code, targetLine);
    } else {
        console.log('is variable');
        return removeUnusedVariable(code, line, endColumn);
    }
};

const removeUnusedFunction = (code, targetLine) => {
    const subCode = functionNode(code, targetLine);

    const startIndex = code.indexOf(subCode);

    if (startIndex === -1) return code; // If function is not found, return original code

    const endIndex = startIndex + subCode.length;

    // Remove the function from the code
    const updatedCode = code.slice(0, startIndex) + code.slice(endIndex);

    return updatedCode.trim(); // Remove extra new lines or spaces 
}

const removeUnusedVariable = (code, line, endColumn) => {
    const codeLines = code.split("\n"); // Split code into lines

    if (line > codeLines.length) return code; // Ensure line exists

    const targetLine = codeLines[line - 1]; // Get the target line (ESLint is 1-based)
    const declarationRegex = /^(let|const|var)\s+/;

    if (!declarationRegex.test(targetLine)) {
        const tokens = targetLine.trim().split("=");
        const leftSide = tokens[0]?.trim();

        if (isSimpleReassignment(targetLine, leftSide)) {
            // Remove reassignment line (like a = 5;)
            codeLines.splice(line - 1, 1);
            return codeLines.join("\n");
        }

        return code; // Not a variable declaration
    }

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
    if (line > codeLines.length) return code;

    let targetLine = codeLines[line - 1];

    let params = [];
    let isSingleParam = false;
    let isArrowFunction = false;

    // Check for arrow functions first
    if (targetLine.includes('=>')) {
        // Arrow function with parentheses: look for pattern right before =>
        const arrowMultiMatch = /,\s*\(([^)]*)\)\s*=>|^\s*\(([^)]*)\)\s*=>/.exec(targetLine);
        console.log(arrowMultiMatch);
        if (arrowMultiMatch) {
            const paramString = arrowMultiMatch[1] || arrowMultiMatch[2];
            params = paramString
                ? paramString.split(',').map(p => p.trim()).filter(p => p)
                : [];
            isSingleParam = params.length === 1;  // Check actual parameter count
            isArrowFunction = true;
        } else {
            // Arrow function single param: param => {} (no parentheses)
            const arrowSingleMatch = /,\s*(\w+)\s*=>|^\s*(\w+)\s*=>/.exec(targetLine);
            if (arrowSingleMatch) {
                const param = arrowSingleMatch[1] || arrowSingleMatch[2];
                params = [param];
                isSingleParam = true;
                isArrowFunction = true;
            }
        }
    } else {
        // Traditional function: function name(params) or function(params)
        const funcMatch = /function\s+\w*\s*\(([^)]*)\)/.exec(targetLine);
        if (funcMatch) {
            params = funcMatch[1]
                .split(',')
                .map(p => p.trim())
                .filter(p => p);
        } else {
            // Method definitions: methodName(params) {}
            const methodMatch = /\w+\s*\(([^)]*)\)\s*{/.exec(targetLine);
            if (methodMatch) {
                params = methodMatch[1]
                    .split(',')
                    .map(p => p.trim())
                    .filter(p => p);
            }
        }
    }

    if (params.length === 0) return code;

    // Find which parameter to remove based on column position
    let columnIndex = endColumn - 1;
    let argToRemove = findParameterAtPosition(targetLine, params, columnIndex, isSingleParam);

    if (!argToRemove) return code;

    // Remove the parameter
    const updatedParams = params.filter((param) => param.trim() !== argToRemove.trim());
    console.log(updatedParams);
    // Reconstruct the line with updated parameters
    let updatedLine;

    if (isArrowFunction) {
        if (isSingleParam && updatedParams.length === 1) {
            // Single param removed, need to add empty parentheses
            updatedLine = targetLine.replace(/\b\w+\s*=>/, '() =>');
        } else if (updatedParams.length === 1 && !targetLine.includes('(')) {
            // Still single param, keep without parentheses
            updatedLine = targetLine.replace(/\b\w+\s*=>/, `${updatedParams[0]} =>`);
        } else {
            // Arrow functions with parentheses - use the better pattern
            const newParamString = updatedParams.length > 0 ? updatedParams.join(", ") : "";
            updatedLine = targetLine.replace(/,\s*\(([^)]*)\)\s*=>|^\s*\(([^)]*)\)\s*=>/,
                (match) => {
                    if (match.startsWith(',')) {
                        return `, (${newParamString}) =>`;
                    } else {
                        return `(${newParamString}) =>`;
                    }
                });
        }
    } else {
        // Regular functions and methods
        const newParamString = updatedParams.length > 0 ? updatedParams.join(", ") : "";
        updatedLine = targetLine.replace(/\([^)]*\)/, `(${newParamString})`);
    }

    codeLines[line - 1] = updatedLine;
    return codeLines.join("\n");
};

const findParameterAtPosition = (line, params, columnIndex, isSingleParam) => {
    if (isSingleParam) {
        // For single parameter, just return it
        return params[0];
    }

    // For multiple parameters, find the one at the column position
    let charCount = line.indexOf("(") + 1;

    for (let i = 0; i < params.length; i++) {
        const paramLength = params[i].length;
        if (columnIndex >= charCount && columnIndex <= charCount + paramLength) {
            return params[i];
        }
        charCount += paramLength + 2; // +2 for ", " separator
    }

    return null;
};

const isSimpleReassignment = (lineText, variable) => {
    const regex = new RegExp(`^\\s*${variable}\\s*=`);
    return regex.test(lineText.trim());
};

const categorizeLine = (line) => {
    // Match var/let/const with variable names including $ and _
    const varDecl = /^\s*(var|let|const)\s+([$A-Za-z_][$\w]*)/.exec(line);
    if (varDecl) {
        return { type: 'variable', name: varDecl[2] };
    }

    // Check for arrow functions - look for => pattern
    if (line.includes('=>')) {
        // Arrow function with parentheses: look for pattern right before =>
        const arrowMultiMatch = /,\s*\(([^)]*)\)\s*=>|^\s*\(([^)]*)\)\s*=>/.exec(line);
        if (arrowMultiMatch) {
            const paramString = arrowMultiMatch[1] || arrowMultiMatch[2];
            const params = paramString
                ? paramString.split(',').map(p => p.trim()).filter(p => p)
                : [];

            return {
                type: 'function-parameters',
                params,
                isSingleParam: params.length === 1  // Check actual parameter count
            };
        }

        // Arrow function single param: param => {} (no parentheses)
        const arrowSingleMatch = /,\s*(\w+)\s*=>|^\s*(\w+)\s*=>/.exec(line);
        if (arrowSingleMatch) {
            const param = arrowSingleMatch[1] || arrowSingleMatch[2];
            return {
                type: 'function-parameters',
                params: [param],
                isSingleParam: true
            };
        }
    }

    // Traditional function: function name(params) or function(params)
    const funcMatch = /function\s+\w*\s*\(([^)]*)\)/.exec(line);
    if (funcMatch) {
        const params = funcMatch[1]
            .split(',')
            .map(p => p.trim())
            .filter(p => p);

        return {
            type: 'function-parameters',
            params,
            isSingleParam: false
        };
    }

    // Method definitions: methodName(params) {}
    const methodMatch = /\w+\s*\(([^)]*)\)\s*{/.exec(line);
    if (methodMatch) {
        const params = methodMatch[1]
            .split(',')
            .map(p => p.trim())
            .filter(p => p);

        return {
            type: 'function-parameters',
            params,
            isSingleParam: false
        };
    }

    // Match function declaration
    const funcDecl = isFunctionDeclaration(line);
    if (funcDecl) {
        return { type: 'function-declaration', name: funcDecl[1] };
    }

    return { type: 'other' };
}