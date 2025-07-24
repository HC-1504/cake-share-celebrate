import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/App";
import { Navigate } from "react-router-dom";

const UploadCake = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const [form, setForm] = useState({
    title: "",
    description: "",
    image: null as File | null,
    ingredients: "",
    story: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "file") {
      setForm({ ...form, image: (e.target as HTMLInputElement).files?.[0] || null });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    try {
      const formDataObj = new FormData();
      formDataObj.append("title", form.title);
      formDataObj.append("description", form.description);
      if (form.image) formDataObj.append("image", form.image);
      formDataObj.append("ingredients", form.ingredients);
      formDataObj.append("story", form.story);
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/cakes", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formDataObj,
      });
      if (!res.ok) throw new Error("Failed to upload cake");
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to upload cake");
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-background">
        <Card className="max-w-md w-full border-0 shadow-cake">
          <CardHeader>
            <CardTitle className="text-center text-xl">{success ? "Cake Uploaded!" : "Upload Failed"}</CardTitle>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center text-muted-foreground">Your cake details have been submitted for review.</div>
            ) : (
              <div className="text-center text-red-600">{error}</div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-background">
      <Card className="max-w-md w-full border-0 shadow-cake">
        <CardHeader>
          <CardTitle className="text-center text-xl">Upload Cake Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && <div className="text-red-600 text-center mb-2">{error}</div>}
            <div>
              <Label htmlFor="title">Cake Title</Label>
              <Input id="title" name="title" value={form.title} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" value={form.description} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="image">Cake Image</Label>
              <Input id="image" name="image" type="file" accept="image/*" onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="ingredients">Ingredients</Label>
              <Input id="ingredients" name="ingredients" value={form.ingredients} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="story">Story Behind the Cake</Label>
              <textarea id="story" name="story" value={form.story} onChange={handleChange} className="w-full rounded-md border px-3 py-2" required />
            </div>
            <Button type="submit" variant="cake" className="w-full">Submit</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadCake; 