import { create as createLogger } from "@nodeplusplus/xregex-logger";

import { IDirector, IBuilder, ITemplate } from "../types";
import { XParser } from "../XParser";
import { HTMLParser, JSONParser } from "../engines";

export class Director implements IDirector {
  public constructFromTemplate(builder: IBuilder, template: ITemplate) {
    builder.setLogger(
      createLogger(template.logger.type, template.logger.options)
    );
    builder.setXParser(XParser, { HTML: HTMLParser, JSON: JSONParser });
    builder.registerXFilter(template);
  }
}
