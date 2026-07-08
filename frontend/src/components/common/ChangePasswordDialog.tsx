import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { changePassword } from "@/services/mock";

const schema = z
  .object({
    current: z.string().min(1, "Required"),
    next: z
      .string()
      .min(8, "Min 8 characters")
      .regex(/[A-Z]/, "Must include uppercase")
      .regex(/[0-9]/, "Must include a number"),
    confirm: z.string(),
  })
  .refine((d) => d.next === d.confirm, { path: ["confirm"], message: "Passwords don't match" });

type FormVals = z.infer<typeof schema>;

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormVals>({ resolver: zodResolver(schema) });
  const onSubmit = async (v: FormVals) => {
    try {
      await changePassword(v.current, v.next);
      toast.success("Password changed successfully");
      reset();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || "Failed to change password");
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Update your account password. Min 8 characters with an uppercase letter and a number.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Current password</Label>
            <Input type="password" {...register("current")} />
            {errors.current && <p className="text-xs text-destructive">{errors.current.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>New password</Label>
            <Input type="password" {...register("next")} />
            {errors.next && <p className="text-xs text-destructive">{errors.next.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Confirm new password</Label>
            <Input type="password" {...register("confirm")} />
            {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Update password</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
