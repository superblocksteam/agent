export interface DatabaseSchemaMetadata {
  tables: Table[];
  schemas?: Schema[];
}

export class Table {
  id?: string;
  type: TableType;
  name: string;
  schema?: string;
  columns: Column[];
  keys?: Key[];
  templates?: Template[];

  constructor(name: string, type: TableType, schema?: string) {
    this.name = name;
    this.schema = schema;
    this.type = type;
    this.columns = [];
    this.keys = [];
    this.templates = [];
  }
}

export enum TableType {
  TABLE = 'TABLE',
  VIEW = 'VIEW',
  ALIAS = 'ALIAS',
  COLLECTION = 'COLLECTION'
}

export class Column {
  name: string;
  type: string;
  escapedName?: string;

  constructor(name: string, type: string, escapedName?: string) {
    this.name = name;
    this.type = type;
    this.escapedName = escapedName;
  }
}

export interface PrimaryKey {
  name: string;
  type: 'primary key';
  columns?: string[];
}

export interface ForeignKey {
  name: string;
  type: 'foreign key';
}

export type Key = PrimaryKey | ForeignKey;

export class Template {
  title: string;
  body: string;
}

export class Schema {
  id?: string;
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}
