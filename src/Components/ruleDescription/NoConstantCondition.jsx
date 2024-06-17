/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import CodeDisplay from "../codeDisplay/codeDisplay";
import { extractLines } from './../globalFunction';

const NoConstantCondition = ({ file, error, des }) => {
    const [code, setCode] = useState('');

    useEffect(() => {
        setCode(extractLines(file, error).replace('\t', ""))
    }, [error]);

    const foreverloopEx = "while(true){\n\t//ลูปไม่มีจุดจบ\n}\n\nfor (;-2;) {\n\t//ลูปไม่มีจุดจบ\n}";
    const alwaysdoEx = "if(true){\n\t//จะเข้าเงื่อนไขนี้ตลอด\n}\n\nif (0) {\n\t//จะไม่เข้าเงื่อนไขนี้เลย\n}";

    const foreverloopFixEx = "while(true){\n\t//...\n\t//จัดการอะไรสักอย่าง\n\t//...\n\tbreak;\n}";

    return (
        <>
            <CodeDisplay codeTxt={code} customLine={error.line - 1} />

            <div className="m-5">
                ตัวอย่างโค้ดที่ทำให้เกิด loop ไม่รู้จบ , โค้ดที่เงื่อนไขนั้นจะถูกทำตลอดหรือไม่ทำตลอด
            </div>

            <CodeDisplay codeTxt={foreverloopEx + '\n\n' + alwaysdoEx} />

            <div className="m-5">
                หากต้องการใช้ while(true) จำเป็นต้องมี break; เพื่อให้หลุดออกจาก while ได้
            </div>

            <CodeDisplay codeTxt={foreverloopFixEx} />
        </>
    );
};

export default NoConstantCondition;
