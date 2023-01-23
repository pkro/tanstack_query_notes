# React query (tanstack query) notes

<!-- TOC -->
* [React query (tanstack query) notes](#react-query--tanstack-query--notes)
  * [useQuery](#usequery)
    * [status](#status)
    * [Query keys](#query-keys)
    * [fetching / refetching](#fetching--refetching)
      * [refetch vs invalidateQueries](#refetch-vs-invalidatequeries)
      * [staleTime](#staletime)
      * [refetchInterval](#refetchinterval)
    * [Dependent queries](#dependent-queries)
  * [useMutation](#usemutation)
    * [Basic form setup](#basic-form-setup)
    * [options](#options)
    * [Optimistic updates](#optimistic-updates)
    * [mutate / mutateAsync](#mutate--mutateasync)
  * [Pagination](#pagination)
  * [Infinite queries](#infinite-queries)
  * [Other features](#other-features)
    * [useQueries](#usequeries)
    * [Prefetching](#prefetching)
    * [Initial / placeholder data](#initial--placeholder-data)
<!-- TOC -->

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

We can use update data in the frontend so it doesn't have to be reloaded by updating the cache using `queryClient.setQueryData` in `onSuccess`.

`setQueryData` can take the data itself:

```tsx
// ...
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData(['posts', data.id], data);
      queryClient.invalidateQueries(['posts']);
      setCurrentPage(<Post id={data.id}/>);
    },
// ...
```

...or an updater function as an argument to change an existing entry:

```tsx
queryClient.setQueryData(['posts', data.id], (oldData) => ({...oldData, ...data}));
```


### mutate / mutateAsync

Beside `mutate` rq also provides `mutateAsync` returns a promise that can be chained with `mutation.mutateAsync().then(...)` to compose side effects.

Both can also take `onSuccess` etc. properties in an object as the second parameter, e.g. `.mutate(data, {onSuccess: ()=>..., }`)

## Pagination

The data fetching function:

```tsx
export function getPostsPaginated(page: number) {
    return axios
        .get("http://localhost:3000/posts", {
            params: { _page: page, _sort: "title", _limit: 2 },
        })
        .then(res => {
            // @ts-ignore
            const hasNext = page * 2 <= parseInt(res.headers["x-total-count"])
            return {
                nextPage: hasNext ? page + 1 : undefined,
                previousPage: page > 1 ? page - 1 : undefined,
                posts: res.data,
            }
        })
}
```

The paginated page:

```tsx
function PostsListPaginated() {
    const [page, setPage] = useState<number | undefined>(1);

    // using destructured properties just to mix things up a bit
    const {status, error, data, isPreviousData} = useQuery({
        queryKey: ['posts', {page: page}],
        keepPreviousData: true, // show previous pages data while loading new data
        queryFn: ()=>getPostsPaginated(page!)
    });

    if (status === 'loading') return <h1>loading...</h1>;
    if (status === 'error') return <pre>{JSON.stringify(error)}</pre>;

    return (
        <>
            <h1>Post list Paginated</h1>
            <small>{isPreviousData && "Previous Data"}</small>
            <ul>
                {data.posts.map((post: Post) => <li key={post.id}>{post.id}: {post.title}</li>)}
            </ul>
            <div>
                {data?.previousPage && (<button onClick={()=>setPage(data?.previousPage)}>Previous</button>)}
                {data?.nextPage && (<button onClick={()=>setPage(data?.nextPage)}>Next</button>)}
            </div>
        </>
    );
}
```

## Infinite queries

uses `useInfiniteQuery` requiring a `getNextPageParam` option.

See code, `PostListsInfinite.tsx`.

## Other features

### useQueries

The problem: `useQuery` can't be used in a hook. So we can't use it to iterate over the result in another query, as [hooks can't be called  inside loops, conditions, or nested functions](https://reactjs.org/docs/hooks-rules.html).

Solution: `useQueries` which can be used at the top level and pass in options for multiple queries:

```typescript
    const postsQuery = useQuery({
        queryKey: ['posts'],
        queryFn: getPosts
    });

    // we're just getting the posts here again but we might load other
    // related data for each post
    const queries = useQueries({
        // return empty array while we don't have any data (yet)
        queries: (postsQuery?.data?? []).map((post: Post) => {
            return {
                queryKey: ['posts', post.id],
                queryFn: () => getPost(post.id)
            };
        })
    });

    console.log(queries.map(q => q.data));
```

### Prefetching

Self explanatory code:

```tsx
    const queryClient = useQueryClient();

    function onHoverPostLink(postId: any) {
        queryClient.prefetchQuery(
            {
                queryKey: ['posts', postId],
                queryFn: ()=>getPost(postId)
            }
        );
    }

    // ...

    <button
            onClick={() => setCurrentPage(<Post id={1}/>)}
            onMouseEnter={() => onHoverPostLink(1)}>
      1st post
    </button>
```

### Initial / placeholder data

- `initialData` sets initial data that is regarded as valid, so no fetch is done (until rq would refetch anyway)
- `placeholderData` sets initial data until the "real" data is fetched
