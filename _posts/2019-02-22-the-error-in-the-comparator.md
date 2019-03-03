---
layout: post
title:  "The Error in the Comparator"
date:   2019-02-22 17:52:25
categories: stats probability machine-learning python
---

### *Or, [scikit-learn](https://scikit-learn.org/stable/index.html)'s importance weighting is broken.*

*If the title doesn't immediately give you chills, it should.  Allow me to explain.*

It will help to devise an artificial motivating example to illustrate the point before diving into the particular
manifestation of this problem that gave me chills when I first discovered it.

Defining what is meant by *comparator* is important.  By
*[comparator](https://en.wikipedia.org/wiki/Comparator)*, I mean a
[total ordering](https://en.wikipedia.org/wiki/Total_order) on a set.  Different programming languages call this binary
relation by different names:  *Java* calls it a
[Comparator](https://docs.oracle.com/javase/8/docs/api/java/util/Comparator.html), *Scala* an 
[Ordering](https://www.scala-lang.org/files/archive/api/current/scala/math/Ordering.html), Haskell calls it
[Ord](http://hackage.haskell.org/package/base-4.12.0.0/docs/Data-Ord.html) and python admits a
*[key](https://docs.python.org/3.6/howto/sorting.html#key-functions)* function to establish order.  Hopefully, the
utility of such a comparison function is apparent.  It establishes order on the elements of a set of objects.  It
enables operations like *sorting*, *min* and *max*.

What happens if there's a bug in this comparison function?  Since its implementation is decoupled from the functions
utilizing it, the correctness of the comparison function is independent of the algorithms (like *sort*, *min*
and *max*) utilizing it.  Even though the *sort*, *min* or *max* algorithms may be correct, using a buggy comparison
function may give wildly undesirable and inaccurate results.  This should not be surprising, but it should be noted 
nonetheless.  Here's a motivating toy example.

Comparing [floating point](https://en.wikipedia.org/wiki/IEEE_754) representations of
[real](https://en.wikipedia.org/wiki/Real_number) values is [isomorphic](http://mathworld.wolfram.com/Isomorphic.html)
to comparing ordered pairs where the first element in the pair is the (signed) whole number component of the real value
and the second element is the [mantissa](http://mathworld.wolfram.com/Mantissa.html) of the real value.  Transforming
floating point values into ordered pairs like this, for comparison, will give the same ascending sort order as when
sorting directly on the original floating point values.

<!-- Python example of correct and buggy key functions. -->
<script src="https://gist.github.com/deaktator/6e622833691c0ebf66c7335c2915cc17.js"></script>

`buggy_key_fn` has a bug that rears its ugly head when the minimum in `loss_values` is sought.  If we look at the
impact of the bug in terms of [relative error](http://mathworld.wolfram.com/RelativeError.html), we see that it is
rather large: [9.999999998 × 10<sup>9</sup>](https://www.wolframalpha.com/input/?i=(1-10%5E-10+-+10%5E-10)%2F10%5E-10).
 
## Out of the sandbox and into the fire

With the basics out of the way, it's time to bring the real problem to center stage.  While attempting to use
importance weighting in a particular problem setting, I noticed that the metrics reported in
[scikit-learn](https://scikit-learn.org/stable/index.html)'s
[cross validation](https://en.wikipedia.org/wiki/Cross-validation_(statistics)) routine seemed odd.  So I
[beared down](https://en.wikipedia.org/wiki/Bear_Down) and dug into the issue and slowly started realizing that while
[importance weighting](https://en.wikipedia.org/wiki/Importance_sampling) has been available in the metric calculations
themselves since 2014 ([PR 3098](https://github.com/scikit-learn/scikit-learn/pull/3098) and
[PR 3401](https://github.com/scikit-learn/scikit-learn/pull/3401)), the `sample_weight` parameter in the metrics isn't
being populated from the cross validation routines (see 
[_validation.py](https://github.com/scikit-learn/scikit-learn/blob/0.20.2/sklearn/model_selection/_validation.py) and
[_search.py](https://github.com/scikit-learn/scikit-learn/blob/0.20.2/sklearn/model_selection/_search.py)).  Once I
discovered this, I confirmed that `sample_weight` is properly propagated during model training.  The takeaway is this:

> *During cross validation in scikit-learn, importance weighting is used in model training but not validation.*

To fully understand why this is an issue, it helps to understand why importance weighting is typically used.  Wikipedia
tells us:

> *"In statistics, importance sampling is a general technique for estimating properties of a particular distribution,
while only having samples generated from a different distribution than the distribution of interest."*
—[https://en.wikipedia.org/wiki/Importance_sampling](https://en.wikipedia.org/wiki/Importance_sampling)

It is typical that during the (training) data generation phase of a modeling process, the sample distribution is not
representative of the test distribution.  By test distribution, I mean the distribution on which the model will perform
predictions. This is what is meant by [sampling bias](https://en.wikipedia.org/wiki/Sampling_bias):

> *"In statistics, sampling bias is a bias in which a sample is collected in such a way that some members of the
intended population are less likely to be included than others. It results in a biased sample, a non-random sample
of a population (or non-human factors) in which all individuals, or instances, were not equally likely to have been
selected.  If this is not accounted for, results can be erroneously attributed to the phenomenon under study rather
than to the method of sampling."
—[https://en.wikipedia.org/wiki/Sampling_bias](https://en.wikipedia.org/wiki/Sampling_bias)*

We can start to see the problem take shape.  When trying to address statistical issues like sampling bias, we use
importance weighting to unwind these biases introduced in the sampling process.  This is predicated on the idea that
importance weighting is consistently applied during training *and validation*.  The fact that scikit-learn
incorporates importance weights in training but not validation during cross validation means that models learn a
distribution different than the one used to measure their efficacy.  This is a manifestation of  the same problem we
sought to solve through importance weighting in the first place.  *See the rub?*  What is most impactful is that this
problem appears inside the code that helps to sort (or rank) models in relation to their efficacy.
$$
\DeclareMathOperator*{\argmin}{\arg\!\min}
$$
## Cross Validation-based Parameter Optimization

Assume we have a training set $$ \mathcal{T} = {\{ \left( x_{i}, y_{i} \right) \}}_{i=1}^{n} $$ of size $$ n $$, 
split into $$ k $$ disjoint non-empty subsets, $$ {\{ \mathcal{T}_{i} \}}_{i=1}^{k} $$.  Given  parameters
$$ \theta \in \Theta $$, let $$ { \widehat { f }  }_{ \theta, { \mathcal{T}  }_{ j } } $$ be a function
learned on training data $$ {\{ \mathcal{T}_{i} \}}_{i \ne j} $$ to be validated on test fold,
$$ { \mathcal{T}  }_{ j } $$. Then, given a  [loss function](https://en.wikipedia.org/wiki/Loss_function),
$$ \ell $$, we can formally define $$ k $$-fold cross validation-based parameter optimization as: 

$$
\widehat{\theta} = \argmin_{\theta \in \Theta} \frac { 1 }{ k } \sum _{ j=1 }^{ k }{ \frac { 1 }{ \left| { \mathcal{T} }_{ j } \right| } \sum _{ \left( x, y \right) \in { \mathcal{T}  }_{ j } }{ \ell \left( x, y, { \widehat { f }  }_{ \theta, { \mathcal{T}  }_{ j } }\left( x \right)  \right)  }  } \label{eq1}\tag{1}
$$

This is very similar to the definition in **[\[1\]](#ref1)** with the addition, here, of the $$ \argmin $$ over the
parameters, $$ \theta $$.  The inner summation (and normalizing constant) describes the average loss *within
a test fold* and the outer summation describes averaging *over the test folds*.  Notice, that the average loss within
a test fold is on the same scale as the loss of a tuple, $$ \left( x, y \right) $$.

## Scikit-learn

Scikit-learn has
[many cross validation routines](https://scikit-learn.org/stable/modules/classes.html#splitter-functions) like
[GridSearchCV](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.GridSearchCV.html) and
[RandomizedSearchCV](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.RandomizedSearchCV.html)
that admit a [scoring](https://scikit-learn.org/stable/modules/model_evaluation.html#scoring-parameter) function.
The *["Implementing your own scoring object"](https://scikit-learn.org/stable/modules/model_evaluation.html#implementing-your-own-scoring-object)*
section of the scikit-learn documentation describes the structure of a scoring function as a function with arguments
`(estimator, X, y)` that returns a floating point number.  We can think of this as a function $$ s $$ that replaces

$$
{ \frac { 1 }{ \left| { \mathcal{T} }_{ j } \right| } \sum _{ \left( x, y \right) \in { \mathcal{T} }_{ j } }{ \ell \left( x, y, { \widehat { f }  }_{ \theta, { \mathcal{T}  }_{ j } }\left( x \right)  \right)  }  }  \label{eq2}\tag{2}
$$

in equation $$ \left( \ref{eq1} \right) $$.  $$ s $$ is in fact more general because .

## Other

In the machine learning literature, one would be hard-pressed to find a paper that does not contain something similar
to:

$$
\widehat{\theta} = arg \min_{\theta} \mathcal{l}(y, f_{\theta}(X))
$$

as $$ \widehat{\theta} $$ represents the parameters to the model $$ f_{\theta} $$, trained on $$ X $$ that minimizes
the [loss function](https://en.wikipedia.org/wiki/Loss_function), $$ \mathcal{l} $$.  This is where the trouble comes.
When attempting to optimize the loss, the loss function does not incorporate the importance weight

<!--
\left( x_{ i },{ y }_{ i } \right) \sim D\\ g\left( x \right) { =E }_{ D }\left\[ { y }|{ x } \right\]
-->


<!--
{ \widehat { R }  }_{ kCV }^{ \left( n \right)  }\quad \equiv \quad \frac { 1 }{ k } \sum _{ j=1 }^{ k }{ \frac { 1 }{ \left| { \tau  }_{ j } \right|  } \sum _{ \left( x,y \right) \in { \tau  }_{ j } }{ \ell \left( x,y,{ \widehat { f }  }_{ { \tau  }_{ j } }\left( x; \theta \right)  \right)  }  }

{ \widehat { R }  }_{ kIWCV }^{ \left( n \right)  }\quad \equiv \quad \frac { 1 }{ k } \sum _{ j=1 }^{ k }{ \frac { 1 }{ \left| { \tau  }_{ j } \right|  } \sum _{ \left( x,y \right) \in { \tau  }_{ j } }{ \frac { { p }_{ test }\left( x \right)  }{ { p }_{ train }\left( x; theta \right)  } \ell \left( x,y,{ \widehat { f }  }_{ { \tau  }_{ j } }\left( x \right)  \right)  }  }

p\left( x \right) =\frac { { p }_{ test }\left( x \right)  }{ { p }_{ train }\left( x \right)  }

{ c }_{ j }=\frac { \left| { \left\{ { \tau  }_{ i } \right\}  }_{ i\neq j } \right|  }{ \left| { \tau  }_{ j } \right|  }

{ p }_{ j }\left( x \right) =\frac { { p }_{ { test }_{ j } }\left( x \right)  }{ { p }_{ { train }_{ j } }\left( x \right)  }

{ p }_{ j }\left( x \right) =\frac { { p }_{ { test }_{ j } }\left( x \right)  }{ { p }_{ { train }_{ j } }\left( x \right)  } =\frac { { S }_{ j }\left( x \right)  }{ { 1-S }_{ j }\left( x \right)  }
-->


## License 

The above code is released under the [MIT License](http://opensource.org/licenses/MIT), Copyright (c) 2019 Ryan Deak.

## References

1. <a name="ref1"></a>Sugiyama, Masashi, Matthias Krauledat, and Klaus-Robert Muller.
   "[Covariate shift adaptation by importance weighted cross validation](http://www.jmlr.org/papers/volume8/sugiyama07a/sugiyama07a.pdf)."
   Journal of Machine Learning Research 8. May (2007): 985-1005.

<script type="text/javascript" src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"></script>
