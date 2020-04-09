import fs from "fs";
import path from "path";
import faker from "faker";
import { Container } from "inversify";
import {
  ILogger,
  createSilent as createeLogger,
} from "@nodeplusplus/xregex-logger";

import XParser, {
  IXParser,
  IXParserSchema,
  GenericObject,
  XParserEngine,
} from "../../src/";
import Factory from "../../src/Factory";

const html = fs.readFileSync(
  path.resolve(__dirname, "../../mocks/data.html"),
  "utf8"
);
const json: GenericObject = {
  name: faker.lorem.words(),
  isActive: faker.random.boolean(),
  child: {
    name: faker.lorem.words(),
    isActive: faker.random.boolean(),
  },
  childs: new Array(faker.random.number({ min: 3, max: 10 }))
    .fill(0)
    .map(() => ({
      ...(faker.random.boolean() ? { comments: faker.random.number() } : {}),
      ...(faker.random.boolean()
        ? { comment_count: faker.random.number() }
        : {}),
      name: faker.lorem.words(),
      isActive: faker.random.boolean(),
    })),
};

describe("XParser", () => {
  let parser: IXParser;

  beforeAll(async () => {
    let container = new Container();
    container.bind<ILogger>("LOGGER").toConstantValue(createeLogger());
    container = Factory.createSimple(container);

    parser = container.resolve<IXParser>(XParser);
    await parser.start();
  });
  afterAll(async () => {
    await parser.stop();
  });

  describe("exec", () => {
    it("should return empty string if data is not truthy", async () => {
      expect(await parser.exec(undefined as any, {})).toBe("");
      expect(await parser.exec(null as any, {})).toBe("");
      expect(await parser.exec("", {})).toBe("");
    });

    it("should throw error if schema is not defined", () => {
      expect(parser.exec(json, undefined as any)).rejects.toThrowError(
        /EMPTY_SCHEMA/
      );
      expect(parser.exec(json, {})).rejects.toThrowError(/EMPTY_SCHEMA/);
    });

    it("should throw error if schema._scope is not defined", () => {
      expect(parser.exec(json, { schema: {} } as any)).rejects.toThrowError(
        /EMPTY_SCHEMA_SCOPE/
      );
      expect(parser.exec(json, { schema: {} } as any)).rejects.toThrowError(
        /EMPTY_SCHEMA_SCOPE/
      );
    });

    it("should parse non-array as well", async () => {
      const schema: IXParserSchema = {
        _scope: [{ selector: "child" }],
        name: [{ selector: "name" }],
        status: [{ selector: "isActive" }],
        contextId: [{ ref: "$context.id" }],
      };
      const ref = { $context: { id: faker.random.uuid() } };

      const response = await parser.exec(json, { schema, ref });
      expect(response).toEqual([
        {
          name: json.child.name,
          status: json.child.isActive,
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

      const response = await parser.exec(json, { schema, ref });
      expect(response).toEqual([
        {
          child: {
            contextId: ref.$context.id,
            name: json.child.name,
            status: json.child.isActive,
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
              filters: [{ id: "filter.toNumber", priority: 1 }],
            },
            {
              selector: "comment_count",
              filters: [{ id: "filter.toNumber", priority: 1 }],
              or: true,
            },
          ],
        },
      };
      const ref = { $context: { id: faker.random.uuid() } };

      const [{ childs, ...props }] = (await parser.exec(json, {
        schema,
        ref,
      })) as any;

      expect(props).toEqual({
        name: json.name,
        status: json.isActive,
        contextId: ref.$context.id,
      });
      expect(Array.isArray(childs) && childs.length).toBeTruthy();

      for (let child of childs) {
        const orginalChild = json.childs.find(
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
        await parser.exec(json, {
          schema,
          ref,
          engine: XParserEngine.HTML,
        })
      ).toEqual([]);
      expect(
        await parser.exec(html, {
          schema,
          ref,
          engine: XParserEngine.JSON,
        })
      ).toEqual([]);
    });
  });

  describe("clean", () => {
    it("should clean data with json", async () => {
      const data = {
        ...json,
        redundant: faker.lorem.words(),
      };

      const response = await parser.clean(data, ["redundant"]);

      expect(response).toEqual(json);
    });

    it("should clean data with html", async () => {
      const response = await parser.clean(html, ["title"]);

      expect(response).not.toEqual(expect.stringContaining("title"));
    });
  });
});
