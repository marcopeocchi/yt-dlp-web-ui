<script lang="ts">
  import { get } from 'svelte/store';
  import Button from './Button.svelte';
  import TextField from './TextField.svelte';
  import { rpcClient, rpcHost, rpcPort } from './store';
  import FullscreenSpinner from './FullscreenSpinner.svelte';

  let loading: Promise<any>;

  const update = () => (loading = get(rpcClient).updateExecutable());
</script>

<div class="w-full">
  <div class="font-semibold text-lg mb-4">Settings</div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
    <TextField
      label="Server address"
      bind:value={$rpcHost}
      placeholder="localhost"
    />
    <TextField label="Server port" bind:value={$rpcPort} placeholder="3033" />
  </div>

  <Button class="mt-4" on:click={update}>Update yt-dlp</Button>

  {#if loading}
    {#await loading}
      <FullscreenSpinner />
    {/await}
  {/if}

  <!-- <CookiesTextField /> -->
</div>
