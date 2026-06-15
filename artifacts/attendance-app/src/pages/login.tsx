import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { GraduationCap, Users, ShieldCheck, Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLogin, LoginInputRole } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  role: z.enum([LoginInputRole.admin, LoginInputRole.faculty, LoginInputRole.student]),
});

const roles = [
  {
    value: LoginInputRole.student,
    label: "Student",
    icon: GraduationCap,
    desc: "View attendance",
  },
  {
    value: LoginInputRole.faculty,
    label: "Faculty",
    icon: Users,
    desc: "Mark attendance",
  },
  {
    value: LoginInputRole.admin,
    label: "Admin",
    icon: ShieldCheck,
    desc: "Manage system",
  },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();
  const [selectedRole, setSelectedRole] = useState<LoginInputRole>(LoginInputRole.student);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", role: LoginInputRole.student },
  });

  const handleRoleSelect = (role: LoginInputRole) => {
    setSelectedRole(role);
    form.setValue("role", role);
  };

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      const response = await loginMutation.mutateAsync({ data: values });
      login(response.token, response.user);
      switch (response.user.role) {
        case "admin":    setLocation("/admin/dashboard"); break;
        case "faculty":  setLocation("/faculty/dashboard"); break;
        case "student":  setLocation("/student/dashboard"); break;
        default:         setLocation("/");
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Please check your credentials and try again.",
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center overflow-hidden relative p-4"
      style={{ background: "linear-gradient(135deg, #050d1a 0%, #0d1f3c 40%, #1a0f3c 70%, #050d1a 100%)" }}>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="animate-float-1 absolute -top-20 -left-20 w-96 h-96 rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, #3b82f6 0%, #1d4ed8 60%, transparent 100%)", filter: "blur(60px)" }} />
        <div className="animate-float-2 absolute -bottom-32 -right-20 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #7c3aed 0%, #4c1d95 60%, transparent 100%)", filter: "blur(80px)" }} />
        <div className="animate-float-3 absolute top-1/2 right-1/4 w-64 h-64 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #06b6d4 0%, #0e7490 60%, transparent 100%)", filter: "blur(50px)" }} />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
      </div>

      <div className="w-full max-w-md relative z-10 animate-scale-in">
        <div className="glass-light rounded-2xl overflow-hidden">
          <div className="px-8 pt-8 pb-6 text-center"
            style={{ background: "linear-gradient(180deg, #f8faff 0%, #ffffff 100%)" }}>
            <div className="flex items-center justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background: "linear-gradient(135deg, hsl(217 91% 36%) 0%, hsl(217 91% 22%) 100%)", boxShadow: "0 4px 0 hsl(217 91% 14%), 0 8px 24px rgba(0,30,120,0.4)" }}>
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Smart Attendance
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Sign in to your institutional dashboard
            </p>
          </div>

          <div className="px-8 pb-8 bg-white">
            <div className="mb-6">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Select your role
              </p>
              <div className="grid grid-cols-3 gap-2">
                {roles.map(({ value, label, icon: Icon, desc }) => {
                  const isActive = selectedRole === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleRoleSelect(value)}
                      className={`role-card flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 select-none ${
                        isActive
                          ? "role-card-active border-transparent text-white"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-semibold">{label}</span>
                      <span className={`text-[10px] leading-tight ${isActive ? "text-blue-200" : "text-slate-400"}`}>
                        {desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            placeholder="name@institution.edu"
                            className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-400 transition-colors rounded-xl"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            type="password"
                            placeholder="••••••••"
                            className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-400 transition-colors rounded-xl"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl text-base mt-2 flex items-center justify-center gap-2"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Sign In
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-[11px] text-center text-slate-400 font-medium mb-2">DEMO CREDENTIALS</p>
              <div className="grid grid-cols-3 gap-2 text-[11px] text-center text-slate-500">
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="font-semibold text-slate-700">Admin</div>
                  <div>admin@demo.edu</div>
                  <div>admin123</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="font-semibold text-slate-700">Faculty</div>
                  <div>sarah.johnson</div>
                  <div>faculty123</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="font-semibold text-slate-700">Student</div>
                  <div>alice@demo.edu</div>
                  <div>student123</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
