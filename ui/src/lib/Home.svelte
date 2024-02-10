<script lang="ts">
  import * as O from 'fp-ts/Option';
  import { pipe } from 'fp-ts/lib/function';
  import { onDestroy } from 'svelte';
  import DownloadCard from './DownloadCard.svelte';
  import Spinner from './Spinner.svelte';
  import { downloads, rpcClient } from './store';
  import { datetimeCompareFunc, isRPCResponse } from './utils';

  const unsubscribe = rpcClient.subscribe(($client) => {
    setInterval(() => $client.running(), 750);

    $client.socket.onmessage = (ev: any) => {
      const event = JSON.parse(ev.data);
      // guards
      if (!isRPCResponse(event)) {
        return;
      }
      if (!Array.isArray(event.result)) {
        return;
      }

      if (event.result) {
        return downloads.set(
          O.of(
            event.result
              .filter((f) => !!f.info.url)
              .sort((a, b) =>
                datetimeCompareFunc(b.info.created_at, a.info.created_at),
              ),
          ),
        );
      }

      downloads.set(O.none);
    };
  });

  onDestroy(unsubscribe);
</script>

{#if O.isNone($downloads)}
  <div class="h-[90vh] w-full flex justify-center items-center">
    <Spinner />
  </div>
{:else}
  <div class="grid grid-cols-1 xl:grid-cols-2 gap-2 p-8">
    {#each pipe( $downloads, O.getOrElseW(() => []), ) as download}
      <DownloadCard {download} />
    {/each}
  </div>
{/if}
