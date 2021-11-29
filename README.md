# Express Router Extended

Add extra functionalities to express router, such as routing and middleware grouping, based on Laravel's router builder.

## Install

NPM

```sh
$ npm install express-router-extended
```

Yarn

```sh
$ yarn add express-router-extended
```

## How to Use

```ts
import express, { Response, Request } from 'express';
import ExpressRouterExtended from 'express-router-extended';

const expressInstance = express()
const router = ExpressRouterExtended.build()

let visits = 0;
const visitsMiddleware = (_req: Request, response: Response, next: () => void) => {
    console.log(`This page was accessed ${++visits} time(s)`)
    next()
}

router.group({ prefix: '/prefix', middlewares: [visitsMiddleware] }, router => {
    router.get('/route', () => console.log('Hello from /prefix/route using visitsMiddleware'))
    router.get('/route2', () => console.log('Hello from /prefix/route2 using visitsMiddleware'))

    router.group({prefix: '/second-prefix'}, router => {
        router.get('/route', () => console.log('Hello from /prefix/second-prefix/route using visitsMiddleware'))
    })
})

expressInstance.listen('8080', () => console.log('Running on Port 8080'))
expressInstance.use(router.exportRouter())
```

## How to Test

```sh
$ npm run test or yarn test
```

## Contributing

This project is open for pull requests. For major changes or discussions, please open an issue first.

## License

[MIT](https://choosealicense.com/licenses/mit/)