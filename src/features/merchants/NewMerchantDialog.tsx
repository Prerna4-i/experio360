import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/mock/fixtures";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createMerchant } from "@/store/merchantsSlice";

export const newMerchantSchema = z.object({
  tradingName: z.string().trim().min(2, "Enter at least 2 characters").max(80),
  legalName: z.string().trim().min(2, "Enter the registered legal name").max(120),
  category: z.string().min(1, "Choose a category"),
  city: z.string().trim().min(2, "Enter a city").max(60),
  contactName: z.string().trim().min(2, "Enter a contact name").max(80),
  contactEmail: z.string().trim().email("Enter a valid email address"),
  contactPhone: z.string().trim().regex(/^\+?[0-9 ]{8,16}$/, "Use 8–16 digits, spaces and an optional +"),
  website: z.string().trim().url("Enter a full URL, e.g. https://example.example"),
  expectedMonthlyVolume: z.coerce.number({ invalid_type_error: "Enter a number" }).positive("Must be greater than 0").max(1_000_000_000, "That looks too high"),
});
type FormValues = z.infer<typeof newMerchantSchema>;

const FIELDS: { name: Exclude<keyof FormValues, "category">; label: string; type?: string; placeholder?: string }[] = [
  { name: "tradingName", label: "Trading name", placeholder: "Lotus Lane Foods" },
  { name: "legalName", label: "Legal name", placeholder: "Lotus Lane Foods Private Limited" },
  { name: "city", label: "City", placeholder: "Bengaluru" },
  { name: "contactName", label: "Primary contact", placeholder: "Asha Kulkarni" },
  { name: "contactEmail", label: "Contact email", type: "email", placeholder: "asha@lotuslane.example" },
  { name: "contactPhone", label: "Contact phone", placeholder: "+91 00000 12345" },
  { name: "website", label: "Website", placeholder: "https://lotuslane.example" },
  { name: "expectedMonthlyVolume", label: "Expected monthly volume (₹)", type: "number", placeholder: "500000" },
];

export function NewMerchantDialog({ disabled }: { disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const busy = useAppSelector((s) => s.merchants.pendingAction?.action === "create");
  const form = useForm<FormValues>({
    resolver: zodResolver(newMerchantSchema),
    defaultValues: { tradingName: "", legalName: "", category: "", city: "", contactName: "", contactEmail: "", contactPhone: "", website: "", expectedMonthlyVolume: undefined as unknown as number },
  });

  const onSubmit = async (values: FormValues) => {
    const res = await dispatch(createMerchant(values));
    if (createMerchant.fulfilled.match(res)) {
      toast.success(`Draft ${res.payload.id} created`);
      setOpen(false);
      form.reset();
      navigate({ to: "/merchants/$merchantId", params: { merchantId: res.payload.id } });
    } else {
      toast.error(res.payload ?? "Could not create the application.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <Plus /> New application
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New merchant application</DialogTitle>
          <DialogDescription>Creates a Draft. Use fictional details only — this is a demo with synthetic data.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <FormField
                key={f.name}
                control={form.control}
                name={f.name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{f.label}</FormLabel>
                    <FormControl>
                      <Input type={f.type ?? "text"} placeholder={f.placeholder} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : "Create draft"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
