<h1 align="center">SDL Codegen</h1>

<p align="center">GraphQL .d.ts file generation for SDL-first projects</p>

This project is for creating the `.d.ts` files for codebases where you have SDL like:

```graphql
export const schema = gql`
    type Game {
        id: ID!
        homeTeamID: Int!
        awayTeamID: Int!
        homeTeamScore: Int!
        awayTeamScore: Int!
    }

    type Query {
        games: [Game!]! @skipAuth
        upcomingGames: [Game!]! @skipAuth
        game(id: ID!): Game @requireAuth
    }
`
```

Then separately, you write functions like:

```ts
export const games = () => db.game.findMany({ orderBy: { startDateTime: "asc" } })

export const upcomingGames = () => db.game.findMany({ isCompleted: false, startDateTime: { gt: new Date() } })

export const game = ({ id }) => db.game.findUnique({ where: { id } })
```

This repo will create `.d.ts` files which very accurately, and very concisely represent the runtime for these functions. It's goal is to take all of the possible logic which might happen in the TypeScript type system, and pre-bake that into the output of the .d.ts files.

You could think of it as a smaller, more singular focused version of the mature and well-featured [graphql-codgen](https://the-guild.dev/graphql/codegen).

## Vision

This repo provides the APIs for building a codegen for framework authors, and the goal is not to provide a CLI for a generalized use-case.

**Step one** is here (which is a CLi you can use): https://github.com/orta/redwood-codegen-api-types/tree/main#how-to-use-this-in-a-redwood-project

**Step two** is to take the above and to start making it more generalized, but to still make it work well with RedwoodJS.

**Step three** will be to make Redwood just a config option.

## Pipeline

This app is architected as a pipeline of sorts. Here's the rough stages:

- Get inputs: GraphQL schema, the source files to represent, Prisma dmmf and dts output config
- Parse inputs: Parse the GraphQL schema, parse source files into facts about the code, parse the Prisma dmmf
- Centralize data: Keep a central store of all of these things, and have specific updaters so that a watcher can be built.
- Generate outputs: Generate .d.ts files for the files we want to generate them for

It's still a bit of a work in progress to have these discrete steps, but it's getting there.

## Development

See [`.github/CONTRIBUTING.md`](./.github/CONTRIBUTING.md), then [`.github/DEVELOPMENT.md`](./.github/DEVELOPMENT.md).
Thanks!

## Contributors

<!-- spellchecker: disable -->
<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="http://www.joshuakgoldberg.com"><img src="https://avatars.githubusercontent.com/u/3335181?v=4?s=100" width="100px;" alt="Josh Goldberg"/><br /><sub><b>Josh Goldberg</b></sub></a><br /><a href="#tool-JoshuaKGoldberg" title="Tools">🔧</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
<!-- spellchecker: enable -->
