import fs from "fs";
import path from "path";
import faker from "faker";
import { Container } from "inversify";
import {
  ILogger,
  createSilent as createLogger,
} from "@nodeplusplus/xregex-logger";

import {
  IXParser,
  IXParserExecOpts,
  HTMLParser,
  XParserReserved,
} from "../../../src";

const data = fs.readFileSync(
  path.resolve(__dirname, "../../../mocks/data.html"),
  "utf8"
);

describe("engines.HTMLParser", () => {
  let parser: IXParser;

  beforeAll(async () => {
    const container = new Container();
    container.bind<ILogger>("LOGGER").toConstantValue(createLogger());

    parser = container.resolve<IXParser>(HTMLParser);
    await parser.start();
  });
  afterAll(async () => {
    await parser.stop();
  });

  describe("exec", () => {
    const ref: any = { $context: { id: faker.random.uuid() } };

    it("should return empty string if data is not truthy string", async () => {
      const opts: IXParserExecOpts = {};

      expect(await parser.exec(undefined as any, opts)).toBe("");
      expect(await parser.exec(null as any, opts)).toBe("");

      const recent = faker.date.recent();
      expect(await parser.exec(recent, opts)).toBe("");
    });

    it("should throw error if both ref and selector are not defined", () => {
      expect(parser.exec(data, {})).rejects.toThrowError(/NO_REF_AND_SELECTOR/);
      expect(parser.exec(data, { schema: {} })).rejects.toThrowError(
        /NO_REF_AND_SELECTOR/
      );
    });

    it("should return reference successfully", async () => {
      expect(
        parser.exec(data, { ref, schema: { ref: "$context.id" } })
      ).resolves.toBe(ref.$context.id);
    });

    it("should return input data if selector is XParserReserved.ROOT_SELECTOR", () => {
      expect(
        parser.exec(data, {
          ref,
          schema: { selector: XParserReserved.ROOT_SELECTOR },
        })
      ).resolves.toEqual(data);
    });

    it("should remove selector with schema.unselector before select attribute", async () => {
      const response = await parser.exec(data, {
        schema: {
          selector: "title",
          unselector: "title",
          prop: XParserReserved.PROP_TEXT,
        },
      });
      expect(response).toBe("");
    });

    it("should return array of found elements if schema.prop is not set", async () => {
      const [response] = (await parser.exec(data, {
        schema: { selector: "title" },
      })) as string[];
      expect(response).toEqual(expect.stringContaining("title"));
    });

    it("should return length of attribute as well", async () => {
      const response = await parser.exec(data, {
        schema: { selector: "title", prop: XParserReserved.PROP_LENGTH },
      });

      expect(typeof response).toBe("number");
      expect(response).toBeGreaterThanOrEqual(1);
    });

    it("should return empty string if element was not found", async () => {
      const response = await parser.exec(data, {
        schema: { selector: "fuck", prop: XParserReserved.PROP_TEXT },
      });

      expect(response).toBe("");
    });

    it("should return text of found element if prop is PROP_TEXT", async () => {
      const response = await parser.exec(data, {
        schema: { selector: "title", prop: XParserReserved.PROP_TEXT },
      });

      expect(typeof response).toBe("string");
      expect(response).toBeTruthy();
    });

    it("should return propety of found element", async () => {
      // Not found prop
      expect(
        await parser.exec(data, {
          schema: { selector: "title", prop: "href" },
        })
      ).toBe("");

      // Found prop
      const response = await parser.exec(data, {
        schema: { selector: "a", prop: "href" },
      });

      expect(typeof response).toBe("string");
      expect(response).toBeTruthy();
      expect(response).toEqual(expect.stringContaining("http"));
    });
  });

  describe("clean", () => {
    it("should return input data if selectors is not truthy array", async () => {
      const data = new Array(faker.random.number({ min: 1, max: 100 }))
        .fill(0)
        .map(() => faker.random.number());

      expect(await parser.clean(data, undefined as any)).toEqual(data);
      expect(await parser.clean(data, [])).toEqual(data);
    });

    it("should return input data if data is not truthy or is not object type", async () => {
      const selectors = new Array(faker.random.number({ min: 1, max: 100 }))
        .fill(0)
        .map(() => faker.lorem.word());

      expect(await parser.clean(undefined as any, selectors)).toBeUndefined();
      expect(await parser.clean(null as any, selectors)).toBeNull();

      const data = faker.lorem.word();
      expect(await parser.clean(data, [])).toEqual(data);
    });

    it("should return cleanup string successfully", async () => {
      const response = await parser.clean(data, ["title"]);
      expect(response).not.toEqual(expect.stringContaining("title"));
    });
  });
});
