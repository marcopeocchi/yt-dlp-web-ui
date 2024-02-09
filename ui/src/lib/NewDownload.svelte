<script lang="ts">
  import { get } from 'svelte/store';
  import Button from './Button.svelte';
  import TextField from './TextField.svelte';
  import { downloadTemplates, rpcClient } from './store';

  let url: string = '';
  let args: string = '';

  $: console.log(args);

  const download = () =>
    get(rpcClient).download({
      url,
      args,
    });
</script>

<div class="w-full">
  <div class="flex gap-2 w-full mb-2">
    <TextField label="url" class="w-96" bind:value={url} />
    <TextField label="args" class="w-96" bind:value={args} />
  </div>
  <Button on:click={download}>Download</Button>
  <select bind:value={args}>
    {#each $downloadTemplates as template}
      <option id={template.id} value={template.content}>{template.name}</option>
    {/each}
  </select>
</div>
