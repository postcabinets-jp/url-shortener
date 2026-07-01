"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLink } from "@/app/actions/links";
import type { Domain } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Props = {
  workspaceId: string;
  domains: Domain[];
  appUrl: string;
};

export default function CreateLinkForm({ workspaceId, domains, appUrl }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [destinationUrl, setDestinationUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [domainId, setDomainId] = useState("");
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxClicks, setMaxClicks] = useState("");

  // UTM
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmTerm, setUtmTerm] = useState("");
  const [utmContent, setUtmContent] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      const result = await createLink({
        workspaceId,
        destinationUrl,
        slug: slug || undefined,
        title: title || undefined,
        tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
        domainId: domainId || undefined,
        password: password || undefined,
        expiresAt: expiresAt || undefined,
        maxClicks: maxClicks ? parseInt(maxClicks) : undefined,
        utmSource: utmSource || undefined,
        utmMedium: utmMedium || undefined,
        utmCampaign: utmCampaign || undefined,
        utmTerm: utmTerm || undefined,
        utmContent: utmContent || undefined,
      });

      if (result.success) {
        toast.success("Link created!");
        router.push(`/dashboard/links/${result.data.id}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  const previewSlug = slug || "aBcD3fG";
  const previewDomain = domainId
    ? domains.find((d) => d.id === domainId)?.hostname ?? appUrl.replace(/^https?:\/\//, "")
    : appUrl.replace(/^https?:\/\//, "");

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="destination">Destination URL *</Label>
              <Input
                id="destination"
                type="url"
                placeholder="https://example.com/your/long/url"
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                type="text"
                placeholder="Campaign homepage — Q3 2024"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                type="text"
                placeholder="campaign, email, social (comma separated)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </Card>

          <Tabs defaultValue="alias">
            <TabsList className="w-full">
              <TabsTrigger value="alias" className="flex-1">Alias</TabsTrigger>
              <TabsTrigger value="utm" className="flex-1">UTM Params</TabsTrigger>
              <TabsTrigger value="advanced" className="flex-1">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="alias">
              <Card className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="domain">Domain</Label>
                  <select
                    id="domain"
                    value={domainId}
                    onChange={(e) => setDomainId(e.target.value)}
                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1"
                  >
                    <option value="">Default ({appUrl.replace(/^https?:\/\//, "")})</option>
                    {domains.map((d) => (
                      <option key={d.id} value={d.id}>{d.hostname}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="slug">Custom alias</Label>
                  <Input
                    id="slug"
                    type="text"
                    placeholder="my-link (leave empty for random)"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                    pattern="[a-zA-Z0-9_-]{3,64}"
                    minLength={slug ? 3 : 0}
                    maxLength={64}
                  />
                  <p className="text-xs text-zinc-400">Letters, numbers, hyphens and underscores only</p>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="utm">
              <Card className="p-5 space-y-4">
                <p className="text-xs text-zinc-500">UTM parameters will be appended to the destination URL on redirect.</p>
                {[
                  { id: "utmSource", label: "Source", placeholder: "google, twitter, newsletter", value: utmSource, set: setUtmSource },
                  { id: "utmMedium", label: "Medium", placeholder: "cpc, email, social", value: utmMedium, set: setUtmMedium },
                  { id: "utmCampaign", label: "Campaign", placeholder: "summer_sale_2024", value: utmCampaign, set: setUtmCampaign },
                  { id: "utmTerm", label: "Term", placeholder: "paid keyword", value: utmTerm, set: setUtmTerm },
                  { id: "utmContent", label: "Content", placeholder: "banner_a, link_b", value: utmContent, set: setUtmContent },
                ].map((field) => (
                  <div key={field.id} className="space-y-1.5">
                    <Label htmlFor={field.id}>{field.label}</Label>
                    <Input
                      id={field.id}
                      type="text"
                      placeholder={field.placeholder}
                      value={field.value}
                      onChange={(e) => field.set(e.target.value)}
                    />
                  </div>
                ))}
              </Card>
            </TabsContent>

            <TabsContent value="advanced">
              <Card className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password protection</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Leave empty for no protection"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="expiresAt">Expires at</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="maxClicks">Max clicks</Label>
                  <Input
                    id="maxClicks"
                    type="number"
                    placeholder="Leave empty for unlimited"
                    value={maxClicks}
                    onChange={(e) => setMaxClicks(e.target.value)}
                    min={1}
                  />
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar preview */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Preview</h3>
            <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200">
              <p className="text-xs text-zinc-400 mb-1">Short URL</p>
              <p className="text-sm font-mono font-medium text-zinc-900 break-all">
                {previewDomain}/{previewSlug}
              </p>
            </div>
            {destinationUrl && (
              <div className="mt-3 p-3 rounded-lg bg-zinc-50 border border-zinc-200">
                <p className="text-xs text-zinc-400 mb-1">Destination</p>
                <p className="text-xs text-zinc-600 break-all">{destinationUrl}</p>
              </div>
            )}
          </Card>

          <Button
            type="submit"
            className="w-full"
            disabled={isPending || !destinationUrl}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating…
              </>
            ) : (
              "Create Link"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
