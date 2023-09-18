---
layout: post
title:  "Tale of Two Parents"
date:   2023-09-17 14:00:00
categories: metrics
---

## A quick thought to ponder:

Two parents ($$ P_1 $$, $$ P_2 $$) have a child, $$ C $$.  $$ P_1 $$ expects
$$ C $$ to complete a set of chores, $$ T $$.  $$ P_2 $$ instructs $$ C $$
on how to complete the chores.  $$ P_1 $$ grades $$ C $$ on the completion of
chores with a score, $$ S $$.

### Questions:

1.	Does $$ S $$ represent that $$ C $$ performed $$ T $$ satisfactorily,
    according to $$ P_1 $$?
2.	Does $$ S $$ represent that $$ C $$ performed $$ T $$ satisfactorily,
    according to $$ P_2 $$?
3.	Is $$ S $$ ***necessarily*** a reflection of $$ C $$’s performance?
4.	Under which conditions does $$ C $$ simultaneously satisfy $$ P_1 $$ and $$ P_2 $$?
5.	How should $$ C $$ be fairly assessed?
6.  Should $$ P_1 $$ consider $$ P_2 $$ when assessing $$ C $$?
7.  What if $$ C $$ satisfies $$ P_2 $$ but fails to satisfy $$ P_1 $$?

### Answers:

1.	Yes
2.	No, not necessarily.
3.	No; when $$ P_1 $$ and $$ P_2 $$'s requirements differ, $$ C $$ can succeed
    in satisfying the requirements of $$ P_2 $$, while failing to satisfy the
    requirements of $$ P_1 $$.
4.	When $$ P_1 $$ and $$ P_2 $$’s requirements are "*aligned*".
5.	By whether $$ C $$ satisfies requirements provided to $$ C $$.
6.	Yes.  This is really another way to state (5), since $$ P_2 $$ provides
    requirements to $$ C $$.
7. Then better align $$ P_1 $$ and $$ P_2 $$.  See (4).



### Example 1: Bleeched Red Shirt

While walking out the door for the day, a parent asks the child to wash a red
shirt.  Not knowing how to wash a red shirt, the child asks the other parent
how to wash the shirt.  The second parents instructs the child to use
non-color-safe bleech.  The child does as instructed by both parents.  The
shirt turns a bright uniform pink.  The child is grounded by the first parent.
Is this reasonable?  Of course not.  *After all, the child did an excellent
job bleeching the shirt!*


### Example 2: Insubordination in [*The Rings of Power*](https://www.imdb.com/title/tt7631058/)

A commander leads a company to track down an enemy.  The king timeboxes the
campaign, imposing a time-based resource constraint.  When mission parameters
are exceeded, the commander presses on.  Ultimately, her troops lay down their
swords, abandon their duties, and return home.

Now, are these troops to be judged insubordinate?  or faithful?  Did they
abandon their duties, or fulfill them?  They are simultaneously faithful in
their duties, according to the king who imposed the time constraint and
insubordinate, according to their commander who herself failed to heed the
king's constraints.  Had she done so, it would be irrational to consider her
company's act as insubordination, as they satisfied the king's wishes.

> "*It was not your company who defied you out there, but rather you who defied
> the High King, by refusing to heed any limit placed upon you.*"

![It was not your company who defied you out there]({{ site.url }}/assets/20230917/tale/not_your_company.jpg){: width="400" }
![but rather you who defied the High King]({{ site.url }}/assets/20230917/tale/you_defied.jpg){: width="400" }
![by refusing to heed any limit placed upon you]({{ site.url }}/assets/20230917/tale/limits.jpg){: width="400" }

## Relationship to Model Assessment in ML

If a model assumes the role of $$ C $$, and the validation data generation process
assumes the role of $$ P_1 $$, then to use the data for evaluatation of the
model on an environment $$ P_2 $$, $$ P_1 $$ should be aligned or in the very
least account for the differences between $$ P_2 $$.  Otherwise, the model
$$ C $$ could work very well in fulfillment of its responsibilities under
$$ P_2 $$, and appear to fail without explanation.


<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js?config=TeX-AMS-MML_HTMLorMML"></script>
