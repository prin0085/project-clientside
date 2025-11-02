import ContextAnalyzer from './shared/contextAnalyzer.js';
import FixerBase from './shared/fixerBase.js';
import CodeValidator from './shared/codeValidator.js';
import { functionNode } from '../globalFunction';

/**
 * Enhanced unused variable remover using the new architecture
 * Handles variable, function, and parameter removal with improved validation
 */
class RemoveUnusedVarFixer extends FixerBase {
  constructor() {
    super('no-unused-vars', 'complex');
    this.contextAnalyzer = new ContextAnalyzer();
    this.validator = new CodeValidator();
  }

  /**
   * Check if this fixer can handle the given error
   * @param {string} code - The source code
   * @param {Object} error - The ESLint error to fix
   * @returns {boolean} True if this fixer can handle the error
   */
  canFix(code, error) {
    if (!super.canFix(code, error)) {
      return false;
    }

    // Check if we're in a safe zone for variable removal
    const safeZone = this.contextAnalyzer.findSafeFixZone(code, error);

    if (!safeZone.isSafe) {
      return false;
    }

    // Must be an unused variable error
    return this.isUnusedVariableError(error.message);
  }

  /**
   * Apply the unused variable removal fix
   * @param {string} code - The source code to fix
   * @param {Object} error - The ESLint error to fix
   * @returns {Object} The result of the fix operation
   */
  fix(code, error) {
    try {
      const context = this.contextAnalyzer.analyzePosition(code, error.line, error.column);

      // Enhanced context checking
      if (context.inString || context.inComment || context.inRegex) {
        return this.createFailureResult(code, `Cannot remove variables inside ${this.getContextType(context)}`);
      }

      const targetLine = this.getLine(code, error.line);
      const category = this.categorizeLine(targetLine);

      let fixedCode;
      let operation;

      switch (category.type) {
        case 'function-parameters':
          fixedCode = this.removeUnusedFunctionArgument(code, error);
          operation = 'function parameter';
          break;
        case 'function-declaration':
          fixedCode = this.removeUnusedFunction(code, error);
          operation = 'function declaration';
          break;
        case 'variable':
          fixedCode = this.removeUnusedVariable(code, error);
          operation = 'variable declaration';
          break;
        default:
          return this.createFailureResult(code, 'Unknown unused variable type');
      }

      if (fixedCode === code) {
        return this.createFailureResult(code, 'No changes needed or removal not safe');
      }


      const test2 = fixedCode.split('\n');
      const tes222 = test2[error.line - 1];

      // Enhanced validation
      const syntaxValidation = this.validator.validateSyntax(fixedCode);
      if (!syntaxValidation.isValid) {
        return this.createFailureResult(code, `Removal would create syntax error: ${syntaxValidation.error}`);
      }

      // Semantic validation to ensure removal doesn't break code
      const semanticValidation = this.validator.validateSemantics(code, fixedCode);
      if (!semanticValidation.isValid) {
        return this.createFailureResult(code, `Removal would change code semantics: ${semanticValidation.error}`);
      }

      return this.createSuccessResult(fixedCode, `Removed unused ${operation} successfully`);
    } catch (error) {
      return this.handleError(error, code, 'unused variable removal');
    }
  }

  /**
   * Check if error message indicates unused variable
   * @param {string} message - Error message
   * @returns {boolean} True if unused variable error
   * @private
   */
  isUnusedVariableError(message) {
    return message.includes('is defined but never used') ||
      message.includes('is assigned a value but never used') ||
      message.includes('Unused variable') ||
      message.includes('no-unused-vars');
  }

  /**
   * Get context type description for error messages
   * @param {Object} context - Context object
   * @returns {string} Context type description
   * @private
   */
  getContextType(context) {
    if (context.inString) return 'string literal';
    if (context.inComment) return 'comment';
    if (context.inRegex) return 'regular expression';
    if (context.inTemplate) return 'template literal';
    return 'unknown context';
  }

  /**
   * Enhanced unused variable removal with better validation
   * @param {string} code - The source code
   * @param {Object} error - The ESLint error
   * @returns {string} Code with variable removed
   * @private
   */
  removeUnusedVariable(code, error) {
    const codeLines = code.split('\n');
    const targetLine = codeLines[error.line - 1];
    const declarationRegex = /^(let|const|var)\s+/;

    if (!declarationRegex.test(targetLine)) {
      // Handle simple reassignment
      const tokens = targetLine.trim().split('=');
      const leftSide = tokens[0]?.trim();

      if (this.isSimpleReassignment(targetLine, leftSide)) {
        codeLines.splice(error.line - 1, 1);
        return codeLines.join('\n');
      }

      return code;
    }

    const keywordMatch = targetLine.match(declarationRegex);
    if (!keywordMatch) return code;

    const keyword = keywordMatch[0];
    const variables = this.parseVariableDeclarations(targetLine.replace(keyword, ''));

    // Find the variable to remove based on error position
    const variableToRemove = this.findVariableAtPosition(targetLine, variables, error.column - 1);

    if (!variableToRemove) return code;

    // Enhanced removal logic
    const updatedVariables = variables.filter(v =>
      this.normalizeVariableName(v) !== this.normalizeVariableName(variableToRemove)
    );

    if (updatedVariables.length === 0) {
      // Remove entire line if no variables remain
      codeLines.splice(error.line - 1, 1);
    } else {
      // Reconstruct declaration
      codeLines[error.line - 1] = `${keyword}${updatedVariables.join(', ')};`;
    }

    return codeLines.join('\n');
  }

  /**
   * Enhanced unused function argument removal
   * @param {string} code - The source code
   * @param {Object} error - The ESLint error
   * @returns {string} Code with parameter removed
   * @private
   */
  removeUnusedFunctionArgument(code, error) {
    const codeLines = code.split('\n');
    const targetLine = codeLines[error.line - 1];

    const functionInfo = this.analyzeFunctionSignature(targetLine);
    if (!functionInfo) return code;

    const paramToRemove = this.findParameterAtPosition(
      targetLine,
      functionInfo.params,
      error.column - 1
    );

    if (!paramToRemove) return code;

    const updatedParams = functionInfo.params.filter(p =>
      p.trim() !== paramToRemove.trim()
    );

    const updatedLine = this.reconstructFunctionSignature(
      targetLine,
      functionInfo,
      updatedParams
    );

    codeLines[error.line - 1] = updatedLine;
    return codeLines.join('\n');
  }

  /**
   * Enhanced unused function removal
   * @param {string} code - The source code
   * @param {Object} error - The ESLint error
   * @returns {string} Code with function removed
   * @private
   */
  removeUnusedFunction(code, error) {
    const targetLine = this.getLine(code, error.line);

    // Use existing functionNode utility but with enhanced validation
    const subCode = functionNode(code, targetLine);

    if (!subCode) return code;

    const startIndex = code.indexOf(subCode);
    if (startIndex === -1) return code;

    const endIndex = startIndex + subCode.length;

    // Enhanced removal with proper cleanup
    let beforeFunction = code.slice(0, startIndex);
    let afterFunction = code.slice(endIndex);

    // Clean up extra whitespace and newlines
    beforeFunction = beforeFunction.replace(/\s+$/, '');
    afterFunction = afterFunction.replace(/^\s+/, '');

    // Ensure proper spacing
    const updatedCode = beforeFunction +
      (beforeFunction && afterFunction ? '\n\n' : '') +
      afterFunction;

    return updatedCode.trim();
  }

  /**
   * Parse variable declarations handling destructuring and complex patterns
   * @param {string} declarationPart - The part after var/let/const
   * @returns {string[]} Array of variable declarations
   * @private
   */
  parseVariableDeclarations(declarationPart) {
    const variables = [];
    let current = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < declarationPart.length; i++) {
      const char = declarationPart[i];
      const prevChar = i > 0 ? declarationPart[i - 1] : '';

      // Handle string literals
      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = '';
        }
      }

      if (!inString) {
        // Track nesting depth for objects and arrays
        if (char === '{' || char === '[' || char === '(') {
          depth++;
        } else if (char === '}' || char === ']' || char === ')') {
          depth--;
        } else if (char === ',' && depth === 0) {
          // Found a variable separator at top level
          variables.push(current.trim());
          current = '';
          continue;
        }
      }

      current += char;
    }

    if (current.trim()) {
      variables.push(current.trim());
    }

    return variables;
  }

  /**
   * Find variable at specific position with improved accuracy
   * @param {string} line - The line of code
   * @param {string[]} variables - Array of variable declarations
   * @param {number} column - Column position (0-based)
   * @returns {string|null} Variable at position or null
   * @private
   */
  findVariableAtPosition(line, variables, column) {
    const declarationStart = line.search(/^(let|const|var)\s+/) +
      line.match(/^(let|const|var)\s+/)[0].length;

    let currentPos = declarationStart;

    for (const variable of variables) {
      const variableEnd = currentPos + variable.length;

      if (column >= currentPos && column <= variableEnd) {
        return variable;
      }

      currentPos = variableEnd + 2; // +2 for ", "
    }

    return null;
  }

  /**
   * Normalize variable name for comparison (handles destructuring)
   * @param {string} variable - Variable declaration
   * @returns {string} Normalized variable name
   * @private
   */
  normalizeVariableName(variable) {
    // Extract variable name from declarations like "a = 5" or "{a, b} = obj"
    const assignmentMatch = variable.match(/^([^=]+)/);
    if (assignmentMatch) {
      return assignmentMatch[1].trim();
    }
    return variable.trim();
  }

  /**
   * Analyze function signature to extract parameter information
   * @param {string} line - Function declaration line
   * @returns {Object|null} Function information or null
   * @private
   */
  analyzeFunctionSignature(line) {
    // Arrow functions
    if (line.includes('=>')) {
      const arrowMultiMatch = /,\s*\(([^)]*)\)\s*=>|^\s*\(([^)]*)\)\s*=>/.exec(line);
      if (arrowMultiMatch) {
        const paramString = arrowMultiMatch[1] || arrowMultiMatch[2];
        return {
          type: 'arrow-multi',
          params: paramString ? paramString.split(',').map(p => p.trim()).filter(p => p) : [],
          hasParens: true
        };
      }

      const arrowSingleMatch = /,\s*(\w+)\s*=>|^\s*(\w+)\s*=>/.exec(line);
      if (arrowSingleMatch) {
        return {
          type: 'arrow-single',
          params: [arrowSingleMatch[1] || arrowSingleMatch[2]],
          hasParens: false
        };
      }
    }

    // Traditional functions
    const funcMatch = /function\s+\w*\s*\(([^)]*)\)/.exec(line);
    if (funcMatch) {
      return {
        type: 'function',
        params: funcMatch[1].split(',').map(p => p.trim()).filter(p => p)
      };
    }

    // Method definitions
    const methodMatch = /\w+\s*\(([^)]*)\)\s*{/.exec(line);
    if (methodMatch) {
      return {
        type: 'method',
        params: methodMatch[1].split(',').map(p => p.trim()).filter(p => p)
      };
    }

    return null;
  }

  /**
   * Reconstruct function signature with updated parameters
   * @param {string} originalLine - Original function line
   * @param {Object} functionInfo - Function information
   * @param {string[]} updatedParams - Updated parameter list
   * @returns {string} Reconstructed function line
   * @private
   */
  reconstructFunctionSignature(originalLine, functionInfo, updatedParams) {
    const newParamString = updatedParams.join(', ');

    switch (functionInfo.type) {
      case 'arrow-multi':
        return originalLine.replace(
          /,\s*\(([^)]*)\)\s*=>|^\s*\(([^)]*)\)\s*=>/,
          (match) => match.startsWith(',') ?
            `, (${newParamString}) =>` :
            `(${newParamString}) =>`
        );

      case 'arrow-single':
        if (updatedParams.length === 0) {
          return originalLine.replace(/,\s*\w+\s*=>|^\s*\w+\s*=>/,
            match => match.startsWith(',') ? ', () =>' : '() =>');
        } else if (updatedParams.length === 1) {
          return originalLine.replace(/,\s*\w+\s*=>|^\s*\w+\s*=>/,
            match => match.startsWith(',') ?
              `, ${updatedParams[0]} =>` :
              `${updatedParams[0]} =>`);
        } else {
          return originalLine.replace(/,\s*\w+\s*=>|^\s*\w+\s*=>/,
            match => match.startsWith(',') ?
              `, (${newParamString}) =>` :
              `(${newParamString}) =>`);
        }

      case 'function':
      case 'method':
        return originalLine.replace(/\([^)]*\)/, `(${newParamString})`);

      default:
        return originalLine;
    }
  }

  /**
   * Find parameter at specific position
   * @param {string} line - Function line
   * @param {string[]} params - Parameter array
   * @param {number} column - Column position
   * @returns {string|null} Parameter at position
   * @private
   */
  findParameterAtPosition(line, params, column) {
    if (params.length === 1) {
      return params[0];
    }

    const parenIndex = line.indexOf('(');
    if (parenIndex === -1) return null;

    let currentPos = parenIndex + 1;

    for (const param of params) {
      const paramEnd = currentPos + param.length;

      if (column >= currentPos && column <= paramEnd) {
        return param;
      }

      currentPos = paramEnd + 2; // +2 for ", "
    }

    return null;
  }

  /**
   * Check if line is a simple reassignment
   * @param {string} lineText - Line text
   * @param {string} variable - Variable name
   * @returns {boolean} True if simple reassignment
   * @private
   */
  isSimpleReassignment(lineText, variable) {
    const regex = new RegExp(`^\\s*${variable}\\s*=`);
    return regex.test(lineText.trim());
  }

  /**
   * Categorize the type of line for appropriate handling
   * @param {string} line - Line of code
   * @returns {Object} Category information
   * @private
   */
  categorizeLine(line) {
    // Variable declarations
    const varDecl = /^\s*(var|let|const)\s+([$A-Za-z_][$\w]*)/.exec(line);
    if (varDecl) {
      return { type: 'variable', name: varDecl[2] };
    }

    // Function parameters (arrow functions)
    if (line.includes('=>')) {
      return { type: 'function-parameters' };
    }

    // Function parameters (traditional functions and methods)
    if (/function\s+\w*\s*\(([^)]*)\)/.test(line) || /\w+\s*\(([^)]*)\)\s*{/.test(line)) {
      return { type: 'function-parameters' };
    }

    // Function declarations
    if (this.isFunctionDeclaration(line)) {
      return { type: 'function-declaration' };
    }

    return { type: 'other' };
  }

  /**
   * Check if line is a function declaration
   * @param {string} line - Line of code
   * @returns {boolean} True if function declaration
   * @private
   */
  isFunctionDeclaration(line) {
    const functionRegex = /^\s*function\s+\w+\s*\(.*\)\s*{/;
    const arrowFunctionRegex = /^\s*(const|let|var)\s+\w+\s*=\s*\(.*\)\s*=>\s*{/;
    return functionRegex.test(line) || arrowFunctionRegex.test(line);
  }
}

// Create instance and export both class and legacy function
const removeUnusedVarFixer = new RemoveUnusedVarFixer();

// Legacy function for backward compatibility
export const removeUnusedVars = (code, error) => {
  const result = removeUnusedVarFixer.fix(code, error);
  return result.code;
};

// Legacy function for backward compatibility
export const isFunctionDeclaration = (line) => {
  return removeUnusedVarFixer.isFunctionDeclaration(line);
};

// Export the fixer class for use in registry
export { RemoveUnusedVarFixer };
export default RemoveUnusedVarFixer;