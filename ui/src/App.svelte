<script lang="ts">
  import {
    httpPostRpcEndpoint,
    serverApiEndpoint,
    websocketRpcEndpoint,
  } from './lib/store';
</script>

<main>
  {$serverApiEndpoint}
  {$httpPostRpcEndpoint}
  {$websocketRpcEndpoint}
</main>
