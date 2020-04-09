import _ from "lodash";
import cheerio from "cheerio";
import { injectable, inject } from "inversify";
import { ILogger } from "@nodeplusplus/xregex-logger";

import {
  XParserReserved,
  IXParser,
  IXParserExecOpts,
  IXParserSchemaItem,
} from "../types/XParser";

@injectable()
export class HTMLParser implements IXParser {
  @inject("LOGGER") private logger!: ILogger;

  public async start() {
    this.logger.info("XPARSER:ENGINE.HTML.STARTED");
  }
  public async stop() {
    this.logger.info("XPARSER:ENGINE.HTML.STOPPED");
  }

  public async exec<T = any>(
    data: any,
    opts: IXParserExecOpts
  ): Promise<T | T[]> {
    if (!data || typeof data !== "string") return "" as any;

    if (!opts.schema?.ref && !opts.schema?.selector) {
      throw new Error("XPARSER:ENGINE.HTML.NO_REF_AND_SELECTOR");
    }
    const schema = opts.schema as IXParserSchemaItem;

    const ref = opts.ref;
    // 1. Return reference data
    if (schema.ref) return _.get(opts.ref, schema.ref);

    // 2. Return root data
    if (schema.selector === XParserReserved.ROOT_SELECTOR) return data as any;

    const $ = cheerio.load(data);

    // 3.1 Remove redundant elements
    if (schema.unselector) {
      const unselector = _.template(schema.unselector)({ ...ref });
      $(unselector).remove();
    }
    // 3.2 We want to get raw HTML intead of property
    if (!schema.prop) {
      return $(schema.selector)
        .toArray()
        .map((e: any) => $.html(e)) as any[];
    }
    // 3.3 Count items;
    if (schema.prop === XParserReserved.PROP_LENGTH) {
      return $(schema.selector).length as any;
    }

    const dom = $.root().find(schema.selector as string);
    if (!dom.length) return "" as any;

    // 3.4 Fix missing some values of .prop()
    if (schema.prop === XParserReserved.PROP_TEXT) return dom.text() as any;

    return (dom.prop(schema.prop) || "") as any;
  }

  public async clean<T = any>(data: any, selectors: string[]): Promise<T> {
    if (!Array.isArray(selectors) || !selectors.length) return data;
    if (!data || typeof data !== "string") return data;

    const $ = cheerio.load(data);
    $(selectors.join(",")).remove();
    return $.html() as any;
  }
}
