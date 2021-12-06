import {
  IRouter as ExpressRouterInterface,
  Router as ExpressRouter,
} from 'express';

type GroupRouter = {
  group: (routeGroup: RouteGroupParams, callback: GroupCallback) => void;
  exportRouter: () => ExpressRouterInterface;
};
export type RouterInterface = ExpressRouterInterface & GroupRouter;
export type GroupCallback = (router: RouterInterface) => void;

type RouteGroupParams = {
  prefix: string;
  middlewares?: CallableFunction[];
};

export default class ExpressRouterExtended {
  private static readonly GROUP_FUNCTION_NAME = 'group';

  private constructor(
    private expressRouter: ExpressRouterInterface = ExpressRouter()
  ) {}

  public static build(): RouterInterface {
    const expressRouterExtended = new ExpressRouterExtended();
    const proxyHandler = {
      get: (_targetObject: object, property: PropertyKey) => {
        return property in expressRouterExtended
          ? Reflect.get(expressRouterExtended, property)
          : Reflect.get(expressRouterExtended.exportRouter(), property);
      },
    };
    return new Proxy<RouterInterface>(
      expressRouterExtended as any,
      proxyHandler
    );
  }

  public group(
    routeGroupParams: RouteGroupParams,
    groupCallback: GroupCallback
  ): void {
    groupCallback(this.makeGroupedRouteProxy(routeGroupParams));
  }

  private handleExpressCall(
    property: PropertyKey,
    routeGroupParams: RouteGroupParams
  ) {
    const expressValue = Reflect.get(this.expressRouter, property);
    if (typeof expressValue === 'function') {
      return (path: string, ...routeHandlers: CallableFunction[]) => {
        expressValue.call(
          this.expressRouter,
          this.mergePaths(routeGroupParams.prefix, path),
          [...(routeGroupParams.middlewares ?? []), ...routeHandlers]
        );
      };
    }
    return expressValue;
  }

  private handleGroupFunction(
    property: PropertyKey,
    routeGroupParams: RouteGroupParams
  ) {
    if (property === ExpressRouterExtended.GROUP_FUNCTION_NAME) {
      return (routeGroup: RouteGroupParams, groupCallback: GroupCallback) => {
        const newRouteGroupParams = {
          prefix: this.mergePaths(routeGroupParams.prefix, routeGroup.prefix),
          middlewares: [
            ...(routeGroupParams?.middlewares ?? []),
            ...(routeGroup?.middlewares ?? []),
          ],
        };
        return this.group(newRouteGroupParams, groupCallback);
      };
    }
    return Reflect.get(this, property);
  }

  private mergePaths(parentPath: string, childPath: string): string {
    //TODO: handle extra slashes
    return parentPath + childPath;
  }

  private makeGroupedRouteProxy(
    routeGroupParams: RouteGroupParams
  ): RouterInterface {
    const proxyHandler = {
      get: (_targetObject: object, property: PropertyKey) => {
        return property in this
          ? this.handleGroupFunction(property, routeGroupParams)
          : this.handleExpressCall(property, routeGroupParams);
      },
    };
    return new Proxy<RouterInterface>(this as any, proxyHandler);
  }

  public exportRouter(): ExpressRouterInterface {
    return this.expressRouter;
  }
}
