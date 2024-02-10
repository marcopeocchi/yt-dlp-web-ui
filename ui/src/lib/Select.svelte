<script lang="ts">
  export let value: any;

  export let disabled: boolean = false;
  export let placeholder: string = '';
  export { clazz as class };
</script>

<select
  class="
  p-2
  bg-neutral-50
  border rounded-lg
  appearance-none
  text-sm font-semibold
  focus:outline-orange-300
  "
  bind:value
  {disabled}
  {placeholder}
>
  <slot />
</select>
