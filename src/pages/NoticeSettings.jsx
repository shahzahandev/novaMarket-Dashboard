import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const API = "https://nova-market-backend-2.onrender.com";

const NoticeSettings = () => {
  const [text, setText] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const res = await fetch(`${API}/api/v1/notice/getNotice`);
        const data = await res.json();
        if (data.notice) {
          setText(data.notice.text);
          setIsActive(data.notice.isActive);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchNotice();
  }, []);

  const handleSave = async () => {
    if (!text.trim()) {
      setMessage("Notice text likhte hobe");
      return;
    }
    try {
      setLoading(true);
      setMessage("");
      const res = await fetch(`${API}/api/v1/notice/saveNotice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // auth token lagle: Authorization: `Bearer ${token}`
        body: JSON.stringify({ text, isActive }),
      });
      const data = await res.json();
      setMessage(data.success ? "Notice save successfully" : data.message);
    } catch (err) {
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Notice Board</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="notice">Notice Text</Label>
          <Textarea
            id="notice"
            rows={4}
            placeholder="Write Notice here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <Switch checked={isActive} onCheckedChange={setIsActive} />
          <Label>{isActive ? "Active (website e show hobe)" : "Inactive (hide thakbe)"}</Label>
        </div>

        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Notice"}
        </Button>

        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </CardContent>
    </Card>
  );
};

export default NoticeSettings;