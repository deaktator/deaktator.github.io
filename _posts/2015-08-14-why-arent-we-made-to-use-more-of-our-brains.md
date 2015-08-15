---
layout: post
title:  "Why Aren't We MADE to Use More of Our Brains?"
date:   2015-08-14 19:16:00
categories: stats machine-learning
---

Yesterday I was watching [Lucy](http://www.imdb.com/title/tt2872732/), the 
[Luc Besson](http://www.imdb.com/name/nm0000108/) film about a woman, [Lucy](http://www.imdb.com/name/nm0424060/), 
who develops the ability to use 100% of her brain power.  While I was watching, my wife asked why we don't use more 
of our brain's processing power at any one time.  I think it was kind of a hypothetical but I said, *that's 
interesting,  I've got a [paper](http://jmlr.org/proceedings/papers/v37/germain15.pdf) on my iPad about that right 
now!*
 
I would like to note that I am not a cognitive scientist nor an expert in biologically inspired systems, but I do 
enjoy exploring the topic through reading and going to some of the [ICML](http://icml.cc/) workshops.  When I was 
looking at the [2015 ICML accepted papers](http://jmlr.org/proceedings/papers/v37/) list this year (2015), I was 
extremely interested in 
[*MADE: Masked Autoencoder for Distribution Estimation*](http://jmlr.org/proceedings/papers/v37/germain15.pdf) by 
Germain *et al*. 

The paper starts with the definition of an [autoencoder](http://deeplearning.net/tutorial/dA.html#autoencoders), which
is a [neural network](https://en.wikipedia.org/wiki/Artificial_neural_network) with one hidden layer where the 
goal is for the output layer to learn to output the same values that are passed to the input layer while minimizing
[reconstruction error](http://users.ics.aalto.fi/harri/dityo/node6.html).  Or, with equations:

$$
\begin{aligned}
\textbf{h} \left( \textbf{x} \right) &= \textbf{g} \left( \textbf{b}+\textbf{Wx} \right) \\
\hat { \textbf{x} } &= \text{sigm}\left( \textbf{c} + \textbf{Vh}\left( \textbf{x} \right) \right) 
\end{aligned}
$$
 
where the first equation indicates a non-linear activation function ( $$\textbf{g}$$ ) is applied to an 
[affine transformation](https://en.wikipedia.org/wiki/Affine_transformation) of the input data.  This forms the data
at the hidden layer.  In the second equation, the [sigmoid function](https://en.wikipedia.org/wiki/Sigmoid_function) 
is applied to an affine transformation of the hidden layer values produced by the first equation.  The number of 
nodes in the input and output layer is the same. Typically, the number of nodes in the hidden layer is less than 
the number of nodes in the input and output layer, but this is not a requirement by any means.  Pictorially, this
might look something like:

![Autoencoder picture](http://kiyukuta.github.io/_images/autoencoder.png "Autoencoder")

The paper then shows how to modify of the standard autoencoder to create a
[joint probability distribution](https://en.wikipedia.org/wiki/Joint_probability_distribution) estimator.  The first
step to doing this is recognizing that the probability calculations can be factored into the product of conditional
probabilities via the [probability product rule](https://en.wikipedia.org/wiki/Chain_rule_\(probability\)):

$$ p\left( x \right) =\prod _{ d=1 }^{ D }{ p\left( { { x }_{ d } }|{ { \textbf{x} }_{ <d } } \right)  }  $$

An example of this might be: 

$$ p\left( { x }_{ 1 },{ x }_{ 2 },{ x }_{ 3 } \right) =p\left( { x }_{ 1 } \right) p\left( { { x }_{ 2 } } \mid { x }_{ 1 } \right) p\left( { { x }_{ 3 } } \mid { x }_{ 1 },{ x }_{ 2 } \right) $$  

Now, we know what the **ADE** in **MADE** stand for in the paper title, and it's time to expound upon the **M**, 
which is the real meat of the paper. **M**, as the title 
[*MADE: Masked Autoencoder for Distribution Estimation*](http://jmlr.org/proceedings/papers/v37/germain15.pdf)
implies, stands for [masking](https://en.wikipedia.org/wiki/Mask_\(computing\)).  The key to the paper is 
the development of clever masking matrices for the encode and decode phases of the autoencoder.  Once we have the 
masking matrices, this is a straightforward modification to the first set of equations listed above: 
 
$$
\begin{aligned}
\textbf{h} \left( \textbf{x} \right) &= \textbf{g} \left( \textbf{b} + \left( \textbf{W}  \odot { \textbf{M} }^{ \textbf{W} } \right) \textbf{x} \right) \\
\hat { \textbf{x} } &= \text{sigm}\left( \textbf{c} + \left( \textbf{V}  \odot { \textbf{M} }^{ \textbf{V} } \right) \textbf{h}\left( \textbf{x} \right) \right) 
\end{aligned}
$$
  
where $$ \odot $$ represents the [Hadamard product](https://en.wikipedia.org/wiki/Hadamard_product_\(matrices\)).
The key is the form of the masking matrices $$ { \textbf{M} }^{ \textbf{W} } $$ and $$ { \textbf{M} }^{ \textbf{V} } $$,
which are used to remove connections from the input to the hidden layer, and from the hidden layer to the output 
layer, respectively.  These connections are removed so that each input is reconstructed only from previous inputs 
in a given ordering.  This is exactly the condition that was required above in the factoring of the joint 
probability into a product of conditional probabilities.  For more details on constructing the masks, see the 
[paper](http://jmlr.org/proceedings/papers/v37/germain15.pdf).

The interesting thing is that by disabling certain connections in the neural network, the authors divised a way of 
learning joint probability distributions.  That's interesting.  *Again*, I'm not suggesting that this is biologically 
inspired.  I don't know if the brain disables synaptic pathways in order to calculate joint probability distributions.
But I do think it's an interesting thought.

## References

Mathieu Germain, Karol Gregor, Iain Murray, Hugo Larochelle:
[*MADE: Masked Autoencoder for Distribution Estimation*](http://jmlr.org/proceedings/papers/v37/germain15.pdf). ICML 2015: 881-889


<script type="text/javascript" src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"></script>
