import './App.css';
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {getPosts} from "./api/posts";
import { Key, ReactElement, JSXElementConstructor, ReactFragment, ReactPortal } from 'react';
import {Post} from "./types";

function PostsList1() {
    const postsQuery = useQuery({
        queryKey: ['posts'],
        queryFn: getPosts
    });


    if (postsQuery.isLoading) return <h1>loading...</h1>;
    if (postsQuery.isError) return <pre>{JSON.stringify(postsQuery.error)}</pre>;

    return (
        <>
            <h1>Post list 1</h1>
            <ul>
                {postsQuery.data.map((post: Post) => <li key={post.id}>{post.id}: {post.title}</li>)}
            </ul>
        </>
    );
}

export default PostsList1;
