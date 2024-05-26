/* eslint-disable react/prop-types */
import React, { useState, useEffect, useRef } from 'react';

const CodeDisplay = ({ codeTxt }) => {
    const [code, setCode] = useState('');
    const lineIndicate = useRef(null);

    const init = () => {
        lineIndicate.current.innerHTML = '';
        const numLines = codeTxt.split(/\r\n|\r|\n/).length;
        for (let i = 1; i <= numLines + 1; i++) {
            const sp = document.createElement('span');
            sp.innerHTML = i
            sp.classList = 'line-number'
            const br = document.createElement('br');
            lineIndicate.current.appendChild(sp)
            lineIndicate.current.appendChild(br)
        }

        setCode(codeTxt);
    }

    useEffect(() => {
        if (codeTxt) {
            init();
        }
    }, [codeTxt]);

    return (
        <div className='relative'>
            <pre className='codeDisplay language-js line-numbers-mode'>
                <code className='language-js'>
                    {code}
                </code>
                <div ref={lineIndicate} className="line-numbers-wrapper" aria-hidden="true">
                </div>
            </pre >
        </div>
    );
};

export default CodeDisplay;
