import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center code-pattern">
      <div className="w-full max-w-md px-6">
        <SignUp 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "glass-strong shadow-soft-xl",
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          afterSignUpUrl="/dashboard"
        />
      </div>
    </div>
  );
}

