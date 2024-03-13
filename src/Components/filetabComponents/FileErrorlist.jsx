import React, { useState } from "react";
import {
    Collapse
} from "@material-tailwind/react";
import { GoChevronDown, GoChevronUp } from "react-icons/go";

const FileErrorlist = ({ data }) => {
    const [open, setOpen] = useState(false);
    const toggleOpen = () => setOpen((cur) => !cur);

    return (
        <>
            <Button onClick={toggleOpen}>{data[0]}  {open ? <GoChevronUp /> : <GoChevronDown />}</Button>
            <Collapse open={open}>
                <div className="p-2">
                    {data[1].messages.map((item, index) =>
                        <div key={index} className="w-full h-28 mt-2 p-2 border-2 cursor-pointer rounded">
                            <div className=""><h2>{item.ruleId}</h2></div>
                            <div>{item.message}</div>
                        </div>
                    )}
                </div>
            </Collapse>
        </>
    );
}

export default FileErrorlist;