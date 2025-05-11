"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export const Timeline = ({
  data,
  className,
}: {
  data: {
    title: string
    content: React.ReactNode
  }[]
  className?: string
}) => {
  const [activeItem, setActiveItem] = useState(0)
  const [windowWidth, setWindowWidth] = useState(0)
  const timelineRef = useRef<HTMLDivElement>(null)
  const lastScrollTop = useRef(0)

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (!timelineRef.current) return

      const timelineRect = timelineRef.current.getBoundingClientRect()
      const timelineTop = timelineRect.top
      const timelineHeight = timelineRect.height
      const windowHeight = window.innerHeight

      // Calculate the percentage of the timeline that is visible
      const visiblePercentage = (windowHeight - timelineTop) / timelineHeight

      // Calculate the active item based on the visible percentage
      const newActiveItem = Math.min(Math.max(Math.floor(visiblePercentage * data.length), 0), data.length - 1)

      if (newActiveItem !== activeItem) {
        setActiveItem(newActiveItem)
      }

      lastScrollTop.current = window.scrollY
    }

    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [activeItem, data.length])

  return (
    <div ref={timelineRef} className={cn("relative flex flex-col space-y-6 md:space-y-8 lg:space-y-10", className)}>
      {data.map((item, index) => (
        <div
          key={index}
          className={cn(
            "flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-6 lg:space-x-12",
            index === activeItem ? "opacity-100" : "opacity-50",
          )}
        >
          <div className="flex flex-col items-center md:items-end space-y-2 md:w-1/4 lg:w-1/5">
            <div className="flex items-center space-x-2 mt-0 md:mt-48">
              <div className={cn("h-3 w-3 rounded-full mt-0 md:mt-48", index === activeItem ? "bg-primary" : "bg-primary/30")} />
              <div
                className={cn(
                  "text-lg md:text-6xl font-bold mt-0 md:mt-48",
                  index === activeItem ? "text-primary" : "text-primary/50",
                )}
              >
                {item.title}
              </div>
            </div>
            {index < data.length - 1 && <div className="h-full w-px bg-primary/20 md:h-[calc(100%-2rem)] md:mt-8" />}
          </div>
          <div
            className={cn(
              "md:w-3/4 lg:w-4/5 transition-all duration-500",
              index === activeItem
                ? "translate-y-0"
                : index < activeItem
                  ? "-translate-y-4 md:-translate-y-8"
                  : "translate-y-4 md:translate-y-8",
            )}
          >
            {item.content}
          </div>
        </div>
      ))}
    </div>
  )
}
