/* eslint-disable react/prop-types */
import React, { useState } from "react";
import { Collapse } from "@material-tailwind/react";
import { GoChevronDown, GoChevronUp } from "react-icons/go";
import des from '../../Utilities/RuleDescription.json';
import CodeDisplay from "../codeDisplay/codeDisplay";

const FileErrorlist = ({ data }) => {
    const [open, setOpen] = useState(false);
    const toggleOpen = () => setOpen((cur) => !cur);
    const [activePage, setActivePage] = useState('');

    const displayActivePage = () => {
        const desciption = des.find(w => w.ruleId == activePage.ruleId);
        if (desciption) {
            return (
                <div>
                    <div><strong className="text-xl">{desciption.title}</strong></div>
                    <p className="text-slate-400 text-sm">บรรทัด : {activePage.line}</p>
                    <div className="px-5 pt-5 pb-5">{desciption.message}</div>

                    <CodeDisplay file={data[2]} startLine={activePage.line} endLine={activePage.endLine} />
                </div>
            )
        }
        return <>
            no data
        </>
    }

    return (
        <div className="flex">
            <div className="w-1/4">
                <div className="p-2 overflow-auto h-90">
                    <div onClick={toggleOpen} className="flex justify-between mb-0 cursor-pointer tab">
                        {data[0]}
                        <div className="p-1">
                            {open ? <GoChevronUp /> : <GoChevronDown />}</div>
                    </div>
                    <Collapse open={open}>
                        <div className="p-2">
                            {data[1].messages.map((item, index) => {
                                return (
                                    <div key={index} className="w-full h-28 mt-2 p-2 border-2 cursor-pointer rounded"
                                        onClick={() => setActivePage(item)}>
                                        <div className=""><h2>{item.ruleId}</h2></div>
                                        <div>{item.message}</div>
                                    </div>)
                            }
                            )}
                        </div>
                    </Collapse>
                </div>
            </div>
            <div className="w-3/4">
                <div className="p-5">
                    {activePage && displayActivePage()}
                </div>
            </div>
        </div>
    );
}

export default FileErrorlist;