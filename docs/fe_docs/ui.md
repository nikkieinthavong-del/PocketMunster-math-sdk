# UI

We have provided solutions for the UI, which are `/packages/components-ui-pixi` and `/packages/components-ui-html`. They are functional with a few features like auto gaming, turbo mode, bonus button, responsiveness and so on, but they are not as beautiful.

```
<script lang="ts">
	import { UI, UiGameName } from 'components-ui-pixi';
	import { GameVersion, Modals } from 'components-ui-html';
</script>

<App>
  <UI>
    {#snippet gameName()}
      <UiGameName name="LINES GAME" />
    {/snippet}
    {#snippet logo()}
      <Text
        anchor={{ x: 1, y: 0 }}
        text="ADD YOUR LOGO"
        style={{
          fontFamily: 'proxima-nova',
          fontSize: REM * 1.5,
          fontWeight: '600',
          lineHeight: REM * 2,
          fill: 0xffffff,
        }}
      />
    {/snippet}
  </UI>
</App>

<Modals>
	{#snippet version()}
		<GameVersion version="0.0.0" />
	{/snippet}
</Modals>

```

For the branding purpose, we recommend you to regard them as just an example of UI packages instead of applying them directly to your final product. It would be a good choice to use them as a starting point and add more style to them to build your UI. It is completely fine to ignore them and build your own UI from scratch.
