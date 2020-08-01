import { Container, interfaces } from "inversify";
import _ from "lodash";
import { ILogger } from "@nodeplusplus/xregex-logger";

import { IBuilder, IXParser, GenericObject } from "../types";

export class Builder implements IBuilder {
  private container!: interfaces.Container;

  reset() {
    this.container = new Container({ defaultScope: "Singleton" });
  }
  merge(container: interfaces.Container) {
    this.container = Container.merge(this.container, container);
  }

  setXParser(Parser: interfaces.Newable<IXParser>, engines: GenericObject) {
    _.forEach(engines, (engine, name) =>
      this.container
        .bind<IXParser>(`XPARSER.ENGINE.${name.toUpperCase()}`)
        .to(engine)
    );

    this.container.bind<IXParser>("XPARSER").to(Parser);
  }

  getContainer() {
    return this.container;
  }
  getXParser() {
    return this.container.get<IXParser>("XPARSER");
  }
}
