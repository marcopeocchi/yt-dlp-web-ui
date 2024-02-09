<script lang="ts">
  import CookiesTextField from './CookiesTextField.svelte';
  import { rpcHost, rpcPort } from './store';
</script>

<div>
  <div class="font-semibold text-lg">Settings</div>

  <input type="text" bind:value={$rpcHost} />
  <input type="text" bind:value={$rpcPort} />

  <CookiesTextField />
</div>
