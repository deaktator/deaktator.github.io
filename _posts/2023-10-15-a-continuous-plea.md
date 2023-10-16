---
layout: post
title:  "A Continuous Plea"
date:   2023-10-15 15:15:00
categories: machine learning
---

There’s this amazing paper,
*[The continuous Bernoulli: fixing a pervasive error in variational autoencoders](https://proceedings.neurips.cc/paper/2019/file/f82798ec8909d23e55679ee26bb26437-Paper.pdf)*
by Loaiza-Ganem and Cunningham, published in NeurIPS 2019.  I’ve read it a handful
of times, and the most striking aspect every time is not the experiments section,
bias plot (Figure 6), near-zero KL divergence, or ELBO analysis.  It’s not even
the problem description or solution, the propositions, or math.  For me, it’s
the plea in the introduction.  I don’t think I’ve ever
read a paper where the authors’ plea for the reader’s attention and concern is
so vehement.  Whenever I read this paper, I assume that the authors, at some point
prior to writing the paper, presented this idea and heard the same question they
rhetorically ask the reader: *who cares*?

The point of the paper is "***to study the impact of this widespread modeling error***".
The authors write in the introduction:

> "Before these details, let us ask the central question: who cares?"

I don't often read, "who cares?" in papers, so this statement piqued my interest.
Usually, efficacy speaks for itself.  If something works better, and it's not
that difficult to do, you just do it.  This "who cares" is not a prelude to a
list of applications or something, but almost an additional justification for use
of the method, which in the paper is shown to work better empirically.  It seemed,
to me, as if the whole point had previously fallen on apathetic ears.  To
answer their own question, the authors write four paragraphs in the introduction.

Here are some excerpts.  I replaced some of the precise, problem-specific detail
and replaced it with the text in the square brackets to generalize the point a
bit; otherwise, the text is directly from the paper.

## 1st &#182;: *Don't ignore the right thing*

> "First, theoretically, ignoring \[**relevant detail** ~~normalizing constants~~\]
is unthinkable throughout most \[**scientific domains** ~~of probabilistic
machine learning~~\]."

## 2nd &#182;: *Don't make excuses, trivialize, or divert*

> "Second, one might suppose this error can be interpreted or fixed"

> "one might be tempted to call \[**it** ~~the Bernoulli VAE~~\] a toy model or
a minor point. Let us avoid that trap."

## 3rd &#182;: *It works better in practice, too*

> "Third, and most importantly, empiricism"

> "we show the \["**incorrect solution**" ~~Bernoulli VAE~~\] significantly
underperforms the \["**correct solution**" ~~continuous Bernoulli VAE~~\]
across a range of evaluation metrics, models, and datasets."

## 4th &#182;: *Care about types, units, etc.*

> "All together this work suggests that careful treatment of data type[s] … can
produce optimal results when modeling some of the most core \[**problems** ~~datasets in machine learning~~\].""

I'm a fan of this paper because of the technical points, sure, but also because of the
wisdom in the introduction that I think some readers may gloss over.  The whole
point of this post is to try to point out that wisdom explicitly, because the
method and analysis, in my opinion, speaks for itself.  But I think the authors
felt compelled to add these points.  I can only imagine why, but my guess is
that they may have heard, "*who cares*?", as in, "*who cares about normalizing constants
these days, anyway*"?

I think the last quote from the fourth paragraph is my favorite part of the paper
because its message extends beyond machine learning to science, in general, and to
programming.  I think this is why our science teachers drilled the
idea of [unit conversion](https://en.wikipedia.org/wiki/Conversion_of_units#Factor-label_method)
into our heads, from an early age.  I think it's also why I've always preferred to program
with [type safety](https://en.wikipedia.org/wiki/Type_safety) in mind and prefer
[static](https://en.wikipedia.org/wiki/Type_system#Static_type_checking) to
[dynamic](https://en.wikipedia.org/wiki/Type_system#Dynamic_type_checking_and_runtime_type_information) typing.

&nbsp;

<hr />

## Original Paper Text

> "Here we introduce and fully characterize the continuous Bernoulli distribution (§3), both as a means to study the impact of this widespread modeling error, and to provide a proper VAE for [0, 1]-valued data. Before these details, let us ask the central question: who cares?
>
> First, theoretically, ignoring normalizing constants is unthinkable throughout most of probabilistic machine learning: these objects serve a central role in restricted Boltzmann machines [36, 13], graphical models [23, 33, 31, 38], maximum entropy modeling [16, 29, 26], the “Occam’s razor” nature of Bayesian models [27], and much more.
>
> Second, one might suppose this error can be interpreted or fixed via data augmentation, binarizing data (which is also a common practice), stipulating a different lower bound, or as a nonprobabilistic model with a “negative binary cross-entropy” objective. §4 explores these possibilities and finds them wanting. Also, one might be tempted to call the Bernoulli VAE a toy model or a minor point. Let us avoid that trap: MNIST is likely the single most widely used dataset in machine learning, and VAE is quickly becoming one of our most popular probabilistic models.
>
> Third, and most importantly, empiricism; §5 shows three key results: (i) as a result of this error, we show that the Bernoulli VAE significantly underperforms the continuous Bernoulli VAE across a range of evaluation metrics, models, and datasets; (ii) a further unexpected finding is that this performance loss is significant even when the data is close to binary, a result that becomes clear by consideration of continuous Bernoulli limits; and (iii) we further compare the continuous Bernoulli to beta likelihood and Gaussian likelihood VAE, again finding the continuous Bernoulli performant.
>
> All together this work suggests that careful treatment of data type – neither ignoring normalizing constants nor defaulting immediately to a Gaussian likelihood – can produce optimal results when modeling some of the most core datasets in machine learning."
