import React, { useContext } from "react";
import { dataContext } from "../Context/context";

export default function Summary() {
    let [analizeData, setAnalyzeData] = useContext(dataContext);
    const displayDataAnalize = () => {
        return analizeData.forEach(element => {
            console.log(element);
            return element[0].messages.map((item, index) => {
                console.log(item);
                return (
                    <div key={index} className="w-full h-28 mt-2 p-2 border-2 cursor-pointer rounded">
                        <div className=""><h2>{item.ruleId}</h2></div>
                        <div>{item.message}</div>
                    </div>
                )
            })
        });
    }

    return (
        <div className="overflow-hidden">
            <div className="p-2 overflow-auto h-90 w-1/2">
                {
                    analizeData != 0 && displayDataAnalize()
                }
            </div>
        </div>
    )
}