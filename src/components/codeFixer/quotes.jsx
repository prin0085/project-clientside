import { isInsideStringOrComment } from '../globalFunction';

export const quotes = (code, error) => {
  const lines = code.split('\n');
  const targetLine = lines[error.line - 1];
  const column = error.column - 1;
  
  // Check if we're inside a comment (we want to fix quotes, so being in string is expected)
  const context = analyzeQuoteContext(targetLine, column);
  if (context.inComment) {
    return code;
  }
  
  // Determine target quote style from error message
  const targetQuote = getTargetQuoteStyle(error.message);
  if (!targetQuote) {
    return code;
  }
  
  const fixedLine = convertQuoteStyle(targetLine, column, targetQuote);
  lines[error.line - 1] = fixedLine;
  return lines.join('\n');
};

const analyzeQuoteContext = (line, column) => {
  let inComment = false;
  
  for (let i = 0; i < column && i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    // Check for start of comment
    if (char === '/' && nextChar === '/') {
      inComment = true;
      break;
    }
  }
  
  return { inComment };
};

const getTargetQuoteStyle = (message) => {
  if (message.includes('single')) {
    return "'";
  } else if (message.includes('double')) {
    return '"';
  }
  return null;
};

const convertQuoteStyle = (line, column, targetQuote) => {
  // Find the string boundaries starting from the error position
  const stringStart = findStringStart(line, column);
  const stringEnd = findStringEnd(line, stringStart);
  
  if (stringStart === -1 || stringEnd === -1) {
    return line;
  }
  
  const currentQuote = line[stringStart];
  const stringContent = line.substring(stringStart + 1, stringEnd);
  
  // Don't convert if target quote exists inside the string content
  if (stringContent.includes(targetQuote)) {
    return line;
  }
  
  // Build the new line with converted quotes
  const before = line.substring(0, stringStart);
  const after = line.substring(stringEnd + 1);
  
  return before + targetQuote + stringContent + targetQuote + after;
};

const findStringStart = (line, startPos) => {
  // Look backwards from startPos to find the opening quote
  for (let i = startPos; i >= 0; i--) {
    const char = line[i];
    if (char === '"' || char === "'") {
      return i;
    }
  }
  return -1;
};

const findStringEnd = (line, startPos) => {
  if (startPos === -1) return -1;
  
  const quoteChar = line[startPos];
  
  // Look forwards from startPos + 1 to find the closing quote
  for (let i = startPos + 1; i < line.length; i++) {
    const char = line[i];
    const prevChar = line[i - 1];
    
    // Found matching quote that's not escaped
    if (char === quoteChar && prevChar !== '\\') {
      return i;
    }
  }
  return -1;
};