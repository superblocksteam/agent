import { ConnectionPool } from 'mssql';

declare module 'mssql' {
  export function on(event: string, handler: (any) => void): ConnectionPool;
}
