// src/pages/ComingSoon.jsx
"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Hourglass,
  Sparkles,
  Construction,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ComingSoon({
  title = "Coming Soon",
  subtitle = "This module is still under development.",
  note = "We’re polishing things behind the scenes to give you the best experience.",
}) {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-[70vh] flex items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60">
      {/* 🔹 Blurry gradient blobs in the background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-16 h-64 w-64 bg-[#800000]/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-10 h-72 w-72 bg-amber-400/40 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/40 to-white/70 backdrop-blur-xl" />
      </div>

      {/* 🌟 Main content card */}
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 max-w-xl w-full px-6 py-8 md:px-10 md:py-10 bg-white/70 backdrop-blur-2xl border border-white/60 shadow-xl rounded-3xl"
      >
        {/* Icon cluster */}
        <div className="flex items-center gap-3 mb-4 text-[#800000]">
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="inline-flex items-center justify-center h-11 w-11 rounded-2xl bg-[#800000]/10"
          >
            <Hourglass className="w-6 h-6" />
          </motion.div>
          <motion.div
            animate={{ y: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
            className="hidden md:inline-flex items-center justify-center h-9 w-9 rounded-2xl bg-amber-400/20"
          >
            <Sparkles className="w-5 h-5 text-amber-500" />
          </motion.div>
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ repeat: Infinity, duration: 2.1, ease: "easeInOut" }}
            className="hidden md:inline-flex items-center justify-center h-9 w-9 rounded-2xl bg-slate-900/5"
          >
            <Construction className="w-5 h-5 text-slate-700" />
          </motion.div>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="text-sm md:text-base text-slate-600">
            {subtitle}
          </p>
          <p className="text-xs md:text-sm text-slate-500">
            {note}
          </p>
        </div>

        {/* Progress-ish bar */}
        <div className="mt-6 mb-5">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-slate-500 mb-1.5">
            <span>Module status</span>
            <span>In progress</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
            <motion.div
              initial={{ width: "25%" }}
              animate={{ width: "65%" }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-[#800000] via-amber-500 to-amber-300"
            />
          </div>
        </div>

        {/* Actions / hint */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-4">
          <div className="text-[11px] md:text-xs text-slate-500">
            You can still navigate to other modules while this one is being
            prepared.
          </div>

          <div className="flex flex-wrap gap-2 justify-start md:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="bg-[#800000] hover:bg-[#a10000] text-white text-xs md:text-sm"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
