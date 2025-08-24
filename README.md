# Magic Card Collection Manager

A Svelte-based web application for managing your Magic: The Gathering card collection using the Scryfall API.

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## TypeScript

This project uses TypeScript with strict mode for type safety. The application includes:

- **Type-safe API responses** - Interfaces for Scryfall API data (`ScryfallCard`, `ScryfallError`, `ScryfallSearchResponse`)
- **Type guards** - Functions like `isCard()` and `isError()` for runtime type checking
- **Strict TypeScript configuration** - Full type checking enabled

### TypeScript Commands

```sh
# Check for TypeScript errors
npm run check

# Build with TypeScript compilation
npm run build
```

### Current Features

- **Card Search** - Search Magic cards by name with fuzzy matching
- **Scryfall Integration** - Fetches card data and images from Scryfall API  
- **Error Handling** - Specific error messages for different failure types
- **Loading States** - Skeleton UI while searching
- **TypeScript Safety** - Full type coverage for API responses

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
