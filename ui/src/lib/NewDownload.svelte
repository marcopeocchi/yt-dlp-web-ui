<script lang="ts">
  import { get } from 'svelte/store';
  import Button from './Button.svelte';
  import TextField from './TextField.svelte';
  import { rpcClient } from './store';

  let url: string = '';
  let args: string = '';

  const download = () =>
    get(rpcClient).download({
      url,
      args,
    });
</script>

<div>
  <TextField label="url" bind:value={url} />
  <TextField label="args" bind:value={args} />
  <Button on:click={download}>Download</Button>
</div>
