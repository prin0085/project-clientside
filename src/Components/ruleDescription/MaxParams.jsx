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

    const example = '//ตัวแปร1 int, ตัวแปร2 string, ตัวแปร3 object\n' + code

    return (
        <>
            <CodeDisplay codeTxt={code} />
            <div className="px-5 pt-5 pb-5">
                ถึงแม้จะไม่ส่งผลอะไร แต่การเขียนโค้ดจากผู้เขียนหลาย ๆ คน อาจจำเป็นต้องระบุ
                ถึงประเภท การเรียงลำดับของ Parameter ให้ผู้เขียนคนอื่นเข้าใจได้ง่ายมากยิ่งขึ้น
            </div>

            <CodeDisplay codeTxt={example} />
        </>
    );
};

export default MaxParams;
