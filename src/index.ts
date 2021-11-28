import { IRouter as ExpressRouterInterface, Router as ExpressRouter } from 'express';

type RequestMethods = 'get' | 'post' | 'put' | 'patch' | 'delete';

type GroupRouter = {
  group: (routeGroup: RouteGroupParams, callback: GroupCallback) => void;
  exportRouter: () => ExpressRouterInterface;
}
export type RouterInterface = ExpressRouterInterface & GroupRouter;
type GroupCallback = (router: RouterInterface) => void;

type RouteGroupParams = {
  prefix: string;
  middlewares?: CallableFunction[]
}

export default class ExpressRouterExtended {

  private static readonly GROUP_FUNCTION_NAME = 'group'

  private constructor(private expressRouter: ExpressRouterInterface = ExpressRouter()) {
  }

  public static build(): RouterInterface {

    const expressRouterExtended = new ExpressRouterExtended();
    const proxyHandler = {
      get: (_targetObject: object, property: PropertyKey) => {
        return (property in expressRouterExtended)
          ? Reflect.get(expressRouterExtended, property)
          : Reflect.get(expressRouterExtended.exportRouter(), property)
      }
    }
    return new Proxy<RouterInterface>(expressRouterExtended as any, proxyHandler)
  }

  public group(routeGroupParams: RouteGroupParams, groupCallback: GroupCallback): void {
    groupCallback(this.makeGroupedRouteProxy(routeGroupParams));
  };

  private handleExpressFunction(value: Function | RequestMethods, groupPath: string, groupMiddlewares: CallableFunction[] = []) {
    if (typeof value === 'function') {
      return (path: string, ...routeHandlers: CallableFunction[]) => {
        value.call(this.expressRouter, this.mergePaths(groupPath, path), [...groupMiddlewares, ...routeHandlers]);
      }
    }
    return this.expressRouter[value]
  }

  private handleGroupFunction(routeGroupParams: RouteGroupParams) {

    return (routeGroup: RouteGroupParams, groupCallback: GroupCallback) => {

      const newRouteGroupParams = {
        prefix: this.mergePaths(routeGroupParams.prefix, routeGroup.prefix),
        middlewares: [...(routeGroupParams?.middlewares ?? []), ...(routeGroup?.middlewares ?? [])]
      }

      return this.group(newRouteGroupParams, groupCallback)
    }
  }

  private mergePaths(parentPath: string, childPath: string): string {
    //TODO: handle extra slashes
    return parentPath + childPath;
  }

  private makeGroupedRouteProxy(routeGroupParams: RouteGroupParams): RouterInterface {

    const proxyHandler = {
      get: (_targetObject: object, property: PropertyKey) => {
        if (property in this) {
          if (property === ExpressRouterExtended.GROUP_FUNCTION_NAME) return this.handleGroupFunction(routeGroupParams)
          return Reflect.get(this, property)
        }
        const expressFunction = Reflect.get(this.expressRouter, property);
        return this.handleExpressFunction(expressFunction, routeGroupParams.prefix, routeGroupParams.middlewares)
      }
    }
    return new Proxy<RouterInterface>(this as any, proxyHandler)
  }

  public exportRouter(): ExpressRouterInterface {
    return this.expressRouter
  }
}
