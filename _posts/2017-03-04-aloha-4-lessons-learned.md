---
layout: post
title:  "Aloha&nbsp;4: Lessons Learned"
date:   2017-03-04 15:34:00
categories: programming java scala APIs
---

In this post, I'll compare the new (post v4) and old (pre v4) versions of the
[Aloha](https://github.com/eharmony/aloha) code bases and try to give some
motivation for the changes.  I'll hopefully provide a little insight along the
way and describe the direction I would like to see
[Aloha](https://github.com/eharmony/aloha) progress towards in the future.

With the release of [Aloha](https://github.com/eharmony/aloha) 4.0.0 to  [Central](https://search.maven.org/#search%7Cga%7C1%7Cg%3A%22com.eharmony%22%20AND%20v%3A%224.0.0%22), I managed to incorporate a lot of changes that I've wanted to include
for a long time.  The main improvements included in
[Aloha](https://github.com/eharmony/aloha) 4 are:

- Simplified [ModelFactory](https://github.com/eHarmony/aloha/blob/master/aloha-core/src/main/scala/com/eharmony/aloha/factory/ModelFactory.scala) creation and usage.
- Drastically simplified [Model](https://github.com/eHarmony/aloha/blob/master/aloha-core/src/main/scala/com/eharmony/aloha/models/Model.scala) APIs.
- Inclusion of [Auditor](https://github.com/eHarmony/aloha/blob/master/aloha-core/src/main/scala/com/eharmony/aloha/audit/Auditor.scala)s, a score [decorator](https://www.gofpatterns.com/structural-design-patterns/structural-patterns/decorator-pattern.php) based on a variation of my [Recursive Auditing](http://deaktator.github.io/2015/08/01/recursive-auditing/) post.
- Modularization of model I/O types requiring additional software dependencies.

### *A Note About Types*

In this post, the code has the following type parameters, with the associated
meanings:

- `U`: The [upper type bound](http://docs.scala-lang.org/tutorials/tour/upper-type-bounds.html)  of a model's codomain, `B`.
- `N` The natural output type of a model.  For instance, a regression model has a real-valued output type.  In [Aloha](https://github.com/eharmony/aloha), this is a `Double`.  Other model types have flexible output types, such as decision trees which can have any natural output type.
- `A` The domain of a model.
- `B` The codomain of a model, upper bounded by `U`.

## Simplified Model Factories

### Pre 4.0.0 Model Factories

In [Aloha](https://github.com/eharmony/aloha) 3, model factories could create
models by calling the `getModel` method with the appropriate type parameters and
implicit parameters or by creating a `TypedModelFactory` capable of only
producing models with one specific input and output type.  

{% highlight scala %}
case class ModelFactory(modelParsers: ModelParser*) {

  // Directly get a model of the desired type.
  def getModel[A: RefInfo, B: RefInfo: JsonReader: ScoreConverter](
      json: spray.json.JsValue,
      semantics: Option[com.eharmony.aloha.semantics.Semantics[A]] = None
  ): Try[Model[A, B]]

  // Get a typed model factory that returns models of the desired type.
  def toTypedFactory[A: RefInfo, B: RefInfo: JsonReader: ScoreConverter](
      semantics: com.eharmony.aloha.semantics.Semantics[A]
  ): TypedModelFactory[A, B]
}
{% endhighlight %}

{% highlight scala %}
case class TypedModelFactory[
  A: RefInfo,
  B: RefInfo: JsonReader: ScoreConverter
]( // ...
) {
  def fromString(s: String): Try[Model[A, B]]

  // AND MANY OTHER FACTORY METHODS:
  // def fromXyz(xyz: Xyz): Try[Model[A, B]]
}
{% endhighlight %}

### 4.0.0 Model Factories

Prior to [Aloha](https://github.com/eharmony/aloha) 4, `ModelFactory` was
more flexible than `TypedModelFactory`, but this flexibility is not strictly
necessary.  After Aloha was in the wild for an extended amount of time, this
additional flexibility was found to be unnecessary, especially in a world
dominated by micro services.  Since minimizing the number of ways to use the library
minimizes the footprint and a smaller footprint is easier to maintain, I decided
the notion of an untyped model factory was unnecessary and it was removed in
[Aloha](https://github.com/eharmony/aloha) 4.  Instead,
[`ModelFactory[A,B]`](https://github.com/eHarmony/aloha/blob/master/aloha-core/src/main/scala/com/eharmony/aloha/factory/ModelFactory.scala)
was made a sealed, abstract base class for which there is one implementation,
[`ModelFactoryImpl[U,N,A,B]`](https://github.com/eHarmony/aloha/blob/master/aloha-core/src/main/scala/com/eharmony/aloha/factory/ModelFactory.scala).
Creation methods in the `ModelFactory` companion object return instances of
`ModelFactoryImpl` which can easily be downcast to a `ModelFactory[A,B]`.  This
leads to the first lesson:

> Constrain the number of ways to accomplish the same goal.  Do not allow two
> ways to do something when one will suffice.

{% highlight scala %}
sealed abstract class ModelFactory[A, B] {
  def fromString(s: String): Try[Model[A, B]]

  // AND MANY OTHER FACTORY METHODS:
  // def fromXyz(xyz: Xyz): Try[Model[A, B]]
}

object ModelFactory {
  // Create a ModelFactoryImpl for all model types on the classpath.
  def defaultFactory[U, N, A, B <: U](
      semantics: Semantics[A],
      auditor: MorphableAuditor[U, N, B]
  )(implicit refInfo: RefInfo[N]): ModelFactoryImpl[U, N, A, B] = {
    // ...
  }
}
{% endhighlight %}

## Simplified Models

### Pre 4.0.0 Models

{% highlight scala %}
trait Model[-A, +B]
extends Identifiable[ModelIdentity]
   with Closeable {

  // Return a score as a scala.Option.
  def apply(a: A): Option[B]

  // Return a score as a scala.Either containing diagnostics
  // in the event of a failure.
  def scoreAsEither(a: A): ModelOutput[B]

  // Return a score as a protocol buffer instance.
  def score(a: A): com.eharmony.aloha.score.Scores.Score

  // Internal API
  private[aloha] def getScore(a: A)(implicit audit: Boolean):
    (ModelOutput[B], Option[com.eharmony.aloha.score.Scores.Score])
}
{% endhighlight %}

*The signature says it all!*  It smacks of poor design.  The `score` method was
unfortunately a requirement (not a choice) which had a few major implications.
The first is that since `Score` is a (now outdated) v2.4.1
[Protocol Buffer](https://developers.google.com/protocol-buffers/) instance,
the protobuf v2.4.1 library was a dependency in *aloha-core* and part of the
most widely used API.  Over time, this has caused many protobuf version conflicts
\([DLL Hell](https://en.wikipedia.org/wiki/DLL_Hell)\), especially as other
libraries adopted more modern versions of protobuf.  This leads to the second
lesson learned:

> In major APIs, avoid types that require additional dependencies.  This is
> especially true in core libraries.

Another problem with the API above is that as more basic versions of prediction
functions were added (`Option`s and `Either`s), I had to allow `Score` instances
to be produced in the model implementations.  The other problem, which is
totally my fault is that `Option`s can easily be created via `Either`s via
`scoreAsEither(a).right.toOption`.  But since this was a nuisance, I added the
`apply` method.  This clearly violates the first lesson about providing
multiple ways to accomplish a desired goal.

### 4.0.0 Models

Models are simply functions with identifiers and can be cleaned up.  Dead simple.
*Enough said!*

{% highlight scala %}
trait Model[-A, +B]
extends (A => B)
   with Identifiable[ModelIdentity]
   with Closeable
{% endhighlight %}

## Auditing

To avoid model reimplementation while allowing different model output
representations, I chose to add the ability to inject a score decorator into
a model.  This takes the form of [`Auditor[U,-N,+B<:U]`](https://github.com/eHarmony/aloha/blob/master/aloha-core/src/main/scala/com/eharmony/aloha/audit/Auditor.scala) in [Aloha](https://github.com/eHarmony/aloha) 4.
By allowing the auditor instances to parameterize `ModelFactoryImpl`, the
factory can inject all models and submodels with auditors of the appropriate
type.  This enables models in [Aloha](https://github.com/eHarmony/aloha) 4 to be
truly generic in the output type.  It also, allows for easy refactoring of the
[CompiledSemanticsProtoPlugin](https://github.com/eHarmony/aloha/blob/master/aloha-io-proto/src/main/scala/com/eharmony/aloha/semantics/compiled/plugin/proto/CompiledSemanticsProtoPlugin.scala)
to place it in its own module,
[aloha-io-proto](https://github.com/eHarmony/aloha/tree/master/aloha-io-proto).
Because of this, I could easily remove of the protobuf dependency in
[aloha-core](https://github.com/eHarmony/aloha/tree/master/aloha-core).

One additional thing to notice is the type parameters in `Auditor`.  This easily
could have been done with a
[unary type constructor](https://en.wikipedia.org/wiki/Kind_(type_theory)#Examples)
(*e.g.* `Auditor[M[_], N]`), but I already put so much effort into making
[Aloha](https://github.com/eHarmony/aloha) work with Java that I didn't want to
introduce this into an important API.  This leads to lesson three:

> Pick the languages a project should support.  Don't use niceties from
> one language at the expense of usability from another language.  If you must
> use language-specific niceties and idioms, create separate tailored
> language-specific APIs.

### A Note on the N Type Parameter in ModelFactoryImpl

Since [ModelFactoryImpl](https://github.com/eHarmony/aloha/blob/master/aloha-core/src/main/scala/com/eharmony/aloha/factory/ModelFactory.scala)
is parameterized by a
[`MorphableAuditor[U,N,B]`](https://github.com/eHarmony/aloha/blob/master/aloha-core/src/main/scala/com/eharmony/aloha/audit/MorphableAuditor.scala), `ModelFactoryImpl` is also
parameterized the type `N`, the natural output type of the top-level models it produces.
Parameterizing the `ModelFactoryImpl` by `N` could have been avoided because
morphable auditors can create new auditors for a different natural output type
but I *want* Aloha users to know the natural output type of the models produced
by factories.  This is because auditors can produce [coproducts](https://en.wikipedia.org/wiki/Coproduct) *and* the consumption of a
model score could happen much later, possibly on a different machine.  So,
if the output type is like [`Score`](https://github.com/eHarmony/aloha/blob/master/aloha-avro-score-java/src/main/resources/com/eharmony/aloha/audit/impl/avro/aloha_avro_score.avdl) in the
[aloha-avro-score-java](https://github.com/eHarmony/aloha/tree/master/aloha-avro-score-java)
module or [`Score`](https://github.com/eHarmony/aloha-proto/blob/master/src/main/proto/com.eharmony.aloha.score.Scores.proto) in [aloha-proto](https://github.com/eHarmony/aloha-proto),
and the consumer is expecting a classifier result like a string or
integer but the factory instantiates a regression model with a real-valued
natural output type, then the consumer will encounter an error and the team
responsible for the factory will may be oblivious.  This situation can be
exacerbated when the scoring infrastructure (factories and models) is under the
control of a different team than the one that *produces* models.  This type
constraint can be seen as a consistency check across teams to ensure, within
reason, that an appropriate class of models will be used on the problem domain.
So, if `N` is incongruous with the natural output type of a model that the factory
attempts to produce, the factory may raise an error at model creation time and
avoid this situation entirely.  This leads the fourth lesson:

> Fail early by design.

## Conclusion

Over time, [Aloha](https://github.com/eharmony/aloha) has evolved to include
simpler, more thoughtful high-level APIs.  Along the way, the API evolution was
guided by overcoming mistakes of the past.  Hopefully, by disclosing and
discussing some of these mistakes, others will be able to avoid them.  So, once
more:

1. *Constrain the number of ways to accomplish the same goal.  Do not allow two ways to do something when one will suffice.*
1. *In major APIs, avoid types that require additional dependencies.  This is especially true in core libraries.*
1. *Pick the languages a project should support.  Don't use niceties from one language at the expense of usability from another language.  If you must use language-specific niceties and idioms, create separate tailored language-specific APIs.*
1. *Fail early by design.*
