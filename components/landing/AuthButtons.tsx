"use client";

import { motion } from "framer-motion";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export function AuthButtons() {
  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="modal" fallbackRedirectUrl="/dashboard" forceRedirectUrl="/dashboard">
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="font-sans text-sm text-white/60 transition-colors duration-200 hover:text-white cursor-pointer"
          >
            Sign in
          </motion.button>
        </SignInButton>
        <SignUpButton mode="redirect" fallbackRedirectUrl="/dashboard" forceRedirectUrl="/dashboard">
          <motion.button
            type="button"
            whileHover={{
              scale: 1.04,
              boxShadow: "0 0 30px rgba(124,106,250,0.45)",
            }}
            whileTap={{ scale: 0.97 }}
            className="cursor-pointer rounded-lg bg-gradient-forge px-[18px] py-2 font-sans text-sm font-semibold tracking-wide text-white transition-shadow duration-200"
          >
            Get started free
          </motion.button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <UserButton
          appearance={{
            elements: {
              avatarBox: {
                width: "34px",
                height: "34px",
                border: "1.5px solid rgba(124,106,250,0.4)",
              },
              userButtonPopoverCard: {
                background: "rgba(13,13,24,0.97)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(24px)",
                boxShadow:
                  "0 0 60px rgba(124,106,250,0.15), 0 20px 40px rgba(0,0,0,0.7)",
              },
              userPreviewMainIdentifier: {
                color: "#ffffff",
              },
              userPreviewSecondaryIdentifier: {
                color: "rgba(255,255,255,0.45)",
              },
              userButtonPopoverActionButton: {
                color: "rgba(255,255,255,0.7)",
              },
              userButtonPopoverActionButton__hover: {
                background: "rgba(124,106,250,0.1)",
              },
              userButtonPopoverActionButtonIcon: {
                color: "rgba(255,255,255,0.5)",
              },
              userButtonPopoverFooter: {
                borderTop: "1px solid rgba(255,255,255,0.06)",
              },
            },
          }}
        />
      </Show>
    </>
  );
}
