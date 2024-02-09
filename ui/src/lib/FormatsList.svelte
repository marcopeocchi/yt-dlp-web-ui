<script lang="ts">
  import type { DLFormat } from './types';

  let group = '';
  export let formats: DLFormat[];
</script>

<div class="flex w-full flex-col items-center justify-center">
  <div class="w-full px-4 py-16">
    <div class="mx-auto w-full max-w-md">
      <fieldset class="flex flex-col space-y-2">
        {#each formats as format}
          <div class="relative">
            <input
              id="startup"
              class="absolute opacity-0 w-0 h-0 peer"
              type="radio"
              bind:group
              name="type"
              value="startup"
            />
            <label
              for="startup"
              class="[&_p]:text-gray-900 [&_span]:text-gray-500 peer-checked:[&_p]:text-white peer-checked:[&_span]:text-sky-100 peer-focus:ring-2 peer-focus:ring-white peer-focus:ring-opacity-60 peer-focus:ring-offset-2 peer-focus:ring-offset-sky-300 bg-white relative flex cursor-pointer rounded-lg px-5 py-4 shadow-md focus:outline-none peer-checked:bg-sky-900/75 peer-checked:text-white"
            >
              <div class="flex w-full items-center justify-between">
                <div class="flex items-center">
                  <div class="text-sm">
                    <p class="font-medium" id="headlessui-label-:R5mm:">
                      {format.resolution}
                    </p>
                    <span class="inline" id="headlessui-description-:R9mm:">
                      <span>{format.vcodec}</span>
                      <span aria-hidden="true">·</span>
                      <span>{format.vcodec}</span></span
                    >
                  </div>
                </div>
                <div class="shrink-0 text-white">
                  <svg viewBox="0 0 24 24" fill="none" class="h-6 w-6">
                    <circle
                      cx="12"
                      cy="12"
                      r="12"
                      fill="#fff"
                      opacity="0.2"
                    /><path
                      d="M7 13l3 3 7-7"
                      stroke="#fff"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </label>
          </div>
        {/each}
      </fieldset>
    </div>
  </div>
</div>
