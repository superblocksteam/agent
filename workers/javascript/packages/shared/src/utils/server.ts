import { Server } from 'http';
import express, { Application, RequestHandler, Router } from 'express';
import { MaybeError } from '../errors';
import { Closer } from './runtime';

export type HttpServerOptions = {
  handlers?: RequestHandler[];
  routes?: HttpServerRoute[];
  port: number;
};

export type HttpServerRoute = {
  path: string;
  handler: Router | RequestHandler;
};

export class HttpServer implements Closer {
  private _server: Server;
  private _app: Application;

  constructor(options: HttpServerOptions) {
    this._app = express();
    options.handlers?.forEach((handler) => this._app.use(handler));
    options.routes?.forEach((route) => this._app.use(route.path, route.handler));
    this._server = this._app.listen(options.port);
  }

  public async close(reason?: string): Promise<MaybeError> {
    return await new Promise<void>((resolve, reject) => {
      this._server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}
