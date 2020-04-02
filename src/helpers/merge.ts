import _ from "lodash";

export function merge(source: any, target: any) {
  if (!source) return target;
  if (!target) return source;

  if (source instanceof Date) return source;
  if (target instanceof Date) return target;

  const numericalSource =
    Number.isInteger(source) || typeof source === "string"
      ? Number(source)
      : undefined;
  const numericalTarget =
    Number.isInteger(target) || typeof target === "string"
      ? Number(target)
      : undefined;
  if (numericalSource && numericalTarget) {
    return Number(source) + Number(target);
  }

  if (typeof source === "string" && typeof target === "string") {
    return [source, target].filter(Boolean).join(" ");
  }

  if (Array.isArray(source) && Array.isArray(target)) {
    return source.concat(target);
  }

  return _.merge({}, source, target);
}
