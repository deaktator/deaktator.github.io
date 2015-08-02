---
layout: post
title:  "Recursive Auditing"
date:   2015-08-01 14:26:26
categories: scala aloha
---

One of the really cool features of my project [Aloha](https://github.com/eharmony/aloha) is that models can return
normal scalar values or trees if the environment requires a complete 
[audit trail](https://en.wikipedia.org/wiki/Audit_trail).  When I was developing the auditing code, one of the 
requirements was using [protocol buffers](https://developers.google.com/protocol-buffers/) (*PB*) as the auditing
datastructure.  *PB* are perfectly fine and I like them just fine, but I've always thought of them as a little 
heavyweight.  Since I developed [Aloha](https://github.com/eharmony/aloha) while at [eHarmony](http://www.eharmony.com), 
using *PB* wasn't really a choice.

Since then, I was asked to 
[figure out a strategy for removing the dependency on *PB*](https://github.com/eHarmony/aloha/issues/8) in 
[aloha-core](https://github.com/eHarmony/aloha/tree/master/aloha-core).  Because the current auditing code is 
dependent on *PB*, a more generic auditing strategy is required to remove the need for, while still allowing 
*PB* as an audit trail data structure. 

### A New Generic Auditor

There are three major types we need to auditing: 

1. A key type: `K`
1. A value type: `Raw`
1. An output type: `Out`
 
In the `Auditor` trait that follows, each of these types appears as a type parameter.  Notice, there's also an
`Audited[_]` [type constructor](http://debasishg.blogspot.com/2009/01/higher-order-abstractions-in-scala-with.html) 
in the body left to be filled in by the derived classes but the implementation is known: it is equivalent in shape 
to the `Out` type parameter described above.  Now the astute programmer will say: "*Why bother? just use a 
[higher-kinded type](https://twitter.github.io/scala_school/advanced-types.html#higher) parameter and 
everything would work itself beautifully.*"  And he'd be right.  The issue is that the higher kind would have to 
be exposed in the instantiation.  This won't work for us because the `Auditor` is an integral part our API and 
while the `Auditor` will be *used inside Scala*, we want to be able to create the `Auditor` *from Java*.  To 
accomplish this, we expose the `Out` type parameter as the `audit` functions return type and then use the 
`Audited[_]` type constructor for the `cs` parameter in the second `audit` function.

{% highlight scala linenos %}
import scala.language.higherKinds

trait Auditor[K, -Raw, +Out] {
  type Audited[_]
  def audit(k: K, v: Raw): Out
  def audit[C](k: K, raw: Raw, cs: Iterable[Audited[C]]): Out
}
{% endhighlight %}

### Typed Auditor

This gets us most of the way there, but we want to be able to create new auditors with the same implementation but 
with different `Raw` types.  This will allow us to audit other types in different models.  To facilitate the 
creation of other auditors, we create the  `TypedAuditor` trait.  Notice below that typed auditors have an 
additional  [F-bounded polymorphic](http://ktoso.github.io/scala-types-of-types/#f-bounded-type) type parameter, 
`Impl`.  This allows the typed auditor to know about its own implementation which is very useful.  For instance, 
the `impl` function returns this same auditor (`this`), but with its implementation type it knows from `Impl`. 

The `typedAuditor` function is the useful function here.  It uses 
[type projection](http://ktoso.github.io/scala-types-of-types/#type-projection) involving the `AuditorImpl[_]`
type constructor that returns the `Impl` type but with a new `Raw` type.  Said another way, it returns a new typed 
auditor with the same implementation that audits a different type.  

One last thing about `typedAuditor`: notice the 
[implicit parameter](http://daily-scala.blogspot.com/2010/04/implicit-parameters.html) `a` in the definition.  The 
new typed auditor is materialized from the 
[implicit scope](http://www.artima.com/pins1ed/implicit-conversions-and-parameters.html#21.2).  The proper way to 
provide these implicits is to put the 
[implicits in the companion class](http://daily-scala.blogspot.com/2010/04/companion-object-implicits.html).  That
way, we don't need to import the implicits into the 
[implicit scope](http://www.artima.com/pins1ed/implicit-conversions-and-parameters.html#21.2).  We can also control
the auditor [domain](https://en.wikipedia.org/wiki/Domain_of_a_function) by placing type bounds on the `Raw` types 
in the implicit definitions we choose to implement. 

{% highlight scala linenos %}
import scala.language.higherKinds

trait TypedAuditor[K, -Raw, +Out, Impl <: TypedAuditor[K, Raw, Out, Impl]] 
extends Auditor[K, Raw, Out] {
  type AuditorImpl[_]
  protected[this] def impl: Impl
  final def auditor: Auditor[K, Raw, Out] = this
  final def typedAuditor[NewRaw](implicit a: Impl#AuditorImpl[NewRaw]): 
    Impl#AuditorImpl[NewRaw] = a
}
{% endhighlight %}

### A No-audit Auditor

Let's get our hands dirty with our first implementation, `NoAudit`.  This will be a no-audit auditor.  This auditor 
will just return the raw value in each of the 

Notice that we only have two type parameters: `K` and `V`.  `K` has the usual meaning.  It's the key type.  `V` is 
both the `Raw` type and the `Out` type.  Since the [identity function](https://en.wikipedia.org/wiki/Identity_function) 
is the only [automorphism](https://en.wikipedia.org/wiki/Automorphism) that applies to all 
[mathematical objects](https://en.wikipedia.org/wiki/Mathematical_object), `Audited[_]` must be the
[identity monad](http://eed3si9n.com/learning-scalaz/Id.html).  As was mentioned above in the 
[A New Generic Auditor](#a-new-generic-auditor) section, the definition of `Audited[_]` is the same in structure
as the `Out` parameter in `TypedAuditor`.  So, for the second `audit` function, `cs` has the concrete type 
`Iterable[C]`.  The type of `cs` doesn't really matter though, since `NoAudit` doesn't maintain the audit trail but 
just returns the value `v` passed to it.

{% highlight scala linenos %}
import scala.annotation.implicitNotFound
import scala.language.higherKinds

@implicitNotFound(msg = "Cannot find NoAudit[${K}, V=${V}] because ${V} doesn't extends AnyVal.\nEnsure V extends AnyVal.")
final case class NoAudit[K, @specialized V]() 
extends TypedAuditor[K, V, V, NoAudit[K, V]] {
  type Audited[A] = A
  type AuditorImpl[A] = NoAudit[K, A]
  def audit(k: K, v: V): V = v
  def audit[C](k: K, v: V, cs: Iterable[Audited[C]]): V = v
  protected[this] def impl: NoAudit[K, V] = this 
}

object NoAudit {
  implicit def get[K, V <: AnyVal]: NoAudit[K, V] = new NoAudit[K, V]
}
{% endhighlight %}

One last detail about `NoAudit`.  Notice in the `NoAudit` companion object, where we specify `get` that the domain 
of `V` must be a subtype of `AnyVal`.  This is merely for pedagogical purposes.  See what happens when we try to
invoke `typedAuditor[String]`.  We can't do this because String isn't an AnyVal.  See the 
[REPL](https://en.wikipedia.org/wiki/Read–eval–print_loop) session below.

{% highlight scala %}
scala> val nald = NoAudit[Long, Double]
nald: NoAudit[Long,Double] = NoAudit()

scala> nald.typedAuditor[String]
<console>:18: error: Cannot find NoAudit[Long, V=String] because String doesn't extends AnyVal.
Ensure V extends AnyVal.
              nald.typedAuditor[String]
                               ^
{% endhighlight %}

### A Tree Auditor

Let's create an auditor that uses the following definition of a tree.  This tree is a little different from usual
because the root of the tree is typed but the descendants are not.  Nodes also have keys.  The design goals for this 
tree are:

1. We want to be able to retrieve the root and know its type (because the root is the top-level value).
1. We care about the string representation of the entire tree but not about the specific descendant types.

{% highlight scala linenos %}
import scala.language.higherKinds

trait Tree[K, +A] {
  def id: K
  def value: A
  def desc: Iterable[Tree[K, _]] // Descendants
}

case class Leaf[K, +A](id: K, value: A) extends Tree[K, A] {
  def desc: Iterable[Tree[K, _]] = Iterable.empty
}

case class Node[K, +A](id: K, value: A, desc: Iterable[Tree[K, _]]) 
extends Tree[K, A]
{% endhighlight %}

We can create the auditor as follows.  Notice `V` is the `Raw` type and `Tree[K, V]` is the `Out` type.  So the 
purpose of this auditor is to *lift values into trees!*

{% highlight scala linenos %}
import scala.language.higherKinds
import scala.collection.{ immutable => sci }

case class TreeAuditor[K, V]() 
extends TypedAuditor[K, V, Tree[K, V], TreeAuditor[K, V]] {
  type Audited[B] = Tree[K, B]
  type AuditorImpl[R] = TreeAuditor[K, R]
  def audit(k: K, v: V): Tree[K, V] = Leaf(k, v)
  def audit[C](k: K, v: V, cs: Iterable[Audited[C]]): Tree[K, V] = 
    Node(k, v, cs)
  protected[this] def impl: TreeAuditor[K, V] = this 
}

object TreeAuditor {
  implicit def anyVal[K, R <: AnyVal]: TreeAuditor[K, R] = 
    TreeAuditor[K, R]
  implicit def serial[K, R <: java.io.Serializable]: TreeAuditor[K, R] = 
    TreeAuditor[K, R]
}
{% endhighlight %}

Let's audit.  Here's another REPL session.  Look at how, given a bunch of tree auditors that audit different types, 
we can call audit to build up bigger trees.  Also, we'll ensure that auditing is type safe.

{% highlight scala %}
scala> val tali = TreeAuditor[Long, Int]
tali: TreeAuditor[Long,Int] = TreeAuditor()

scala> val tald = tali.typedAuditor[Double]
tald: TreeAuditor[Long,Int]#AuditorImpl[Double] = TreeAuditor()

scala> val tals = tali.typedAuditor[String]
tals: TreeAuditor[Long,Int]#AuditorImpl[String] = TreeAuditor()
{% endhighlight %}

Notice if we try to audit an incorrect type, we get a compilation error.

{% highlight scala %}
scala> tald.audit(1L, "")
<console>:22: error: type mismatch;
 found   : String("")
 required: Double
              tald.audit(1L, "")
                             ^
{% endhighlight %}

Here we audit two different values, `a1` and `a2`, of different types to create tree leaves then create a bigger 
tree, `a3`, by calling the `audit` function that allows for incorporating the descendants.  

{% highlight scala %}
scala> val a1 = tald.audit(1L, 1.0)
a1: Tree[Long,Double] = Leaf(1,1.0)

scala> val a2 = tals.audit(2L, "2")
a2: Tree[Long,String] = Leaf(2,2)

scala> val a3 = tali.audit(3L, 3, Vector(a1, a2))
a3: Tree[Long,Int] = Node(3,3,Vector(Leaf(1,1.0), Leaf(2,2)))
{% endhighlight %}

Finally, let's look at the types of the descendants once they are incorporated into the larger tree.

{% highlight scala %}
scala> val desc = a3.desc
desc: Iterable[Tree[Long, _]] = Vector(Leaf(1,1.0), Leaf(2,2))

scala> val firstDescendant = desc.head
firstDescendant: Tree[Long,Any] = Leaf(1,1.0)
{% endhighlight %}

### Calling from Java

This is all well and good, but have we violated our goal to be able to instantiate auditors from Java?  Nope:

{% highlight scala %}
public final void example() {
  final TypedAuditor<String, 
                     Long, 
                     Tree<String, Long>, 
                     TreeAuditor<String, Long>> 
    auditor = new TreeAuditor<String, Long>();
}
{% endhighlight %}

We can pass `auditor` to Scala and let Scala call `impl` or `typedAuditor` to get back a `TreeAuditor` with the 
desired output type.

### Final Thoughts

We have shown how to create a generic auditing framework that can audit using any recursive (tree-like) type.
All that needs to be done to adapt it to your type is to write an implementation that extends `TypedAuditor`
and provide the definitions in the companion object.  But "*that's left as an exercise for the reader ...*"
