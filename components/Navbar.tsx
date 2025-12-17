"use client";

import { Radio } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

const Navbar = () => {
  const items = [
    { id: 1, title: "Library", path: "/library" },
    { id: 5, title: "Analytics", path: "/analytics" },
    { id: 4, title: "Trim Videos", path: "/trim" },
    { id: 2, title: "Log In", path: "/login", disabled: true },
    { id: 3, title: "Signup for free", path: "/signup", disabled: true },
  ];

  const handleDisabledClick = (
    e: React.MouseEvent<HTMLAnchorElement>
  ) => {
    e.preventDefault();
    toast("🚧 This feature is not built yet", {
      duration: 3000,
    });
  };

  return (
    <div className="flex font-[poppins] justify-between p-3 items-center container mx-auto">
      {/* Logo */}
      <Link className="flex gap-2 items-center" href="/">
        <span className="text-blue-600 text-3xl">
          <Radio />
        </span>
        <h1 className="text-3xl font-bold text-blue-700">
          Clipline
        </h1>
      </Link>

      {/* Nav Items */}
      <div className="flex items-center gap-5">
        {items.map((item) => {
          const isDisabled = item.disabled;

          return (
            <Link
              key={item.id}
              href={item.path}
              onClick={isDisabled ? handleDisabledClick : undefined}
              className={
                item.path !== "/signup"
                  ? "text-xl text-zinc-600 font-semibold hover:text-blue-600"
                  : "bg-blue-700 px-8 py-3 text-white rounded-xl font-semibold hover:bg-blue-800"
              }
            >
              {item.title}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Navbar;
