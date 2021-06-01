// Copyright (c) 2021 ST John

import * as m from "ml-matrix";

const paramVariance = {
  name: "variance",
  formula: "\\sigma^2",
  value: 1.0,
  min: 0.0,
  max: 2.0,
  step: 0.01,
  lowerBound: 0.0,
};
const paramLengthscale = {
  name: "lengthscale",
  formula: "\\ell",
  value: 0.5,
  min: 0.05,
  max: 1.5,
  step: 0.01,
  lowerBound: 1e-3,
};

export function sqexp(variance = 1, lengthscale = 1) {
  const twosqlength = 2 * lengthscale * lengthscale;
  return (x1, x2) => {
    const sqdist = Math.pow(x1 - x2, 2);
    return variance * Math.exp(-sqdist / twosqlength);
  };
}

export function makeSqexp() {
  return {
    description: "Squared-exponential",
    formula: "\\sigma^2 \\exp\\Big(-\\frac{(s-t)^2}{2\\ell^2}\\Big)",
    parameters: [paramVariance, paramLengthscale],
    kernel: sqexp,
  };
}

export function matern12(variance = 1, lengthscale = 1) {
  return (x1, x2) => {
    const dist = Math.abs(x1 - x2);
    return variance * Math.exp(-dist / lengthscale);
  };
}

export function makeMatern12() {
  return {
    description: "Matérn 1/2 (Exponential)",
    formula: "\\sigma^2 \\exp\\Big(-\\frac{|s-t|}{\\ell}\\Big)",
    parameters: [paramVariance, paramLengthscale],
    kernel: matern12,
  };
}

export function matern32(variance = 1, lengthscale = 1) {
  return (x1, x2) => {
    const scaledDist = (Math.sqrt(3) * Math.abs(x1 - x2)) / lengthscale;
    return variance * (1 + scaledDist) * Math.exp(-scaledDist);
  };
}

export function makeMatern32() {
  return {
    description: "Matérn 3/2",
    formula:
      "\\sigma^2 \\big( 1 + \\frac{\\sqrt{3} |x-x'|}{\\ell} \\big) \\exp\\Big(-\\frac{\\sqrt{3} |x-x'|}{\\ell}\\Big)",
    parameters: [paramVariance, paramLengthscale],
    kernel: matern32,
  };
}

export function matern52(variance = 1, lengthscale = 1) {
  return (x1, x2) => {
    const scaledDist = (Math.sqrt(5) * Math.abs(x1 - x2)) / lengthscale;
    return (
      variance *
      (1 + scaledDist + (scaledDist * scaledDist) / 3) *
      Math.exp(-scaledDist)
    );
  };
}

export function makeMatern52() {
  return {
    description: "Matérn 5/2",
    formula:
      "\\sigma^2 \\big( 1 + \\frac{\\sqrt{5} |x-x'|}{\\ell} + \\frac{5 (x-x')^2}{3 \\ell^2} \\big) \\exp\\Big(-\\frac{\\sqrt{5} |x-x'|}{\\ell}\\Big)",
    parameters: [paramVariance, paramLengthscale],
    kernel: matern52,
  };
}

export function white(variance = 1) {
  return (x1, x2) => {
    return x1 === x2 ? variance : 0.0;
  };
}

export function makeWhite() {
  return {
    description: "White Noise",
    formula: "\\sigma^2 \\mathbb{1}\\{s=t\\}",
    parameters: [paramVariance],
    kernel: white,
  };
}

export function periodic(variance = 1, lengthscale = 1.4, period = 2) {
  const sqlength = lengthscale * lengthscale;
  return (x1, x2) => {
    const dist = Math.abs(x1 - x2);
    const sin2 = Math.pow(Math.sin((Math.PI * dist) / period), 2);
    return variance * Math.exp(-(2 * sin2) / sqlength);
  };
}

const paramPeriod = {
  name: "period",
  formula: "p",
  value: 2.0,
  min: 0.1,
  max: 10.0,
  step: 0.01,
  lowerBound: 1e-3,
};

export function makePeriodic() {
  return {
    description: "periodic",
    formula:
      "\\sigma^2 \\exp\\Big(- 2 \\frac{\\sin^2(\\pi |x-x'|/p)}{\\ell^2}\\Big)",
    parameters: [paramVariance, paramLengthscale, paramPeriod],
    kernel: periodic,
  };
}

const paramBias = {
  name: "bias",
  formula: "\\sigma^2_b",
  value: 0.0,
  min: 0.0,
  max: 4.0,
  step: 0.01,
  lowerBound: 0.0,
};
const paramCenter = {
  name: "center",
  formula: "x_c",
  value: 2.0,
  min: -2.0,
  max: 8.0,
  step: 0.1,
};

export function linear(variance = 1, bias = 0, center = 0) {
  return (x1, x2) => {
    return bias + variance * (x1 - center) * (x2 - center);
  };
}

export function makeLinear() {
  return {
    description: "linear",
    formula: "\\sigma^2 (x - x_c)(x' - x_c) + \\sigma^2_b",
    parameters: [paramVariance, paramBias, paramCenter],
    kernel: linear,
  };
}

export function productKernel(kernels) {
  return (x1, x2) => {
    const results = kernels.map((k) => k.apply(null, [x1, x2]));
    return results.reduce((acc, x) => acc * x, 1);
  };
}

export function sumKernel(kernels) {
  return (x1, x2) => {
    const results = kernels.map((k) => k.apply(null, [x1, x2]));
    return results.reduce((acc, x) => acc + x, 0);
  };
}

export function covMatrix(kernel, xs) {
  const dim = xs.length;
  const kernelMatrix = new m.Matrix(dim, dim);
  for (let i = 0; i < dim; ++i) {
    for (let j = i; j < dim; ++j) {
      let k = kernel(xs[i], xs[j]);
      kernelMatrix.set(i, j, k);
      kernelMatrix.set(j, i, k);
    }
  }
  return kernelMatrix;
}
