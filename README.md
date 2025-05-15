# Senior Backend Challenge

## Documentation

Please, provide documentation explaining your implementation choices, challenges faced, and your solution. Either in written here, or with a short loom video.

...

## Learnings

Write your learnings here if you would like to share them.

...

## Project structure infos

Monorepo structured with [nx] following [package-based] pattern:

- [/packages](/packages/) - contains libraries and packages
  - [backend-api](/packages/backend-api/) – API code, like routes and configuration
  - [database-services](/packages/database-services/) - database services and helpers
  - [library-schemas](/packages/library-schemas/) – reusable schemas and types
  - [library-utils](/packages/library-utils/) – reusable utility helpers
  - [types](/packages/types/) – generic types shared between all packages

[nx]: https://nx.dev/getting-started/intro
[package-based]: https://nx.dev/tutorials/package-based-repo-tutorial

## Setup

Use local node version:

```
nvm use
```

### Install dependencies

```
npm install
```

There is one top level `package-lock.json` file. Shared dependencies are present and linked from top level `./node_modules` folder.

## How to run the API locally

- Run command in the terminal

  - from root folder `npm start`
  - from any folder `npx nx start @challenge/backend-api`

- API will be available on http://localhost:3000

## Local scripts

Check available scripts by running:

```
npm run
```

## Running tasks with `nx`

```
npx nx [task] [project]
```

Running a task on multiple projects:

```
npx nx run-many -t [task] -p [project1 project2 ...]
```

Note: an nx project is an internal package.
