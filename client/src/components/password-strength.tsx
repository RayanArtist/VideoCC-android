import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const strength = getPasswordStrength(password);
  const strengthLabels = ['بسیار Weak', 'Weak', 'Medium', 'Strong', 'بسیار Strong'];
  
  const getStrengthColor = (index: number) => {
    if (index >= strength) return 'bg-slate-600';
    if (strength <= 1) return 'bg-red-500';
    if (strength <= 2) return 'bg-yellow-500';
    if (strength <= 3) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex space-x-1 space-x-reverse">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={cn(
              "h-1 w-full rounded transition-colors duration-200",
              getStrengthColor(index)
            )}
          />
        ))}
      </div>
      <p className="text-xs text-slate-400">
        Password strength: {strengthLabels[strength] || 'Weak'}
      </p>
    </div>
  );
}
