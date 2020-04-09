import { Container } from "inversify";
import {
  ILogger,
  createConsole as createLogger,
} from "@nodeplusplus/xregex-logger";
import XFilter from "@nodeplusplus/xregex-filter";

import { IXParser } from "./types";
import { HTMLParser, JSONParser } from "./engines";

class Factory {
  createSimple(container = new Container()): Container {
    if (!container.isBound("LOGGER")) {
      container.bind<ILogger>("LOGGER").toConstantValue(createLogger());
    }
    if (!container.isBound("SETTINGS")) {
      container.bind<any>("SETTINGS").toConstantValue({});
    }

    container.bind<any>("XFILTER").to(XFilter);
    container.bind<IXParser>("XPARSER_ENGINE_HTML").to(HTMLParser);
    container.bind<IXParser>("XPARSER_ENGINE_JSON").to(JSONParser);

    return container;
  }
}

export default new Factory();
