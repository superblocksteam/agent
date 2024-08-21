export type BreakConfig = {
  condition: string;
};

// return
export type ReturnConfig = {
  data: string;
};

// wait
export type WaitConfig = {
  condition: string;
};

// throw
export type ThrowConfig = {
  error: string;
};

export enum WAIT_NUM {
  WAIT_UNSPECIFIED = 0,
  WAIT_ALL = 1,
  WAIT_NONE = 2
}

export enum WAIT_STR {
  WAIT_UNSPECIFIED = 'WAIT_UNSPECIFIED',
  WAIT_ALL = 'WAIT_ALL',
  WAIT_NONE = 'WAIT_NONE'
}

export type ParallelConfig = {
  wait: WAIT_NUM | WAIT_STR;
  poolSize?: number;
  static?: {
    paths: Record<string, { blocks?: BaseBlock[] }>;
  };
  dynamic?: {
    variables: {
      item: string;
    };
    paths: string;
    blocks?: BaseBlock[];
  };
};

// conditional
type Condition = {
  condition: string;
  blocks?: BaseBlock[];
};
export type ConditionalConfig = {
  if?: Condition;
  elseIf?: Condition[];
  else?: { blocks?: BaseBlock[] };
};

// loop
export enum LOOP_TYPE {
  UNSPECIFIED = 'TYPE_UNSPECIFIED',
  FOR = 'TYPE_FOR',
  FOREACH = 'TYPE_FOREACH',
  WHILE = 'TYPE_WHILE'
}

export type LoopConfig = {
  variables: {
    index: string;
    item: string;
  };
  range: string;
  blocks?: BaseBlock[];
  type: LOOP_TYPE;
};

// try catch
export type TryCatchConfig = {
  variables: {
    error: string;
  };
  try?: { blocks?: BaseBlock[] };
  catch?: { blocks?: BaseBlock[] };
  finally?: { blocks?: BaseBlock[] };
};

// variables
// export enum VariableType {
//   UNSPECIFIED = 'TYPE_UNSPECIFIED',
//   SIMPLE = 'TYPE_SIMPLE',
//   ADVANCED = 'TYPE_ADVANCED'
// }

// export enum VariableMode {
//   UNSPECIFIED = 'MODE_UNSPECIFIED',
//   READ = 'MODE_READ',
//   READWRITE = 'MODE_READWRITE'
// }
// export type VariableConfig = {
//   value: string;
//   key: string;
//   type: VariableType;
//   mode: VariableMode;
// };
// export type VariablesConfig = {
//   items: Array<VariableConfig>;
// };

// send
export type SendConfig = {
  message: string;
};

// stream
export type StreamConfig = {
  variables: {
    item: string;
  };
  trigger?: BaseBlock;
  process?: { blocks?: BaseBlock[] };
  options?: {
    disable_auto_send: boolean;
  };
};

// step
export type StepPluginType = string; // This will be something like "python" | "bigquery" ...
export type StepConfig = {
  integration?: string;
} & {
  [plugin in StepPluginType]?: unknown;
};

export type BaseBlock = {
  name: string;
  // only one of the following configs will be defined in a valid block
  break?: BreakConfig;
  return?: ReturnConfig;
  wait?: WaitConfig;
  throw?: ThrowConfig;
  parallel?: ParallelConfig;
  conditional?: ConditionalConfig;
  loop?: LoopConfig;
  tryCatch?: TryCatchConfig;
  step?: StepConfig;
  stream?: StreamConfig;
  send?: SendConfig;
  // variables?: VariablesConfig;
};

const ALL_BLOCK_TYPES = [
  'break',
  'return',
  'wait',
  'throw',
  'parallel',
  'conditional',
  'loop',
  'tryCatch',
  'step',
  'variables',
  'send',
  'stream'
] as const;

export const BlockType = {
  CONDITION: 'CONDITION',
  LOOP: 'LOOP',
  PARALLEL: 'PARALLEL',
  TRY_CATCH: 'TRY_CATCH',
  VARIABLES: 'VARIABLES',
  RETURN: 'RETURN',
  BREAK: 'BREAK',
  WAIT: 'WAIT',
  THROW: 'THROW',
  STEP: 'STEP',
  SEND: 'SEND',
  STREAM: 'STREAM'
} as const;

type BlockType = (typeof BlockType)[keyof typeof BlockType];

export type GenericBlock = {
  type: BlockType;
  config:
    | StepConfig
    | ConditionalConfig
    | LoopConfig
    | ParallelConfig
    | TryCatchConfig
    // | VariableConfig
    | ReturnConfig
    | BreakConfig
    | WaitConfig
    | ThrowConfig
    | SendConfig
    | StreamConfig;
};

export type StepBlock = {
  type: 'STEP';
  config: StepConfig;
};

export type ControlBlock = {
  type: Exclude<BlockType, 'STEP'>;
  config:
    | ConditionalConfig
    | LoopConfig
    | ParallelConfig
    | TryCatchConfig
    // | VariableConfig
    | ReturnConfig
    | BreakConfig
    | WaitConfig
    | ThrowConfig
    | SendConfig
    | StreamConfig;
};

function getBlockType(type: (typeof ALL_BLOCK_TYPES)[number]): BlockType {
  switch (type) {
    case 'break':
      return BlockType.BREAK;
    case 'return':
      return BlockType.RETURN;
    case 'wait':
      return BlockType.WAIT;
    case 'throw':
      return BlockType.THROW;
    case 'parallel':
      return BlockType.PARALLEL;
    case 'conditional':
      return BlockType.CONDITION;
    case 'loop':
      return BlockType.LOOP;
    case 'tryCatch':
      return BlockType.TRY_CATCH;
    case 'variables':
      return BlockType.VARIABLES;
    case 'send':
      return BlockType.SEND;
    case 'stream':
      return BlockType.STREAM;
    case 'step':
      return BlockType.STEP;
    default: {
      const exhaustiveCheck: never = type;
      throw new Error(`Unhandled block type: ${exhaustiveCheck}`);
    }
  }
}

export function convertBlock(backendBlock: BaseBlock): GenericBlock | null {
  for (const blockType of ALL_BLOCK_TYPES) {
    if (blockType in backendBlock) {
      const config = backendBlock[blockType];
      if (config != null) {
        return {
          type: getBlockType(blockType),
          config
        };
      }
    }
  }
  return null;
}

export function isStepBlock(block: GenericBlock): block is StepBlock {
  return block.type === BlockType.STEP;
}

export function isControlBlock(block: GenericBlock): block is ControlBlock {
  return !isStepBlock(block);
}

export function getPluginType(block: GenericBlock): StepPluginType | null {
  if (isStepBlock(block)) {
    return Object.keys(block.config)[0] as StepPluginType;
  }
  return null;
}
