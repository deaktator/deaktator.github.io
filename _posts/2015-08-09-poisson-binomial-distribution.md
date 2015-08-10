---
layout: post
title:  "Poisson Binomial Distribution"
date:   2015-08-09 21:11:00
categories: stats probability distribution PMF CDF scala
---

The other day I found myself daydreaming about the 
[Poisson binomial distribution](https://en.wikipedia.org/wiki/Poisson_binomial_distribution).  As 
[data scientists](https://twitter.com/josh_wills/status/198093512149958656), you should be especially interested in
this distribution as it gives the distribution of successes in *N* 
[Bernoulli trials](https://en.wikipedia.org/wiki/Bernoulli_trial) where each trial has a (*potentially*) different 
probability of success.  

That is, the Poisson binomial random variable, *N*, is the sum of *n* independent and non-identically distributed 
random indicators:
 
 $$ 
 \left( N=\sum _{ i }^{ n }{ { \mathbb{1} }_{ i } } \right) 
 $$
 
 where 
 
 $$
 { \mathbb{1} }_{ i } ∼ \text{Bernoulli}({ p }_{ i }) 
 $$

The [probability mass function](https://en.wikipedia.org/wiki/Probability_mass_function) is:

$$
\sum _{ A\in { F }_{ k } }{ \prod _{ i\in A }{ { p }_{ i }\prod _{ j\in { A }^{ c } }{ \left( 1-{ p }_{ j } \right)  }  }  } 
$$

## Uses

There are a number of different instances when this distribution comes in handy.  For instance, imagine a naïve 
advertising engine that displays ads based on maximizing 
[click-through rate](https://en.wikipedia.org/wiki/Click-through_rate).  An implementation of such an engine might 
work by estimating, for a given viewer, the probabilities of each ad in the inventory and selecting the 
[argmax](https://en.wikipedia.org/wiki/Arg_max) ad.  Let's say that once the engine has shown a bunch of ads to a 
bunch of people, we want to estimate the distribution of the total number of click-throughs.  This is a 
straightforward application of the Poisson binomial distribution.  We just create a vector of the estimated 
conditional click-through probabilities associated with each displayed ad and pass the vector as the parameter 
to Poisson binomial distribution.  

Another use might be in modeling the converstation dynamics of online dating.  Imagine a user on a dating site 
receives *N* dating suggestions, and we want to model the distribution of the number of ensuing conversations.  This 
is exactly the [PMF](https://en.wikipedia.org/wiki/Probability_mass_function) of the Poisson binomial distribution.

## An Example of the Naïve Exact Method 

Let's look at the exact computation on three events *A*, *B*, and *C*, with corresponding probabilities 
$$ { p }_{ a } $$, $$ { p }_{ b } $$, and $$ { p }_{ c } $$.

We can define the Poisson binomial as $$ PoissonBinomial\left( \left\{ { p }_{ a },{ p }_{ b },{ p }_{ c } \right\} \right) $$ and 
write down equations for the four possible values of the [PMF](https://en.wikipedia.org/wiki/Probability_mass_function), 
$$ f\left(x\right) $$, for $$ x\in \left\{ 1,2,3,4 \right\} $$:


$$
\begin{aligned}
f\left( 0 \right) &= Pr\left[ \text{ 0 true events } \right] \\
& = Pr\left( \overline { A } \cap \overline { B } \cap \overline { C }  \right) \\
& = \left( 1-{ p }_{ a } \right) \left( 1-{ p }_{ b } \right) \left( 1-{ p }_{ c } \right) \\
\\
f\left( 1 \right) &= Pr\left[ \text{ 1 true event } \right] \\
& = Pr\left( \left( A\cap \overline { B } \cap \overline { C }  \right) \cup \left( \overline { A } \cap B\cap \overline { C }  \right) \cup \left( \overline { A } \cap \overline { B } \cap C \right)  \right) \\ 
& = { p }_{ a }\left( 1-{ p }_{ b } \right) \left( 1-{ p }_{ c } \right) +\left( 1-{ p }_{ a } \right) { p }_{ b }\left( 1-{ p }_{ c } \right) +\left( 1-{ p }_{ a } \right) \left( 1-{ p }_{ b } \right) { p }_{ c } \\
\\
f\left( 2 \right) &= Pr\left[ \text{ 2 true events } \right] \\
&= Pr\left( \left( \overline { A } \cap B\cap C \right) \cup \left( A\cap \overline { B } \cap C \right) \cup \left( A\cap B\cap \overline { C }  \right)  \right) \\
&= \left( 1-{ p }_{ a } \right) { p }_{ b }{ p }_{ c }+{ p }_{ a }\left( 1-{ p }_{ b } \right) { p }_{ c }+{ p }_{ a }{ p }_{ b }\left( 1-{ p }_{ c } \right) \\
\\
f\left( 3 \right) &= Pr\left[ \text{ 3 true events } \right] \\
&= Pr\left( A\cap B\cap C \right) \\
&= { p }_{ a }{ p }_{ b }{ p }_{ c }
\end{aligned}
$$

It should be readily apparent that the number of additive terms in the formula for $$ f\left(x\right) $$ is $$ \left( \begin{matrix} n \\ x \end{matrix} \right) $$.
For more information, look at the [binomial theorem](https://en.wikipedia.org/wiki/Binomial_theorem).  The number of 
multiplicative terms per additive terms is *n*, and the number of subtractions per additive term is $$ n - x $$.  So, 
the total number of operations is:
 
$$ 
\begin{aligned}
\text{ops}(n, x) &= \underbrace { \left( \begin{matrix} n \\ x \end{matrix} \right)  }_{ terms } \left( \underbrace { \left( n-x \right)  }_{ subtractions } +\underbrace { \left( n-1 \right)  }_{ multiplications }  \right) +\underbrace { \left( \left( \begin{matrix} n \\ x \end{matrix} \right) -1 \right)  }_{ additions } \\
& = \left( 2n-x \right) \left( \begin{matrix} n \\ x \end{matrix} \right) - 1 \\
\end{aligned}
$$ 

To verify this, we can write some quick [Scala](http://scala-lang.org) code: 

{% highlight scala linenos %}
// Scala Code
import scala.language.postfixOps
implicit class Factorial(val n: Long) extends AnyVal { 
  def ! = { 
    def h(i: Long, x: Long): Long = 
      if (i < 2) x else h(i - 1, x * i)
    h(n, 1)
  }
  def choose(k: Long) = (n!) / (((n - k)!) * (k!))
}
{% endhighlight %}

And look at the Scala [REPL](https://en.wikipedia.org/wiki/Read–eval–print_loop) session:

{% highlight scala linenos %}
scala> val n = 3
n: Int = 3

scala> 0 to 3 map(k => n choose k) toList
res0: List[Long] = List(1, 3, 3, 1)

scala> 0 to 3 map(k => n - k) toList
res1: List[Int] = List(3, 2, 1, 0)

scala> 0 to 3 map { k => (2*n - k)*(n choose k) - 1 } toList
res2: List[Long] = List(5, 14, 11, 2)
{% endhighlight %}

*Confirmed!*  But so what?  We did {5, 14, 11, 2} arithmetic operations.  My processor can do that in nanoseconds.  
But what if we try to calculate the distribution of clicks in 100 ad views.  How many arithmetic operations would 
that take?

That would take **190,147,590,034,234,410,224,505,480,806,299** (*1.90 &times; 10<sup>32</sup>*) arithmetic operations!
[See here](http://www.wolframalpha.com/input/?i=Sum%28%282*100-i%29*Binomial%28100%2Ci%29+-+1%2Ci%2C0%2C100%29) for 
proof.  Let's say that we had a laptop that could do a [petaflop](https://en.wikipedia.org/wiki/FLOPS) (*That's faster
than any laptop today*).  *On that laptop*, it would take
[6 billion years](http://www.wolframalpha.com/input/?i=190147590034234410224505480806299%2F%28365.2425*86400*10%5E15%29) to
compute. *There's got to be a better way!*  Otherwise, this distribution would be strictly academic.
 
## A Better Way!

As you may have noticed from above, there is some repeated work that can be 
[memoized](https://en.wikipedia.org/wiki/Memoization).  Additionally, factoring can help a lot.  If we transform the 
probabilities to probability ratios, we can omit multiplications for the probabilities of negative events.  Then we 
just have to normalize, and we can compute the normalizing constant onc e for the entire 
[PMF](https://en.wikipedia.org/wiki/Probability_mass_function).
[Arthur Dempster](https://en.wikipedia.org/wiki/Arthur_P._Dempster), of 
[EM](https://en.wikipedia.org/wiki/Expectation–maximization_algorithm) fame, divised an algorithm in 
[*Weighted finite population sampling to maximize entropy*](http://www.people.fas.harvard.edu/~junliu/TechRept/94folder/cdl94.pdf)
(1994) to efficiently compute the Poisson binomial distribution.  Here's my implementation.

### Code 

#### Method 1 

{% highlight scala linenos %}
// Scala Code

/** 
 * Based on Dempster's algorithm (Method 1), recapitulated in: 
 *
 * Chen, Sean X.; Liu, Jun S. 
 * Statistical applications of the Poisson-binomial and conditional 
 * Bernoulli distributions. 
 * Statist. Sinica 7 (1997), no. 4, 875–892.
 *
 * @author R.M.Deak
 */
object PoissonBinomial {
  def prob(pr: Seq[Double], k: Int): Double = {
    val rM = new Array[Double](k + 1)
    rM(0) = 1d
    prob(pr, k, rM, new Array[Double](k+1))
  }

  def pmf(pr: Seq[Double]): IndexedSeq[Double] = {
    val n = pr.size
    val rM = new Array[Double](n + 1)
    rM(0) = 1d
    val tM = new Array[Double](n + 1)
    val _w = w(pr)
    val z = _w.foldLeft(1d)((p, w) => p / (1d + w))
    0 to n map(k => prob(_w, k, rM, tM, z))
  }

  def cdf(pr: Seq[Double]): IndexedSeq[Double] = 
    pmf(pr).scanLeft(0d)(_+_).tail

  def prob(pr: Seq[Double], 
           k: Int, 
           rM: Array[Double], 
           tM: Array[Double]): Double = {
    val _w = w(pr)
    val z = _w.foldLeft(1d)((p, w) => p / (1d + w))
    prob(_w, k, rM, tM, z)
  }

  def prob(w: IndexedSeq[Double], 
           k: Int, 
           rM: Array[Double], 
           tM: Array[Double], 
           z: Double): Double = 
    z * r(w, k, rM, tM)

  def w(pr: Seq[Double]): IndexedSeq[Double] = 
    pr.map(p => p / (1d - p)).toIndexedSeq
  
  def t(w: IndexedSeq[Double], i: Int): Double = 
    w.foldLeft(0d)((s, v) => s + math.pow(v, i))
  
  def r(w: IndexedSeq[Double], 
        k: Int, 
        rM: Array[Double], 
        tM: Array[Double]): Double = {
    if (0 != rM(k)) rM(k)
    else {
      val rValue = one / k * (1 to k).foldLeft(0d)((s, i) => {
        val neg = if (0 == i % 2) -1d else 1d
        val tVal = if (0 != tM(i)) tM(i) 
                   else { val tmp = t(w, i); tM(i) = tmp; tmp }
        val rVal = r(w, k - i, rM, tM)
        s + neg * tVal * rVal
      })
        
      rM(k) = rValue
      rValue
    }
  }
}
{% endhighlight %}

#### Method 2

> *Use this one:*

I wrote a java variant of the "*Method 1*" algorithm a few years ago but only used it on a small number of events.
When testing the code for this article, I noticed a few things, namely the output of the algorithm, on a large number 
of events, violates [the first two probability axioms](https://en.wikipedia.org/wiki/Probability_axioms), *and not
by just a little!*  The numerical instability of this algorithm has been written about (cf. &sect;2.5 Hong, 2011).
The reasons for this are two-fold. The first is that the algorithm employs an 
[alternating series](https://en.wikipedia.org/wiki/Alternating_series) and the second is that the algorithm raises 
the probability ratios to a large exponent, $$ { \left( { p }/{ \left( 1-p \right)  } \right)  }^{ n } $$.  This 
can potentially cause the result to be very large, or very close to zero, depending on whether the numerator or 
denominator dominates.  Each of these issues lead to numerical instability.
 
Noticing this, I implemented the Method 2 in (Chen, et al. 1997).  This is much more stable but has to do some 
additional arithmetic operations and uses $$ O\left( { n }^{ 2 } \right) $$ auxiliary space for memoization rather 
than the $$ O\left( n \right) $$ used in [Method 1](#method-1).  But if we desire an exact method, correctness should
trump both speed and memory usage.  So here's the code for the Method 2. 

{% highlight scala linenos %}

/** 
 * Based on Method 2, recapitulated in: 
 *
 * Chen, Sean X.; Liu, Jun S. 
 * Statistical applications of the Poisson-binomial and conditional 
 * Bernoulli distributions. 
 * Statist. Sinica 7 (1997), no. 4, 875–892.
 *
 * @author R.M.Deak
 */
object PoissonBinomialMethod2BigDecimal {
  val negOne = BigDecimal(-1)
  val zero = BigDecimal(0)
  val one = BigDecimal(1)

  def pmf(pr: Seq[Double]) = {
    val _w = w(pr)
    val z = _w.foldLeft(one)((p, w) => p / (one + w))
    val _m = m(pr.size, pr.size)
    pr.indices foreach { k => R(_w, _m, k, _m(k).length - 1) }
    z +: _m.map(z * _.last)
  }

  def cdf(pr: Seq[Double]) = pmf(pr).scanLeft(zero)(_+_).tail

  def prob(pr: Seq[Double], k: Int) = {
    val _w = w(pr)
    val z = _w.foldLeft(one)((p, w) => p / (one + w))
    val _m = m(pr.size, k)
    if (k == 0) z
    else z * R(_w, _m, k - 1, _m(k - 1).length - 1)
  }

  def m(n: Int, k: Int) = 0 until k map (i => Array.fill(n-i)(zero))

  def R(w: IndexedSeq[BigDecimal], 
        m: IndexedSeq[Array[BigDecimal]], 
        r: Int, 
        c: Int): BigDecimal =
    if (r == -1) one
    else if (c == -1) zero
    else if (m(r)(c) != zero) m(r)(c)
    else {
      m(r)(c) = R(w, m, r, c - 1) + w(c+r) * R(w, m, r - 1, c)
      m(r)(c)
    }
  
  def w(pr: Seq[Double]) = 
    pr.map(v => {val p = BigDecimal(v); p / (one - p)}).toIndexedSeq
}
{% endhighlight %}

### Results

For [Method 1](#method-1) Calculating *PoissonBinomial*(*50; [100 0.25 probabilities]*) takes 13ms on my 
[Mid-2010 MacBook Pro](http://www.everymac.com/systems/apple/macbook_pro/specs/macbook-pro-core-i7-2.66-aluminum-15-mid-2010-unibody-specs.html).  That's 
better.  We can work with that.  One of the problems is that this algorithm is 
[recursive](https://en.wikipedia.org/wiki/Recursion), but not [tail recursive](https://en.wikipedia.org/wiki/Tail_call)
so it has a potential [stack overflow](https://en.wikipedia.org/wiki/Stack_overflow) when calculating for a large 
number of events.

Calculating the entire PMF using [Method 2](#method-2) takes about 7ms on my 
[Mid-2010 MacBook Pro](http://www.everymac.com/systems/apple/macbook_pro/specs/macbook-pro-core-i7-2.66-aluminum-15-mid-2010-unibody-specs.html).
Since Method 2 is also not tail recursive, it also has the potential to stack overflow.

### Other Algorithms

There are plenty of other algorithms out there that calculate the exact Poisson binomial distribution.  For more 
information, see papers sited in the [references section](#references). 

## Approximations

When *n* is rather large, there are a number of ways to approximate the distributions including:

* The [Poisson approximation](https://en.wikipedia.org/wiki/Poisson_distribution) method 
  $$ \left( \frac { { \mu  }^{ k }{ e }^{ -\mu  } }{ k! }  \right) $$.  This only works when *&mu;*
  (or *&lambda;* in the [wikipedia article](https://en.wikipedia.org/wiki/Poisson_distribution)) is small.
* The [normal approximation](https://en.wikipedia.org/wiki/Normal_distribution) with 
  [continuity correction](https://en.wikipedia.org/wiki/Continuity_correction) 
  $$ \left( CDF=\Phi \left( \frac { k + 0.5 - \mu  }{ \sigma } \right) \right) $$, where $$ \Phi $$ is the 
  [CDF](https://en.wikipedia.org/wiki/Cumulative_distribution_function) of the 
  [standard normal distribution](https://en.wikipedia.org/wiki/Normal_distribution#Cumulative_distribution_function)
  and the first two [moments](https://en.wikipedia.org/wiki/Moment_\(mathematics\)) are:
  * $$ \mu =\sum _{ i }^{ n }{ { p }_{ i } } $$ &nbsp;
  * $$ \sigma ={ \left( \sum _{ i=1 }^{ n }{ { p }_{ i }\left( 1-{ p }_{ i } \right)  }  \right)  }^{ \frac { 1 }{ 2 }  } $$ &nbsp;
* A refined normal approximation from [A. Yu. Volkova (1996)](http://epubs.siam.org/doi/abs/10.1137/1140093).

### Refined Normal Approximation

As with the normal approximation, listed above, the first three 
[moments](https://en.wikipedia.org/wiki/Moment_\(mathematics\)) are: 

* $$ \mu =\sum _{ i }^{ n }{ { p }_{ i } } $$ &nbsp;
* $$ \sigma ={ \left( \sum _{ i=1 }^{ n }{ { p }_{ i }\left( 1-{ p }_{ i } \right)  }  \right)  }^{ \frac { 1 }{ 2 }  } $$ &nbsp;
* $$ \gamma ={ \sigma  }^{ -3 }\sum _{ i=1 }^{ n }{ { p }_{ i }\left( 1-{ p }_{ i } \right) \left( 1-2{ p }_{ i } \right) } $$ &nbsp;

and the [PDF](https://en.wikipedia.org/wiki/Probability_density_function) and 
[CDF](https://en.wikipedia.org/wiki/Cumulative_distribution_function) of the 
[standard normal distribution](https://en.wikipedia.org/wiki/Normal_distribution) are $$ \phi $$ and $$ \Phi $$, respectively.

Given these definitions, we compute the refined normal approximation as 

$$
G\left( \frac { k + 0.5 - \mu }{ \sigma }  \right)
$$

where $$G\left( x \right)$$ is defined as

$$
G\left( x \right) =\frac { \Phi \left( x \right) +\gamma \left( 1-{ x }^{ 2 } \right) \phi \left( x \right)  }{ 6 } 
$$

I was thinking, if we're going to make this fast, let's add a normal approximation for the 
[CDF](https://en.wikipedia.org/wiki/Cumulative_distribution_function) (*Not that there's 
really a choice since* [erf](https://en.wikipedia.org/wiki/Error_function) *does not have an 
[analytical solution](https://en.wikipedia.org/wiki/Closed-form_expression)*).  So I looked around and found 
[*High Accurate Simple Approximation of Normal Distribution Integral*](http://downloads.hindawi.com/journals/mpe/2012/124029.pdf) (2012)
with an approximation of the [error function](https://en.wikipedia.org/wiki/Error_function) as:

$$
\text{erf}\left( x \right) \approx \tanh { \left( \frac { 77x }{ 75 } +\left( \frac { 116 }{ 25 } \right) \tanh { \left( \frac { 147x }{ 73 } -\left( \frac { 76 }{ 6 } \right) \tanh { \left( \frac { 51x }{ 278 } \right) } \right) } \right) } 
$$

The [CDF](https://en.wikipedia.org/wiki/Cumulative_distribution_function) of the 
[standard normal distribution](https://en.wikipedia.org/wiki/Normal_distribution) is:

$$
\Phi\left( x \right) =\frac { 1 }{ 2 } \left( 1+\text{erf}\left( \frac { x-\mu  }{ \sqrt { 2 } \sigma } \right) \right)  
$$

Since the [PDF](https://en.wikipedia.org/wiki/Probability_density_function) of the 
[standard normal distribution](https://en.wikipedia.org/wiki/Normal_distribution) has an 
[analytical solution](https://en.wikipedia.org/wiki/Closed-form_expression), we can easily compute it:

$$
\phi \left( x \right) =\frac { 1 }{ \sigma \sqrt { 2\pi  }  } \text{exp}\left( -\frac { { \left( x-\mu  \right)  }^{ 2 } }{ 2{ \sigma  }^{ 2 } }  \right) 
$$


### RNA Code

So we are now equipped with all the tools necessary to create an implementation (which is probably still a little 
buggy).

{% highlight scala linenos %}
// Scala Code
object PoissonBinomialApprox {
  import scala.math._
  private[this] val sqrt2 = sqrt(2)
  private[this] val sqrt2pi = sqrt(2*Pi)

  def prob(p: Seq[Double], k: Int): Double = {
    val m = mu(p)
    val s = sigma(p)
    val ga = gamma(p, s)
    g(m, s, ga, k)
  }

  def pmf(p: Seq[Double]): IndexedSeq[Double] = {
    val m = mu(p)
    val s = sigma(p)
    val ga = gamma(p, s)
    0 to p.size map (k => rna(m, s, ga, k))
  }

  def cdf(p: Seq[Double]): IndexedSeq[Double] = 
    pmf(p).scanLeft(0d)(_+_).tail

  def mu(p: Seq[Double]) = p.sum
  def sigma(p: Seq[Double]) = 
    sqrt(p.foldLeft(0d)((s, x) => s + x*(1-x)))
  def gamma(p: Seq[Double], s: Double) = 
    pow(s, -3) * p.foldLeft(0d)((s, x) => s + x * (1-x)*(1-2*x))
  def erf(x: Double) = 
    tanh(77*x/75 + 116/25*tanh(147*x/73 - 76d/7 * tanh(51*x/278)))
  def normalCdf(x: Double, m: Double, s: Double) = 
    0.5 * (1 + erf((x - m)/(sqrt2*s)))
  def normalPdf(x: Double, m: Double, s: Double) = 
    1d/(s*sqrt2pi)*exp(-pow(x - m,2)/(2*s*s))
  def g(x: Double, m: Double, s: Double, ga: Double) = 
    (normalCdf(x, m, s) + ga * (1-x*x) * normalPdf(x, m, s)) / 6d
  def rna(m: Double, s: Double, ga: Double, k: Int) =
    g((k + 0.5 - m) / s, m, s, ga)
}
{% endhighlight %}

## Remarks

The Poisson binomial distribution has a lot of applications.  I've given a couple of implementations to calculate the 
distribution exactly (up to numerical precision errors).  Make sure to use [Method 2](#method-2) if you use the 
([*MIT Licensed*](http://opensource.org/licenses/MIT)) code.  I also gave the equations and some untested code for the
[refined normal approximation](#refined-normal-approximation).  If you find any errors, let me know and I'll work on it.
 
## License 

The above code is released under the [MIT License](http://opensource.org/licenses/MIT), Copyright (c) 2015 Ryan Deak.

## References

1. Chen, Sean X., and Jun S. Liu. 
   "[Statistical applications of the Poisson-binomial and conditional Bernoulli distributions](http://www3.stat.sinica.edu.tw/statistica/oldpdf/A7n44.pdf)." 
   Statistica Sinica 7.4 (1997): 875-892.
1. Hong, Yili. 
   "[On computing the distribution function for the Poisson binomial distribution](http://www.researchgate.net/profile/Yili_Hong/publication/257017356_On_computing_the_distribution_function_for_the_Poisson_binomial_distribution/links/0c96053614a4cf38bb000000.pdf)." 
   Computational Statistics & Data Analysis 59 (2013): 41-51.
1. Vazquez-Leal, Hector, et al. 
   "[High accurate simple approximation of normal distribution integral](http://downloads.hindawi.com/journals/mpe/2012/124029.pdf)." 
   Mathematical problems in engineering 2012 (2012).

<script type="text/javascript" src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"></script>
