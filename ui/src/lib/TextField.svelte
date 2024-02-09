<script lang="ts">
  export let label: string;
  export let value: any;
</script>

<div class="flex flex-col gap-0.5 text-sm">
  <label for=""> {label} </label>
  <input
    type="text"
    class="p-2 bg-neutral-50 border rounded-lg"
    on:keyup
    bind:value
  />
</div>
