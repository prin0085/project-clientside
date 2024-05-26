/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import CodeDisplay from "../codeDisplay/codeDisplay";
import { extractLines } from './../globalFunction';

const MaxParams = ({ file, error }) => {
    const [code, setCode] = useState('');

    useEffect(() => {
        const extractCode = extractLines(file, error);
        setCode(extractCode);
    }, [error]);

    return (
        <>
            <CodeDisplay codeTxt={code} />
            <div className="px-5 pt-5 pb-5"></div>
        </>
    );
};

export default MaxParams;
