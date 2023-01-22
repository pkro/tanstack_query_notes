import React, {useState} from 'react';
import PostsList1 from "./PostsList1";
import PostsList2 from "./PostsList2";
import Post from "./Post";
import {CreatePost} from "./CreatePost";

type AppPropsType = {};

export const App = ({}: AppPropsType) => {
const [currentPage, setCurrentPage] = useState(<PostsList1 />);
    return (<div>
        <div>
        <button onClick={()=>setCurrentPage(<PostsList1 />)}>Page 1</button>
        <button onClick={()=>setCurrentPage(<PostsList2 />)}>Page 2</button>
        <button onClick={()=>setCurrentPage(<Post id={1} />)}>1st post</button>
        <button onClick={()=>setCurrentPage(<CreatePost setCurrentPage={setCurrentPage}/>)}>New post</button>
        </div>
        {currentPage}
    </div>);
};
