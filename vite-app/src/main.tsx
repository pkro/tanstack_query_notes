import React from 'react';
import ReactDOM from 'react-dom/client';
import PostsList1 from './PostsList1';
import './index.css';
import {QueryClientProvider, QueryClient} from "@tanstack/react-query";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import {App} from "./App";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <App/>
            <ReactQueryDevtools/>
        </QueryClientProvider>
    </React.StrictMode>
);
