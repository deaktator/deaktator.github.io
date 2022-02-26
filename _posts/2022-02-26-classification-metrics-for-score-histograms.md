---
layout: post
title:  "Classification Metrics for Score Histograms"
date:   2022-02-26 13:00:00
categories: statistics
---

In a previous post, [Metrics for Calibrated Classifiers]({% post_url 2019-05-20-metrics-for-calibrated-classifiers %}), a method was provided to compute confusion matrix
statistics and derived metrics.  It was noted that:

> since the confusion matrix estimates can be determined at any threshold,
> curves like precision-recall curves and ROC curves can be determined
> parametrically as can metrics derived from these curves.

This post expands on the previous ideas and provides a method for computing
confusion matrix statistics for histograms of scores (for instance, provided
in python via `numpy.histogram`).  The motivation for providing a histogram
based method is to reduce the memory constraints over the method outlined in
the original article.

## Example

We will compare the ROC and PR curve and the AUC and AP estimates computed
by scikit-learn with curves estimated without any ground truth (`yt`)
information.  While ground truth information is omitted from the
calculations, the information is provided implicitly if the classifier from
which the predictions are derived is well calibrated.  This means that the
[accuracy](https://en.wikipedia.org/wiki/Accuracy_and_precision#In_binary_classification)
of a positive prediction equals the probability output by the classifier.

### Create a sample distribution

Create a Beta(*&alpha;*=2, *&beta;*=8) distribution representing probability
estimates and sample 10 million ground truth labels (`yt`) and predictions
(`yp`).

<script src="https://gist.github.com/deaktator/97cef63eb8c0c4917092a7b5aa00b969.js"></script>

### Use scikit-learn to determine ROC curve and PR curves

<script src="https://gist.github.com/deaktator/408170a779454e247e29abfec070137a.js"></script>

Here, scikit-learn returns `AUC: 0.709  AP: 0.372` and takes about
***14 seconds*** on a modern MacBook Air.  If we produce the precision recall
curve and ROC curve, we see the following.

### Compute the confusion matrix stats based on predictions only

We can determine the confusion matrix stats established for a histogram with
a constant bin width.  

<script src="https://gist.github.com/deaktator/ddb726f4016bae43bddddd33c374f689.js"></script>

This only takes about ***1 second*** to compute.

### Plot ROC and PR curves

|---
| ROC Curve                                              | PR Curve
| :----------------------------------------------------: | :---------------------------------------------:
|  ![ROC Curve]({{ site.url }}/assets/20220226/roc.png)  | ![PR Curve]({{ site.url }}/assets/20220226/pr.png)
|  `plot_roc(cm,sk_fpr,sk_tpr,sk_auc)`             | `plot_pr(cm,sk_rec,sk_pre,sk_ap)`
|===
{:.deaktatortable}

## Conclusion

Since the "classifier" represented by the Beta distribution is well calibrated,
the curves computed by scikit-learn, which use the predictions and ground
truth, are aligned with the estimates computed by the method in this post that
do not require the ground truth.  Consequently, the area under the curves is
also nicely aligned.  We can plot these curves or compute the areas under the
curves based only on histograms of probabilities.  For large scale analysis,
score histograms can be computed in parallel and reduced to avoid an explosion
of memory and the results are similar in quality to the method provided in
[Metrics for Calibrated Classifiers]({% post_url 2019-05-20-metrics-for-calibrated-classifiers %})
with much lower memory overhead.  While the example in this post only used the
Beta distribution, the reader is encouraged to try other distributions and
other parameter settings like `digits_precision` in
`cm_stats_by_threshold_binned` to see how the method degrades.

**NOTE**: The integration code is very simple.  For strategies to better
account for interpolation issues, see
[The relationship between Precision-Recall and ROC curves](https://dl.acm.org/doi/10.1145/1143844.1143874)
from ICML, 2006.

## Code

<script src="https://gist.github.com/deaktator/47bf3835fa0652f429fe7bf4f3cec606.js"></script>

<script src="https://gist.github.com/deaktator/b664632482e4d37934ed21cc3e921078.js"></script>
