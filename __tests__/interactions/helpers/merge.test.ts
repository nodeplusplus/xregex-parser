import faker from "faker";
import _ from "lodash";

import { merge } from "../../../src/helpers/merge";

describe("helpers.merge", () => {
  it("should return target if source is not truthy", () => {
    expect(merge(null, 1)).toBe(1);
    expect(merge(undefined, 1)).toBe(1);
    expect(merge(NaN, 1)).toBe(1);
  });

  it("should return source if target is not truthy", () => {
    expect(merge(1, null)).toBe(1);
    expect(merge(1, undefined)).toBe(1);
    expect(merge(1, NaN)).toBe(1);
  });

  it("should return what is instance of Date first", () => {
    const now = new Date();
    expect(merge(now, "now")).toBe(now);
    expect(merge("now", now)).toBe(now);
  });

  it("should return sum of 2 convertible values", () => {
    expect(merge(1, 1)).toBe(2);
    expect(merge("1", 1)).toBe(2);
    expect(merge(1, "1")).toBe(2);
  });

  it("should return combined string if source and target are truthy string", () => {
    const source = faker.lorem.word();
    const target = faker.lorem.words();

    expect(merge(source, "")).toBe(source);
    expect(merge("", target)).toBe(target);
    expect(merge(source, target)).toBe([source, target].join(" "));
  });

  it("should return combined array if source and target are array", () => {
    const source = faker.lorem.words().split(" ");
    const target = faker.lorem.words().split(" ");

    expect(merge(source, [])).toEqual(source);
    expect(merge([], target)).toEqual(target);
    expect(merge(source, target)).toEqual([...source, ...target]);
  });

  it("should use lodash merge function for other case", () => {
    const source = faker.lorem.words().split(" ");
    const target = faker.lorem.words().split(" ");

    const object = { id: faker.random.uuid() };

    expect(merge(source, object)).toEqual(_.merge({}, source, object));
    expect(merge(object, target)).toEqual(_.merge({}, object, target));
  });
});
