"use client";

import Image from "next/image";
import { useState } from "react";

export function ResourcesHero() {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <section
      aria-labelledby="resources-hero-title"
      className="relative isolate min-h-[260px] overflow-hidden rounded-[22px] border border-[#D7E8E4] bg-[#E8F7F3] shadow-sm shadow-teal-950/10 sm:min-h-[280px]"
    >
      {!imageFailed ? (
        <Image
          alt="Modern workplace resources"
          className="object-cover object-center sm:object-right"
          fill
          onError={() => setImageFailed(true)}
          priority
          sizes="(max-width: 767px) 100vw, 1200px"
          src="/images/resources/resources-hero.png"
        />
      ) : null}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-[#F8FAF9]/98 via-[#F8FAF9]/90 to-[#F8FAF9]/15"
      />
      <div className="relative flex min-h-[260px] items-center px-6 py-10 sm:min-h-[280px] sm:px-10 lg:px-12">
        <div className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#087F73]">
            Explore resources
          </p>
          <h1
            className="mt-3 max-w-lg text-3xl font-bold tracking-tight text-[#063B3A] sm:text-4xl lg:text-[2.75rem] lg:leading-tight"
            id="resources-hero-title"
          >
            Find the right space or equipment
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-[#475569]">
            Discover and book the spaces and tools your team needs.
          </p>
        </div>
      </div>
    </section>
  );
}
