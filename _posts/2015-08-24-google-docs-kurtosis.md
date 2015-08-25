---
layout: post
title:  "Is Google Docs&#8217; Kurtosis Wrong?"
date:   2015-08-24 13:32:00
categories: stats probability
---

[Kurtosis](https://en.wikipedia.org/wiki/Kurtosis#Sample_kurtosis) measures "*peakedness*" of a distribution of a 
real-valued random variable.  It is the 4<sup>th</sup> [central moment](https://en.wikipedia.org/wiki/Central_moment)
divided by 2<sup>nd</sup> [central moment](https://en.wikipedia.org/wiki/Central_moment) squared.  *3* is then 
typically subtracted to measure *excess kurtosis*.  Under this definition, the kurtosis of the normal distribution 
is zero.  

## Definition 

Kurtosis is defined as follows:

$$
\text{excess kurtosis} = \frac { { \mu  }_{ 4 } }{ \sigma ^{ 4 } } -3=\frac { E\left[ { \left( X-\mu  \right)  }^{ 4 } \right]  }{ { E\left[ { \left( X-\mu  \right)  }^{ 2 } \right]  }^{ 2 } } -3=\frac { \cfrac { 1 }{ N } \sum _{ i=1 }^{ N }{ { \left( { x }_{ n }-\mu  \right)  }^{ 4 } }  }{ { \left( \cfrac { 1 }{ N } \sum _{ i=1 }^{ N }{ { \left( { x }_{ n }-\mu  \right)  }^{ 2 } }  \right)  }^{ 2 } } -3
$$

where $$\mu$$ is defined as:

$$
\mu =\cfrac { 1 }{ N } \sum _{ i=1 }^{ N }{ { x }_{ n } } 
$$


## Code

We can write the code for this: 

{% highlight scala linenos %}
def mean[A](data: Seq[A])(implicit toDbl: A => Double) =
  data.iterator.map(toDbl).sum.toDouble / data.size
{% endhighlight %}

{% highlight scala linenos %}
def moment[A](mNum: Int, data: Seq[A], mu: Double)
             (implicit toDbl: A => Double) =
  data.foldLeft(0d)((s, x) => s + math.pow(toDbl(x) - mu, mNum)) / data.size
{% endhighlight %}

{% highlight scala linenos %}
def kurtosis[A](data: Seq[A])(implicit toDbl: A => Double) = {
  val mu = mean(data)
  val m2 = moment(2, data, mu)
  val m4 = moment(4, data, mu)
  m4 / (m2*m2)
}
{% endhighlight %}

{% highlight scala linenos %}
def excessKurtosis[A](data: Seq[A])(implicit toDbl: A => Double) =
  kurtosis(data) - 3
{% endhighlight %}


## Google Docs Kurtosis Values

If we look at the [kurtosis documentation](https://support.google.com/docs/answer/3093634?vid=1-635760429616454827-3518892514) 
for [Google Docs](https://www.google.com/docs/about/), we see the examples:

1. `KURT(1,2,3,4,5,6,7,8,9,10)` = -1.2
1. `KURT(3,5,6,8,10)` = -0.6811784575
1. `KURT(3,5,6,8)` = 0.3905325444


The first one seems fishy right off the bat when we look at the Wikipedia page for the 
[discrete uniform distribution](https://en.wikipedia.org/wiki/Uniform_distribution_\(discrete\)), which lists 
kurtosis as: 

$$ -\frac { 6\left( { n }^{ 2 }+1 \right)  }{ 5\left( { n }^{ 2 }-1 \right)  }  $$

which means the kurtosis of { 1, 2, &hellip;, 10 } is 

$$ -1.224242=-\frac { 202 }{ 165 } =-\frac { 6 }{ 5 } \frac { 101 }{ 99 } =-\frac { 6 }{ 5 } \frac { { 10 }^{ 2 }+1 }{ { 10 }^{ 2 }-1 }  $$ 

That differs from what Google Docs indicates, *-1.2*.  Let's check Wolfram Alpha. It says 
[-1.2242424242424242](http://www.wolframalpha.com/input/?i=Kurtosis%5B%7B1%2C2%2C3%2C4%2C5%2C6%2C7%2C8%2C9%2C10%7D%5D-3) also.
Let's check the other two examples.  Wolfram Alpha says 
[-1.170294614374179](http://www.wolframalpha.com/input/?i=Kurtosis%5B%7B3%2C5%2C6%2C8%2C10%7D%5D-3) and
[-1.1479289940828402](http://www.wolframalpha.com/input/?i=Kurtosis%5B%7B3%2C5%2C6%2C8%7D%5D-3), respectively.  What do I get?

1. -1.2242424242424244 (`excessKurtosis(1 to 10)`)
1. -1.170294614374179 (`excessKurtosis(Seq(3,5,6,8,10))`)
1. -1.1479289940828403 (`excessKurtosis(Seq(3,5,6,8))`)

*Hmmm*.  So I get the almost "*exactly*" what Wolfram Alpha gets, but nowhere near what Google Docs gets.  I have to 
say, I trust Wolfram Alpha on this one.  One, because it's [Wolfram](http://www.wolfram.com) and because Wolfram 
gives the same value as multiple definitions of kurtosis on Wikipedia.

*Is this a bug, or is something else going on?*


<script type="text/javascript" src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"></script>
