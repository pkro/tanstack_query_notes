import React, {useRef} from 'react';
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {createPost} from "./api/posts";
import Post from "./Post";

type CreatePostPropsType = {
    setCurrentPage:  React.Dispatch<React.SetStateAction<JSX.Element>>
};

export const CreatePost = ({setCurrentPage}: CreatePostPropsType) => {
    const titleRef = useRef<HTMLInputElement>(null);
    const bodyRef = useRef<HTMLTextAreaElement>(null);

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
            useQueryClient().invalidateQueries(['posts'])
            setCurrentPage(<Post id={data.id} />)
        },
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
