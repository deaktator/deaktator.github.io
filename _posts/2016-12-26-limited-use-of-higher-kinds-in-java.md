---
layout: post
title:  "Limited use of higher kinds in Java"
date:   2016-12-28 18:56:00
categories: programming java scala APIs OOP
---

While developing the new [APIs](https://en.wikipedia.org/wiki/Application_programming_interface) for the machine learning library [Aloha](https://github.com/eHarmony/aloha), I wanted to make use of [higher kinds](http://stackoverflow.com/questions/6246719/what-is-a-higher-kinded-type-in-scala) to make the APIs more elegant.  The problem is that support for higher kinds at the [JVM](https://en.wikipedia.org/wiki/Java_virtual_machine)-level is non-existent.  This is a shame because there was an article, [Adding Type Constructor Parameterization to Java](http://www.jot.fm/issues/issue_2008_06/article2.pdf), published in 2007 in the *Journal of Object Technology* that outlined a proposal to extend Java to handle higher kinds.  This proposal was never incorporated into the language.  For those unfamiliar or interested in reading more about higher kinds in Scala, see:

> Adriaan Moors, Frank Piessens, Martin Odersky:
> [Generics of a higher kind](https://adriaanm.github.io/files/higher.pdf).
> OOPSLA 2008: 423-438

I've had experience writing Scala APIs that include higher kinds.  This is fine when the libraries are consumed by Scala code because of the support for such language features.  Unfortunately, I didn't anticipate the desire to use the library from Java and **this turned out to be a nightmare**.

So, this time around, I wanted to make sure that things would go more smoothly because Aloha really needs to work in Scala *and Java*.  But what can we do?


## API Goals

1. Make models generic in their input and output types.
1. Use [recursive auditing]({{ site.url }}/2015/08/01/recursive-auditing/) to transform raw (*natural*) model output to audited output.
1. Be able to **easily** use *and construct* models in both Scala *and Java*.


## Desired Model API

Ideally, we'd like to have the model interface look like the following:

{% highlight scala %}
/**
  * @tparam A model input type (covariate data)
  * @tparam N natural output type.
  * @tparam AUD type constructor provided by an auditor
  */
trait Model[AUD[+_], -A, +N] extends (A => AUD[N])
{% endhighlight %}

Here, the type constructor `AUD` represents an auditor that takes one type parameter, as is evidenced by the single underscore, and is [covariant](https://en.wikipedia.org/wiki/Covariance_and_contravariance_%28computer_science%29) in its type parameter (*that's what the* `+` *means*).  This is simple and concise, but when the JVM byte code is emitted by the Scala compiler, the resulting Java code looks like:

{% highlight java %}
public abstract interface Model<AUD, A, N>
extends scala.Function1<A, AUD> {}
{% endhighlight %}

Because Java doesn't support higher kinds, the type constructor `AUD` doesn't appear as desired.  Instead of appearing as a parameterized type, it appears as a naked type parameter.  So, again what can we do to fix this?


## Use a simpler model interface

{% highlight scala %}
trait Model[-A, +B] extends (A => B)
{% endhighlight %}


## Create a higher kind interface

Instead of including a type constructor directly in the `Model` trait, we can create a trait that *contains* a type constructor with one type parameter

{% highlight scala %}
trait TypeCtor1 {
  type TC[+A]
}
{% endhighlight %}

When compiled with `scalac` and decompiled with `javap`, we see that a simple [marker interface](https://en.wikipedia.org/wiki/Marker_interface_pattern) is produced.

{% highlight java %}
public interface TypeCtor1 {}
{% endhighlight %}


## A more complex model interface behind the scenes

{% highlight scala %}
trait AuditedModel[T <: TypeCtor1, N, -A, +B <: T#TC[N]]
extends Model[A, B]
{% endhighlight %}

Notice that we use higher kinds to enforce [upper type bounds](http://docs.scala-lang.org/tutorials/tour/upper-type-bounds.html) but not specifically as an exact type.  This is acceptable.  The bound is enforced in Scala but in Java it is omitted because the constructed type resolves to `Object`, which is the [top type](https://en.wikipedia.org/wiki/Top_type) in Java.  Luckily, while the model implementations may be used from Java, they will most likely be defined in Scala.


## Auditor interface

{% highlight scala %}
trait Auditor[-K, T <: TypeCtor1, A, +B <: T#TC[A]] {
  // Method signatures omit a few parameters in this post for brevity.

  def success[S](key: K, value: A, subValues: Seq[T#TC[S]] = Nil): B
  def failure[S](key: K, subValues: Seq[T#TC[S]] = Nil): B
}
{% endhighlight %}

So we have an interface (*trait in Scala*) but what does an actual implementation look like?  For Scala `Option`s, we can create an `Auditor` implementation that looks like:


## Create an Auditor implementation for Option

{% highlight scala %}
import OptionAuditor.OptionTC

case class OptionAuditor[A]()
extends Auditor[ModelId, OptionTC, A, Option[A]] {
  def success[S](key: ModelId, value: A, subValues: Seq[Option[S]] = Nil) =
    Option(value)
  def failure[S](key: ModelId, subValues: Seq[Option[S]] = Nil) = None
}

object OptionAuditor {
  sealed trait OptionTC extends TypeCtor1 {
    override type TC[+A] = Option[A]
  }
}
{% endhighlight %}

`ModelId` is an identifier to models.  It contains a numeric ID and a model name.

## A simple model: ConstantModel

Let's create perhaps the simplest model: one that is invariant to the input (*i.e.* just returns a constant).

{% highlight scala %}
case class ConstantModel[T <: TypeCtor1, N, +B <: T#TC[N]](
    modelId: ModelId,
    constant: N,
    auditor: Auditor[ModelId, T, N, B])
extends AuditedModel[T, N, Any, B] {
  def apply(a: Any): B = auditor.success(modelId, constant)
}
{% endhighlight %}

This is nice and easy but notice it's a little verbose.  The `B` type parameter could have been omitted if the library was intended to be used solely in Scala. This would however cause problems in Java, so the `B` type parameter is retained. Calling is easy too and doesn't require any type parameters in Scala or the Java constructor.  The types are required for the variable definition in Java, but that's to be expected and an IDE can correctly infer the types automatically.

### Calling in Scala
{% highlight scala %}
val cm1 = ConstantModel(ModelId(1, "name 1"), 1, OptionAuditor[Int])
{% endhighlight %}

### Calling in Java
*With the diamond operator, the types can be inferred.*

{% highlight scala %}
ConstantModel<OptionAuditor.OptionTC, Integer, scala.Option<Integer>> cm2 =
  ConstantModel<>(new ModelId(2, "name 2"), 1, new OptionAuditor<Integer>());
{% endhighlight %}

## But why the T parameter?

So, some of the benefit of having the type constructor type parameter `T` is already apparent.  It enforces the upper type bound of `B` in a model using the type constructor (at least in Scala).  In Java, this is omitted because of the lack of support for higher kinds.  It is actually more useful than that though. It can also ensure that in hierarchical models (models that contain other models) all models have the same type constructor, dictated by the `Auditor`.  For instance, let's create another model implementation that contains a model.

{% highlight scala %}
case class HierarchicalConstantModel[T <: TypeCtor1, SN, N, -A, +B <: T#TC[N]](
    modelId: ModelId,
    constant: N,
    sub: Model[A, T#TC[SN]],
    auditor: Auditor[ModelId, T, N, B]
 ) extends AuditedModel[T, N, A, B] {
  def apply(a: A): B = auditor.success(modelId, constant, Seq(sub(a)))
}
{% endhighlight %}

Again, this works well in Scala.  There is somewhat of a problem in Java because of the higher-kinded type in the `sub` parameter. To get around this, we can create a companion object, add factory methods and make the constructor private to enforce that the model is only instantiated via the factory.

{% highlight scala %}
object HierarchicalConstantModel {
  // This isn't necessarily generated as a static Java method.
  def apply[T <: TypeCtor1, SN, SB <: T#TC[SN], N, A, B <: T#TC[N]](
      modelId: ModelId,
      constant: N,
      auditor: Auditor[ModelId, T, N, B])(
      sub: Model[A, SB]
  ): HierarchicalConstantModel[T, SN, N, A, B] =
    new HierarchicalConstantModel[T, SN, N, A, B](
      modelId,
      constant,
      sub.asInstanceOf[Model[A, T#TC[SN]]], // cast OK b/c bound & variance.
      auditor)

  // A static Java factory method.
  def createFromJava[T <: TypeCtor1, SN, SB <: T#TC[SN], N, A, B <: T#TC[N]](
      modelId: ModelId,
      constant: N,
      auditor: Auditor[ModelId, T, N, B],
      sub: AuditedModel[T, SN, A, SB]
  ): HierarchicalConstantModel[T, SN, N, A, B] =
    apply[T, SN, SB, N, A, B](modelId, constant, auditor)(sub)
}
{% endhighlight %}

There are a couple of things to notice here.  The first is that the Scala factory method, `apply`, has two parameter lists.  This makes type inference work properly so that no type parameters need to be specified during construction.  This is because the `T` appears in the first parameter list and the output type of the `sub` model is dependent on `T`.  

In the Java factory method, notice that `sub` has a different type.  It is an `AuditedModel`.  This is done so that the `T` type parameter can be used to validate that `sub` and `auditor` have the same type constructor.  This is important because it allows the Java compiler to catch typing issues.  When the higher kinds appear as type upper bounds in the signature of the Java factory method, they are omitted in Java code that is emitted.  The important thing is that the remaining type parameters line up and that we can get some type checking to catch typing issues on the Java side.  This isn't perfect, but it works well in practice.

### Calling in Scala

{% highlight scala %}
val cm = ConstantModel(ModelId(1, "name 1"), 1, OptionAuditor[Int])
val constant = 2f
val id2 = ModelId(2, "name 2")
val m = HierarchicalConstantModel(id2, constant, OptionAuditor[Float])(cm)
{% endhighlight %}

### Calling in Java

{% highlight java %}
ModelId id1 = new ModelId(1, "name 1");

ConstantModel<OptionTC, Integer, Option<Integer>> cModel =
  new ConstantModel<>(id1, 1, cmAud);

Float constant = 2f;
OptionAuditor<Float> aud = new OptionAuditor<>();
ModelId id2 = new ModelId(2, "name 2");

// These parameter types are inferred.
HierarchicalConstantModel<OptionTC, Integer, Float, Object, Option<Float>> m =
  HierarchicalConstantModel.createFromJava(id2, constant, aud, cModel);
{% endhighlight %}

## What we've learned

Higher kinds in Scala libraries should be avoided in top level APIs that may be called in Java.  If however, a method only depends on a higher kind as an upper type bound for its input parameters, we can use an interface like `TypeCtor1` to codify the type constructor in Java and the types in Java work out "*for the most part*."  While the type bounds are not necessarily respected in Java, at least the types of input parameters can be properly inferred.  When using type constructors in APIs, the resulting values' types in Java won't be properly parameterized and will need to be cast to ensure the values have the proper types.  Alternatively, when using a trait or interface that extends `TypeCtor1` to represent the type constructor and using redundant type parameters in the interface to represent both the type passed to the type constructor and the resulting type, the results are properly typed in Java and not only don't need to be cast, but they can also be properly inferred by the Java compiler.  ***This is a huge win!***

## Conclusion

In the [OOP](https://en.wikipedia.org/wiki/Object-oriented_programming) community people preach often programming to an
[interface](https://en.wikipedia.org/wiki/Interface_%28computing%29#Software_interfaces_in_object-oriented_languages).  I think this is important to good software development, but there's more to API design than just designing good interfaces.  For instance, looking at the API documentation for a [String](http://docs.oracle.com/javase/7/docs/api/java/lang/String.html) in [Java](https://en.wikipedia.org/wiki/Java_%28programming_language%29), it's apparent that a considerable portion of the documentation is dedicated to method signatures of the [constructors](https://en.wikipedia.org/wiki/Constructor_%28object-oriented_programming%29).  Interfaces are nice because they provide type descriptions and thus provide a description of how such software components are to be *used*.  In OOP, constructors (*and factory methods*) determine how components *should be created*.  In languages like Java, constructor signatures are not part of an interface but are equally as important to the API as methods defined in an interface.  To the author, it's important that models in Aloha are easy to use and construct in both Scala and Java.  This new Aloha model API, while slightly less elegant than an API designed solely for use in Scala, meets all of the design goals: models are sufficiently generic, outputs can be audited recursively, and models are easy to use and construct in Scala and Java.  Type inference allows users to define and use models without specifying type parameters, which hopefully will lead to a more enjoyable experience using Aloha.
