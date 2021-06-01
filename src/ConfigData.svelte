<!-- Copyright (c) 2021 ST John -->
<script>
  import Katex from "./Katex.svelte";
  import ParameterSlider from "./ParameterSlider.svelte";
  export let noiseScale, selectedKernel, kernelChoices;

  let noiseScaleProps = {
    name: "standard deviation",
    formula: "\\sigma_\\text{noise}",
    min: 0.0,
    max: 2.0,
    step: 0.01,
    lowerBound: 0.0,
  };
  let noiseScaleInternal = noiseScale;
  let useLikelihood = true;
  $: noiseScale = useLikelihood ? noiseScaleInternal : 0.0;
</script>

<div>
  <strong>Kernel:</strong>
  <select bind:value={selectedKernel}>
    {#each kernelChoices as choice}
      <option value={choice}>
        {choice.description}
      </option>
    {/each}
  </select>
  <span style="display:inline-block; width: 10px;"></span>
  <Katex math="\sigma(s, t) = {selectedKernel.formula}" />

  {#each selectedKernel.parameters as parameter}
    <ParameterSlider bind:value={parameter.value} {...parameter} />
  {/each}

</div>

<style>
  input[type="radio"] {
    margin-right: 5px;
  }
</style>
