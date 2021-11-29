import ExpressRouterExtended, { RouterInterface } from '../src'

describe('Express Router Extended flow', () => {

    test('it should group one route without middlewares', () => {

        const expressRouterExtended = ExpressRouterExtended.build()
        expressRouterExtended.group({ prefix: '/group' }, (router: RouterInterface) => {
            router.get('/child', () => null)
        })

        expect(expressRouterExtended.stack[0].route.path).toEqual('/group/child')
    })

    test('it should group multiple routes without middlewares', () => {

        const expressRouterExtended = ExpressRouterExtended.build()
        expressRouterExtended.group({ prefix: '/group' }, (router: RouterInterface) => {
            router.get('/child1', () => null)
            router.get('/child2', () => null)
            router.get('/child3', () => null)
            router.get('/child4', () => null)
            router.get('/child5', () => null)
        })

        expect(expressRouterExtended.stack[0].route.path).toEqual('/group/child1')
        expect(expressRouterExtended.stack[1].route.path).toEqual('/group/child2')
        expect(expressRouterExtended.stack[2].route.path).toEqual('/group/child3')
        expect(expressRouterExtended.stack[3].route.path).toEqual('/group/child4')
        expect(expressRouterExtended.stack[4].route.path).toEqual('/group/child5')
    })

    test('it should group one route with multiple middlewares', () => {

        const expressRouterExtended = ExpressRouterExtended.build()
        const middlewares = [
            function namedMiddleware0() { },
            function namedMiddleware1() { },
            function namedMiddleware2() { },
            function namedMiddleware3() { },
        ]

        expressRouterExtended.group({ prefix: '/group', middlewares: [...middlewares] }, (router: RouterInterface) => {
            router.get('/child1', () => null)
        })

        const rawExpressRouter = expressRouterExtended.stack[0].route
        const middlewaresCount = middlewares.length - 1; //subtract -1 because the last one is the route callback "() => null"

        for (let middlewareIndex = 0; middlewareIndex <= middlewaresCount; middlewareIndex++) {
            expect(rawExpressRouter.stack[middlewareIndex].handle).toBeInstanceOf(Function)
            expect(rawExpressRouter.stack[middlewareIndex].name).toBe(`namedMiddleware${middlewareIndex}`)
        }
    })

    test('it should group multiple routes with multiple middlewares', () => {

        const middleware1 = function firstMiddleware() { }
        const middleware2 = function secondMiddleware() { }
        const middleware3 = function thirdMiddleware() { }

        const expressRouterExtended = ExpressRouterExtended.build()
        expressRouterExtended.group({ prefix: '/group', middlewares: [middleware1, middleware2, middleware3] }, (router: RouterInterface) => {
            router.get('/child1', () => null)
            router.get('/child2', () => null)
            router.get('/child3', () => null)
            router.get('/child4', () => null)
            router.get('/child5', () => null)
        })

        const numRoutes = 5; //number of routes registered inside of the group above
        for (let routeIndex = 0; routeIndex < numRoutes; routeIndex++) {
            const currentRoute = expressRouterExtended.stack[routeIndex].route
            expect(currentRoute.stack[0].handle).toBeInstanceOf(Function)
            expect(currentRoute.stack[1].handle).toBeInstanceOf(Function)
            expect(currentRoute.stack[2].handle).toBeInstanceOf(Function)
            expect(currentRoute.stack[0].name).toBe('firstMiddleware')
            expect(currentRoute.stack[1].name).toBe('secondMiddleware')
            expect(currentRoute.stack[2].name).toBe('thirdMiddleware')
        }
    })

    test('it should group route inside child group with middlewares', () => {

        const expressRouterExtended = ExpressRouterExtended.build()

        const parentGroupMiddlewares = [
            function parentGroupMiddleware1() { },
            function parentGroupMiddleware2() { },
        ]
        const childGroupMiddlewares = [
            function childGroupMiddleware1() { },
            function childGroupMiddleware2() { },
        ]

        expressRouterExtended.group({ prefix: '/parent-group', middlewares: parentGroupMiddlewares }, (router: RouterInterface) => {

            router.group({ prefix: '/child-group', middlewares: childGroupMiddlewares }, (router: RouterInterface) => {
                router.get('/second-child-route', () => null)
            })
        })

        const childRoute = expressRouterExtended.stack[0].route

        expect(childRoute.path).toBe('/parent-group/child-group/second-child-route')
        expect(childRoute.stack[0].name).toBe('parentGroupMiddleware1')
        expect(childRoute.stack[1].name).toBe('parentGroupMiddleware2')
        expect(childRoute.stack[2].name).toBe('childGroupMiddleware1')
        expect(childRoute.stack[3].name).toBe('childGroupMiddleware2')
        expect(childRoute.stack[0].handle).toBeInstanceOf(Function)
        expect(childRoute.stack[1].handle).toBeInstanceOf(Function)
        expect(childRoute.stack[2].handle).toBeInstanceOf(Function)
        expect(childRoute.stack[3].handle).toBeInstanceOf(Function)
    })
})