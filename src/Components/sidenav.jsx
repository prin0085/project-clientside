import React, { useState } from "react";
import { BrowserRouter, NavLink } from "react-router-dom";
import '../Style/main.css';
import Router from "../router/router";

const SideNav = () => {
    const [open, setOpen] = useState(true);
    const Menus = [
        { title: "Dashboard", src: "Chart_fill", to: "/" },
        { title: "Analytics", src: "Search", to: "/analize", gap: true },
        { title: "Summary ", src: "Chart", to: "/summary" },
        { title: "Setting", src: "Setting", to: "/setting", gap: true },
    ];

    return (
        <BrowserRouter>
            <div className="flex">
                <div
                    className={`${open ? "w-72" : "w-20 "} bg-dark-purple h-screen p-5 pt-8 relative duration-300`}>
                    <div className="absolute cursor-pointer -right-3 top-9 w-7" onClick={() => setOpen(!open)}>
                        <img alt="btn-toggle"
                            src="./src/assets/control.png"
                            className={`border-dark-purple border-2 rounded-full ${!open && "rotate-180"}`} />
                    </div>
                    <div className="flex gap-x-4 items-center">
                        <img alt="logo"
                            src="./src/assets/logo.png"
                            className={`cursor-pointer duration-500 ${open && "rotate-[360deg]"
                                }`}
                        />
                        <h1 className={`text-white origin-left font-medium text-xl duration-200 ${!open && "scale-0"}`}>
                            Code Analyzer
                        </h1>
                    </div>
                    <ul className="pt-6 sidenav-custom">
                        {
                            Menus.map((Menu) => (
                                <NavLink key={Menu.title} to={Menu.to}
                                    className={({ isActive }) => `flex rounded-md p-2 cursor-pointer text-gray-300 text-sm items-center gap-x-4
              ${Menu.gap ? "mt-9" : "mt-2"} ${isActive ? "bg-light-white" : ""}`}>
                                    <img alt={Menu.title} src={`./src/assets/${Menu.src}.png`} />
                                    <span className={`${!open && "hidden"} origin-left duration-200`}>
                                        {Menu.title}
                                    </span>
                                </NavLink>
                            ))
                        }
                    </ul>
                </div>
                <div className="h-screen flex-1 p-7">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
                        <Router />
                    </div>
                </div>
            </div>
        </BrowserRouter>
    );
};
export default SideNav;
