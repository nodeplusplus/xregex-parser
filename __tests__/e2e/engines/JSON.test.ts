import faker from "faker";
import { Container } from "inversify";

import {
  ILogger,
  IXParser,
  IXParserExecOpts,
  JSONParser,
  GenericObject,
  XParserReserved,
} from "../../../src";

const logger = require("../../../mocks/logger");

describe("engines.JSONParser", () => {
  let parser: IXParser;

  beforeAll(async () => {
    const container = new Container();
    container.bind<ILogger>("LOGGER").toConstantValue(logger);

    parser = container.resolve<IXParser>(JSONParser);
    await parser.start();
  });
  afterAll(async () => {
    await parser.stop();
  });

  describe("exec", () => {
    const data: GenericObject = {
      name: faker.lorem.words(),
      isActive: faker.random.boolean(),
      childs: new Array(faker.random.number({ min: 1, max: 10 }))
        .fill(0)
        .map(() => ({
          name: faker.lorem.words(),
          isActive: faker.random.boolean(),
        })),
    };
    const ref: any = { $context: { id: faker.random.uuid() } };

    it("should return input data if data is not truthy or is not object type", async () => {
      const opts: IXParserExecOpts = {};

      expect(await parser.exec(undefined as any, opts)).toBe("");
      expect(await parser.exec(null as any, opts)).toBe("");

      const word = faker.lorem.word();
      expect(await parser.exec(word, opts)).toBe("");
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

    it("should return length of attribute if prop is PROP_LENGTH", async () => {
      // Prop was not found
      const notFound = await parser.exec(data, {
        ref,
        schema: { selector: "notFound", prop: XParserReserved.PROP_LENGTH },
      });
      expect(notFound).toBe(0);

      // Couldn't find length
      const notLength = await parser.exec(data, {
        ref,
        schema: { selector: "isActive", prop: XParserReserved.PROP_LENGTH },
      });
      expect(notLength).toBe(0);

      // Return length of string
      const string = await parser.exec(data, {
        ref,
        schema: { selector: "name", prop: XParserReserved.PROP_LENGTH },
      });
      expect(string).toBe(data.name.length);

      // Return length of array
      const array = await parser.exec(data, {
        ref,
        schema: { selector: "childs", prop: XParserReserved.PROP_LENGTH },
      });
      expect(array).toBe(data.childs.length);
    });

    it("should return selected property", async () => {
      // Return string as well
      const string = await parser.exec(data, {
        ref,
        schema: { selector: "name" },
      });
      expect(string).toBe(data.name);

      // Return array as well
      const array = await parser.exec(data, {
        ref,
        schema: { selector: "childs" },
      });
      expect(array).toEqual(data.childs);
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

    it("should remove redundant item of array if input data is array", async () => {
      const selectors = new Array(faker.random.number({ min: 1, max: 100 }))
        .fill(0)
        .map(() => faker.random.uuid());
      const data = new Array(faker.random.number({ min: 1, max: 100 }))
        .fill(0)
        .map(() => faker.lorem.words());

      const response = await parser.clean([...selectors, ...data], selectors);
      expect(response).toEqual(data);
    });

    it("should omit props of object if input data is literal object", async () => {
      const selectors = new Array(faker.random.number({ min: 1, max: 100 }))
        .fill(0)
        .map(() => faker.random.uuid());

      const data = {
        name: faker.lorem.words(),
        isActive: faker.random.boolean(),
      };

      const response = await parser.clean(
        {
          ...data,
          ...selectors.reduce(
            (d, key) => ({ ...d, [key]: faker.random.alphaNumeric() }),
            {}
          ),
        },
        selectors
      );
      expect(response).toEqual(data);
    });
  });
});
