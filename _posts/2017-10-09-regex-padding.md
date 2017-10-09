---
layout: post
title:  "Regex Padding"
date:   2017-10-09 16:51:00
categories: programming java scala
---

I was recently working on (Aloha](https://github.com/eharmony/aloha)'s support for multilabel models and
I came across a regular expression issue that was confounding.  I want to quickly share the problem and
an easy solution.

## Problem

When trying to find regular expression matches of something delimited by whitespace, it's not appropriate to
simply look for the pattern and just surround the pattern by whitespace.  For instance, consider the following
example:

{% highlight java linenos %}
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final Pattern re1 = Pattern.compile(""" -q\s*(\S{2}) """);
final String subject1 = " -qab -q cd ";

final Matcher m1 = re1.matcher(subject1);
m1.find();        // true
m1.group(1);      // "ab"
m1.find();        // false
{% endhighlight %}

Notice that, at first glance, the regular expression in `re1` seems reasonable.  It seems like it should be
able to find both of values in the first capture group: `"ab"` and `"cd"`.  But it fails to find the second
value.  This is because the trailing space in the match `" -qab "`, the trailing space is consumed by the
first match and is not available to be used to delimit the second match.  This is because the search for
the second match starts at the index *after* the end of the first match.


## Easy Solution

The solution involves consuming the delimiting whitespace on just one end of the
[Pattern](https://docs.oracle.com/javase/7/docs/api/java/util/regex/Pattern.html).  In the following
example, an arbitrary decision was made to consume the whitespace at the beginning of the pattern.  To do
this, simply use the *zero-width positive lookahead* feature.  This is the `(?=\s|$)` at the end of
pattern, `re2`.  This says "*the next character, if one exists, must be whitespace (but don't consume it)*."
At the beginning of the pattern, we see `(^|\s)` which says "*if a character is present, it must be
whitespace (and DO consume it)*."

{% highlight java linenos %}
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final Pattern re2 = Pattern.compile("""(^|\s)-q\s*(\S{2})(?=\s|$)""");
final String subject2 = "-qab -q cd";

final Matcher m2 = re2.matcher(subject2);
m2.find();        // true
m2.group(2);      // "ab"
m2.find();        // true
m2.group(2);      // "cd"
{% endhighlight %}

An additional capture group in front of the main pattern is added to consume the whitespace character, so
the group containing the information is group `2`, but this is the only thing necessary to change.  Notice
the second match is found this time.  Also notice that `subject2` isn't whitespace-padded since the the
regular expression takes care of the edge cases.

## Scala Too

Since [Scala](https://scala-lang.org) is based on the JVM, the functions in
[Regex](http://www.scala-lang.org/api/current/scala/util/matching/Regex.html) encounter the same problems:

{% highlight scala linenos %}
val re1 = """ -q\s*(\S{2}) """.r
val subject1 = " -qab -q cd "

// List("ab")
val matches1 = re1.findAllMatchIn(subject1).map(_.group(1)).toList
{% endhighlight %}

*and with the fix*:

{% highlight scala linenos %}
val re2 = """(^|\s)-q\s*(\S{2})(?=\s|$)""".r
val subject2 = "-qab -q cd"

// List("ab", "cd")
val matches2 = re2.findAllMatchIn(subject2).map(_.group(2)).toList
{% endhighlight %}


## Summary

So, in summary, consider whitespace padding your regular expressions with:

{% highlight java %}
// JAVA
public static String pad(String s) {
  return "(^|\\s)" + s "(?=\\s|$)";
}
{% endhighlight %}

{% highlight scala %}
// SCALA
def pad(s: String) = """(^|\s)""" + s """(?=\s|$)"""
{% endhighlight %}
