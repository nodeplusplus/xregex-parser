import _ from "lodash";
import { injectable, inject } from "inversify";

import { ILogger } from "../types/Common";
import {
  XParserReserved,
  IXParser,
  IXParserExecOpts,
  IXParserSchemaItem,
} from "../types/XParser";

@injectable()
export class JSONParser implements IXParser {
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
    if (!data || typeof data !== "object") return "" as any;

    if (!opts.schema?.ref && !opts.schema?.selector) {
      throw new Error("XPARSER:ENGINE.JSON.NO_REF_AND_SELECTOR");
    }
    const schema = opts.schema as IXParserSchemaItem;

    // 1. Return reference data
    if (schema.ref) return _.get(opts.ref, schema.ref);

    // 2. Return root data
    if (schema.selector === XParserReserved.ROOT_SELECTOR) return data as any;

    // 3. Get count items
    if (schema.prop === XParserReserved.PROP_LENGTH) {
      const items = _.get(data, schema.selector as string);
      return items?.length ? items.length : 0;
    }

    // 4. Return selected data
    return _.get(data, schema.selector as string);
  }

  public async clean<T = any>(data: any, selectors: string[]): Promise<T> {
    if (!Array.isArray(selectors) || !selectors.length) return data;
    if (!data || typeof data !== "object") return data;

    if (Array.isArray(data)) {
      return data.filter((d) => !selectors.includes(d)) as any;
    }
    return _.omit(data, selectors) as any;
  }
}
