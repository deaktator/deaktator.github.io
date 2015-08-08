---
layout: post
title:  "Can Your Exception Handling Code Handle the SchrodingerException Juggernaut?"
date:   2015-08-07 16:56:26
categories: scala aloha
---

I was writing some documentation for [Aloha](https://github.com/eharmony/aloha) the other day when I thought some 
more about an *exception* that I wrote called 
[SchrodingerException](https://github.com/eHarmony/aloha/blob/master/aloha-core/src/main/scala/com/eharmony/aloha/ex/SchrodingerException.scala)
after the [Erwin Schrödinger](https://en.wikipedia.org/wiki/Erwin_Schrödinger), the Nobel Prize-winning physicist
that gave us many cool things like [Schrödinger equation](https://en.wikipedia.org/wiki/Schrödinger_equation). 
He's perhaps most well known in popular culture for his famous 
[Schrödinger cat](https://en.wikipedia.org/wiki/Schrödinger%27s_cat) thought experiment.  You can read about it 
yourself but the punchline is that there is a cat in a box and you can't know if it's alive or dead until observing
it.  So it's kind of in a half live, half dead state.

Out of an excessive amount sadism, I've chosen to pervert the meaning of the thought experiment a little.  So
[SchrodingerException](https://github.com/eHarmony/aloha/blob/master/aloha-core/src/main/scala/com/eharmony/aloha/ex/SchrodingerException.scala)
actually kills the cat every time.  It's as if opening the box releases the hydrocyanic acid.  What this means is 
that when the exception is interrogated in any way, it throws itself:

> If you try to get the message, *it throws itself!*
>
> If you try to get the Throwable caused it, *it throws itself!*
> 
> If you try to *get* the stacktrace, *it throws itself!*
>
> If you try to *print* the stacktrace, *it throws itself!*
>
> If you call *toString*, *it throws itself!*


{% highlight scala linenos %}
// Scala Code
import java.io.{PrintWriter, PrintStream}
final class SchrodingerException(message: String, cause: Throwable) 
extends Exception(message, cause) {
    def this() = this(null, null)
    def this(message: String) = this(message, null)
    def this(cause: Throwable) = this(null, cause)
    override def fillInStackTrace() = this
    override def getCause() = throw this
    override def getLocalizedMessage() = throw this
    override def getMessage() = throw this
    override def getStackTrace() = throw this
    override def initCause(cause: Throwable) = throw this
    override def printStackTrace() = throw this
    override def printStackTrace(s: PrintStream) = throw this
    override def printStackTrace(s: PrintWriter) = throw this
    override def setStackTrace(stackTrace: Array[StackTraceElement]) = 
      throw this
    override def toString() = throw this
    def safeToString() = {
        val m = Option(message) getOrElse ""
        s"SchrodingerException($m)"
    }
}
{% endhighlight %}

I wrote this exception so that I could test the 
[ErrorSwallowingModel](https://github.com/eHarmony/aloha/blob/master/aloha-core/src/main/scala/com/eharmony/aloha/models/ErrorSwallowingModel.scala)
in [Aloha](https://github.com/eharmony/aloha) which is supposed to swallow thrown exceptions and return the errors
instead (*like functional code should*).

# So my question to you is, can your exception handling code handle the SchrodingerException juggernaut?  *I doubt it!*
