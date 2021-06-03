<!-- Copyright (c) 2021 ST John -->
<script lang="ts">
  import Lineplot from "./Lineplot.svelte";
  import Kernelplot from "./Kernelplot.svelte";
  import CovMat from "./CovMat.svelte";
  import RandomSample from "./RandomSample.svelte";
  import ConfigData from "./ConfigData.svelte";
  import { x1, x2, vs, us } from "./store.js";
  import {
    sqexp,
    white,
    makeSqexp,
    makeMatern12,
    makeWhite,
    makeBrownianMotion,
    sumKernel,
  } from "./kernels.js";
  import {
    linspace,
    matrixSqrt,
    sampleMvnTrajectory,
    covEllipse,
  } from "./mymath.js";
  import { getIndicesAndFrac } from "./binarysearch.js";
  import { posterior, prior } from "./gpposterior.js";

  let kernelChoices = [
    makeMatern12(), // 0
    makeSqexp(), // 1
    makeWhite(), // 2
    makeBrownianMotion(), //3
  ];
  let selectedKernel = kernelChoices[1]; // = Sqexp
  let noiseScale = 0.0;

  let doAnimate = true;

  let plotProps = {
    mean: true,
    confidence: false,
    samples: true,
    marginals: false,
  };

  let num_grid = 200;
  $: xs = linspace(0, 5, num_grid);

  $: kernelWithJitter = sumKernel([
    selectedKernel
      ? selectedKernel.kernel(...selectedKernel.parameters.map((p) => p.value))
      : sqexp(),
    white(1e-6),
  ]);

  $: gp =
    points.length > 0
      ? posterior(
          kernelWithJitter,
          points.map((p) => p.x),
          points.map((p) => p.y),
          noiseScale * noiseScale
        )
      : prior(kernelWithJitter);

  $: k1s = xs.map((x) => gp.kernel($x1, x));
  $: k2s = xs.map((x) => gp.kernel($x2, x));
  $: means = gp.mean(xs);
  $: covMat = gp.cov(xs);
  $: marginalVariances = covMat.diag();
  $: covSqrt = matrixSqrt(covMat);

  let frameIdx = 0;
  let numFrames = 30;
  $: sampleFrames = sampleMvnTrajectory(means, covSqrt, $vs, $us, numFrames);
  $: samples = sampleFrames[frameIdx];

  function updateFrameIdx() {
    if (doAnimate) {
      frameIdx = (frameIdx + 1) % numFrames;
    }
  }

  let animationInterval;
  let animationDelay = 100;
  $: {
    clearInterval(animationInterval);
    setInterval(updateFrameIdx, animationDelay);
  }

  $: getDataAt = (dat) => {
    // TODO improve using d3-interpolate?
    const samples1 = samples.getRow(dat.idx1);
    const samples2 = samples.getRow(dat.idx2);
    const ys = samples1.map(
      (y1: number, i: number) => dat.w1 * y1 + dat.w2 * samples2[i]
    );
    const mean = dat.w1 * means[dat.idx1] + dat.w2 * means[dat.idx2];
    const variance =
      dat.w1 * marginalVariances[dat.idx1] +
      dat.w2 * marginalVariances[dat.idx2];
    const k1 = dat.w1 * k1s[dat.idx1] + dat.w2 * k1s[dat.idx2];
    const k2 = dat.w1 * k2s[dat.idx1] + dat.w2 * k2s[dat.idx2];
    return { ys, mean, variance, k1, k2 };
  };
  $: atX1 = getDataAt(getIndicesAndFrac(xs, $x1));
  $: atX2 = getDataAt(getIndicesAndFrac(xs, $x2));

  $: covY1Y2 = gp.cov([$x1, $x2]);
  $: covProps = covEllipse(covY1Y2);

  let points = [];
</script>

<div>
  <h1 class="post-title">Gaussian Process Visualization</h1>
  <span style="display:block; margin-top:-20px;">
    Topics in Econometrics and Statistics, Summer term 2021, Tim Mensinger
  </span>

  <div>
    <div class="plot-container">
      <div class="chart" style="grid-area: kernel;">
        <Kernelplot {xs} {k1s} {k2s} {atX1} {atX2} />
      </div>
      <div class="chart" style="grid-area: line;">
        <Lineplot
          {xs}
          {means}
          {marginalVariances}
          {samples}
          bind:points
          {atX1}
          {atX2}
          {plotProps}
        />
      </div>
    </div>
  </div>

  <div>
    <ConfigData bind:noiseScale bind:selectedKernel {kernelChoices} />
  </div>

  <div>
    <RandomSample xsLength={xs.length} bind:doAnimate />
  </div>

  <div class="footer">
    <em>
      Adjusted by Tim Mensinger
      [<a href="https://github.com/timmens/gp-visualization">GitHub</a>]
      &mdash Copyright (c) 2021 ST John [
      <a href="https://github.com/st--/interactive-gp-visualization/"
        >Original source on GitHub</a
      >
      ]
    </em>
  </div>
</div>

<style>
  .plot-container {
    display: grid;
    height: 550px;
    grid-template-rows: auto 350px;
    grid-template-columns: 95%;
    grid-template-areas:
      "kernel covmat"
      "line covariance";
  }
  .chart {
    min-width: 90%;
  }

  .footer {
    position: fixed;
    left: 0;
    bottom: 3%;
    width: 100%;
    text-align: center;
  }
</style>
