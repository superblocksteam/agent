import { isString } from 'lodash';
import { PositionedSegment, StringSegment } from './types';

const DATA_BIND_REGEX = /{{([\s\S]*?)}}/;

// referencing DATA_BIND_REGEX fails for the value "{{Table1.tableData[Table1.selectedRowIndex]}}" if you run it multiple times and don't recreate
export const containsBindingsAnywhere = (value: string): boolean => DATA_BIND_REGEX.test(value);

/**
 * used to filter the output of `getDynamicStringSegments` for further processing, not a validator
 */
export const isExactBinding = (value: string): boolean => value.startsWith('{{') && value.endsWith('}}');

export function getDynamicStringSegments(dynamicString: string): string[] {
  return getDynamicStringSegmentsWithPositions(dynamicString).map((segment) => segment.str);
}

// See unit tests for examples
function getDynamicStringSegmentsWithPositions(inputString: string): PositionedSegment[] {
  const tokens: PositionedSegment[] = [];
  let currentToken = '';
  let betweenBrackets = false;
  let sum = 0;
  for (let i = 0; i < inputString.length; i++) {
    if (inputString[i] === '{') {
      if (betweenBrackets) {
        currentToken += '{';
        sum++;
      } else if (inputString[i + 1] === '{') {
        if (currentToken.length > 0) {
          tokens.push({
            str: currentToken,
            from: i - currentToken.length,
            to: i
          });
        }
        currentToken = '{{';
        betweenBrackets = true;
        sum = 0;
        i++; // Skip the second '{' character
      } else {
        currentToken += '{';
      }
    } else if (inputString[i] === '}') {
      if (betweenBrackets) {
        // Look for closing }} only when the brackets are balanced. This prevents bugs with {{{a: 1}}}
        // while it will fail for mismatched brackets like {{{a: 1}}
        if (sum === 0 && inputString[i + 1] === '}') {
          currentToken += '}}';
          i++; // Skip the second '}' character
          tokens.push({
            str: currentToken,
            from: i - currentToken.length,
            to: i
          });
          currentToken = '';
          betweenBrackets = false;
        } else {
          currentToken += '}';
          sum = Math.max(sum - 1, 0);
        }
      } else {
        currentToken += '}';
        sum = Math.max(sum - 1, 0);
      }
    } else {
      currentToken += inputString[i];
    }
  }

  if (currentToken.length > 0) {
    tokens.push({
      str: currentToken,
      from: inputString.length - currentToken.length,
      to: inputString.length
    });
  }

  return tokens;
}

export const getDynamicBindings = (
  dynamicString: string
): {
  stringSegments: string[];
  jsSnippets: string[];
  positionedSnippets: PositionedSegment[];
} => {
  // Protect against bad string parse
  if (!dynamicString || !isString(dynamicString)) {
    return { stringSegments: [], jsSnippets: [], positionedSnippets: [] };
  }
  // Get the {{binding}} bound values
  const stringSegments = getDynamicStringSegmentsWithPositions(dynamicString.trim());
  // Get the "binding" path values
  const paths: Array<PositionedSegment> = stringSegments.map((positionedSegment) => {
    const segment = positionedSegment.str;
    const length = segment.length;
    const matches = isExactBinding(segment);
    if (matches) {
      return {
        str: segment.substring(2, length - 2),
        from: positionedSegment.from + 2,
        to: positionedSegment.from + length - 2
      };
    }
    return {
      str: '',
      from: 0,
      to: 0
    };
  });
  return {
    stringSegments: stringSegments.map((segment) => segment.str),
    jsSnippets: paths.map((path) => path.str),
    positionedSnippets: paths.filter((path) => path.str !== '')
  };
};

export const combineDynamicBindings = (jsSnippets: string[], stringSegments: string[]) => {
  return stringSegments
    .map((segment, index) => {
      if (jsSnippets[index] && jsSnippets[index].length > 0) {
        return jsSnippets[index];
      } else {
        return `'${segment}'`;
      }
    })
    .join(' + ');
};

export const joinStringWithBindings = (segments: StringSegment[]): string => {
  return segments.map((segment) => (segment.dynamic ? `{{${segment.value}}}` : segment.value)).join('');
};
