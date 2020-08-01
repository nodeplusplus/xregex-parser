import { create as createLogger } from "@nodeplusplus/xregex-logger";
import {
  Director as XFilterDirector,
  Builder as XFilterBuilder,
} from "@nodeplusplus/xregex-filter";

import { IDirector, IBuilder, ITemplate } from "../types";
import { XParser } from "../XParser";
import { HTMLParser, JSONParser } from "../engines";

export class Director implements IDirector {
  public constructFromTemplate(builder: IBuilder, template: ITemplate) {
    builder.reset();

    // Merge XFilter container with our container
    const xfilterBuilder = new XFilterBuilder();
    new XFilterDirector().constructFromTemplate(xfilterBuilder, template);
    builder.merge(xfilterBuilder.getContainer());

    builder.setXParser(XParser, { HTML: HTMLParser, JSON: JSONParser });
  }
}
