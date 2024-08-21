import { get, isFunction, isPlainObject } from 'lodash';
import type { TreeCursor } from '@lezer/common';
import type { LRParser } from '@lezer/lr';
import type { Token, TokenizeOptions } from 'esprima';
import type { SourceLocation } from 'estree';

export type EvaluationPair = {
  binding: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  range: {
    start: number;
    end: number;
  };
  // How many tokens were consumed
  tokenIndex?: number;
};

export type PythonParser = LRParser;

type TokenWithRangeAndLoc = Token & {
  range?: [number, number];
  loc?: SourceLocation;
};

export const extractJsEvaluationPairsWithTokenizer = (
  jsSnippet: string,
  entitiesToExtract: Set<string>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataTree: Record<string, any>,
  tokenize: (input: string, config?: TokenizeOptions) => TokenWithRangeAndLoc[],
  namespacedEntitiesToExtract: Record<string, Set<string>> = {}
): EvaluationPair[] => {
  let tokens: TokenWithRangeAndLoc[] = [];
  const ret: EvaluationPair[] = [];
  try {
    tokens = tokenize(jsSnippet, { range: true, loc: true });
  } catch (e) {
    // Swallow the error and skip tokenization, let the backend vm handle javascript parsing
    return ret;
  }

  let currentNamespace;
  let canCapture = true; // set to true when we are capturing the first identifier in a list of a.b.c OR a[b][c]
  for (let i = 0; i < tokens.length; i++) {
    switch (tokens[i].type) {
      case 'Identifier': {
        const prevLine = tokens[i - 1]?.loc?.end.line;
        const currentLine = tokens[i]?.loc?.end.line;
        if (prevLine && currentLine && prevLine < currentLine) {
          // Handle automatic semicolon insertion such as when previous token ends with ]
          canCapture = true;
        }
        // Check if identifier is a valid namespace prefix
        if (canCapture && namespacedEntitiesToExtract[tokens[i].value]) {
          // set the current prefix to the token value
          currentNamespace = tokens[i].value;
          break;
        }

        const shouldExtract =
          entitiesToExtract.has(tokens[i].value) ||
          (currentNamespace && namespacedEntitiesToExtract[currentNamespace].has(tokens[i].value));
        if (canCapture && shouldExtract) {
          // Skip when the identifier is part of a key: value
          const nextToken = tokens[i + 1]?.value;
          if (nextToken === ':' || nextToken === '=') break;
          // We have found the first token to capture the entity path
          const output = extractEntity(i, tokens, dataTree);
          ret.push(output);
          // Skip ahead
          if (output.tokenIndex && output.tokenIndex > i) {
            // with the ++ increment this makes sure we start at the tokenIndex
            i = output.tokenIndex - 1;
          }
          canCapture = true;
          currentNamespace = undefined;
        } else {
          // reset prefix if we can't immediately capture something after it
          currentNamespace = undefined;
        }
        break;
      }
      case 'Punctuator': {
        if (currentNamespace && tokens[i].value === '.') {
          canCapture = true;
          // keep prefix if we see a . accessor
          break;
        }
        canCapture = !['.', ']'].includes(tokens[i].value);
        currentNamespace = undefined;
        break;
      }
      default: {
        canCapture = true;
        currentNamespace = undefined;
        break;
      }
    }
  }
  return ret;
};

// TODO: Move test for this into shared.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const extractEntity = (indexToStart: number, tokens: Array<TokenWithRangeAndLoc>, dataTree: Record<string, any>): EvaluationPair => {
  const currentPropertyPath: string[] = [];
  let previousToken: TokenWithRangeAndLoc | null = null;
  let done = false; // cant do break out of switch without state variable
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let entity: any;
  const removeTrailingPunctuation = () => {
    if (currentPropertyPath[currentPropertyPath.length - 1] === '.' || currentPropertyPath[currentPropertyPath.length - 1] === '[') {
      // Special case to handle null.length, such as Input1.value.length
      currentPropertyPath.pop();
    }
  };
  for (let j = indexToStart; j < tokens.length; j++) {
    switch (tokens[j].type) {
      case 'Identifier': {
        const val = tokens[j].value;
        const prevLine = previousToken?.loc?.end.line;
        const currentLine = tokens[j]?.loc?.end.line;
        if (prevLine && currentLine && prevLine < currentLine) {
          // Detect newlines that would insert a semicolon automatically
          done = true;
          // Update token position to previous- used for return values
          j--;
          break;
        }
        // We need to check hasOwnProperty to avoid prototype functions
        // like .map or .trim. This works on all primitives except null or undefined,
        // but we actually don't want this on arrays that have prototype methods
        if (!entity && dataTree[val]) {
          entity = dataTree[val];
          currentPropertyPath.push(val);
        } else if (entity && !Array.isArray(entity) && isPlainObject(entity) && Object.prototype.hasOwnProperty.call(entity, val)) {
          entity = get(entity, val);
          if (isFunction(entity)) {
            // Something like API1.run() or Input1.text.split() can't be extracted, but we will
            // return API or Input1.text in this case
            done = true;
            break;
          }
          currentPropertyPath.push(val);
          if (!entity) {
            done = true;
          }
        } else {
          done = true;
        }
        break;
      }
      case 'Punctuator': {
        if (tokens[j].value === '[' && tokens.length > j + 1 && !['Numeric', 'String'].includes(tokens[j + 1].type)) {
          // if we see [ and the next token is not a numeric (array access) or a string (property access), break out
          done = true;
          break;
        }
        if (tokens[j].value === ']' && !!previousToken && !['Numeric', 'String'].includes(previousToken.type)) {
          // if we see ] and the previous token is not a numeric (array access) or a string (property access), break out
          // in this case, we do not want to add an extra ] to resultant property path
          done = true;
          break;
        }
        if (!['.', '[', ']'].includes(tokens[j].value)) {
          // invalid Punctuator
          done = true;
          break;
        }

        currentPropertyPath.push(tokens[j].value);
        break;
      }
      case 'Numeric':
      case 'String': {
        const previousTokenIsOpeningBracket = !!previousToken && previousToken.type === 'Punctuator' && previousToken.value === '[';
        const nextTokenIsClosingBracket = tokens.length > j + 1 && tokens[j + 1].value === ']';
        if (entity && nextTokenIsClosingBracket && previousTokenIsOpeningBracket) {
          // Tokens contain literal quotation marks like Input1["value"], need to remove
          const currentValue = tokens[j].type === 'String' ? tokens[j].value.slice(1, tokens[j].value.length - 1) : tokens[j].value;
          // Property/Array access
          // We need to check hasOwnProperty to avoid prototype functions
          // like .map or .trim. This works on all primitives except null or undefined
          if (
            (isPlainObject(entity) && Object.prototype.hasOwnProperty.call(entity, currentValue)) ||
            (Array.isArray(entity) && entity.length > Number(currentValue))
          ) {
            entity = get(entity, currentValue);
            // Use the quoted string here
            currentPropertyPath.push(tokens[j].value);
            if (entity === null) {
              currentPropertyPath.push(tokens[j + 1].value);
              done = true;
              break;
            }
          } else {
            // Don't leave in an invalid state
            currentPropertyPath.pop();
            done = true;
          }
        } else {
          // invalid numeric/property if it isn't preceded by [
          done = true;
        }
        break;
      }
      default:
        done = true;
        break;
    }

    previousToken = tokens[j];
    if (done) {
      break;
    }
  }
  removeTrailingPunctuation();
  return {
    binding: currentPropertyPath.join(''),
    value: entity,
    range: {
      // @ts-ignore: range is added to token as a result of tokenization config
      start: tokens[indexToStart].range[0],
      // @ts-ignore: range is added to token as a result of tokenization config
      end: previousToken.range[1]
    },
    tokenIndex: indexToStart + currentPropertyPath.length
  };
};

export const extractPythonEvaluationPairsWithParser = (
  code: string,
  entities: Set<string>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataTree: Record<string, any>,
  parser: PythonParser,
  namespacedEntitiesToExtract: Record<string, Set<string>> = {}
): EvaluationPair[] => {
  // Parsing always succeeds, but does not imply that the grammar is valid.
  // Invalid tokens use the type ⚠, but does not affect the entity extraction
  const tree = parser.parse(code);
  const cursor = tree.cursor();
  let isCapturing = false;
  const bindingPairs: EvaluationPair[] = [];
  let currentEntityPath: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let entity: any;
  let bindingStart = 0;
  let bindingEnd = 0;
  let currentNamespace;
  const previousCursorNamesAndValues: Array<{ name: string; value: string; cursorTo: number }> = [];
  const removeTrailingPunctuation = () => {
    if (currentEntityPath[currentEntityPath.length - 1] === '.' || currentEntityPath[currentEntityPath.length - 1] === '[') {
      // Don't leave a trailing period if the entity is already done
      currentEntityPath.pop();
    }
  };

  do {
    switch (cursor.name) {
      case 'VariableName': {
        const text = code.substring(cursor.from, cursor.to);
        // Check if VariableName is a valid namespace prefix
        if (namespacedEntitiesToExtract[text]) {
          currentNamespace = text;
          isCapturing = false;
        } else if (!isCapturing && entities.has(text)) {
          let isKeyValuePair = false;
          let isAssignment = false;
          // This is a special case. In python it is valid to write { Widget1: "value" },
          // which is equivalent to the JavaScript { [Widget1]: "value" }.
          // We will skip the binding extraction in this case because it's more likely that
          // the user has named a local variable the same as a global variable.
          if (cursor.nextSibling()) {
            const nextName = (cursor as TreeCursor).name;
            isKeyValuePair = nextName === ':';
            isAssignment = nextName === 'AssignOp';
            cursor.prevSibling();
          }
          if (isKeyValuePair || isAssignment) break;

          if (entity) {
            // We need to check hasOwnProperty to avoid prototype functions
            // like .map or .trim. This works on all primitives except null or undefined
            if (Object.prototype.hasOwnProperty.call(entity, text)) {
              entity = get(entity, text);
              currentEntityPath.push(text);
              if (entity === null) {
                break;
              }
            } else {
              removeTrailingPunctuation();
              isCapturing = false;
            }
          } else if (!entity) {
            if (dataTree[text]) {
              entity = dataTree[text];
              currentEntityPath.push(text);
              bindingStart = cursor.from;
              isCapturing = true;
            }
          }
        }

        break;
      }
      case 'PropertyName': {
        const text = code.substring(cursor.from, cursor.to);
        if (isCapturing) {
          // we update where the expression ends because we need to show an error to the end user
          // regardless if the entity has the property or not
          bindingEnd = cursor.to;
          if (entity && Object.prototype.hasOwnProperty.call(entity, text)) {
            entity = get(entity, text);
            currentEntityPath.push(text);
            if (entity === null) {
              bindingPairs.push({
                binding: currentEntityPath.join(''),
                value: entity,
                range: {
                  start: bindingStart,
                  end: bindingEnd
                }
              });
              currentEntityPath = [];
              entity = undefined;
              isCapturing = false;
              break;
            }
          } else {
            removeTrailingPunctuation();
            bindingPairs.push({
              binding: currentEntityPath.join(''),
              value: entity,
              range: {
                start: bindingStart,
                end: bindingEnd
              }
            });
            currentEntityPath = [];
            entity = undefined;
            isCapturing = false;
          }
        } else if (currentNamespace && namespacedEntitiesToExtract[currentNamespace].has(text)) {
          isCapturing = true;
          bindingStart = cursor.from;
          currentEntityPath.push(text);
          entity = dataTree[text];
        }
        currentNamespace = undefined;
        break;
      }
      case '.': {
        if (isCapturing) {
          currentEntityPath.push(cursor.name);
        }
        break;
      }
      case ']': {
        // If we hit a ] and are capturing, check if we are looking at a literal array index (i.e. [0]). if so, try to extract the value
        if (
          isCapturing &&
          previousCursorNamesAndValues.length === 2 &&
          previousCursorNamesAndValues[0].name === '[' &&
          previousCursorNamesAndValues[1].name === 'Number'
        ) {
          const indexValue = Number(previousCursorNamesAndValues[1].value);
          if (entity && Array.isArray(entity) && entity.length > Number(indexValue)) {
            entity = entity[indexValue];
            currentEntityPath.push(`[${indexValue}]`);
          } else {
            removeTrailingPunctuation();
            // For invalid array access, we want to stop capturing right before the [
            bindingEnd = previousCursorNamesAndValues[0].cursorTo; // stop capture right before the '['
            bindingPairs.push({
              binding: currentEntityPath.join(''),
              value: entity,
              range: {
                start: bindingStart,
                end: bindingEnd
              }
            });
            currentEntityPath = [];
            entity = undefined;
            isCapturing = false;
          }
        }
        currentNamespace = undefined;
        break;
      }
      case '[':
      case 'Number': {
        currentNamespace = undefined;
        // want to keep capturing if we are in the middle of capturing, in order to handle literal array indexing
        break;
      }
      default: {
        currentNamespace = undefined;
        if (isCapturing) {
          removeTrailingPunctuation();
          bindingEnd = cursor.to;
          bindingPairs.push({
            binding: currentEntityPath.join(''),
            value: entity,
            range: {
              start: bindingStart,
              end: bindingEnd
            }
          });
          currentEntityPath = [];
          entity = undefined;
          isCapturing = false;
        }
        break;
      }
    }

    // add the previous cursor name and value to the list. ensure that previous cursor list is only 2 items long
    previousCursorNamesAndValues.push({ name: cursor.name, value: code.substring(cursor.from, cursor.to), cursorTo: cursor.to });
    if (previousCursorNamesAndValues.length > 2) {
      previousCursorNamesAndValues.shift();
    }
  } while (cursor.next());

  if (isCapturing) {
    removeTrailingPunctuation();
    bindingEnd = cursor.to;
    bindingPairs.push({
      binding: currentEntityPath.join(''),
      value: entity,
      range: {
        start: bindingStart,
        end: bindingEnd
      }
    });
    entity = undefined;
    isCapturing = false;
  }
  return bindingPairs;
};
