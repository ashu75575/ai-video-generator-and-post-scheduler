import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";

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
          theme: dark,
        }}
      />
    </main>
  );
}
