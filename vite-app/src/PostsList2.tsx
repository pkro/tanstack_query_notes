import './App.css';
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {getPosts} from "./api/posts";
import { Key, ReactElement, JSXElementConstructor, ReactFragment, ReactPortal } from 'react';
import {Post} from "./types";

function PostsList2() {
    const postsQuery = useQuery({
        queryKey: ['posts'],
        queryFn: getPosts
    });

    const queryClient = useQueryClient();

    /*const postsMutation = useMutation({
        mutationFn: (title: string) =>
            wait(1000)
                .then(() => POSTS.push({id: crypto.randomUUID(), title})),
        //onSuccess: ()=> postsQuery.refetch()
        onSuccess: () => queryClient.invalidateQueries(['posts'])
    });*/

    if (postsQuery.isLoading) return <h1>loading...</h1>;
    if (postsQuery.isError) return <pre>{JSON.stringify(postsQuery.error)}</pre>;

    return (
        <>
            <h1>Post list 2</h1>
            <ul>
                {postsQuery.data.map((post: Post) => <li key={post.id}>{post.id}: {post.title}</li>)}
            </ul>
            {/*<button disabled={postsMutation.isLoading} onClick={()=>postsMutation.mutate('abc')}>Add new</button>*/}
        </>
    );
}

export default PostsList2;
