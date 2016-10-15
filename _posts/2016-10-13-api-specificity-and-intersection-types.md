---
layout: post
title:  "API Specificity and Intersection Types"
date:   2016-10-13 20:21:00
categories: java scala mwt
---

The other day I was talking to my colleague about an elegant way to convert a Java array to an
`ArrayList`.  For some reason, this immediately set off red flags in my head.  As you'll see in
the chat log below, I immediately responded with a barrage of questions.

<br />

![Chat about transforming to an ArrayList]({{ site.url }}/assets/20161013/chat_conv.png)

<br />

[Aloha](https://github.com/eharmony/aloha), the machine learning and feature extraction
library I wrote, has integrations with Microsoft's
[Multiworld Testing (*MWT*)](http://mwtds.azurewebsites.net) 
[java library](https://github.com/Microsoft/mwt-ds-explore-java) to help with the logging of
[exploration](http://webdocs.cs.ualberta.ca/~sutton/book/ebook/node7.html) data.  When my
colleague mentioned [Vowpal Wabbit](https://github.com/JohnLangford/vowpal_wabbit/wiki)'s
[ActionProbs](https://github.com/JohnLangford/vowpal_wabbit/blob/master/java/src/main/java/vowpalWabbit/responses/ActionProbs.java), 
I realized that he was referring to the interactions with the
[MWT](http://mwtds.azurewebsites.net) code.  

## The Setup
My curiosity got the best of me and I had to see what he was talking about.  So I searched
through [MWT](https://github.com/Microsoft/mwt-ds-explore-java) and found the 
[Scorer](https://github.com/Microsoft/mwt-ds-explore-java/blob/master/src/main/java/com/mwt/scorers/Scorer.java) 
interface: 

{% highlight java %}
public interface Scorer<T> {
  java.util.ArrayList<Float> scoreActions(T context);
}
{% endhighlight %}

After staring at the 
[Scorer](https://github.com/Microsoft/mwt-ds-explore-java/blob/master/src/main/java/com/mwt/scorers/Scorer.java)
interface for a second or two, I thought "*why?*", echoing back to the chat I just had.  I was 
thinking "*it's weird how specific this API is*".  There's no reason that one could possibly
need an `ArrayList` at an API level.  The [OOP](https://en.wikipedia.org/wiki/Object-oriented_programming)
programmer in me thought "*no one should care that much about the implementation of a list.*"
What the user really cares about is a [random access](https://en.wikipedia.org/wiki/Random_access)
`List`.

## The Problem

In [OOP](https://en.wikipedia.org/wiki/Object-oriented_programming) languages like Java, we often
hear about 
[programming to an interface](http://stackoverflow.com/questions/383947/what-does-it-mean-to-program-to-an-interface#384067).
This is very common but it starts to break down when we want to program to multiple interfaces.
Fortunately Java has *some* support for intersection types. By intersection types, I mean
[multiple inheritance](https://en.wikipedia.org/wiki/Multiple_inheritance).  While Java (before 
Java 8) only allows single inheritance, there is limited support for describing classes that
implement multiple interfaces. This is pretty seamless when passing an argument with an 
intersection type **to a function**, but this seems much more problematic when trying to return 
a value **from a function**.  For instance the following works (in Java 6+):

{% highlight java %}
import java.util.List;
import java.util.RandomAccess;
<L extends List<Float> & RandomAccess> int listSize(final L lst) {
  return lst.size();
}
{% endhighlight %}

Here the function accepts any [random access](https://en.wikipedia.org/wiki/Random_access) `List`, 
just like we wanted, and returns the size of the list.  But how do we return an intersection type?
I don't think it's really possible to do in a generic way.  This is a deficiency in the Java 
language but makes sense since Java only allowed single inheritance.  An astute programmer will 
notice things in the Java standard library like 
[java.util.Arrays.asList](http://docs.oracle.com/javase/7/docs/api/java/util/Arrays.html#asList\(T...\)),
which returns a regular `List` but states in the javadoc,

> The returned list is serializable and implements RandomAccess.

This is not, however, codified at the *type-level*, which should be disconcerting to anyone 
who has ever noticed a disparity over time between API documentation and the code it professes 
to document.  As a consequence, we cannot do something like:

{% highlight java %}
listSize(java.util.Arrays.asList("one", "two"))
{% endhighlight %}

The best partial workaround that I can find is to add a type parameter to the class or interface 
containing the method with an intersection type as a return type.  For instance, we could change
the [Scorer](https://github.com/Microsoft/mwt-ds-explore-java/blob/master/src/main/java/com/mwt/scorers/Scorer.java) 
interface from above to be:

{% highlight java %}
import java.util.List;
import java.util.RandomAccess;
public interface Scorer<T, L extends List<Float> & RandomAccess> {
  L scoreActions(T context);
}
{% endhighlight %}

but this introduces a new type parameter which may be undesirable and it falls short in at least 
two ways.  It doesn't alleviate the programmer's burden of specifying a concrete implementation 
because he would still have to write something like:

{% highlight java %}
import java.util.ArrayList;
import java.util.RandomAccess;
public interface MyScorer extends <Float[], ArrayList<Float>> {
  ArrayList<Float> scoreActions(Float[] context) { 
    // ...
  }
}
{% endhighlight %}

where `ArrayList` again appears in the type signatures.  This is because while type bounds can be
encoded using intersection types, the concrete type cannot be specified as an intersection type. 
The second way in which this strategy falls short is in static methods.  This doesn't help static 
methods in any way.  As a *hackish* workaround, one could move the type parameter encoding the 
intersection type to the method.  This seems like a faux pas because the return value must be cast
and the Java compiler will issue an "*Unchecked cast*" warning, indicating this may result in future
issues.  And this is indeed possible here.  Any API user could inadvertently subvert the benefits 
of this strategy by supplying a valid type argument to the method, which adheres to the type bounds,
but that disagrees with the actual type of the value returned by the method.  In which case, a 
`ClassCastException` will be thrown. For instance, given a method:

{% highlight java %}
import java.util.List;
import java.util.ArrayList;
import java.util.RandomAccess;

public <L extends List<Float> & RandomAccess> L scoreActions(float... fs) {
  final ArrayList<Float> floatsList = new ArrayList<Float>(fs.length);
    for (float f: fs)
      floatsList.add(f);
    return (L) floatsList;  // Compiler issues "Unchecked cast" warning.
}
{% endhighlight %}

the following results in the throwing of a `ClassCastException`:

{% highlight java %}
<it.unimi.dsi.fastutil.floats.FloatArrayList>scoreActions(1f, 2f).get(0); 
{% endhighlight %}

If the API user swears on his honor not to be a bad actor, this could potentially be useful because 
functions returning insection types could be interleaved with functions that accept them without ever
having to provide type arguments.  For instance, the following is valid: 

{% highlight java %}
listSize(scoreActions(1f, 2f))
{% endhighlight %}

*BUT* the whole point of this article, and for that matter type systems themselves, is that APIs 
and interactions with APIs shouldn't involve an honor system, but rather, should be encoded in 
the type signatures provided by the API.

So while APIs like the
[Scorer](https://github.com/Microsoft/mwt-ds-explore-java/blob/master/src/main/java/com/mwt/scorers/Scorer.java)
API are most likely too precise and APIs like `Arrays.asList` are imprecise, providing the 
proper amount of precision is difficult in Java when it involves the interaction of two or more 
orthogonal interfaces.  So what can be done? 

## The Punchline

*Switch to Scala!*

[Scala](http://www.scala-lang.org), which runs on the JVM, has much better facilities for such types
due to support for [multiple inheritance](https://en.wikipedia.org/wiki/Multiple_inheritance) and 
[mixin composition](https://en.wikipedia.org/wiki/Mixin).  So while properly encoding these APIs in
Java was hard, it's rather easy in Scala.

{% highlight scala %}
import java.util.{Arrays, ArrayList, LinkedList, List => JList, RandomAccess}

trait Scorer[A] {
  // Easily return an intersection type.
  def scoreActions(context: A): JList[Float] with RandomAccess
}

// Easily require an intersection type for an argument.
def listSize(lst: JList[Float] with RandomAccess): Int = lst.size
{% endhighlight %}

And using the APIs is easy too (as shown in the Scala [REPL](https://en.wikipedia.org/wiki/Read–eval–print_loop)).
Types that don't adhere to the full type constraint are disallowed, like in the following since
`LinkedList` is not a `RandomAccess` list:

{% highlight scala %}
scala> listSize(new LinkedList[Float])
<console>:12: error: type mismatch;
 found   : java.util.LinkedList[Float]
 required: java.util.List[Float] with java.util.RandomAccess
              listSize(new LinkedList[Float])
                       ^
{% endhighlight %}

And ones that do adhere are successfully accepted like in the case of `java.util.ArrayList` (which 
is a random access list): 

{% highlight scala %}
scala> listSize(new ArrayList[Float])
res1: Int = 0
{% endhighlight %}

## Final Thoughts

It's important to think about the specificity of APIs and only require of the user what is 
necessary.  Presumably this should involve 
[programming to interfaces](http://stackoverflow.com/questions/383947/what-does-it-mean-to-program-to-an-interface#384067),
but this is rather hard to guarantee at the *type-level* in Java.  This has led to Java APIs that are
either too specific or rely on the honor system rather than the contractual requirements of the APIs
themselves.  A richer type system like Scala's type system can overcome these deficiencies, thereby 
allowing API developers to ask for no more than is necessary (even when requesting multiple orthogonal 
constraints).  The ultimate consequence is that API developers will develop more general libraries and will 
avoid pigeonholing API users into specific implementations.  This really seems like a win-win situation.
