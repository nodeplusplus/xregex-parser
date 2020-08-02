import { Container, interfaces } from "inversify";
import _ from "lodash";
import { ILogger } from "@nodeplusplus/xregex-logger";
import {
  ITemplate as IXFilterTemplate,
  Builder as XFilterBuilder,
  Director as XFilterDirector,
} from "@nodeplusplus/xregex-filter";

import { IBuilder, IXParser, GenericObject } from "../types";

export class Builder implements IBuilder {
  private container!: interfaces.Container;

  constructor(container?: interfaces.Container) {
    this.container = container || new Container({ defaultScope: "Singleton" });
  }

  registerXFilter(template: IXFilterTemplate) {
    if (this.container.isBound("XFILTER")) return;

    const builder = new XFilterBuilder(this.container);
    new XFilterDirector().constructFromTemplate(builder, template);

    this.container = builder.getContainer();
  }

  public setLogger(logger: ILogger) {
    if (this.container.isBound("LOGGER")) return;

    this.container.bind<ILogger>("LOGGER").toConstantValue(logger);
  }
  public setXParser(
    Parser: interfaces.Newable<IXParser>,
    engines: GenericObject
  ) {
    _.forEach(engines, (engine, name) =>
      this.container
        .bind<IXParser>(`XPARSER.ENGINE.${name.toUpperCase()}`)
        .to(engine)
    );

    this.container.bind<IXParser>("XPARSER").to(Parser);
  }

  public getContainer() {
    return this.container;
  }
  public getXParser() {
    return this.container.get<IXParser>("XPARSER");
  }
}
