<script lang="ts">
  import { rpcClient, serverApiEndpoint } from './store';
</script>

<nav
  class="p-4 flex justify-between items-center bg-neutral-100 rounded-b-lg border shadow-lg"
>
  <div class="font-semibold">yt-dlp WebUI</div>

  <div />

  <div class="flex gap-2">
    <div>
      HDD: {#await $rpcClient.freeSpace()}
        Loading...
      {:then freeSpace}
        {freeSpace.result}
      {/await}
    </div>

    <div>RPC: {$serverApiEndpoint.split('//')[1]}</div>
  </div>
</nav>
