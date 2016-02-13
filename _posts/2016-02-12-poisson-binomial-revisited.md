---
layout: post
title:  "Poisson Binomial Revisited"
date:   2016-02-12 17:05:00
categories: stats probability distribution PMF CDF scala
---


Since I wrote on the [Poisson Binomial Distribution]({% post_url 2015-08-09-poisson-binomial-distribution %}),
I was bothered by a couple of things.  The first and main problem that I had was with stack overflows and excessive
$$ O\left( { n }^{ 2 } \right) $$ memory allocation in 
[method 2]({% post_url 2015-08-09-poisson-binomial-distribution %}#method-2).  As a reminder
[method 2]({% post_url 2015-08-09-poisson-binomial-distribution %}#method-2) found in 
[\(Chen and Liu, 1997\)](http://www3.stat.sinica.edu.tw/statistica/oldpdf/A7n44.pdf) looks like:

$$
R\left( k,C \right) =R\left( k, C \backslash \{ k \}  \right) +{ w }_{ k }R\left( k-1, C \backslash \{ k \} \right) 
$$

This may or may not look like gibberish to those who haven't read the paper but I find *Table 1* from the paper to
be quite informative.

![table 1]({{ site.url }}/assets/20160212/table1.png)

This diagram also drove me crazy until I had the epiphany that allowed me to rewrite
[method 2]({% post_url 2015-08-09-poisson-binomial-distribution %}#method-2) *non-recursively* using only 
$$ O\left( n \right) $$ rather than $$ O\left( { n }^{ 2 } \right) $$ auxiliary space.  The epiphany was this.  

## Epiphany

The diagram, when interpreted as a matrix, is a matrix in 
[row echelon form](https://en.wikipedia.org/wiki/Row_echelon_form).  These zeros on the left are worthless to the 
algorithm and if we remove them and appropriately shift the remaining values to the left, the diagonal arrows in the 
diagram become vertical, downward arrows.  This doesn't affect the left-to-right arrows but this gives us a diagram that 
looks like a triangle.  The fact that we have only downward and right arrows and a triangular shape helps a lot.  It 
indicates that we can iterate over the rows then columns and use just a one-dimensional array, $$ r $$,  of size 
$$ n + 1 $$ to aggregate the computation because we only need values from the previous iteration of the outer loop and 
the previous value of the current inner loop to update the current value in the inner loop.  This means that we can use
[bottom-up](https://en.wikipedia.org/wiki/Top-down_and_bottom-up_design)
[dynamic programming](https://en.wikipedia.org/wiki/Dynamic_programming) to generate the 
[PMF](https://en.wikipedia.org/wiki/Probability_mass_function) for the Poisson binomial distribution.
At the end of each iteration of the inner loop, we add another value toward the end of the array that represents 
the probability of a certain number of successes, where the probability of zero successes is the last value in the 
array, the probability of one success is the second to last value, and so on.  The only gotcha is that we need to 
normalize each value by multiplying by the normalizing constant from *equation 5* in the paper:

$$
\prod _{ i\in S }{ { \left( 1+{ w }_{ i } \right)  }^{ -1 } } 
$$

Finally, we just have to reverse the array, $$ r $$. 

## Benefits

There are multiple benefits to writing the algorithm this way:

1. Stack overflows don't occur.
1. Memory consumption is greatly reduced from $$ O\left( { n }^{ 2 } \right) $$ to $$ O\left( n \right) $$.
1. The actual speed of the algorithm is faster (*wall clock, not asymptotic runtime*).

## Code

{% highlight scala linenos %}
// Scala Code

def pmf(pr: Seq[Double]): Array[Double] = pmf(pr, pr.size, 2)

def pmf(pr: Seq[Double], maxN: Int, maxCumPr: Double): Array[Double] = {
  require(0 <= maxN && maxN <= pr.length + 1);

  val n = pr.size
  val w = pr.map(p => p / (1 - p)).toIndexedSeq
  val z = pr.foldLeft(1d)((s, p) => s * (1 - p))
  val r = Array.fill(n + 1)(1d)
  
  r(n) = z
  
  var i = 1
  var j = 0
  var k = 0
  var m = 0
  var mN = math.min(maxN, n)
  var s = 0d
  var cumPr = r(n)
  
  while(cumPr < maxCumPr && i <= mN) {
    m = n - i
    k = i - 1
    s = 0
    j = 0
    
    while (j <= m) {
      s += r(j) * w(k + j)
      r(j) = s
      j += 1
    }
    
    r(j - 1) *= z
    cumPr += r(j - 1)
    
    i += 1
  }
  
  finalizeR(r, i, n)
}

def finalizeR(r: Array[Double], i: Int, n: Int) = {
  val j = r.lastIndexWhere(x => java.lang.Double.isNaN(x) || 
                                java.lang.Double.isInfinite(x))
  if (j != -1) 
    throw new NumberFormatException(s"Numerical overflow detected: r[$j] = ${r(j)}")

  if (i <= n) {
    val smallerR = new Array[Double](i)
    System.arraycopy(r, n - i + 1, smallerR, 0, i)
    reverse(smallerR)
  }
  else reverse(r)
}

def reverse(a: Array[Double]): Array[Double] = {
  val n = a.length / 2
  var i = 0
  var t = 0d
  var j = 0
  while (i <= n) {
    j = a.length - i - 1
    t = a(i)
    a(i) = a(j)
    a(j) = t
    i += 1
  }
  a
}

{% endhighlight %}

## Remarks

This code doesn't read like typical [Scala](http://scala-lang.org) code because it uses *mutable arrays* and *while
loops* rather than functional constructs like [folds](https://en.wikipedia.org/wiki/Fold_%28higher-order_function%29).
The purpose was speed and correctness over conciseness and elegance.  This choice stems from the `pmf` algorithm's
runtime and space requirements: $$ O\left( { n }^{ 2 } \right) $$ and $$ O\left( n \right) $$, respectively.

Another comment.  The runtime for computing the full [PMF](https://en.wikipedia.org/wiki/Probability_mass_function) is
indeed $$ O\left( { n }^{ 2 } \right) $$, but if we just want to know the probabilities for the first $$ k $$ successes,
the runtime is more like $$ O\left( k n \right) $$.  This is nice since the code was written to short circuit if the
caller only requests the first $$ k $$ probabilities.  The code can also short circuit for using it as an 
[inverse distribution function](https://en.wikipedia.org/wiki/Cumulative_distribution_function#Inverse_distribution_function_.28quantile_function.29)
by specifying `maxCumPr`.  The `length - 1` of the resulting array is the *IDF* value. 

## Tests

On my 2010 MacBook Pro, I can run `val p = pmf(Seq.fill(1000)(0.5))` in 0.01877 seconds and it's accurate according 
to Wolfram Alpha.  `p(500)` is *0.025225018178360804* and Wolfram Alpha says it's
[0.025225](http://www.wolframalpha.com/input/?i=PDF(BinomialDistribution(1000,+0.5),+500)).

## License 

The above code is released under the [MIT License](http://opensource.org/licenses/MIT), Copyright (c) 2016 Ryan Deak.

## References

1. Chen, Sean X., and Jun S. Liu. 
   "[Statistical applications of the Poisson-binomial and conditional Bernoulli distributions](http://www3.stat.sinica.edu.tw/statistica/oldpdf/A7n44.pdf)." 
   Statistica Sinica 7.4 (1997): 875-892.

<script type="text/javascript" src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"></script>
