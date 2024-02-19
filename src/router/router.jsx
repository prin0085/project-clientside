import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from './../Components/home';
import EditForm from "../Components/editor";

export default function Router() {
    return (
        <Routes style={{ margin: '20px' }}>
            <Route path="/" element={<Home />} />
            <Route path="/analize" element={<EditForm />} />
            <Route path="/*" element={<div style={{ textAlign: 'center' }}>Error 404 Not Found</div>} />
        </Routes>
    )
}