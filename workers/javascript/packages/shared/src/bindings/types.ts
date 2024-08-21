export type StringSegment = {
  dynamic: boolean;
  value: string;
};

export type PositionedSegment = {
  str: string;
  from: number;
  to: number;
};
