# React query (tanstack query) notes

<!-- START doctoc -->
<!-- END doctoc -->

## useQuery

### status

Beside the explicit state properties from the query object created using useQuery such as isLoading, isFetching etc. it also has
- `fetchStatus` with `fetching`, `idle` and `paused` (if no network connectivity during fetching)
- `status` with `error`, `success` and `loading`
  The queryFn passed to useQuery takes a parameter that contains the returns, among other meta data, the query key.

### Query keys

  Query keys must be arrays (since v4).

  Querykeys don't have to follow a specific pattern, but it's helpful to make them logical to the underlying promise, which is usually an API request.

  Constructing query keys from API routes:

- /posts -> `['posts']`
- /posts/1 -> `['post', 1]`
- /posts?authorId={authorId} -> `['posts', {aurhorId: 1}]`
- /posts/2/comments -> `['post_comments', post.id]` or `["posts", post.id, "comments"]`

  if we use the same query key in different useQuery hook calls in different components, rq **returns the cached data for that query key but refetches in the background and repopulates the data, which causes the component then to re-render**. `status` will *stay* in `success` if the query was once loaded.

**Note that `queryClient.invalidateQueries(['posts'])` ALSO invalidates all query keys *starting* with 'posts', e.g. `['posts', 1]` and `['posts', {aurhorId: 1}]` UNLESS specified otherwise, e.g. `queryClient.invalidateQueries(['posts'], { exact: true })`**

### fetching / refetching

#### refetch vs invalidateQueries

- refetch (returned from useMutation) forces refetch regardless if the query is being used by a mounted component or not
- queryClient.invalidateQuery(querykey) marks the query as stale so it will be refetched when a component using the query data mounts

>invalidation is a more "smart" refetching. Refetching will always refetch, even if there are no observers for the query. invalidation will just mark them as stale so that they refetch the next time an observer mounts. For queries with active observers, there is no difference as far as I'm aware. [TkDodo on github](https://github.com/TanStack/query/discussions/2468)

#### staleTime

If we don't want to refetch in the background when mounting a component using an existing / already fetched query (with the same key), we can set the `staleTime` in the `QueryClient` `defaultOptions`, e.g.

```typescript jsx
    import {QueryClient} from "@tanstack/react-query";

    const queryClient = new QueryClient({
    defaultOptions: {queries: {staleTime: 1000 * 60 * 5}},
})
```

or per query

```typescript jsx
    const postsQuery = useQuery({
    queryKey: ['posts'],
    queryFn: getPosts,
    staleTime: 1000 * 60 * 5 // 5 minutes
});
```

#### refetchInterval

We can define a `refetchInterval` to automatically refetch regularly the same way as we define a staleTime.

### Dependent queries

Enable / disable queries using the `enabled` property:

```typescript
const postQuery = useQuery({
        queryKey: ["posts", id],
        queryFn: () => getPost(id),
    })

const userQuery = useQuery({
    queryKey: ["users", postQuery?.data?.userId],
    enabled: postQuery?.data?.userId != null,
    queryFn: () => getUser(postQuery.data.userId),
})
```

## useMutation

- mutations don't do any retry like useQuery by default (unless `retry` is set)
- the mutation.status also has "idle" state as until it is called with `.mutate`.

### Basic form setup

```tsx
import React, {useRef} from 'react';
import {useMutation} from "@tanstack/react-query";
import {createPost} from "./api/posts";

type CreatePostPropsType = {};

export const CreatePost = ({}: CreatePostPropsType) => {
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const createPostMutation = useMutation({
    mutationFn: createPost,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (titleRef?.current && bodyRef?.current) {
      createPostMutation.mutate({
        title: titleRef.current.value,
        body: bodyRef.current.value,
      });
    }
  }

  return (<>
    <div>{createPostMutation.isError && JSON.stringify((createPostMutation.error))}</div>
    <form onSubmit={handleSubmit}>
      <input type="text" name="title" id="title" ref={titleRef} placeholder={"title"}/>
      <textarea name="body" id="body" cols={30} rows={10} placeholder={"post"} ref={bodyRef}></textarea>
      <button type={"submit"} disabled={createPostMutation.isLoading}>Create</button>
    </form>
  </>);
};
```

### options

```typescript
const createPostMutation = useMutation({
        mutationFn: createPost,
        onError: (error) => console.log("create failed"),
        onSettled: (isError, error, data ) =>
            console.log("create settled (error or not)"),
        onMutate: (variables) => {
            console.log("Before sending query");
            console.log("Setting a context")
            return {hi: "bye"};
        },
        onSuccess: (data, variables, context) => {
            console.log(`create successful, context: ${JSON.stringify(context)}`);
          // reload data
          useQueryClient().invalidateQueries(['posts']);
        },
    });
```

->

```
Before sending query CreatePost.tsx:17:20
Setting a context CreatePost.tsx:21:20
XHROPTIONShttp://localhost:3000/posts
[HTTP/1.1 204 No Content 1ms]

XHRPOSThttp://localhost:3000/posts
[HTTP/1.1 201 Created 5ms]

create successful, context: {"hi":"bye"} CreatePost.tsx:25:20
create settled (error or not) CreatePost.tsx:15:20
```

Neat way to redirect to a post upon creation:

```tsx
type CreatePostPropsType = {
    setCurrentPage:  React.Dispatch<React.SetStateAction<JSX.Element>>
};

export const CreatePost = ({setCurrentPage}: CreatePostPropsType) => {
    // ...
    const createPostMutation = useMutation({
        mutationFn: createPost,
        // ...
        onSuccess: (data, variables, context) => {
            setCurrentPage(<Post id={data.id} />)
        },
    });
    // ...
```

### Optimistic updates

https://tanstack.com/query/v4/docs/react/guides/optimistic-updates

We can use update data in the frontend so it doesn't have to be reloaded by updating the cache using `queryClient.setQueryData`:




### mutate / mutateAsync

Beside `mutate` rq also provides `mutateAsync` returns a promise that can be chained with `mutation.mutateAsync().then(...)` to compose side effects.

Both can also take `onSuccess` etc. properties in an object as the second parameter, e.g. `.mutate(data, {onSuccess: ()=>..., }`)

