import './App.css';
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {getPosts, getPostsPaginated} from "./api/posts";
import {Key, ReactElement, JSXElementConstructor, ReactFragment, ReactPortal, useState} from 'react';
import {Post} from "./types";

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

export default PostsListPaginated;
