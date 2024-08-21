/*
Javascript package implements pkg/engine interfaces for the javascript
lanugage. Specifically, |engine.Sandbox|, |engine.Engine|, |engine.Value|.

This implementation uses a single mutex around v8go constructs. It's not clear
if this mutex is explicitly necessary. The previous implementation was under
the assumption that go needed to ensure all v8go interactions were done on the
same OS thread and so went to extensive lengths to have a separate goroutine
with the v8 objects and channels too communicate with it. This seems to echo
true in some of the online rumblings, but when attempting to do it locally,
it doesn't seem to matter. (write a small contained v8go program which uses
v8go resources in parallel goroutines and you'll see nothing blows up)

Here's some reading material I (dlamotte) went through to come up with this
implementation:

- https://www.ehfeng.com/v8go-and-parallelism/
- https://stackoverflow.com/questions/25361831/benefits-of-runtime-lockosthread-in-golang
- https://github.com/rogchap/v8go/issues/144
- https://github.com/rogchap/v8go/issues/129
- https://groups.google.com/g/v8-users/c/x5zqVlag-uk
- https://dunglas.dev/2022/05/goroutines-threads-and-thread-ids/
- https://groups.google.com/g/v8-users/c/hv5sOSLTO5c

And lastly, my question to the author: https://github.com/rogchap/v8go/issues/403
*/
package javascript
