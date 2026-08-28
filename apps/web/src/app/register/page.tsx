"use client";

import Link from "next/link";
import { isAxiosError } from "axios";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { register } from "@/lib/server-api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: () => {
      toast.success("Account created");
      router.push("/login");
    },
    onError: (registerError) => {
      if (isAxiosError<{ error?: string }>(registerError)) {
        const message =
          registerError.response?.data.error ?? "Failed to register";
        setError(message);
        toast.error(message);
        return;
      }

      setError("Failed to register");
      toast.error("Failed to register");
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      toast.error("Passwords do not match");
      return;
    }

    registerMutation.mutate({
      name,
      email,
      password,
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <p className="text-sm text-muted-foreground">Start generating and tracking AI assets.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <label className="block space-y-1 text-sm font-medium">
              <span>Name</span>
              <Input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Email</span>
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Password</span>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Confirm Password</span>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={8}
              />
            </label>
            {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
            <Button className="w-full" type="submit" disabled={registerMutation.isPending}>
              <UserPlus className="h-4 w-4" />
              {registerMutation.isPending ? "Creating..." : "Create Account"}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link className="font-medium text-primary" href="/login">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
