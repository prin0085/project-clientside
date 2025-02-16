/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect, useContext, useRef } from "react";
import { GoChevronDown, GoChevronUp } from "react-icons/go";
import { dataContext } from "../../Context/context";

const FileErrorlist = ({ data, ndata }) => {
  const [
    [analizeData, setAnalyzeData],
    [files, setFile],
    [fileName, setFileName],
    [activePage, setActivePage],
  ] = useContext(dataContext);
  const [content, setContent] = useState("");
  const [openPage, setOpenPage] = useState("");
  const containerRef = useRef();

  const toggleOpen = (idx) => {
    setOpenPage((c) => (c === idx ? "" : idx));
  };

  const handleOnclickActivePage = (item, e) => {
    item[0]["filename"] = item[1];
    setActivePage(item[0]);

    const container = containerRef.current;
    if (container) {
      const activeElement = container.querySelector(".active");
      if (activeElement) {
        activeElement.classList.remove("active");
      }
    }

    e.currentTarget.classList.add("active");
  };

  return (
    <div ref={containerRef}>
      {ndata.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={`pt-2 overflow-auto invisble-scrollbar ${
            rowIndex === openPage ? "h-90" : ""
          }`}
        >
          <div
            onClick={() => toggleOpen(rowIndex)}
            className="flex justify-between mb-0 cursor-pointer tab"
          >
            {row[1].originalname}

            <div className="p-1">
              {rowIndex === openPage ? <GoChevronUp /> : <GoChevronDown />}
            </div>
          </div>
          <Collapse open={rowIndex === openPage}>
            <div className="p-2">
              {row[0].messages.map((item, index) => {
                return (
                  <div
                    key={index}
                    className="w-full errorlist h-28 mt-2 p-2 border-2 cursor-pointer rounded"
                    onClick={(e) =>
                      handleOnclickActivePage([item, row[1].originalname], e)
                    }
                  >
                    <div>
                      <h2>{item.ruleId}</h2>
                    </div>
                    <div>{item.message}</div>
                  </div>
                );
              })}
            </div>
          </Collapse>
        </div>
      ))}
    </div>
  );
};

export default FileErrorlist;
