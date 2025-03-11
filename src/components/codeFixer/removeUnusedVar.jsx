import React from "react";
import { functionNode } from '../globalFunction';

export const isFunctionDeclaration = (line) => {
    const functionRegex = /^\s*function\s+\w+\s*\(.*\)\s*{/;

    const arrowFunctionRegex = /^\s*(const|let|var)\s+\w+\s*=\s*\(.*\)\s*=>\s*{/;

    return functionRegex.test(line) || arrowFunctionRegex.test(line);
};

export const removeUnusedVars = (code, error) => {
    const line = error.line;
    const endColumn = error.endColumn;
    const codeLines = code.split("\n");
    const targetLine = codeLines[line - 1];
    const fIndex = targetLine.indexOf("(");
    const lIndex = targetLine.indexOf(")");

    const isFunctionArgument = fIndex < endColumn - 1 && lIndex > endColumn - 1;
    // check if it was function argument... 
    if (isFunctionArgument) {
        console.log('is functionArgument');
        return removeUnusedFunctionArgument(code, line, endColumn);
    } else if (isFunctionDeclaration(targetLine)) {
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