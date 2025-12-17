"use client";

import { Radio } from "lucide-react";
import Link from "next/link";
import React from "react";

const Navbar = () => {
  const items = [
    { id: 1, title: "Library", path: "/library" },
    { id: 2, title: "Log In", path: "/login" },
    { id: 3, title: "Signup for free", path: "/signup" },
  ];
  return (
    <div className="flex font-[poppins] justify-between p-3 items-center container mx-auto">
      {/* logo */}
      <div className="">
        <Link className="flex gap-2 items-center" href={'/'}>
        <span className="text-blue-600 text-3xl">
          <Radio />
        </span>
        <h1 className="text-3xl font-bold font-[italics] text-blue-700">
          Clipline
        </h1>
        </Link>
      </div>

      <div className="flex items-center gap-5">
        {items.map((item) => (
          <div key={item.id}>
            <Link className={item.path !== '/signup' ? `text-xl text-zinc-600 font-semibold`: 'bg-blue-700 flex items-center px-8 py-3 text-white rounded-xl font-semibold'} href={item.path}>{item.title}</Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Navbar;
