<script lang="ts">
  import * as O from 'fp-ts/Option';
  import { pipe } from 'fp-ts/lib/function';
  import { downloads, rpcClient } from './lib/store';
  import { datetimeCompareFunc, isRPCResponse } from './lib/utils';
  import { onDestroy } from 'svelte';
  import Navbar from './lib/Navbar.svelte';

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

<main>
  <Navbar />
  <div class="flex flex-col gap-2 p-8">
    {#each pipe( $downloads, O.getOrElseW(() => []), ) as download}
      <div class="flex gap-4 bg-neutral-100 p-4 rounded-lg shadow-lg border">
        <img src={download.info.thumbnail} class="h-48 rounded" alt="" />
        <div class="break-all">
          <div>{download.id}</div>
          <div>{JSON.stringify(download.info)}</div>
          <div>{JSON.stringify(download.progress)}</div>
        </div>
      </div>
    {/each}
  </div>
</main>
