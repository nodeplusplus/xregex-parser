import _ from "lodash";
import { injectable, inject } from "inversify";
import { ILogger } from "@nodeplusplus/xregex-logger";
import { IXFilter } from "@nodeplusplus/xregex-filter";

import { GenericObject } from "./types/Common";
import {
  XParserEngine,
  IXParser,
  IXParserExecOpts,
  IXParserSchema,
  IXParserSchemaItem,
  IXParserPropsSchema,
} from "./types/XParser";
import { merge } from "./helpers/merge";

@injectable()
export class XParser implements IXParser {
  @inject("LOGGER") private logger!: ILogger;
  @inject("XFILTER") private filter!: IXFilter;
  @inject("XPARSER_ENGINE_HTML") private html!: IXParser;
  @inject("XPARSER_ENGINE_JSON") private json!: IXParser;

  public async start() {
    await Promise.all([
      this.filter.start(),
      this.html.start(),
      this.json.start(),
    ]);

    this.logger.info("XPARSER:STARTED");
  }

  public async stop() {
    await Promise.all([this.filter.stop(), this.html.stop(), this.json.stop()]);

    this.logger.info("XPARSER:STOPPED");
  }

  public async exec<T = any>(
    data: any,
    opts: IXParserExecOpts
  ): Promise<T | T[]> {
    if (!data) return "" as any;

    const engine = this.selectEngine(data, opts?.engine);
    const refValues = { ...opts?.ref };

    const schema = opts?.schema as IXParserSchema;
    if (!schema) throw new Error("XPARSER:EXEC.EMPTY_SCHEMA");
    if (!schema._scope) throw new Error("XPARSER:EXEC.EMPTY_SCHEMA_SCOPE");

    const { _scope, _merge, ...fieldsSchema } = schema;
    let scopesData: any[] = await this.parseItems(
      engine,
      data,
      _scope,
      refValues
    );
    if (!Array.isArray(scopesData)) {
      this.logger.debug("XPARSER:EXEC.SCOPE_DATA_IS_NOT_ARRAY", opts);
      scopesData = [scopesData];
    }

    const records = await Promise.all(
      scopesData
        .filter(Boolean)
        .map((scopeData) =>
          this.parseFieldsInScope(
            engine,
            scopeData,
            fieldsSchema as any,
            refValues
          )
        )
    );

    if (_merge) {
      this.logger.debug("XPARSER:EXEC.MERGED_PROPS", { props: records });
      return Object.assign({}, ...records);
    }

    return records.filter(Boolean) as T[];
  }

  public async clean<T = any>(data: any, selectors: string[]): Promise<T> {
    const engine = this.selectEngine(data);
    return engine.clean(data, selectors);
  }

  private async parseItems(
    engine: IXParser,
    data: any,
    schemas: IXParserSchemaItem[],
    ref?: any
  ): Promise<any> {
    return schemas.reduce(async (response: Promise<any>, schema) => {
      const prev = await response;

      let res = (await engine.exec(data, { schema, ref })) as any;
      if (Array.isArray(schema.filters) && schema.filters.length) {
        this.logger.debug("XPARSER:PARSE_ITEMS.APPLY_FILTER", {
          filters: schema.filters,
        });

        const fieldName = "$filtered$";
        // Prepare filter options
        const filterOpts = { schema: { [fieldName]: schema.filters }, ref };
        const [filtered] = await this.filter.exec(
          [{ [fieldName]: res }],
          filterOpts
        );
        res = filtered && filtered[fieldName];
      }

      if (schema.or) {
        this.logger.debug("XPARSER:PARSE_ITEMS.USE_OR_ALGO");
        return prev || res;
      }

      this.logger.debug("XPARSER:PARSE_ITEMS.USE_AND_ALGO");
      return merge(prev, res);
    }, Promise.resolve(null));
  }

  private selectEngine(data: any, engine?: XParserEngine | IXParser): IXParser {
    if (!engine) return typeof data === "string" ? this.html : this.json;

    if (typeof (engine as IXParser).exec === "function") {
      return engine as IXParser;
    }

    return engine === XParserEngine.HTML ? this.html : this.json;
  }

  private async parseFieldsInScope(
    engine: IXParser,
    scopeData: any,
    schema: IXParserPropsSchema,
    ref?: any
  ): Promise<GenericObject | null> {
    const props = await this.parseProps(engine, scopeData, schema, ref);
    // Update ref
    const childRef = { ...ref, $parent: props };
    const childProps = await this.parseChildProps(
      engine,
      scopeData,
      schema,
      childRef
    );

    return Object.assign({}, props, childProps);
  }

  private async parseProps(
    engine: IXParser,
    data: any,
    schema: IXParserPropsSchema,
    ref?: any
  ): Promise<GenericObject> {
    const fields = Object.keys(schema).filter((fieldKey) =>
      Array.isArray(schema[fieldKey])
    );
    if (!fields.length) {
      return {};
    }

    const items: Array<GenericObject> = await Promise.all(
      fields.map(async (field) => {
        const schemaItem = schema[field] as IXParserSchemaItem[];
        const value = await this.parseItems(engine, data, schemaItem, ref);

        return { [field]: value };
      })
    );

    return Object.assign({}, ...items);
  }

  private async parseChildProps(
    engine: IXParser,
    data: any,
    schema: IXParserPropsSchema,
    ref?: any
  ): Promise<GenericObject> {
    const fields = Object.keys(schema).filter(
      (fieldKey) => !Array.isArray(schema[fieldKey])
    );
    if (!fields.length) return {};

    const items = await Promise.all(
      fields.map(async (field) => {
        const nestedSchema = schema[field] as IXParserSchema;
        const nestedOpts: IXParserExecOpts = {
          engine,
          schema: nestedSchema,
          ref,
        };
        const value = await this.exec(data, nestedOpts);

        return { [field]: value };
      })
    );

    return Object.assign({}, ...items);
  }
}
