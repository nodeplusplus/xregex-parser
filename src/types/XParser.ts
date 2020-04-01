import { GenericObject } from "./Common";

export interface IXParser {
  start(opts?: any): Promise<void>;
  stop(opts?: any): Promise<void>;

  exec<T = any>(data: any, opts: IXParserExecOpts): Promise<T | T[]>;
  clean<T = any>(data: any, selectors: string[]): Promise<T>;
}
export enum XParserReserved {
  ROOT_SELECTOR = "$root",
  PROP_TEXT = "$text",
  PROP_LENGTH = "$length",
}

export enum XParserEngine {
  JSON = "json",
  HTML = "html",
}

export interface IXParserExecOpts {
  engine?: XParserEngine | IXParser;
  schema?: IXParserSchema | IXParserSchemaItem;
  ref?: any;
}

export interface IXParserSchema extends IXParserPropsSchema {
  _scope: IXParserSchemaItem[];
  _merge?: boolean;
}

export interface IXParserPropsSchema {
  [field: string]: IXParserSchemaItem[] | IXParserSchema | boolean | undefined;
}

export interface IXParserSchemaItem {
  ref?: string;

  selector?: string;
  unselector?: string;
  prop?: string;

  or?: boolean;
  filters?: IXParserSchemaFilterItem[];
}

export interface IXParserFilter {
  start(opts?: any): Promise<void>;
  stop(opts?: any): Promise<void>;

  exec<T extends GenericObject>(data: any[], opts: any): Promise<T[]>;
}

export interface IXParserSchemaFilterItem {
  id: string;
  priority: number;
  opts?: any;
}
