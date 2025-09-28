# File Structure

The file structure is in a way of [structure of TurboRepo](https://turbo.build/repo/docs/crafting-your-repository/structuring-a-repository) to achieve a [monorepo](https://en.wikipedia.org/wiki/Monorepo#:~:text=In%20version%2Dcontrol%20systems%2C%20a,commonly%20called%20a%20shared%20codebase.). Besides the files for the configurations of TurboRepo, sveltekit, eslint, typescript, git and so on, here is a list of of key modules of (`/apps`) and `/packages`.

```
root
  |_apps
  |  |_cluster
  |  |_lines
  |  |_price
  |  |_scatter
  |  |_ways
  |
  |_packages
     |_config-*
     |_constants-*
     |_state-*
     |_utils-*
     |_components-*
     |_pixi-*
```

## /apps

For each game, it has an individual folder in the apps, for example `/apps/lines`.

- `/apps/lines/package.json`: Find the module name of the app here.

```
{
  "name": "lines",
  ...
}
```

- To run the app in DEV mode instead of in the storybook: Run `pnpm run dev --filter=<MODULE_NAME>` in the terminal.

```
pnpm run dev --filter=lines
```

- `/apps/lines/src/routes/%2Bpage.svelte`: This is the entry file of sample game apps/lines in a sveltekit way. It is a combination of two things:
  - `setContext()`(`/apps/lines/src/game/context.ts#L14`): A function that sets all the [svelte-context](https://svelte.dev/docs/svelte/context) required and used in this app and in the `/packages`. As we already know, only children-level components can access the context. That is why we set the context at the entry level of the app.
  - `<Game \/>`(`/apps/lines/src/components/Game.svelte`): The entry svelte component to the game. It includes all the components of the game.

```
// +page.svelte

<script lang="ts">
  import Game from '../components/Game.svelte';
  import { setContext } from '../game/context';

  setContext();
</script>

<Game />
```

- `/apps/lines/src/stories/ComponentsGame.stories.svelte`: You will find the same pattern in this storybook or other `Mode<GAME_MODE>Book.stories.svelte` and `Mode<GAME_MODE>BookEvent.stories.svelte`.

```
// ComponentsGame.stories.svelte

<script lang="ts">
  ...
  import Game from '../components/Game.svelte';
  import { setContext } from '../game/context';

  ...
  setContext();
</script>

<Story name="component (loadingScreen)">
  <StoryLocale lang="en">
    <Game />
  </StoryLocale>
</Story>
```

- We can render `<Game \/>`(`/apps/lines/src/components/Game.svelte`) component in the app or in the storybook. Either way it requires the context to set in advance, otherwise the children or the descendants will throw errors if they use the `getContext()`(`/apps/lines/src/game/context.ts#L21`) from `/apps` or `getContext()` (`/packages/components-ui-pixi/src/context.ts#L8`) from `/packages`.

<a name="packages"></a>

## /packages

For every TurboRepo local package, you can import and use them in an app or in another local package directly without publishing them to [npm](https://www.npmjs.com). <mark>Our codebase benefits considerably from a monorepo because it brings reusability, readability, maintainability, code splitting and so on.</mark> Here is an example of importing local packages with `workspace:*` in `/apps/lines/package.json`:

```
// package.json

{
  "name": "lines",
  ...,
  "devDependencies": {
    ...,
    "config-ts": "workspace:*",
  },
  "dependencies": {
    ...,
    "pixi-svelte": "workspace:*",
    "constants-shared": "workspace:*",
    "state-shared": "workspace:*",
    "utils-shared": "workspace:*",
    "components-shared": "workspace:*",
  }
}
```

The naming convention of packages is a combination of `<PACKAGE_TYPE>`, hyphen and `<SPECIAL_DEPENDENCY>` or `<SPECIAL_USAGE>`. For example, `components-pixi` is a local package that the package type is "components" and the special dependency is `pixi-svelte`.

- `config-*`:
  - `/packages/config-lingui`: This local package contains reusable configurations of npm package [lingui](https://www.npmjs.com/package/@lingui/core).
  - `/packages/config-storybook`: This local package contains reusable configurations of npm package [storybook](https://www.npmjs.com/package/storybook).
  - `packages/config-svelte`: This local package contains reusable configurations of npm package [svelte](https://www.npmjs.com/package/svelte).
  - `/packages/config-ts`: This local package contains reusable configurations of npm package [typescript](https://www.npmjs.com/package/typescript).
  - `/packages/config-vite`: This local package contains reusable configurations of npm package [vite](https://www.npmjs.com/package/vite).
- `pixi-*`
  - `/packages/pixi-svelte`: This local package contains reusable svelte components/functions/types based on [pixijs](https://www.npmjs.com/package/pixi.js) and [svelte](https://www.npmjs.com/package/svelte).
    - It creates `stateApp` and `AppContext` as a [svelte-context](https://svelte.dev/docs/svelte/context).
    - It also builds and publishes [pixi-svelte of npm](https://www.npmjs.com/package/pixi-svelte).
  - `packages/pixi-svelte-storybook`: This is a storybook for components in `pixi-svelte`.
- `constants-*`:
  - `/packages/constants-shared`: This local package contains reusable <mark>global</mark> constants.
- `state-*`:
  - `/packages/state-shared`: This local package contains reusable <mark>global</mark> [svelte-$state](https://svelte.dev/docs/svelte/$state).
- `utils-*`:
  - `/packages/utils-book`: This local package contains reusable functions/types that are related to book and bookEvent.
  - `/packages/utils-fetcher`: This local package contains reusable functions/types based on [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).
  - `/packages/utils-shared`: This local package contains reusable functions/types, except for [lodash](https://www.npmjs.com/package/lodash) and [lingui](https://www.npmjs.com/package/@lingui/core).
  - `/packages/utils-slots`: This local package contains reusable functions/types for slots game, for example creating reel and spinning the board.
  - `/packages/utils-sound`: This local package contains reusable functions/types based on npm package [howler](https://www.npmjs.com/package/howler) for music and sound effect.
  - `/packages/utils-event-emitter`: This local package contains reusable functions/types to achieve our [event-driven programming](https://en.wikipedia.org/wiki/Event-driven_programming).
    - It creates `eventEmitter` and `ContextEventEmitter` as a [svelte-context](https://svelte.dev/docs/svelte/context)
  - `/packages/utils-xstate`: This local package contains reusable functions/types based on npm package [xstate](https://www.npmjs.com/package/xstate).
    - It creates `stateXstate`, `stateXstateDerived` and `ContextXstate` as a [svelte-context](https://svelte.dev/docs/svelte/context)
  - `/packages/utils-layout`: This local package contains reusable functions/types for our layout system of pixijs.
    - It creates `stateLayout`, `stateLayoutDerived` and `ContextLayout` as a [svelte-context](https://svelte.dev/docs/svelte/context)
- `components-*`:
  - `/packages/components-layout`: This local package contains reusable svelte components based on another local package `utils-layout`.
  - `/packages/components-pixi`: This local package contains reusable svelte components based on `pixi-svelte`.
  - `/packages/components-shared`: This local package contains reusable svelte components based on `html`.
  - `/packages/components-storybook`: This local package contains reusable svelte components for storybooks.
  - `/packages/components-ui-pixi`: This local package contains reusable svelte pixi-svelte components for the game UI.
  - `packages/components-ui-html`: This local package contains reusable svelte html components for the game UI.

For `*-shared` packages, they are created to be reused as much as possible by other apps and packages. Instead of having a special dependency or usage, they should have a minimum list of dependencies and a broad set of use cases.

`pixi-svelte`, `utils-event-emitter`, `utils-layout` and `utils-xstate` they have functions to create corresponding [svelte-context](https://svelte.dev/docs/svelte/context). For the contexts, they can be used by either an app or a local `components-*` package by just calling the `getContext<CONTEXT_NAME>()`. For example, components in `components-layout` use `getContextLayout()` from `utils-layout`. In this way, we can regard `pixi-svelte` as an integration of "utils-pixi-svelte" and "components-pixi-svelte".
