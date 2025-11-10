"use client";
import { projects } from "@/constants/projects";
import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
import { LinkPreview } from "./LinkPreview";

import { BsTerminal } from "react-icons/bs";

type ProjectItem = (typeof projects)[number];

export const Projects = ({
  items = projects,
}: {
  items?: ProjectItem[];
}) => {
  let [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="max-w-5xl mx-auto px-8">
      <div className="grid grid-cols-1 md:grid-cols-2  lg:grid-cols-3 gap-10 mt-20">
        {items.map((project, idx) => (
          <div
            key={idx}
            className="relative group block p-2"
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <LinkPreview
              url={project.link}
              className=""
            >
            <AnimatePresence>
              {hoveredIndex === idx && (
                <motion.span
                  className="absolute inset-0 h-full w-full bg-zinc-800/[0.8]  rounded-3xl"
                  layoutId="hoverBackground"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: { duration: 0.15 },
                  }}
                  exit={{
                    opacity: 0,
                    transition: { duration: 0.15, delay: 0.2 },
                  }}
                />
              )}
            </AnimatePresence>
            <div className=" rounded-2xl overflow-hidden bg-zinc-800 border border-transparent group-hover:border-cyan-500/50 group-hover:bg-zinc-700/50 relative z-50 transition-all duration-300">
              <div className="relative z-50">
                <div className="p-4">
                  <h4 className="text-zinc-100 font-bold tracking-wide mt-4 group-hover:text-cyan-500 transition duration-150">
                    {project.title}
                  </h4>
                  <p className="mt-8 text-zinc-300 tracking-wide leading-relaxed text-sm">
                    {project.description}
                  </p>

                  <div className="flex flex-row flex-wrap mt-8">
                    {project.stack.map((stack, idx) => (
                      <div key={`stack-${idx}`}>
                        {
                          <span className="text-gray-500 mr-4 inline-block  stroke-1">
                            {stack.icon}
                          </span>
                        }
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-row space-x-2 mt-4 items-center px-0.5">
                    <BsTerminal className="h-3 w-3 stroke-1.5 text-zinc-400 group-hover:text-cyan-500" />
                    <p
                      // href={project.link}
                      className="text-zinc-400 group-hover:text-cyan-500 text-xs"
                    >
                      View Source
                    </p>
                  </div>
                </div>
              </div>
            </div>
            </LinkPreview>
          </div>
        ))}
      </div>
    </div>
  );
};
