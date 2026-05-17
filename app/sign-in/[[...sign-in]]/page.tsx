import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-forge-bg">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(124,106,250,0.12)_0%,transparent_70%)] blur-[60px]" />
        <div className="absolute top-1/3 right-1/4 h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,rgba(62,207,207,0.07)_0%,transparent_70%)] blur-[40px]" />
      </div>
      <SignIn
        appearance={{
          baseTheme: dark,
          variables: {
            colorPrimary: "#7C6AFA",
            colorBackground: "#08080f",
            colorInputBackground: "#0d0d18",
            colorInputText: "#ffffff",
            colorText: "#ffffff",
            colorTextSecondary: "rgba(255,255,255,0.5)",
            colorNeutral: "#ffffff",
            borderRadius: "12px",
          },
          elements: {
            rootBox: {
              position: "relative",
              zIndex: 10,
            },
            card: {
              background: "rgba(8,8,20,0.92)",
              backdropFilter: "blur(32px)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow:
                "0 0 80px rgba(124,106,250,0.18), 0 30px 80px rgba(0,0,0,0.7)",
            },
            headerTitle: {
              color: "#ffffff",
              fontWeight: "700",
            },
            headerSubtitle: {
              color: "rgba(255,255,255,0.45)",
            },
            socialButtonsBlockButton: {
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#ffffff",
              transition: "all 0.2s ease",
            },
            dividerLine: {
              background: "rgba(255,255,255,0.08)",
            },
            dividerText: {
              color: "rgba(255,255,255,0.3)",
            },
            formFieldInput: {
              background: "#0d0d18",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#ffffff",
              transition: "border-color 0.2s ease",
            },
            formFieldLabel: {
              color: "rgba(255,255,255,0.6)",
            },
            footerActionLink: {
              color: "#7C6AFA",
            },
            formButtonPrimary: {
              background: "linear-gradient(135deg, #7C6AFA 0%, #3ECFCF 100%)",
              boxShadow: "0 0 30px rgba(124,106,250,0.35)",
              transition: "box-shadow 0.2s ease, transform 0.1s ease",
            },
          },
        }}
      />
    </main>
  );
}
