import { isInsideStringOrComment } from '../globalFunction';

export const semi = (code, error) => {
  const lines = code.split('\n');
  const targetLine = lines[error.line - 1];
  const column = error.column - 1;
  
  // Check if we're inside a string or comment
  if (isInsideStringOrComment(targetLine, column)) {
    return code;
  }
  
  // Handle missing semicolon case
  if (error.message.includes('Missing semicolon')) {
    const fixedLine = addMissingSemicolon(targetLine, column);
    lines[error.line - 1] = fixedLine;
    return lines.join('\n');
  }
  
  // Handle extra semicolon case (like in if statements)
  if (error.message.includes('Extra semicolon')) {
    const fixedLine = removeExtraSemicolon(targetLine, column);
    lines[error.line - 1] = fixedLine;
    return lines.join('\n');
  }
  
  return code;
};

const addMissingSemicolon = (line, column) => {
  // Find the end of the statement (usually end of line, but could be before a comment)
  const commentIndex = line.indexOf('//');
  const insertPosition = commentIndex !== -1 ? commentIndex : line.length;
  
  // Trim any trailing whitespace before adding semicolon
  const beforeComment = line.substring(0, insertPosition).trimEnd();
  const afterComment = line.substring(insertPosition);
  
  return beforeComment + ';' + (afterComment ? ' ' + afterComment : '');
};

const removeExtraSemicolon = (line, column) => {
  // Remove semicolon at the specified position
  // This typically happens in control structures like if (condition);
  const before = line.substring(0, column);
  const after = line.substring(column + 1);
  
  return before + after;
};