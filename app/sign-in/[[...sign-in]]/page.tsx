import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center code-pattern">
      <div className="w-full max-w-md px-6">
        <SignIn 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "glass-strong shadow-soft-xl",
            },
          }}
        />
      </div>
    </div>
  );
}

