"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { MdEmail, MdLock, MdPerson } from "react-icons/md";
import toast from "react-hot-toast";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import authService from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/utils/constants";

const registerSchema = z
  .object({
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const response = await authService.register(data);
      setUser(response.user);
      toast.success("Account created! Let's get started 🎉");
      router.push(ROUTES.DASHBOARD);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Registration failed. Please try again.";
      toast.error(message);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google/redirect`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Mobile logo */}
      <div className="flex lg:hidden items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-sm">
          IF
        </div>
        <span className="font-semibold text-[var(--text-primary)]">InterviewForge AI</span>
      </div>

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Create your account</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Free forever. No credit card required.
        </p>
      </div>

      {/* Google Sign Up */}
      <Button
        variant="outline"
        fullWidth
        leftIcon={<FcGoogle size={20} />}
        onClick={handleGoogleSignup}
      >
        Sign up with Google
      </Button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[var(--border)]" />
        <span className="text-xs text-[var(--text-muted)]">or with email</span>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full name"
          type="text"
          placeholder="Rahul Sharma"
          leftIcon={<MdPerson size={18} />}
          error={errors.full_name?.message}
          {...register("full_name")}
        />

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          leftIcon={<MdEmail size={18} />}
          error={errors.email?.message}
          {...register("email")}
        />

        <Input
          label="Password"
          type="password"
          placeholder="Min. 8 chars, 1 uppercase, 1 number"
          leftIcon={<MdLock size={18} />}
          error={errors.password?.message}
          {...register("password")}
        />

        <Input
          label="Confirm password"
          type="password"
          placeholder="••••••••"
          leftIcon={<MdLock size={18} />}
          error={errors.confirm_password?.message}
          {...register("confirm_password")}
        />

        <Button type="submit" fullWidth loading={isSubmitting} size="lg">
          Create account
        </Button>
      </form>

      <p className="text-center text-xs text-[var(--text-muted)]">
        By signing up you agree to our{" "}
        <Link href="/terms" className="text-primary-600 hover:underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-primary-600 hover:underline">
          Privacy Policy
        </Link>
        .
      </p>

      <p className="text-center text-sm text-[var(--text-secondary)]">
        Already have an account?{" "}
        <Link
          href={ROUTES.LOGIN}
          className="text-primary-600 hover:text-primary-500 font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
