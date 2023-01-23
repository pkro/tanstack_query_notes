import './App.css';
import {useMutation, useQueries, useQuery, useQueryClient} from "@tanstack/react-query";
import {getPost, getPosts} from "./api/posts";
import { Key, ReactElement, JSXElementConstructor, ReactFragment, ReactPortal } from 'react';
import {Post} from "./types";

function PostsList1() {
    const postsQuery = useQuery({
        queryKey: ['posts'],
        queryFn: getPosts,
        placeholderData: [
            {id: '123', title: 'Loading real posts'}
        ]
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
