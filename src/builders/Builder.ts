import { Container, interfaces } from "inversify";
import _ from "lodash";
import xhelpers from "@nodeplusplus/xregex-helpers";

import { IBuilder, IXParser, GenericObject } from "../types";

export class Builder implements IBuilder {
  private container!: interfaces.Container;
  private options: interfaces.ContainerOptions = { defaultScope: "Singleton" };

  public reset() {
    this.container = new Container(this.options);
  }
  public merge(container: interfaces.Container) {
    this.container = xhelpers.inversify.merge(
      this.container,
      container,
      this.options
    );
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
