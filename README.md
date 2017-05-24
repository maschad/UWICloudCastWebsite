### UWI CloudCast Literacy Tutor web app  built with Angular2, AngularFire2, and Firebase SDK 3

Built with **Angular2** and **AngularFire2**. The app features a **Firebase** backend with **OAuth** authentication. 

- Angular2 `2.2.0`
- Angular2 Router `3.2.0`
- AngularFire2 `2.0.0-beta.5`
- Firebase SDK 3
  - JSON Datastore
  - OAuth authentication with GitHub, Google, and Twitter
  - Hosting
- RxJS
- SASS
- Typescript
- Webpack
  - Inlines external SCSS files
  - Inlines external HTML templates
  - Bundles and minifies release builds
  - Injects style and script tags into index.html


Quick Start
-----------

```shell
$ git clone https://github.com/r-park/todo-angular2-firebase.git
$ cd todo-angular2-firebase
$ npm install
$ npm start
```

#### Install firebase-tools:
```shell
$ npm install -g firebase-tools
```

#### Build and deploy the app:
```shell
$ npm run build
$ firebase login
$ firebase use default
$ firebase deploy
```


Commands
--------

|Script|Description|
|---|---|
|`npm start`|Start webpack development server @ `localhost:3000`|
|`npm run build`|Lint, test, and build the application to `./target`|
|`npm run lint`|Lint `.ts` and `.js` files|
|`npm run lint:js`|Lint `.js` files with eslint|
|`npm run lint:ts`|Lint `.ts` files with tslint|
|`npm run server`|Start express server @ `localhost:3001` to serve built artifacts from `./target` (must run `npm run build` first)|
|`npm test`|Run unit tests with Karma and Jasmine|
|`npm run test:watch`|Run unit tests with Karma and Jasmine; watch for changes to re-run tests|
