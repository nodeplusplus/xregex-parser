import { interfaces } from "inversify";
import { ILogger } from "@nodeplusplus/xregex-logger";
import { ITemplate as IXFilterTemplate } from "@nodeplusplus/xregex-filter";

import { ITemplate } from "./Template";
import { IXParser } from "./XParser";
import { GenericObject } from "./Common";

export interface IBuilder {
  registerXFilter(template: IXFilterTemplate): void;
  setLogger(logger: ILogger): void;
  setXParser(
    Parser: interfaces.Newable<IXParser>,
    engines: GenericObject
  ): void;

  getContainer(): interfaces.Container;
  getXParser(): IXParser;
}

export interface IDirector {
  constructFromTemplate(builder: IBuilder, template: ITemplate): void;
}
