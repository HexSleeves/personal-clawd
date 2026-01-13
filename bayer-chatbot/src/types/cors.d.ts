declare module "cors" {
  import type { RequestHandler } from "express";
  export interface CorsOptions {
    origin?: any;
    methods?: any;
    allowedHeaders?: any;
    exposedHeaders?: any;
    credentials?: boolean;
    maxAge?: number;
    preflightContinue?: boolean;
    optionsSuccessStatus?: number;
  }

  export default function cors(options?: CorsOptions): RequestHandler;
}
