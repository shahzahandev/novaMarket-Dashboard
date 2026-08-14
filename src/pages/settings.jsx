import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-normal">Settings</h2>
        <p className="mt-2 text-muted-foreground">Store profile, delivery settings and dashboard preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Store Information</CardTitle>
          <CardDescription>Default values for the E-Earbuds storefront</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">Store name</span>
              <Input defaultValue="E-Earbuds" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Support email</span>
              <Input defaultValue="support@e-earbuds.com" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Currency</span>
              <Select defaultValue="BDT">
                <option value="BDT">BDT - Bangladeshi Taka</option>
                <option value="USD">USD - US Dollar</option>
              </Select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Default delivery</span>
              <Select defaultValue="inside-dhaka">
                <option value="inside-dhaka">Inside Dhaka</option>
                <option value="outside-dhaka">Outside Dhaka</option>
              </Select>
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Store policy</span>
              <Textarea defaultValue="7 days replacement warranty for eligible earbuds with original packaging." />
            </label>
            <div className="md:col-span-2">
              <Button>
                <Save className="h-4 w-4" />
                Save Settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
