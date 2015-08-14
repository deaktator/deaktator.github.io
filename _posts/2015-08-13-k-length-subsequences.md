---
layout: post
title:  "K-Length Subsequences"
date:   2015-08-13 22:00:00
categories: probability scala
---

I was working on fixing a [bug](https://github.com/eHarmony/aloha/issues/24) in 
[Aloha](https://github.com/eHarmony/aloha/) when I came across a usage of [Scala](http://scala-lang.org/)'s 
`combinations` function in the [SeqLike](http://www.scala-lang.org/api/current/index.html#scala.collection.SeqLike) trait.
I'd never used it before and was a little disappointed when I found that: 

> If there is more than one way to generate the same subsequence, only one will be returned.

What I thought (*and hoped*) it did was create the list of *k*-[subsequences](https://en.wikipedia.org/wiki/Subsequence).
Nope.  So I figured I'd write something that actually computes what I wanted.  I wanted four things in the 
implementation:

1. Accuracy
1. Speed
1. Low Space Overhead
1. Thread-safety

[Accuracy](#accuracy) will be discussed below the code.  [Click here](#accuracy) for that discussion.  Speed is 
also an obvious concern.  To ensure iteration is fast, I used an adaptation of 
[Nils Pipenbrinck's response](http://stackoverflow.com/a/506862) to the stack overflow post 
[*Creating multiple numbers with certain number of bits set*](http://stackoverflow.com/questions/506807/creating-multiple-numbers-with-certain-number-of-bits-set).
The algorithm employs bit hacks and takes 5 64-bit long operations to find a the next value and *k* 
[masking](https://en.wikipedia.org/wiki/Mask_\(computing\)) operations to build the 
*k*-[subsequence](https://en.wikipedia.org/wiki/Subsequence).  So the total runtime is $$ O\left( k \right) $$.  The
total auxiliary space is 2 64-bit integers and one 
[AtomicLong](http://docs.oracle.com/javase/7/docs/api/java/util/concurrent/atomic/AtomicLong.html) for a total of 
$$ O\left( 1 \right) $$ auxiliary space.

The last concern is thread-safety.  While the algorithm produces iterators that are thread-safe, I still want this 
to be fast.  So I use [AtomicLong](http://docs.oracle.com/javase/7/docs/api/java/util/concurrent/atomic/AtomicLong.html)
and [CAS](https://en.wikipedia.org/wiki/Compare-and-swap) operations to avoid
[blocking](http://tutorials.jenkov.com/java-concurrency/non-blocking-algorithms.html#optimistic-locking-with-compare-and-swap).

## Code

{% highlight scala linenos %}
import java.util.concurrent.atomic.AtomicLong
import java.util.concurrent.atomic.AtomicBoolean

object SubSeqIterator {
  private val Masks = 0 to 62 map { i => 1L << i }

  def apply[A](values: IndexedSeq[A], k: Int): Iterator[Seq[A]] =
    if (0 == k) OneIterator[A]()
    else if (k > values.size) Iterator.empty
    else new SubSeqIterator(values, k)

  case class OneIterator[A]() extends Iterator[Seq[A]] {
    val more = new AtomicBoolean(true)
    def hasNext: Boolean = more.get
    def next(): Seq[A] = 
      if (more.getAndSet(false)) Seq[A]()
      else throw new NoSuchElementException
  }

  case class SubSeqIterator[A](values: IndexedSeq[A], k: Int) 
  extends Iterator[Seq[A]] {
    require(values.size <= 63)
    require(k <= values.size)

    private[this] val current = new AtomicLong(smallest(k))
    private[this] val last = largest(values.size, k)
    private[this] val numValues = values.size

    def hasNext: Boolean = current.get <= last

    def next(): IndexedSeq[A] = {
      var c = current.get
      var n = 0L
      if (c <= last) {
        n = next(c)
        while (c <= last && !current.compareAndSet(c, n)) {
          c = current.get
          n = next(c)
        }
      }
      if (c <= last) subset(c)
      else throw new NoSuchElementException
    }

    protected[this] def subset(n: Long) = {
      var i = 0
      var els = values.companion.empty[A]
      while(i < numValues) {
        if (0 != (Masks(i) & n))
          els = els :+ values(i)
        i += 1
      }
      els
    }

    protected[this] def largest(n: Int, k: Int): Long = 
      smallest(k) << (n - k)
    protected[this] def smallest(n: Int): Long = (1L << n) - 1
    protected[this] def next(x: Long): Long = {
      if (x == 0) 0
      else {
        val smallest = x & -x
        val ripple = x + smallest
        val newSmallest = ripple & -ripple
        val ones = ((newSmallest / smallest) >> 1) - 1
        ripple | ones
      }
    }
  }
}
{% endhighlight %}

## Accuracy

To test accuracy, we want to make sure that the number of *k*-[subsequences](https://en.wikipedia.org/wiki/Subsequence) 
is $$ \left( \begin{matrix} n \\ k \end{matrix} \right) $$, which is equivalent to the number *k*-element subsets of
of *n*-element set.  See the wikipedia article on the 
[binomial coefficient](https://en.wikipedia.org/wiki/Binomial_coefficient#Combinatorics_and_statistics) for why this
is true.  The following code calculates the binomial coefficients:  

{% highlight scala linenos %}
import scala.language.postfixOps

implicit class Ops(val n: Long) { 
  def ! = { 
    def h(x: Long, s: Long): Long = 
      if (x <= 1) s 
      else h(x-1, s * x)
    h(n, 1)
  }
  def choose(k: Long) = (n!) / ((k!)*((n-k)!))
}
{% endhighlight %}

Then we can test that the proper number of *k*-[subsequences](https://en.wikipedia.org/wiki/Subsequence) are outputted.

{% highlight scala linenos %}
val tests = for {
              n <- 1 to 20
              k <- 0 to n
              numSubseqs = SubSeqIterator(1 to n, k).size 
            } yield (n, k, numSubseqs, n choose k)

// Find places where # of k-subsequences aren't n choose k. 
val wrong = tests.filter(x => x._3 != x._4)

// Make sure there's nothing wrong.
assert(wrong.isEmpty, wrong.mkString("\n"))
{% endhighlight %}

## Conclusion

[*"Well, there you have it."*](http://www.dailyscript.com/scripts/an_affair_to_remember.pdf) A fast, thread-safe, 
memory efficient  *k*-[subsequence](https://en.wikipedia.org/wiki/Subsequence) iterator.  *Enjoy!*

<script type="text/javascript" src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"></script>
