---
layout: post
title:  "Optimizing Top Finishers in Grouped Races"
date:   2019-08-04 21:30:00
categories: optimization, linear programming
---

# Problem

Consider a race between at least $$ N $$ runners from at most $$ K $$ countries.

Each country that wishes to participate agrees to submit to the race committee a roster
containing the number of runners that will participate along with an amount
$1,000,000 * $$ q $$ (where $$ q \in [0, 1] $$) the country will donate to charity for
each of its runners that finish in the top $$ N $$ runners.

Assuming that all possible race standings are equally likely, find the countries that
should participate in the race so that the most money is donated to charity.


# Outline

Ultimately, we'll use linear-fractional 0-1 programming to optimize this problem, but we'll
start with a description of the dynamics of the race. Then we'll show the brute force
approach to solving the problem in order to supply a baseline for both speed correctness.
Along the way, we'll develop an intuition why linear-fractional 0-1 programming is applicable
in solving the problem.


# Prerequisites

For a given race, we can determine the outcomes by creating *runner*&nbsp;/&nbsp;*country* pairs, 
and looking at the country breakdowns of the $$ N $$&ndash;[combinations](https://en.wikipedia.org/wiki/Combination)
of the *runner*&nbsp;/&nbsp;*country* pairs.  Because payments to charity do not depend on
which specific runners from a country finish in the top, we can disregard the complexity of
looking at $$ N $$&ndash;[permutations](https://en.wikipedia.org/wiki/Permutation).

For each $$ N $$&ndash;combination, determining the country breakdown tells the amount of money
that would be donated to charity.  The expected payment to charity is computed by averaging over
the possible outcomes.


## Expectation of $$ q $$ for a given race 

<script src="https://gist.github.com/deaktator/26453535af649422c495e32c404b344e.js"></script>

`exp_q_finishers` returns the expected sum or average $$ q $$ values of the top finishers
(depending on the value of `avg_q`), given the countries participating in the race.
In addition to the $$ q $$ value, the function also returns a map of the different
finishes from a country perspective (counts rather than individual runners).  The astute
reader will note that the values in the returned `country_finishes` map follow an unnormalized
[multivariate hypergeometric distribution](https://en.wikipedia.org/wiki/Hypergeometric_distribution#Multivariate_hypergeometric_distribution),
which can be verified by dividing each value (count) by the sum of values and comparing the probabilities
to the multivariate hypergeometric distribution probability mass function.  We can also run the keys in 
`country_finishes` through the multivariate hypergeometric distribution PMF to verify the probabilities
sum to one, which is an indication the returned race finishes represent the comprehensive set of
possible finishes.  To see this in action, consider the following example.


### Example 1

Consider the race between the following three countries where the top $$ t $$ = **11** finishers
of the $$ p $$ = **13** participants will have a charitable donation in their name with the amount
dictated by the $$ q $$ value for a runner's country of origin.

|---
| country         | # runners   | $$ q $$
| :-------------- | :---------- | :--------
| Algeria         |  5          | 0.5
| Morocco         |  5          | 0.5
| United Kingdom  |  3          | 0.31
|===
{:.deaktatortable}

There are **3,113,510,400** $$ = nPr(p, t) $$ $$ = nPr(13, 11) $$ $$ = \frac{ 13! }{ (13-11)! } $$ unique
race finishes for the top **11** finishers of this race.  Again, individual race ordering does
not matter since the problem is only concerned with the *number of finishers* from each country
in the top **11**. Therefore, combinations rather than permutations are appropriate. There are then
$$ n = 78 $$ $$ = nCr(p, t) = nCr(13, 11) $$ $$ = \frac{ 13! }{ 11! (13-11)! } $$ unique finishes when order within
the top **11** runners does not matter.

If we let $$ r = \begin{bmatrix} 5 & 5 & 3 \end{bmatrix} $$ and
$$ q = \begin{bmatrix} 0.5 & 0.5 & 0.31 \end{bmatrix} $$, and
inspect the results of `exp_q_finishers(r, q, t)`, we
get the unique finishes, $$ F $$, and the number of times each finish occurs in $$ C $$.
Note that the column vectors in $$ F $$ represent a unique race outcome and therefore each
column in $$ F $$ sums to $$ t $$ since there are $$ t $$ top finishers.

$$
F = \begin{bmatrix}
5 & 5 & 5 & 4 & 4 & 3 \\
5 & 4 & 3 & 5 & 4 & 5 \\
1 & 2 & 3 & 2 & 3 & 3
\end{bmatrix}
$$

$$
C = \begin{bmatrix}
3 & 15 & 10 & 15 & 25 & 10
\end{bmatrix}
$$

Notice:

$$
\begin{split}
{n}^{-1} C F^T & = \begin{bmatrix} \frac{330}{78}  &  \frac{330}{78} & \frac{198}{78} \end{bmatrix} \\
               & = \begin{bmatrix} \frac{55}{13}  &  \frac{55}{13} & \frac{33}{13} \end{bmatrix} \\
               & = \begin{bmatrix} \left( \frac{11}{13} \right) 5  &  \left( \frac{11}{13} \right) 5 & \left( \frac{11}{13} \right) 3 \end{bmatrix} \\
               & = \left( \frac{ t }{ p } \right) r
\end{split}
$$

and 

$$
p = \sum_{j}{r_j}
$$

These are important results because $$ t $$, $$ p $$ and $$ r $$ are parts of the race
definition, which tells us that we don't actually need to simulate the possible races to
determine the expected number of runners from each country that will finish in the top
$$ t $$.  Determining the expected charitable donation for the race is just $1,000,000 times:

$$
\left( \frac{ t }{ p } \right) r q^T = \left( \frac{ t }{ \sum_{j}{r_j} } \right) \sum_{j}{r_j q_j} = t \left( \frac{ \sum_{j}{r_j q_j} }{ \sum_{j}{r_j} } \right)   \label{eq1}\tag{1}
$$

or **$5,017,692.31** or about **$456,153.85** per the 11 finishers.


## Brute force optimization of the problem

`exp_q_finishers` determines the expected sum of $$ q $$ values for the top finishers, given
set of countries entered into a race.  `brute_force_best`, defined below, can be used optimize the
objective in a brute force way by applying `exp_q_finishers` to each valid country combination
and finding the one with the highest value for `exp_q_finishers`.  This is rather straightforward
and can be done as follows:

<script src="https://gist.github.com/deaktator/7c0a2f7cbd68e8557e29b141736bc6d7.js"></script>


### Example 2

Find at most $$ K $$ = **3** countries (from the list below) to participate in a race with at least
$$ N $$ = **11** runners, where the top $$ t $$ = **11** runners' countries will make a charitable
donation according to the country's $$ q $$ value.

|---
| country         | # runners   | $$ q $$
| :-------------- | :---------- | :--------
| Algeria         |  5          | 0.5
| Morocco         |  5          | 0.5
| Tanzania        |  4          | 0.32
| United Kingdom  |  3          | 0.31
|===
{:.deaktatortable}

By looking at the "*# runners*" column, it is apparent that 3 countries are required to fill out the
race.  So, the possible races (*i.e.*, country combinations), along with their expected donation
following the race and average donation per finisher are listed below.

|---
| rank | countries                         | exp donation ($1M) = sum $$ q $$ | sum $$ q $$ / $$ t $$
| :--- | :-------------------------------- | :------------------ | :----------
| 1    | Algeria, Morocco, United Kingdom  |  5.017692           | 0.45615384
| 2    | Algeria, Morocco, Tanzania        |  4.9342856          | 0.4485714
| 3    | Algeria, Tanzania, United Kingdom |  4.3175             | 0.3925
| 3    | Morocco, Tanzania, United Kingdom |  4.3175             | 0.3925
|===
{:.deaktatortable}

There are a few things to call out in these results:

1. ***Greedily selecting countries based on the highest*** $$ q $$ ***values is suboptimal***;
   otherwise, *Algeria*, *Morocco* and *Tanzania* would have been selected to race.
1. ***Optimizing the sum of*** $$ q $$ ***values for the top*** $$ t $$ ***finishers is equivalent
   to optimizing the mean*** $$ q $$ ***values for the top*** $$ t $$ ***finishers*** since $$ t $$
   is unrelated to the countries participating in the race.
1. ***Since*** $$ t $$ ***is a constant in each objective value,*** $$ t $$
   ***can be removed from the objective.***
1. ***The objective value is thus:*** $$ \frac{ \sum_{j}{r_j q_j} }{ \sum_{j}{r_j} } $$.
   (*See example 1 for the derivation*)


# Optimization via linear-fractional 0-1 programming

Given the insight from the two examples, we know that we can write the problem definition as:

**maximize:**

$$
    \frac{ \sum_{j}{x_j r_j q_j} }{ \sum_{j}{x_j r_j} }  \label{eq2}\tag{2}
$$

**subject to:**

$$
x_j \in \left\{ 0, 1 \right\} \\
\sum_{j}{x_j} \le K \\
\sum_{j}{x_j r_j} \ge N
$$

This is a linear-fractional 0-1 programming problem because the objective is the ratio of two linear functions:
$$ \sum_{j}{x_j r_j q_j} $$ and $$ \sum_{j}{x_j r_j} $$ and the decision variables $$ x_j $$ are binary.  While
this is not currently a pure linear program, it can be transformed into one by applying the
[Charnes-Cooper transformation](https://en.wikipedia.org/wiki/Linear-fractional_programming#Transformation_to_a_linear_program).

**maximize:**

$$
    \sum_{j}{y_j r_j q_j}  \label{eq3}\tag{3}
$$

**subject to:**

$$
\sum_{j}{y_j r_j} = 1\\
\sum_{j}{y_j} \le K t \\
\sum_{j}{y_j r_j} \ge N t \\
t \ge 0
$$

Notice that with the change of variables from $$ x_j $$ to $$ y_j $$, we lose the binary constraints on $$ x_j $$.  To
reintroduce the binary constraint, we can use a trick from the
[lp_solve documentation](http://lpsolve.sourceforge.net/5.5/ratio.htm), which introduces additional binary
variables $$ z_j $$ and three constraints per $$ y_j $$: 

$$
y_j \le f_1 z_j \\
y_j - t - f_2 z_j \ge -f_2 \\
y_j - t + f_2 z_j \le f_2
$$

where $$ f_1 $$ and $$ f_2 $$ are constants and $$ f_1 $$ must be greater than $$ \max y_j $$ and 
$$ f_2 $$ must be greater than $$ t $$ in linear programming problem  $$ \left( \ref{eq3} \right) $$,
defined above.


## Example 3: Using [PuLP](https://pythonhosted.org/PuLP/) to define LP problem  $$ \left( \ref{eq3} \right) $$

<script src="https://gist.github.com/deaktator/99d4beec9a7b3c4698060ba61c78565e.js"></script>

## Example 4: linear-fractional 0-1 programming formulation

Given the result of the linear program above with no binary constraints, we need to use the 
values of $$ f_1 $$ and $$ f_2 $$ and create the additional $$ z_j $$ variables and constraints.
This looks like the following:

<script src="https://gist.github.com/deaktator/0b518a3411d0a0e0387eb058a94b2ad9.js"></script>

Once we solve the problem and determine the active variables, we can get the list of countries
in the race via `countries[active_variables(y)].tolist()`.  Sure enough, the countries selected are:
*Algeria*, *Morocco* and *United Kingdom*.  The objective value for those countries is given by
`pulp.value(model.objective)` which gives a value of **0.45615384661**.  Notice that this is same as
the *avg_q* of **0.45615384** in *Example 2*.  So, it should be no surprise that 
(**0.45615384661** &times; 11 &times; $1,000,000) = **$5,017,692.31** matches the result in
*Example 1*.


# Conclusion

Linear-fractional 0-1 programming can be used to optimize grouped races where the objective
is to maximize some definition of quality for the quickest finishers.  In the examples above,
the definition of quality is the size of charitable donations, but this same problem has
applications in advertising.  For instance, if an advertising budget allows for $$ N $$
impressions over at most $$ K $$ distinct placements, then placement quality over all
potential placements could be optimized using the above formulation.

Thinking about the brute force search over the $$N$$&ndash;permutations representing all of
the possible race finishes, the linear-fractional 0-1 programming formulation gives a good
speed up.  Further refinements are likely possible and some of those possible improvements
are likely to be found in some of the references that follow.


# References

1. [Barnhart, Cynthia, et al. "Branch-and-price: Column generation for solving huge integer programs."
   Operations research 46.3 (1998): 316-329.](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.93.7791&rep=rep1&type=pdf)
1. [Charles, V., and D. Dutta. "Non-linear stochastic fractional programming models of financial derivatives."
   The ICFAI Journal of Applied Finance 11.6 (2005): 5-13.](http://www.optimization-online.org/DB_FILE/2005/06/1145.pdf)
1. Charnes, Abraham, and William W. Cooper. "Programming with linear fractional functionals." Naval Research logistics
   quarterly 9.3‐4 (1962): 181-186.
1. [Chinneck, John W. "Practical Optimization: A Gentle Introduction.", Ch 13. Systems and Computer
   Engineering, Carleton University, Ottawa. http://www.sce.carleton.ca/faculty/chinneck/po.html (2006).
   (Accessed Aug 3, 2019)](http://www.sce.carleton.ca/faculty/chinneck/po.html)
1. [Glover, Fred. "Improved linear integer programming formulations of nonlinear integer problems."
   Management Science 22.4 (1975): 455-460.](http://leeds-faculty.colorado.edu/glover/fred%20pubs/69%20-%20Improved%20Linear%20Integer%20Programming%20Formulations%20of%20Nonlinear%20Integer%20Problems%20_%20%20Fred%20Glover.pdf)
1. Güngör, Murat. "A fractional 0–1 program for task assignment with respect to preferences."
   Computers & Industrial Engineering 131 (2019): 263-268.
1. [Swarup, Kanti. "Letter to the editor—Linear fractional functionals programming." Operations Research 13.6 (1965): 
   1029-1036.](https://pubsonline.informs.org/doi/pdf/10.1287/opre.13.6.1029)
1. [Lawrence J. Watters,  (1967) Letter to the Editor—Reduction of Integer Polynomial Programming Problems
   to Zero-One LinearProgramming Problems. Operations Research 15(6):1171-1174.
   https://doi.org/10.1287/opre.15.6.1171](https://doi.org/10.1287/opre.15.6.1171)

1. [https://pythonhosted.org/PuLP/](https://pythonhosted.org/PuLP/)
1. [https://en.wikipedia.org/wiki/Linear-fractional_programming#Transformation_to_a_linear_program](https://en.wikipedia.org/wiki/Linear-fractional_programming#Transformation_to_a_linear_program)
1. [http://lpsolve.sourceforge.net/5.5/ratio.htm](http://lpsolve.sourceforge.net/5.5/ratio.htm)
1. [https://en.wikipedia.org/wiki/Hypergeometric_distribution#Multivariate_hypergeometric_distribution](https://en.wikipedia.org/wiki/Hypergeometric_distribution#Multivariate_hypergeometric_distribution)
1. [https://en.wikipedia.org/wiki/Mile_run_world_record_progression](https://en.wikipedia.org/wiki/Mile_run_world_record_progression)


<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js?config=TeX-AMS-MML_HTMLorMML"></script>
