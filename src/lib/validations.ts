import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

export const uuidSchema = z.string().uuid("有効なUUID形式で入力してください");

export const slugSchema = z
  .string()
  .regex(
    /^[a-zA-Z0-9_-]{3,64}$/,
    "スラッグは3〜64文字の英数字・ハイフン・アンダースコアで入力してください"
  );

export const hostnameSchema = z
  .string()
  .min(4, "ホスト名は4文字以上で入力してください")
  .max(253, "ホスト名は253文字以内で入力してください")
  .regex(
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,
    "無効なホスト名形式です"
  );

export const tagSchema = z
  .string()
  .min(1, "タグは1文字以上で入力してください")
  .max(50, "タグは50文字以内で入力してください")
  .trim();

// ---------------------------------------------------------------------------
// Links
// ---------------------------------------------------------------------------

export const createLinkSchema = z.object({
  workspaceId: uuidSchema,
  destinationUrl: z.string().url("有効なURLを入力してください"),
  slug: slugSchema.optional(),
  title: z.string().max(280, "タイトルは280文字以内で入力してください").optional(),
  tags: z
    .array(z.string().max(50, "各タグは50文字以内で入力してください"))
    .max(20, "タグは最大20個までです")
    .optional(),
  domainId: uuidSchema.optional(),
  password: z
    .string()
    .min(1, "パスワードは1文字以上で入力してください")
    .max(128, "パスワードは128文字以内で入力してください")
    .optional(),
  expiresAt: z.string().optional(),
  maxClicks: z.coerce
    .number()
    .int("クリック上限は整数で入力してください")
    .positive("クリック上限は正の数で入力してください")
    .optional(),
  utmSource: z.string().max(200, "UTM sourceは200文字以内で入力してください").optional(),
  utmMedium: z.string().max(200, "UTM mediumは200文字以内で入力してください").optional(),
  utmCampaign: z.string().max(200, "UTM campaignは200文字以内で入力してください").optional(),
  utmTerm: z.string().max(200, "UTM termは200文字以内で入力してください").optional(),
  utmContent: z.string().max(200, "UTM contentは200文字以内で入力してください").optional(),
});

export const updateLinkSchema = z.object({
  destinationUrl: z.string().url("有効なURLを入力してください").optional(),
  title: z.string().max(280, "タイトルは280文字以内で入力してください").optional(),
  tags: z
    .array(z.string().max(50, "各タグは50文字以内で入力してください"))
    .max(20, "タグは最大20個までです")
    .optional(),
  active: z.boolean().optional(),
  domainId: uuidSchema.optional(),
  password: z.string().max(128, "パスワードは128文字以内で入力してください").optional(),
  expiresAt: z.string().optional(),
  maxClicks: z.coerce
    .number()
    .int("クリック上限は整数で入力してください")
    .positive("クリック上限は正の数で入力してください")
    .optional(),
  utmSource: z.string().max(200, "UTM sourceは200文字以内で入力してください").optional(),
  utmMedium: z.string().max(200, "UTM mediumは200文字以内で入力してください").optional(),
  utmCampaign: z.string().max(200, "UTM campaignは200文字以内で入力してください").optional(),
  utmTerm: z.string().max(200, "UTM termは200文字以内で入力してください").optional(),
  utmContent: z.string().max(200, "UTM contentは200文字以内で入力してください").optional(),
});

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export const deviceTypeEnum = z.enum(["mobile", "desktop", "tablet", "bot", "unknown"]);

export const trackClickSchema = z.object({
  linkId: uuidSchema,
  referrer: z.string().max(2048, "リファラーは2048文字以内で入力してください").optional(),
  country: z.string().max(100, "国名は100文字以内で入力してください").optional(),
  city: z.string().max(200, "市区町村名は200文字以内で入力してください").optional(),
  deviceType: deviceTypeEnum.optional(),
  browser: z.string().max(200, "ブラウザ名は200文字以内で入力してください").optional(),
  os: z.string().max(200, "OS名は200文字以内で入力してください").optional(),
  ipHash: z.string().max(128, "IPハッシュは128文字以内で入力してください").optional(),
});

export const analyticsQuerySchema = z.object({
  linkId: uuidSchema,
  days: z.coerce
    .number()
    .int("日数は整数で入力してください")
    .min(1, "日数は1以上で入力してください")
    .max(365, "日数は365以下で入力してください")
    .default(30),
});

export const workspaceAnalyticsSchema = z.object({
  workspaceId: uuidSchema,
  days: z.coerce
    .number()
    .int("日数は整数で入力してください")
    .min(1, "日数は1以上で入力してください")
    .max(365, "日数は365以下で入力してください")
    .default(30),
});

// ---------------------------------------------------------------------------
// Domains
// ---------------------------------------------------------------------------

export const addDomainSchema = z.object({
  workspaceId: uuidSchema,
  hostname: hostnameSchema,
});

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

export const addTagSchema = z.object({
  linkId: uuidSchema,
  tag: tagSchema,
});

export const removeTagSchema = z.object({
  linkId: uuidSchema,
  tag: tagSchema,
});

export const renameTagSchema = z.object({
  workspaceId: uuidSchema,
  oldTag: tagSchema,
  newTag: tagSchema,
});

export const deleteTagSchema = z.object({
  workspaceId: uuidSchema,
  tag: tagSchema,
});

// ---------------------------------------------------------------------------
// API Keys
// ---------------------------------------------------------------------------

export const createApiKeySchema = z.object({
  workspaceId: uuidSchema,
  name: z
    .string()
    .min(1, "API Key名は必須です")
    .max(100, "API Key名は100文字以内で入力してください"),
});

// ---------------------------------------------------------------------------
// Workspace
// ---------------------------------------------------------------------------

export const memberRoleEnum = z.enum(["editor", "viewer"]);

export const updateWorkspaceNameSchema = z.object({
  workspaceId: uuidSchema,
  name: z
    .string()
    .min(1, "ワークスペース名は必須です")
    .max(100, "ワークスペース名は100文字以内で入力してください"),
});

export const inviteMemberSchema = z.object({
  workspaceId: uuidSchema,
  email: z.string().email("有効なメールアドレスを入力してください"),
  role: memberRoleEnum,
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;
export type TrackClickInput = z.infer<typeof trackClickSchema>;
export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
export type WorkspaceAnalyticsInput = z.infer<typeof workspaceAnalyticsSchema>;
export type AddDomainInput = z.infer<typeof addDomainSchema>;
export type AddTagInput = z.infer<typeof addTagSchema>;
export type RemoveTagInput = z.infer<typeof removeTagSchema>;
export type RenameTagInput = z.infer<typeof renameTagSchema>;
export type DeleteTagInput = z.infer<typeof deleteTagSchema>;
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type UpdateWorkspaceNameInput = z.infer<typeof updateWorkspaceNameSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
