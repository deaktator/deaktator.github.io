---
layout: post
title:  "Deriving Constant Time Approximations"
date:   2019-03-18 22:38:00
categories: math programming
---

A few years ago, just before going on a vacation, I came across some code in
a code base similar to this:

<script src="https://gist.github.com/deaktator/88d4e8a790f7f0f34a5c2912a2bb4a7b.js"></script>

I stared at it for a second or two and had two thoughts:

1. This is an $$O(K)$$ time algorithm.
1. This can be computed (*at least approximately*) in just $$O(1)$$ time.

To battle boredom on the plane, I confirmed this with the help of a few free tools:
[Wikipedia](https://en.wikipedia.org)
and [Wolfram Alpha](http://www.wolframalpha.com).  With these tools and some
basic algebra I found a pretty decent constant-time approximation capable of
replacing our $$O(K)$$ code.

The purpose of this post isn't to show some revolutionary new idea or result,
but to share the *process* of tracking down and optimizing certain types of
algorithmic inefficiencies in a code base.

## Steps

1. Formalize the Inefficiency
2. Use a C.A.S.
3. Research
4. Update and Simplify
5. Repeat (if Necessary)

### Formalize the Inefficiency

Inside the $$something$$ function, the $$h$$ function does all of the computation
(recursively).  $$something$$ merely calls the $$h$$ function with the
initial parameters: $$n$$, $$k$$ and $$0$$.

Notice that inside the function $$h$$, the $$n_i$$ and $$k_i$$ variables are updated
via the same function, the "***decrement by 1***" function.  This is an indication
that $$n_i$$ and $$k_i$$ can be written in terms of each other, given the initial
conditions, $$n$$ and $$k$$.  So, the $$something$$ function can be rewritten as:

<script src="https://gist.github.com/deaktator/91938c35c9805e1ed4dde200c5366bf9.js"></script>

In this variant, the $$n_i$$ variable is removed and the $$k_i$$ variable becomes
the $$i$$ variable.  Notice how the calculation for $$p$$ is the only place in the
old version that $$n_i$$ is used.  Therefore, the $$denom$$ function in the new
version needs to be rewritten in terms of $$i$$ and the initial conditions
$$n$$ and $$k$$, *and* it needs to work like $$n_i$$ in the old version.  In
the first loop of the old version the initial values of $$n_i$$ and $$k_i$$ are
$$n$$ and $$k$$, respectively.  Therefore,  $$ n_i - k_i = n - k $$. By
rearranging, and changing $$k_i$$ to $$i$$, it is necessarily the case that
$$ denom(n, k, i) = n - k + i $$.

Finally, when the indices are inverted, it's easy to see the formalism take shape.
The code looks like:

<script src="https://gist.github.com/deaktator/ae15ffc8ffdf06c115992d4faa66034e.js"></script>

which can be specified mathematically as:

$$ something\left( n,k \right) =\frac { 1 }{ k } \sum _{ i=1 }^{ k }{ \frac { { i } }{ n-k+i }  } $$


### Use a C.A.S.

Given the formal definition, a
[computer algebra system](https://en.wikipedia.org/wiki/Computer_algebra_system)
can be used to simplify the equation.  [Wolfram Alpha](http://www.wolframalpha.com)
will do the job just fine.  The above definition can be transformed to the Wolfram
Alpha input: **[1/k * Sum[i/(n - k + i), i, 1, k]](http://www.wolframalpha.com/input/?i=1%2Fk+*+Sum%5Bi%2F(n+-+k+%2B+i),+i,+1,+k%5D)**.

On the page, Wolfram Alpha provides an exact result:

$$
\frac { \left( k-n \right) { \psi  }^{ \left( 0 \right)  }\left( n+1 \right) +\left( n-k \right) { \psi  }^{ \left( 0 \right)  }\left( n-k+1 \right) +k }{ k }
$$

Without manipulating $$ { \psi  }^{ \left( 0 \right)  }\left( x \right) $$ at all,
some simplifications can be made via simple algebraic manipulations, leading to:

$$ 1-\frac { n-k }{ k } \left( { \psi  }^{ \left( 0 \right)  }\left( n+1 \right) -{ \psi  }^{ \left( 0 \right)  }\left( n-k+1 \right)  \right)  $$

### Research

With an alternate form of $$something$$ in hand, it's time to do a little
research.  Wolfram Alpha provides a note stating that
$$ { \psi  }^{ \left( n \right)  }\left( x \right) $$ *is the n<sup>th</sup>
derivative of the digamma function*.
$$ { \psi  }^{ \left( 0 \right)  }\left( x \right) = \psi \left( x \right)$$,
since the zeroth derivative of a function is the function itself.  So, it
makes sense to search Wikipedia for the
[digamma function](https://en.wikipedia.org/wiki/Digamma_function#Computation_and_approximation).
The article states that for any $$x > 1/2$$, the result of the digamma
function lies in the interval:

$$ { \psi }\left( x \right) \in \left( \ln { \left( x-\frac { 1 }{ 2 }  \right) , } \ln { x }  \right) $$

and that "the exponential $$ { \psi  }\left( x \right) $$ is approximately $$x − 1/2$$ for large $$x$$."  This means that, for large $$x$$,
$$ { \psi  }\left( x \right) \approx \ln \left(x − \frac { 1 }{ 2 }\right)$$.

### Update and Simplify

So, plugging in the information from Wikipedia into the output from Wolfram Alpha
and simplifying, we get:

$$
\begin{align*}
something &= 1-\frac { n-k }{ k } \left( { \psi  }^{ \left( 0 \right)  }\left( n+1 \right) -{ \psi  }^{ \left( 0 \right)  }\left( n-k+1 \right)  \right) \\

\Rightarrow \quad & \approx 1-\frac { n-k }{ k } \left( \ln { \left( n+1-\frac { 1 }{ 2 }  \right)  } -\ln { \left( n-k+1-\frac { 1 }{ 2 }  \right)  }  \right) \\

\Leftrightarrow \quad & = 1-\frac { n-k }{ k } \left( \ln { \left( n+\frac { 1 }{ 2 }  \right)  } -\ln { \left( n-k+\frac { 1 }{ 2 }  \right)  }  \right) \\

\Leftrightarrow \quad & = 1-\frac { n-k }{ k } \ln { \left( \frac { n+{ 1 }/{ 2 } }{ n-k+{ 1 }/{ 2 } }  \right)  }
\end{align*}
$$

### Result

<script src="https://gist.github.com/deaktator/a16f6c6d0bca0b404931cb09b6beb147.js"></script>

The result of all of this is a high-quality constant-time approximation that
replaces the linear time operation.  No special mathematical ability was
necessary, just some simple algebraic manipulations.  The real magic was
provided by the tools (Wolfram Alpha and Wikipedia).  The only part that required
a little intuition was noticing that $$n_i$$ and $$k_i$$ were updated by the same
function and could thus be rewritten in terms of each other and the initial
conditions, $$n$$ and $$k$$.  These types of series pop up a lot; sometimes it
is a simple arithmetic series whose replacement is obvious.  When it's not
as obvious, try to simplify the loops, and lean on *tools* like *CAS*
tools to simplify the equations modeled by your code.  Finding these constant
time algorithmic speed ups is rather rewarding and may yield huge performance
improvements in your codebase.

Finally, *how good is the approximation?*  Try it out for yourself.  All of the visualizations are interactive.

### Exact vs Approximate Surface

<table>
<tr>
<th width="50%">Exact</th>
<th width="50%">Approximation</th>
</tr>
<tr>
<td><div id="exact_visualization"></div></td>
<td><div id="approx_visualization"></div></td>
</tr>
</table>

Notice that the surface created by the approximation is virtually indistinguishable by visual inspection.  To
see just how good the function is, a difference plot is in order.  The $$ z $$-values are created by the function:

$$ z\left( n, k \right) = sign \left( A \left( n, k \right) - E \left( n, k \right) \right) \log_{10} \left( 10^{-300} + \left| A \left( n, k \right) - E \left( n, k \right) \right| \right) $$

where $$ A \left( n, k \right) $$ is the constant time approximation function and the $$ E \left( n, k \right) $$ is
the exact function.  $$ \epsilon = 10^{-300} $$ is added to the absolute value of the difference in order to avoid
taking the log of zero.   The magnitude of the $$ z $$-values represent the number of digits of precision of the
approximation and the sign represents whether the approximation overestimates ( + ) or underestimates ( - ).

<div id="log_diff_visualization"></div>

### Runtime

The ratio of runtime of the exact and the approximate algorithms is shown on a log scale.  This plot shows that there
is nearly a $$ 10^9 $$ speed up of the approximate over the exact algorithm's runtime for $$ n = 10^7 $$ and
$$ k = 10^7 $$.

<div id="log_speed_visualization"></div>

### Data

All benchmarking source data used to create these visualizations is available here:

* ["{{ site.url }}/assets/20190318/data/const_time_approx.tsv]("{{ site.url }}/assets/20190318/data/const_time_approx.tsv)
* ["{{ site.url }}/assets/20190318/data/const_time_approx_small_values.tsv]("{{ site.url }}/assets/20190318/data/const_time_approx_small_values.tsv)
* ["{{ site.url }}/assets/20190318/data/d_10000_1000000.tsv]("{{ site.url }}/assets/20190318/data/d_10000_1000000.tsv)
* ["{{ site.url }}/assets/20190318/data/d_10000000.tsv]("{{ site.url }}/assets/20190318/data/d_10000000.tsv)
* ["{{ site.url }}/assets/20190318/data/keq1.tsv]("{{ site.url }}/assets/20190318/data/keq1.tsv)

<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis.js"></script>
<script type="text/javascript" src="{{ site.url }}/assets/20190318/approx.js"></script>
<script type="text/javascript" src="{{ site.url }}/assets/20190318/exact.js"></script>
<script type="text/javascript" src="{{ site.url }}/assets/20190318/big_log_diff.js"></script>
<script type="text/javascript" src="{{ site.url }}/assets/20190318/big_log_speed.js"></script>

<script type="text/javascript">
var options_surface = {
  width:  '100%',
  height: '250px',
  style: 'surface',
  showPerspective: true,
  showGrid: true,
  showShadow: true,
  keepAspectRatio: true,
  verticalRatio: 0.5,
  xLabel: 'n',
  yLabel: 'k',
  zLabel: 'z(n, k)',
  cameraPosition: {
    horizontal: 0.44,
    vertical: 0,
    distance: 2
  }
};

var options_log_diff = {
  width: '100%',
  height: '500px',
  style: 'dot',
  dotSizeRatio: 0.005,
  showPerspective: true,
  showGrid: false,
  showShadow: true,
  keepAspectRatio: true,
  xLabel: 'n',
  yLabel: 'k',
  zLabel: 'log10(A - E)',
  cameraPosition: {
    horizontal: 0.8,
    vertical: 0,
    distance: 1.75
  }
};

var options_log_speed = {
  width: '100%',
  height: '500px',
  style: 'dot',
  dotSizeRatio: 0.005,
  showPerspective: true,
  showGrid: false,
  showShadow: true,
  keepAspectRatio: true,
  xLabel: 'n',
  yLabel: 'k',
  zLabel: 'log10(t_A - t_E)',
  cameraPosition: {
    horizontal: -4.71238898038469,  // -1.5 pi
    vertical: 0,
    distance: 1.75
  }
};


var data1 = new vis.DataSet(data_approx);
var data2 = new vis.DataSet(data_exact);
var data3 = new vis.DataSet(data_big_log_diff);
var data4 = new vis.DataSet(data_big_log_speed);

var graph3d_1 = new vis.Graph3d(document.getElementById('approx_visualization'), data1, options_surface);
var graph3d_2 = new vis.Graph3d(document.getElementById('exact_visualization'), data2, options_surface);
var graph3d_3 = new vis.Graph3d(document.getElementById('log_diff_visualization'), data3, options_log_diff);
var graph3d_4 = new vis.Graph3d(document.getElementById('log_speed_visualization'), data4, options_log_speed);
</script>

<!-- <script type="text/javascript" src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"></script> -->
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js?config=TeX-AMS-MML_HTMLorMML"></script>
