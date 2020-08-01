import { interfaces } from "inversify";
import { ILogger } from "@nodeplusplus/xregex-logger";

import { ITemplate } from "./Template";
import { IXParser } from "./XParser";
import { GenericObject } from "./Common";

export interface IBuilder {
  reset(): void;
  merge(container: interfaces.Container): void;
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
