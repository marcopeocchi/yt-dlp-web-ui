<script lang="ts">
  import { get } from 'svelte/store';
  import Button from './Button.svelte';
  import TextField from './TextField.svelte';
  import { downloadTemplates, rpcClient } from './store';
  import Select from './Select.svelte';
  import type { DLMetadata } from './types';
  import FormatsList from './FormatsList.svelte';

  let url: string = '';
  let args: string = '';
  let metadata: DLMetadata;

  const download = () =>
    get(rpcClient).download({
      url,
      args,
    });

  const getFormats = () =>
    get(rpcClient)
      .formats(url)
      ?.then((f) => (metadata = f.result));
</script>

<div class="w-full px-8">
  <div class="my-4 font-semibold text-xl">New download</div>
  <div class="grid grid-cols-2 gap-2 w-full mb-2">
    <TextField placeholder="https://..." label="URL" bind:value={url} />
    <TextField
      placeholder="arguments separated by space"
      label="yt-dlp arguments"
      bind:value={args}
    />
    <Select bind:value={args}>
      <option selected disabled value=""> Select download template </option>
      {#each $downloadTemplates as template}
        <option id={template.id} value={template.content}>
          {template.name}
        </option>
      {/each}
    </Select>
  </div>
  <Button class="mt-2" on:click={download}>Download</Button>
  <Button class="mt-2" on:click={getFormats}>Select format</Button>
  {#if metadata}
    <FormatsList formats={metadata.formats} />
  {/if}
</div>
