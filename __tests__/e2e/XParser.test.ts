import fs from "fs";
import path from "path";
import faker from "faker";
import { Container } from "inversify";
import { ILogger, LoggerType } from "@nodeplusplus/xregex-logger";
import {
  Builder as XFilterBuilder,
  Director as XFilterDirector,
} from "@nodeplusplus/xregex-filter";

import {
  IXParser,
  IXParserSchema,
  XParserEngine,
  Builder,
  Director,
  ITemplate,
} from "../../src/";

const mocks = {
  html: fs.readFileSync(
    path.resolve(__dirname, "../../mocks/data.html"),
    "utf8"
  ),
  json: require(path.resolve(__dirname, "../../mocks/data.js")),
};

describe("XParser", () => {
  const template: ITemplate = { logger: { type: LoggerType.SILENT } };

  describe("start/stop", () => {
    const builder = new Builder();
    beforeAll(() => {
      new Director().constructFromTemplate(builder, template);
    });

    it("should start successful", async () => {
      const xparser = builder.getXParser();
      await xparser.start();

      expect(builder.getContainer().isBound("XFILTER")).toBeTruthy();
    });

    it("should stop as well", async () => {
      const xparser = builder.getXParser();
      await xparser.stop();

      expect(builder.getContainer().isBound("XFILTER")).toBeTruthy();
    });
  });

  describe("exec", () => {
    let parser: IXParser;

    beforeAll(async () => {
      const builder = new Builder();
      new Director().constructFromTemplate(builder, template);

      parser = builder.getXParser();
      await parser.start();
    });
    afterAll(async () => {
      await parser.stop();
    });

    it("should return empty string if data is not truthy", async () => {
      expect(await parser.exec(undefined as any, {})).toBe("");
      expect(await parser.exec(null as any, {})).toBe("");
      expect(await parser.exec("", {})).toBe("");
    });

    it("should throw error if schema is not defined", () => {
      expect(parser.exec(mocks.json, undefined as any)).rejects.toThrowError(
        /EMPTY_SCHEMA/
      );
      expect(parser.exec(mocks.json, {})).rejects.toThrowError(/EMPTY_SCHEMA/);
    });

    it("should throw error if schema._scope is not defined", () => {
      expect(
        parser.exec(mocks.json, { schema: {} } as any)
      ).rejects.toThrowError(/EMPTY_SCHEMA_SCOPE/);
      expect(
        parser.exec(mocks.json, { schema: {} } as any)
      ).rejects.toThrowError(/EMPTY_SCHEMA_SCOPE/);
    });

    it("should parse non-array as well", async () => {
      const schema: IXParserSchema = {
        _scope: [{ selector: "child" }],
        name: [{ selector: "name" }],
        status: [{ selector: "isActive" }],
        contextId: [{ ref: "$context.id" }],
      };
      const ref = { $context: { id: faker.random.uuid() } };

      const response = await parser.exec(mocks.json, { schema, ref });
      expect(response).toEqual([
        {
          name: mocks.json.child.name,
          status: mocks.json.child.isActive,
          contextId: ref.$context.id,
        },
      ]);
    });

    it("should parse data with nested schema", async () => {
      const schema: IXParserSchema = {
        _scope: [{ selector: "$root" }],
        child: {
          _scope: [{ selector: "child" }],
          _merge: true,
          contextId: [{ ref: "$context.id" }],
          name: [{ selector: "name" }],
          status: [{ selector: "isActive" }],
        },
      };
      const ref = { $context: { id: faker.random.uuid() } };

      const response = await parser.exec(mocks.json, { schema, ref });
      expect(response).toEqual([
        {
          child: {
            contextId: ref.$context.id,
            name: mocks.json.child.name,
            status: mocks.json.child.isActive,
          },
        },
      ]);
    });

    it("should parse with filter as well", async () => {
      const schema: IXParserSchema = {
        _scope: [{ selector: "$root" }],
        contextId: [{ ref: "$context.id" }],
        name: [{ selector: "name" }],
        status: [{ selector: "isActive" }],
        childs: {
          _scope: [{ selector: "childs" }],
          name: [{ selector: "name" }],
          status: [{ selector: "isActive" }],
          comments: [
            {
              selector: "comments",
              filters: [{ id: "any.toNumber", priority: 1 }],
            },
            {
              selector: "comment_count",
              filters: [{ id: "any.toNumber", priority: 1 }],
              or: true,
            },
          ],
        },
      };
      const ref = { $context: { id: faker.random.uuid() } };

      const [{ childs, ...props }] = (await parser.exec(mocks.json, {
        schema,
        ref,
      })) as any;

      expect(props).toEqual({
        name: mocks.json.name,
        status: mocks.json.isActive,
        contextId: ref.$context.id,
      });
      expect(Array.isArray(childs) && childs.length).toBeTruthy();

      for (let child of childs) {
        const orginalChild = mocks.json.childs.find(
          (c: { name: string }) => c.name === child.name
        );
        expect(orginalChild).toBeTruthy();
        expect(
          Number(orginalChild.comments || orginalChild.comment_count || 0)
        ).toBe(child.comments);
      }
    });

    it("should return emptay array if we force WRONG engine", async () => {
      const schema: IXParserSchema = {
        _scope: [{ selector: "$root" }],
        name: [{ selector: "name" }],
        status: [{ selector: "isActive" }],
        child: {
          _scope: [{ selector: "child" }],
          _merge: true,
          name: [{ selector: "name" }],
          status: [{ selector: "isActive" }],
        },
      };
      const ref = { $context: { id: faker.random.uuid() } };

      expect(
        await parser.exec(mocks.json, {
          schema,
          ref,
          engine: XParserEngine.HTML,
        })
      ).toEqual([]);
      expect(
        await parser.exec(mocks.html, {
          schema,
          ref,
          engine: XParserEngine.JSON,
        })
      ).toEqual([]);
    });
  });

  describe("clean", () => {
    let parser: IXParser;

    beforeAll(async () => {
      const builder = new Builder();
      new Director().constructFromTemplate(builder, template);

      parser = builder.getXParser();
      await parser.start();
    });
    afterAll(async () => {
      await parser.stop();
    });

    it("should clean data with json", async () => {
      const data = {
        ...mocks.json,
        redundant: faker.lorem.words(),
      };

      const response = await parser.clean(data, ["redundant"]);

      expect(response).toEqual(mocks.json);
    });

    it("should clean data with html", async () => {
      const response = await parser.clean(mocks.html, ["title"]);

      expect(response).not.toEqual(expect.stringContaining("title"));
    });
  });

  describe("3rd integration", () => {
    it("shouldn't bind component which is bound already", () => {
      const xfilterBuilder = new XFilterBuilder();
      new XFilterDirector().constructFromTemplate(xfilterBuilder, template);

      const builder = new Builder(xfilterBuilder.getContainer());
      new Director().constructFromTemplate(builder, template);

      expect(builder.getContainer().get("LOGGER")).toBeTruthy();
      expect(builder.getContainer().get("XFILTER")).toBeTruthy();
    });
  });
});
