---
layout: post
title:  "The Floor Format"
date:   2024-03-06 15:00:00
categories: math, game shows, teaching
---

<style type="text/css">
  .caption {
    text-align: center;
    margin-bottom: 20px;
  }

  .svg_container {
    height: 390px;  /* gridSize * numSquares */
    width: 390px;   /* gridSize * numSquares */
    margin-bottom: 20px;
    margin: auto;
  }

  .svg_container svg {
    width: 100%;
    height: 100%;
  }
</style>


![The Floor Birdseye View]({{ site.url }}/assets/20240306/the_floor_birdseye.png)

*[The Floor](https://en.wikipedia.org/wiki/The_Floor_\(American_game_show\))* is an American quiz show that features a square game board.  This article will focus on the relationship between the board size, the number of eliminations per episode, and the number of episodes.  To better understand the format of the show, please see a description of the [show format](https://en.wikipedia.org/wiki/The_Floor_\(American_game_show\)#Format) on Wikipedia.

## Main Takeaway

When the game board is a square of at least 3x3 with odd-length sides, then exactly
8 eliminations per episode will eventually yield one finalist at the end of the
final episode.  Furthermore, the number of episodes required to crown a champion
is represented by a [triangular number](https://en.wikipedia.org/wiki/Triangular_number).
This means that without additional format changes, the board size can be adjusted
to achieve a desired number of episodes.

## Aside: This article is more kid focused

The idea for this article came about while watching *The Floor* with my family and
asking questions to my child (in elementary school).  The goal is provide real-world
applications and a further explanation of
[mathematically induction](https://en.wikipedia.org/wiki/Mathematical_induction) to someone
who has seen a brief introduction, but who does not have much experience.  Explanations and
derivations will be more thorough than usual articles, because less mathmetical knowledge
is assumed.

## Introduction

The board of *The Floor* is a 9 x 9 square made up of 81 smaller squares
(81 = 9 x 9).  In each episode, 8 small squares are eliminated from the board.
This means that after 10 episodes, 80 small squares will be eliminated:

$$
\begin{align*}

eliminations &= \frac{8 \text{ small squares eliminated}}{\text{ episode}} \times 10 \text{ episodes}
\\

&= \frac{8 \text{ small squares eliminated}}{\cancel{\text{ episode}}} \times 10 \cancel
{\text{ episodes}}
\\

&= 8 \times 10 \text{ small squares eliminated}
\\

&= 80 \text{ small squares eliminated}
\end{align*}
$$

Of the 81 original small squares, 80 will be eliminated, leaving one winner remaining at the end of the final episode.  The question we'll be exploring here is under what conditions the following equation holds:

$$
\textit{# small squares} = 8 * \textit{episodes} + 1
$$


## Game Boards with Even Sizes?

First, let's show that the above equation cannot be true when the side lengths of the board square are even numbers.  For example, a 2 x 2  board cannot have exactly 8 eliminations per episode.  This is true for a 2 x 2 board, 4 x 4 board or a 1,000,000 x 1,000,000 board.

We know that if two numbers are multiplied and at least one of them is an even number, then the result in an even number.  For example, 3 x 4 = 12.  12 must be even because 4 is even.  We also know that if two odd numbers are multiplied, the result will be odd.  What follows is:

*  boards with **even** side lengths have an **even** number of small squares
*  boards with **odd** side lengths have an **odd** number of small squares

A board with even length sides is made up of an even number of small squares.
Remember, one of those squares has to be the final winning square.  We need
to check whether the starting number of small squares minus the final number
of small squares is evenly divisible by 8.  Since 8 = 2 x 2 x 2, in order for
a number to be evenly divisible by 8, it must be divisible by 2 (that is, it
must be even).  Because boards with even side lengths result in a board with
an even number of small squares and subtracting the final one square results
in an odd number of squares, this odd number of small squares cannot be
divisible by 8, because it is not divisible by 2.  This means

> **No board with even side lengths may result in episodes with the
> same number of eliminations per episode while resulting in one winner
> at the end of the final episode.**


## Game Boards with Odd Sizes

We now know that game boards cannot have even side lengths and satisfy the equation.  We also know that a 9 x 9 board can be broken down into 10 episodes of 8 eliminations per episode.  But is this a special case or is this pattern somehow more general?  Let's find out.  

We avoided it so far, but let's define what it means to be even and odd:

* an **even** number, \\( n \\)  is \\( 2 k \\)  for some integer  \\( k \\).
* an **odd** number, \\( n \\)  is \\( 2 k + 1 \\)  for some integer  \\( k \\).

It should be apparent that even and odd numbers alternate.  For instance:

$$
\underbrace{1}_\text{odd}, \underbrace{2}_\text{even}, \underbrace{3}_\text{odd}, \underbrace{4}_\text{even}, \underbrace{5}_\text{odd}, \ldots
$$

We can define a function, \\( S(n) \\), that gives that number of small squares in a game board for the \\(n\\)<sup>th</sup> odd number.

$$
\begin{align*}

S(n) &= (2 n + 1)^{2}      & & \\
&= (2 n + 1)(2 n + 1)      & & \text{definition of square} \\
&= 4 n^2 + 2 n + 2 n + 1   & & \text{F.O.I.L.} \\
&= 4 n^2 + 4 n + 1         & & \text{addition} \\
&= 4 n (n + 1) + 1         & & \text{factor}

\end{align*}
$$

### Visual Explanation:

In the following animation, where \\( n \\) is set to equal 4, we can visually observe
the relationship, \\( S(n) = 4 n (n + 1) + 1\\).  Because \\( n = 4 \\) in this example
animation, each triangle should be made up of 4 rectangular strips.

Each \\( n (n + 1) \\) can be represented as a rectangle.  Below we see 4 rectangles:
greenish, blue/purple, red/orange, yellowish.  There is one addition green square in
the center.  When added, the areas of these 4 rectangles along with the small center
square equal \\( S(n) \\).  In this case, where \\( n = 4 \\), 
\\( S(4) = 4 \times 4 \times 5 + 1 = 81\\).

Slowly click the animation a few times to see that the regardless of how the rectangles
are tightly packed around the center square, there are four distinct, visually
noticeable rectangles.

<div id="svg_container_1" class="svg_container"></div>
<div class="caption">[ <em>👆click image to animate</em> ]</div>

Let's calculate the first few values of \\( n \\) to see if this seems to work for odd size boards.

|---
| \\( n \\) | board dimension |\\( S(n) \\) |  equals           | num episodes  |    
| :-------: | :-------------: | -----------:| :---------------: | :-----------: |
| 0         | 1 x 1           | 1           | 0 &times; 8 + 1   | 0             |
| 1         | 3 x 3           | 9           | 1 &times; 8 + 1   | 1             |
| 2         | 5 x 5           | 25          | 3 &times; 8 + 1   | 3             |
| 3         | 7 x 7           | 49          | 6 &times; 8 + 1   | 6             |
| 4         | 9 x 9           | 81          | 10 &times; 8 + 1  | 10            |
| 5         | 11 x 11         | 121         | 15 &times; 8 + 1  | 15            |
| 6         | 13 x 13         | 169         | 21 &times; 8 + 1  | 21            |
| 7         | 15 x 15         | 225         | 28 &times; 8 + 1  | 28            |
|===
{:.deaktatortable}

Looking at the above table, it appears that in general the pattern holds.  We can see in the second column from the right that squares with odd side lengths appear to be evenly divisible by 8 after we subtract the final winning small square.  Can we somehow prove that that this pattern works for (the infinite number of) all squares with odd length sides?  The answer is yes, and we can prove it this fact in at least a few different ways.


### A Direct Proof

Notice from above that we showed \\( S(n) = 4 n (n + 1) + 1 \\).  If either \\( n \\) or \\( (n + 1) \\) is even, then the product \\( n (n + 1) \\) must be even.  Because even and odd numbers alternate, either \\( n \\) or \\( (n + 1) \\) must be even.  

* If \\( n \\) is odd, then \\( (n+1) \\) must be even.
* If \\( n \\) is even, then \\( (n+1) \\) must be odd.

In all cases, \\( n (n + 1) \\) must be even and by the definition of *even*,
\\( n (n + 1) = 2 j\\), for some integer \\( j \\).  By substituting \\( 2 j \\)
back into the definition of \\( S(n) \\), \\( S(n) = 4 \times 2 j + 1 \\), for
some \\( j \\).  Performing the multiplication gives \\( S(n) = 8 j + 1 \\),
for some \\( j \\).  Notice this is exactly the form of equation we desire.
Since we can produce this form for both  *even and odd* values of \\( n \\),
the equation holds for all positive integer values of \\( n \\). &nbsp; &#10003;


### A Proof By Induction

This assumes brief familiarity with mathematical induction.

#### Find \\( S(n + 1) \\) and \\( S(n + 1) - S(n) \\)
Before we attempt to prove the equation applies to all values of \\( n \geq 1 \\),
we will find it useful to find the value of \\( S(n + 1) \\).  This can be done by
replacing \\( n \\) with \\( (n+1) \\) in the original definition of \\( S(n) \\).

$$
\begin{align*}

S(n + 1) &= (2 (n + 1) + 1)^{2}   & & \\
&= (2 n + 2 + 1)^{2}              & & \text{distribute} \\
&= (2 n + 3)^{2}                  & & \text{addition} \\
&= (2 n + 3)(2 n + 3)             & & \text{definition of square} \\
&= 4 n^2 + 6 n + 6 n + 9          & & \text{F.O.I.L.} \\
&= 4 n^2 + 12 n + 9               & & \text{addition}

\end{align*}
$$

The reason we want to determine the value of \\( S(n+1) \\) is to determine the
difference between \\( S(n+1) \\) and \\( S(n) \\) which is:

$$
\begin{align*}

S(n + 1) - S(n) &= (4 n^2 + 12 n + 9) - (4 n^2 + 4 n + 1)    & & \text{substitution} \\
&= 4 n^2 + 12 n + 9 -4 n^2 - 4 n - 1                         & & \\
&= 4 n^2 -4 n^2 + 12 n - 4 n + 9 - 1                         & & \text{commutativity} \\
&= (4 - 4)n^2 + (12 - 4)n + (9 - 1)                          & & \text{factor} \\
&= 0 n^2 + 8 n + 8                                           & & \text{subtraction} \\
&= 8 n + 8                                                   & &  \\
&= 8(n + 1)                                                  & & \text{factor}

\end{align*}
$$

So \\( S(n + 1) - S(n) = 8(n + 1) \\).  Adding \\( S(n) \\) to both sides yields:

$$
S(n + 1) = S(n) + 8(n + 1)
$$

#### Visual Explanation

By clicking on the animation in the <a href="#svg_container_1">previous section</a>, the triangles
spread out to expose a pattern that shows the relationship, \\( S(n + 1) = S(n) + 8 n + 8 \\).
Each concentric ring around the small center square has 8 \\( n\\)-length bars (that's the "\\(8 n\\)")
*and* 8 white spaces along horizontal, vertical and diagonal directions (the "\\( + 8 \\)").


#### Base Case

We want to show that for \\( S(0) = 8 k + 1 \\) for some \\( k \\).  Since we already did this in the table above, we can see that \\( S(0) = 1 = 0 k + 1 \\). &nbsp; &#10003;

#### Inductive Step

Here we want to show that if \\( S(n) = 8 k + 1 \\) for some \\( k \\), then \\( S(n+1) = 8 j + 1 \\) for some \\( j \\).

Assume that \\( S(n) = 8 k + 1 \\).  We know \\( S(n + 1) = S(n) + 8(n + 1) \\).  

$$
\begin{align*}

S(n + 1) &= S(n) + 8(n + 1) & & \text{previous proof} \\
&= (8 k + 1) + 8(n + 1)     & & \text{substitution of inductive hypothesis} \\
&= (8 k + 1) + 8 n + 8      & & \text{distribute} \\
&= (8 n + 8 k + 8)  + 1     & & \text{commutativity} \\
&= 8(n + k + 1) + 1         & & \text{factor}

\end{align*}
$$

Notice this is the form we wanted with \\( j = (n + k + 1) \\). &nbsp; &#10003;

Since we showed the base case and the inductive step, we've showed that subtracting 1 from a squares with odd side lengths yields a number divisible by 8.


### What numbers are multiplied by 8?

We've shown in two ways, via the direct and inductive proofs, that the equation at the very beginning of this article is true, but this only tells us that all episodes can have exactly 8 eliminations when the board is an odd square.  What we don't know is the number of episodes for a board size.  We can compute this by taking \\( (S(n) - 1) / 8 \\).  When we do, we may notice an interesting pattern.  These numbers are called the [triangular numbers](https://en.wikipedia.org/wiki/Triangular_number), which follow the formula, \\( T(n) = \frac{n(n+1)}{2} \\).  We can prove this will always be the case by induction.  For an intuition, please refer back to the animation, which show these triangular numbers pictorially.

#### Base Case

When \\( n = 1 \\), \\( S(n) = 9 = 8 \times 1 + 1 = 8 \times T(1) + 1\\), where \\( T(1) = 1 \\) is the first triangular number, by definition. &nbsp; &#10003;

#### Inductive Step

Assume that \\( S(n) = 8 \times T(n) + 1 \\).  We need to show that \\( S(n+1) = 8 \times T(n+1) + 1 \\).

$$
\begin{align*}

S(n+1) &= S(n) + 8(n+1)           & & \text{previous proof} \\
&= (8 T(n) + 1) + 8(n+1)          & & \text{substitution of inductive hypothesis} \\
&= (8 (n(n+1)/2) + 1) + 8(n+1)    & & \text{def. of triangular number} \\
&= (4n^2 + 4n + 1) + 8(n+1)       & & \text{multiplication} \\
&= (4n^2 + 4n + 1) + 8n + 8       & & \text{distribute} \\
&= 4n^2 + 12n + 8 + 1             & & \text{commutativity and addition} \\
&= 1 (4n^2 + 12n + 8) + 1         & & \text{multiply by 1} \\
&= (2/2) (4n^2 + 12n + 8) + 1     & & \text{substitution} \\
&= 2(4n^2 + 12n + 8)/2 + 1        & & \text{commutativity} \\   
&= (8n^2 + 24n + 16)/2 + 1        & & \text{distribute} \\
&= 8 (n^2 + 3n + 2) / 2 + 1       & & \text{factor} \\
&= 8 ((n+1)(n+2)/2) + 1           & & \text{factor} \\
&= 8 ((n+1)((n+1) + 1)/2) + 1     & & \\
&= 8     T(n+1)     + 1           & & \text{def. of triangular number}

\end{align*}
$$

Thus if \\( S(n) = 8 T(n) + 1 \\), then \\( S(n+1) = 8 T(n+1) + 1 \\). &nbsp; &#10003;

#### Note

It should be noted that sometimes it's easier to work in both directions from the beginning and end toward the middle.  For instance, if factoring \\( (n^2 + 3n + 2) \\) into \\( (n+1)(n+2) \\) is difficult, but applying the [F.O.I.L. method](https://en.wikipedia.org/wiki/FOIL_method) to \\( (n+1)(n+2) \\) is easy, then working backwards may help avoid getting blocked.

### Why is all of this interesting?

The first season of *The Floor* aired over the last month.  If the show is successful, the television producers might consider adding more episodes for the next season.  Since we've proven the relationship between board size and the number of episodes, the producers could use this table and the associated formula \\( S(n) = 8 T(n) + 1 \\) to choose a board size based on the desired number of episodes while maintaining 8 eliminations per episode with no partial episodes.  

On a side note, the number 8 is interesting for TV, especially hour-long TV shows.  American TV shows typically contain about 1/3 of the air time dedicated to commercials and 2/3 dedicated to the show itself.  This means that about 40 minutes of the hour is dedicated to the show, and 8 nicely divides 40 into 5 minute segments.  So each elimination can take about 5 minutes and there's a nice timing mechanism built directly into the format of the show.  So not only are episodes nicely packed into seasons, but eliminations can occur at a regular cadence during an episode with no need to squeeze in extra eliminations into a given episode, so long as the board is an odd square.


<script type="text/javascript" id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"> </script>

<script type="text/javascript" src="{{ site.url }}/assets/20240306/snap.svg-min.js"> </script>
<script type="text/javascript" src="{{ site.url }}/assets/20240306/triangles.js"> </script>
<script>
    triangles(
        "svg_container_1", // ID of container in which to place the svg element.
        30,              // size of squares in graph paper.
        13,              // number of grid squares in each direction.
        6,               // radius of rounded rectangles.
        400              // animation duration in ms.
    );
</script>
