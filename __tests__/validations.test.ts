import { describe, it, expect } from "vitest";
import {
  uuidSchema,
  slugSchema,
  hostnameSchema,
  tagSchema,
  createLinkSchema,
  updateLinkSchema,
  trackClickSchema,
  analyticsQuerySchema,
  workspaceAnalyticsSchema,
  addDomainSchema,
  addTagSchema,
  removeTagSchema,
  renameTagSchema,
  deleteTagSchema,
  createApiKeySchema,
  updateWorkspaceNameSchema,
  inviteMemberSchema,
  deviceTypeEnum,
  memberRoleEnum,
} from "@/lib/validations";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_UUID_2 = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

function expectSuccess(schema: { safeParse: (v: unknown) => { success: boolean } }, value: unknown) {
  const result = schema.safeParse(value);
  expect(result.success).toBe(true);
}

function expectFailure(schema: { safeParse: (v: unknown) => { success: boolean } }, value: unknown) {
  const result = schema.safeParse(value);
  expect(result.success).toBe(false);
}

// ============================================================================
// 1. uuidSchema
// ============================================================================
describe("uuidSchema", () => {
  it("accepts a valid v4 UUID", () => {
    expectSuccess(uuidSchema, VALID_UUID);
  });

  it("accepts another valid UUID", () => {
    expectSuccess(uuidSchema, VALID_UUID_2);
  });

  it("rejects an empty string", () => {
    expectFailure(uuidSchema, "");
  });

  it("rejects a random string", () => {
    expectFailure(uuidSchema, "not-a-uuid");
  });

  it("rejects a UUID missing one segment", () => {
    expectFailure(uuidSchema, "550e8400-e29b-41d4-a716");
  });

  it("rejects a number", () => {
    expectFailure(uuidSchema, 12345);
  });

  it("rejects null", () => {
    expectFailure(uuidSchema, null);
  });
});

// ============================================================================
// 2. slugSchema
// ============================================================================
describe("slugSchema", () => {
  it("accepts a 3-character slug", () => {
    expectSuccess(slugSchema, "abc");
  });

  it("accepts a 64-character slug", () => {
    expectSuccess(slugSchema, "a".repeat(64));
  });

  it("accepts slug with hyphens and underscores", () => {
    expectSuccess(slugSchema, "my-cool_slug-123");
  });

  it("accepts alphanumeric mix", () => {
    expectSuccess(slugSchema, "A1b2C3");
  });

  it("rejects a 2-character slug (too short)", () => {
    expectFailure(slugSchema, "ab");
  });

  it("rejects a 65-character slug (too long)", () => {
    expectFailure(slugSchema, "a".repeat(65));
  });

  it("rejects slug with spaces", () => {
    expectFailure(slugSchema, "my slug");
  });

  it("rejects slug with special characters", () => {
    expectFailure(slugSchema, "slug@#!");
  });

  it("rejects an empty string", () => {
    expectFailure(slugSchema, "");
  });

  it("rejects slug with dots", () => {
    expectFailure(slugSchema, "my.slug");
  });
});

// ============================================================================
// 3. hostnameSchema
// ============================================================================
describe("hostnameSchema", () => {
  it("accepts a simple domain", () => {
    expectSuccess(hostnameSchema, "example.com");
  });

  it("accepts a subdomain", () => {
    expectSuccess(hostnameSchema, "sub.example.com");
  });

  it("accepts deeply nested subdomain", () => {
    expectSuccess(hostnameSchema, "a.b.c.d.example.com");
  });

  it("accepts domain with hyphens", () => {
    expectSuccess(hostnameSchema, "my-site.example.com");
  });

  it("rejects hostname shorter than 4 chars", () => {
    expectFailure(hostnameSchema, "a.b");
  });

  it("rejects single-label hostname (no dot)", () => {
    expectFailure(hostnameSchema, "localhost");
  });

  it("rejects hostname starting with hyphen", () => {
    expectFailure(hostnameSchema, "-example.com");
  });

  it("rejects hostname with consecutive hyphens at start of label", () => {
    // The regex requires label to start with alphanumeric
    expectFailure(hostnameSchema, "-.example.com");
  });

  it("rejects hostname with underscore", () => {
    expectFailure(hostnameSchema, "my_site.com");
  });

  it("rejects hostname over 253 chars", () => {
    const long = "a".repeat(60) + "." + "b".repeat(60) + "." + "c".repeat(60) + "." + "d".repeat(60) + ".example.com";
    expectFailure(hostnameSchema, long);
  });

  it("rejects empty string", () => {
    expectFailure(hostnameSchema, "");
  });
});

// ============================================================================
// 4. tagSchema
// ============================================================================
describe("tagSchema", () => {
  it("accepts a normal tag", () => {
    expectSuccess(tagSchema, "marketing");
  });

  it("accepts a single-character tag", () => {
    expectSuccess(tagSchema, "a");
  });

  it("accepts a 50-character tag", () => {
    expectSuccess(tagSchema, "a".repeat(50));
  });

  it("rejects an empty tag", () => {
    expectFailure(tagSchema, "");
  });

  it("rejects a 51-character tag", () => {
    expectFailure(tagSchema, "a".repeat(51));
  });

  it("trims whitespace and validates", () => {
    // " a " trims to "a" which is valid
    const result = tagSchema.safeParse(" a ");
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// 5. createLinkSchema
// ============================================================================
describe("createLinkSchema", () => {
  const validInput = {
    workspaceId: VALID_UUID,
    destinationUrl: "https://example.com",
  };

  it("accepts minimal valid input (workspaceId + URL)", () => {
    expectSuccess(createLinkSchema, validInput);
  });

  it("accepts full valid input with all optional fields", () => {
    expectSuccess(createLinkSchema, {
      ...validInput,
      slug: "my-link",
      title: "My Link Title",
      tags: ["tag1", "tag2"],
      domainId: VALID_UUID_2,
      password: "secret123",
      expiresAt: "2025-12-31T23:59:59Z",
      maxClicks: 1000,
      utmSource: "twitter",
      utmMedium: "social",
      utmCampaign: "launch",
      utmTerm: "short-url",
      utmContent: "cta-button",
    });
  });

  it("rejects missing workspaceId", () => {
    expectFailure(createLinkSchema, { destinationUrl: "https://example.com" });
  });

  it("rejects missing destinationUrl", () => {
    expectFailure(createLinkSchema, { workspaceId: VALID_UUID });
  });

  it("rejects invalid UUID for workspaceId", () => {
    expectFailure(createLinkSchema, { workspaceId: "bad", destinationUrl: "https://example.com" });
  });

  it("rejects invalid URL for destinationUrl", () => {
    expectFailure(createLinkSchema, { workspaceId: VALID_UUID, destinationUrl: "not-a-url" });
  });

  it("rejects title over 280 chars", () => {
    expectFailure(createLinkSchema, {
      ...validInput,
      title: "a".repeat(281),
    });
  });

  it("accepts title at exactly 280 chars", () => {
    expectSuccess(createLinkSchema, {
      ...validInput,
      title: "a".repeat(280),
    });
  });

  it("rejects tags array over 20 items", () => {
    expectFailure(createLinkSchema, {
      ...validInput,
      tags: Array.from({ length: 21 }, (_, i) => `tag${i}`),
    });
  });

  it("accepts tags array at exactly 20 items", () => {
    expectSuccess(createLinkSchema, {
      ...validInput,
      tags: Array.from({ length: 20 }, (_, i) => `tag${i}`),
    });
  });

  it("rejects tag string over 50 chars inside array", () => {
    expectFailure(createLinkSchema, {
      ...validInput,
      tags: ["a".repeat(51)],
    });
  });

  it("rejects invalid domainId UUID", () => {
    expectFailure(createLinkSchema, {
      ...validInput,
      domainId: "not-uuid",
    });
  });

  it("rejects password over 128 chars", () => {
    expectFailure(createLinkSchema, {
      ...validInput,
      password: "a".repeat(129),
    });
  });

  it("accepts password at 128 chars", () => {
    expectSuccess(createLinkSchema, {
      ...validInput,
      password: "a".repeat(128),
    });
  });

  it("rejects maxClicks of 0 (not positive)", () => {
    expectFailure(createLinkSchema, {
      ...validInput,
      maxClicks: 0,
    });
  });

  it("rejects negative maxClicks", () => {
    expectFailure(createLinkSchema, {
      ...validInput,
      maxClicks: -5,
    });
  });

  it("rejects non-integer maxClicks", () => {
    expectFailure(createLinkSchema, {
      ...validInput,
      maxClicks: 3.5,
    });
  });

  it("accepts maxClicks of 1", () => {
    expectSuccess(createLinkSchema, {
      ...validInput,
      maxClicks: 1,
    });
  });

  it("coerces string maxClicks to number", () => {
    const result = createLinkSchema.safeParse({ ...validInput, maxClicks: "42" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.maxClicks).toBe(42);
    }
  });

  it("rejects utmSource over 200 chars", () => {
    expectFailure(createLinkSchema, {
      ...validInput,
      utmSource: "a".repeat(201),
    });
  });

  it("rejects utmMedium over 200 chars", () => {
    expectFailure(createLinkSchema, {
      ...validInput,
      utmMedium: "a".repeat(201),
    });
  });

  it("rejects utmCampaign over 200 chars", () => {
    expectFailure(createLinkSchema, {
      ...validInput,
      utmCampaign: "a".repeat(201),
    });
  });

  it("rejects utmTerm over 200 chars", () => {
    expectFailure(createLinkSchema, {
      ...validInput,
      utmTerm: "a".repeat(201),
    });
  });

  it("rejects utmContent over 200 chars", () => {
    expectFailure(createLinkSchema, {
      ...validInput,
      utmContent: "a".repeat(201),
    });
  });

  it("accepts all UTM fields at exactly 200 chars", () => {
    expectSuccess(createLinkSchema, {
      ...validInput,
      utmSource: "a".repeat(200),
      utmMedium: "b".repeat(200),
      utmCampaign: "c".repeat(200),
      utmTerm: "d".repeat(200),
      utmContent: "e".repeat(200),
    });
  });

  it("rejects slug that is too short", () => {
    expectFailure(createLinkSchema, {
      ...validInput,
      slug: "ab",
    });
  });

  it("rejects slug with invalid characters", () => {
    expectFailure(createLinkSchema, {
      ...validInput,
      slug: "my slug!",
    });
  });

  it("accepts various valid URL schemes", () => {
    expectSuccess(createLinkSchema, {
      ...validInput,
      destinationUrl: "https://sub.example.co.jp/path?q=1#hash",
    });
  });
});

// ============================================================================
// 6. updateLinkSchema
// ============================================================================
describe("updateLinkSchema", () => {
  it("accepts an empty object (all fields optional)", () => {
    expectSuccess(updateLinkSchema, {});
  });

  it("accepts only destinationUrl", () => {
    expectSuccess(updateLinkSchema, { destinationUrl: "https://new.example.com" });
  });

  it("accepts only active toggle", () => {
    expectSuccess(updateLinkSchema, { active: false });
  });

  it("accepts only tags update", () => {
    expectSuccess(updateLinkSchema, { tags: ["new-tag"] });
  });

  it("rejects invalid destinationUrl", () => {
    expectFailure(updateLinkSchema, { destinationUrl: "bad-url" });
  });

  it("rejects non-boolean active", () => {
    expectFailure(updateLinkSchema, { active: "yes" });
  });

  it("rejects title over 280 chars", () => {
    expectFailure(updateLinkSchema, { title: "a".repeat(281) });
  });

  it("accepts password as empty string (to clear)", () => {
    // updateLinkSchema allows empty password (min not enforced, unlike create)
    expectSuccess(updateLinkSchema, { password: "" });
  });

  it("rejects password over 128 chars", () => {
    expectFailure(updateLinkSchema, { password: "a".repeat(129) });
  });

  it("rejects tags array over 20 items", () => {
    expectFailure(updateLinkSchema, {
      tags: Array.from({ length: 21 }, (_, i) => `t${i}`),
    });
  });
});

// ============================================================================
// 7. trackClickSchema
// ============================================================================
describe("trackClickSchema", () => {
  it("accepts minimal valid input (linkId only)", () => {
    expectSuccess(trackClickSchema, { linkId: VALID_UUID });
  });

  it("accepts full valid input", () => {
    expectSuccess(trackClickSchema, {
      linkId: VALID_UUID,
      referrer: "https://google.com",
      country: "Japan",
      city: "Tokyo",
      deviceType: "mobile",
      browser: "Chrome",
      os: "iOS",
      ipHash: "abc123def456",
    });
  });

  it("rejects missing linkId", () => {
    expectFailure(trackClickSchema, {});
  });

  it("rejects invalid linkId", () => {
    expectFailure(trackClickSchema, { linkId: "bad" });
  });

  it("rejects referrer over 2048 chars", () => {
    expectFailure(trackClickSchema, {
      linkId: VALID_UUID,
      referrer: "a".repeat(2049),
    });
  });

  it("accepts referrer at 2048 chars", () => {
    expectSuccess(trackClickSchema, {
      linkId: VALID_UUID,
      referrer: "a".repeat(2048),
    });
  });

  it("rejects country over 100 chars", () => {
    expectFailure(trackClickSchema, {
      linkId: VALID_UUID,
      country: "a".repeat(101),
    });
  });

  it("rejects city over 200 chars", () => {
    expectFailure(trackClickSchema, {
      linkId: VALID_UUID,
      city: "a".repeat(201),
    });
  });

  it("rejects invalid deviceType", () => {
    expectFailure(trackClickSchema, {
      linkId: VALID_UUID,
      deviceType: "smartwatch",
    });
  });

  it("accepts all valid device types", () => {
    for (const dt of ["mobile", "desktop", "tablet", "bot", "unknown"]) {
      expectSuccess(trackClickSchema, { linkId: VALID_UUID, deviceType: dt });
    }
  });

  it("rejects browser over 200 chars", () => {
    expectFailure(trackClickSchema, {
      linkId: VALID_UUID,
      browser: "a".repeat(201),
    });
  });

  it("rejects os over 200 chars", () => {
    expectFailure(trackClickSchema, {
      linkId: VALID_UUID,
      os: "a".repeat(201),
    });
  });

  it("rejects ipHash over 128 chars", () => {
    expectFailure(trackClickSchema, {
      linkId: VALID_UUID,
      ipHash: "a".repeat(129),
    });
  });
});

// ============================================================================
// 8. analyticsQuerySchema
// ============================================================================
describe("analyticsQuerySchema", () => {
  it("accepts valid linkId with default days", () => {
    const result = analyticsQuerySchema.safeParse({ linkId: VALID_UUID });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.days).toBe(30);
    }
  });

  it("accepts days = 1 (minimum)", () => {
    expectSuccess(analyticsQuerySchema, { linkId: VALID_UUID, days: 1 });
  });

  it("accepts days = 365 (maximum)", () => {
    expectSuccess(analyticsQuerySchema, { linkId: VALID_UUID, days: 365 });
  });

  it("rejects days = 0", () => {
    expectFailure(analyticsQuerySchema, { linkId: VALID_UUID, days: 0 });
  });

  it("rejects days = 366", () => {
    expectFailure(analyticsQuerySchema, { linkId: VALID_UUID, days: 366 });
  });

  it("rejects negative days", () => {
    expectFailure(analyticsQuerySchema, { linkId: VALID_UUID, days: -1 });
  });

  it("rejects non-integer days", () => {
    expectFailure(analyticsQuerySchema, { linkId: VALID_UUID, days: 7.5 });
  });

  it("coerces string days to number", () => {
    const result = analyticsQuerySchema.safeParse({ linkId: VALID_UUID, days: "14" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.days).toBe(14);
    }
  });

  it("rejects invalid linkId", () => {
    expectFailure(analyticsQuerySchema, { linkId: "bad", days: 7 });
  });
});

// ============================================================================
// 9. workspaceAnalyticsSchema
// ============================================================================
describe("workspaceAnalyticsSchema", () => {
  it("accepts valid workspaceId with default days", () => {
    const result = workspaceAnalyticsSchema.safeParse({ workspaceId: VALID_UUID });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.days).toBe(30);
    }
  });

  it("accepts days within range", () => {
    expectSuccess(workspaceAnalyticsSchema, { workspaceId: VALID_UUID, days: 90 });
  });

  it("rejects days = 0", () => {
    expectFailure(workspaceAnalyticsSchema, { workspaceId: VALID_UUID, days: 0 });
  });

  it("rejects days over 365", () => {
    expectFailure(workspaceAnalyticsSchema, { workspaceId: VALID_UUID, days: 400 });
  });

  it("rejects invalid workspaceId", () => {
    expectFailure(workspaceAnalyticsSchema, { workspaceId: "nope" });
  });
});

// ============================================================================
// 10. addDomainSchema
// ============================================================================
describe("addDomainSchema", () => {
  it("accepts valid workspaceId + hostname", () => {
    expectSuccess(addDomainSchema, {
      workspaceId: VALID_UUID,
      hostname: "links.example.com",
    });
  });

  it("rejects invalid workspaceId", () => {
    expectFailure(addDomainSchema, {
      workspaceId: "bad",
      hostname: "example.com",
    });
  });

  it("rejects invalid hostname", () => {
    expectFailure(addDomainSchema, {
      workspaceId: VALID_UUID,
      hostname: "not a host",
    });
  });

  it("rejects single-label hostname", () => {
    expectFailure(addDomainSchema, {
      workspaceId: VALID_UUID,
      hostname: "localhost",
    });
  });
});

// ============================================================================
// 11. addTagSchema
// ============================================================================
describe("addTagSchema", () => {
  it("accepts valid linkId + tag", () => {
    expectSuccess(addTagSchema, { linkId: VALID_UUID, tag: "promo" });
  });

  it("rejects invalid linkId", () => {
    expectFailure(addTagSchema, { linkId: "bad", tag: "promo" });
  });

  it("rejects empty tag", () => {
    expectFailure(addTagSchema, { linkId: VALID_UUID, tag: "" });
  });

  it("rejects tag over 50 chars", () => {
    expectFailure(addTagSchema, { linkId: VALID_UUID, tag: "x".repeat(51) });
  });
});

// ============================================================================
// 12. removeTagSchema
// ============================================================================
describe("removeTagSchema", () => {
  it("accepts valid input", () => {
    expectSuccess(removeTagSchema, { linkId: VALID_UUID, tag: "old-tag" });
  });

  it("rejects invalid linkId", () => {
    expectFailure(removeTagSchema, { linkId: "bad", tag: "old-tag" });
  });

  it("rejects empty tag", () => {
    expectFailure(removeTagSchema, { linkId: VALID_UUID, tag: "" });
  });
});

// ============================================================================
// 13. renameTagSchema
// ============================================================================
describe("renameTagSchema", () => {
  it("accepts valid rename input", () => {
    expectSuccess(renameTagSchema, {
      workspaceId: VALID_UUID,
      oldTag: "old",
      newTag: "new",
    });
  });

  it("rejects invalid workspaceId", () => {
    expectFailure(renameTagSchema, {
      workspaceId: "bad",
      oldTag: "old",
      newTag: "new",
    });
  });

  it("rejects empty oldTag", () => {
    expectFailure(renameTagSchema, {
      workspaceId: VALID_UUID,
      oldTag: "",
      newTag: "new",
    });
  });

  it("rejects empty newTag", () => {
    expectFailure(renameTagSchema, {
      workspaceId: VALID_UUID,
      oldTag: "old",
      newTag: "",
    });
  });

  it("rejects newTag over 50 chars", () => {
    expectFailure(renameTagSchema, {
      workspaceId: VALID_UUID,
      oldTag: "old",
      newTag: "x".repeat(51),
    });
  });
});

// ============================================================================
// 14. deleteTagSchema
// ============================================================================
describe("deleteTagSchema", () => {
  it("accepts valid input", () => {
    expectSuccess(deleteTagSchema, { workspaceId: VALID_UUID, tag: "remove-me" });
  });

  it("rejects invalid workspaceId", () => {
    expectFailure(deleteTagSchema, { workspaceId: "bad", tag: "x" });
  });

  it("rejects empty tag", () => {
    expectFailure(deleteTagSchema, { workspaceId: VALID_UUID, tag: "" });
  });
});

// ============================================================================
// 15. createApiKeySchema
// ============================================================================
describe("createApiKeySchema", () => {
  it("accepts valid input", () => {
    expectSuccess(createApiKeySchema, {
      workspaceId: VALID_UUID,
      name: "Production Key",
    });
  });

  it("rejects missing name", () => {
    expectFailure(createApiKeySchema, { workspaceId: VALID_UUID });
  });

  it("rejects empty name", () => {
    expectFailure(createApiKeySchema, { workspaceId: VALID_UUID, name: "" });
  });

  it("rejects name over 100 chars", () => {
    expectFailure(createApiKeySchema, {
      workspaceId: VALID_UUID,
      name: "a".repeat(101),
    });
  });

  it("accepts name at exactly 100 chars", () => {
    expectSuccess(createApiKeySchema, {
      workspaceId: VALID_UUID,
      name: "a".repeat(100),
    });
  });

  it("rejects invalid workspaceId", () => {
    expectFailure(createApiKeySchema, { workspaceId: "bad", name: "Key" });
  });
});

// ============================================================================
// 16. updateWorkspaceNameSchema
// ============================================================================
describe("updateWorkspaceNameSchema", () => {
  it("accepts valid input", () => {
    expectSuccess(updateWorkspaceNameSchema, {
      workspaceId: VALID_UUID,
      name: "My Workspace",
    });
  });

  it("rejects empty name", () => {
    expectFailure(updateWorkspaceNameSchema, {
      workspaceId: VALID_UUID,
      name: "",
    });
  });

  it("rejects name over 100 chars", () => {
    expectFailure(updateWorkspaceNameSchema, {
      workspaceId: VALID_UUID,
      name: "a".repeat(101),
    });
  });

  it("accepts name at exactly 100 chars", () => {
    expectSuccess(updateWorkspaceNameSchema, {
      workspaceId: VALID_UUID,
      name: "a".repeat(100),
    });
  });

  it("rejects invalid workspaceId", () => {
    expectFailure(updateWorkspaceNameSchema, {
      workspaceId: "invalid",
      name: "Test",
    });
  });

  it("accepts single-character name", () => {
    expectSuccess(updateWorkspaceNameSchema, {
      workspaceId: VALID_UUID,
      name: "X",
    });
  });
});

// ============================================================================
// 17. inviteMemberSchema
// ============================================================================
describe("inviteMemberSchema", () => {
  it("accepts valid editor invite", () => {
    expectSuccess(inviteMemberSchema, {
      workspaceId: VALID_UUID,
      email: "user@example.com",
      role: "editor",
    });
  });

  it("accepts valid viewer invite", () => {
    expectSuccess(inviteMemberSchema, {
      workspaceId: VALID_UUID,
      email: "viewer@example.com",
      role: "viewer",
    });
  });

  it("rejects invalid email", () => {
    expectFailure(inviteMemberSchema, {
      workspaceId: VALID_UUID,
      email: "not-an-email",
      role: "editor",
    });
  });

  it("rejects empty email", () => {
    expectFailure(inviteMemberSchema, {
      workspaceId: VALID_UUID,
      email: "",
      role: "editor",
    });
  });

  it("rejects invalid role", () => {
    expectFailure(inviteMemberSchema, {
      workspaceId: VALID_UUID,
      email: "user@example.com",
      role: "owner",
    });
  });

  it("rejects missing role", () => {
    expectFailure(inviteMemberSchema, {
      workspaceId: VALID_UUID,
      email: "user@example.com",
    });
  });

  it("rejects invalid workspaceId", () => {
    expectFailure(inviteMemberSchema, {
      workspaceId: "bad",
      email: "user@example.com",
      role: "editor",
    });
  });
});

// ============================================================================
// 18. deviceTypeEnum
// ============================================================================
describe("deviceTypeEnum", () => {
  it.each(["mobile", "desktop", "tablet", "bot", "unknown"] as const)(
    "accepts '%s'",
    (val) => {
      expectSuccess(deviceTypeEnum, val);
    }
  );

  it("rejects invalid device type", () => {
    expectFailure(deviceTypeEnum, "smartwatch");
  });

  it("rejects empty string", () => {
    expectFailure(deviceTypeEnum, "");
  });
});

// ============================================================================
// 19. memberRoleEnum
// ============================================================================
describe("memberRoleEnum", () => {
  it("accepts 'editor'", () => {
    expectSuccess(memberRoleEnum, "editor");
  });

  it("accepts 'viewer'", () => {
    expectSuccess(memberRoleEnum, "viewer");
  });

  it("rejects 'owner' (not in invite enum)", () => {
    expectFailure(memberRoleEnum, "owner");
  });

  it("rejects 'admin'", () => {
    expectFailure(memberRoleEnum, "admin");
  });

  it("rejects empty string", () => {
    expectFailure(memberRoleEnum, "");
  });
});

// ============================================================================
// 20. Edge cases / cross-cutting
// ============================================================================
describe("cross-cutting edge cases", () => {
  it("createLinkSchema rejects extra unknown fields (strict-like)", () => {
    // Zod by default strips unknown keys; this confirms it does not throw
    const result = createLinkSchema.safeParse({
      workspaceId: VALID_UUID,
      destinationUrl: "https://example.com",
      unknownField: "surprise",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect("unknownField" in result.data).toBe(false);
    }
  });

  it("createLinkSchema with undefined optional fields", () => {
    expectSuccess(createLinkSchema, {
      workspaceId: VALID_UUID,
      destinationUrl: "https://example.com",
      slug: undefined,
      title: undefined,
      tags: undefined,
    });
  });

  it("updateLinkSchema strips unknown fields", () => {
    const result = updateLinkSchema.safeParse({
      active: true,
      hackerField: "malicious",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect("hackerField" in result.data).toBe(false);
    }
  });

  it("trackClickSchema rejects null as linkId", () => {
    expectFailure(trackClickSchema, { linkId: null });
  });

  it("analyticsQuerySchema default days applies when omitted", () => {
    const result = analyticsQuerySchema.safeParse({ linkId: VALID_UUID });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.days).toBe(30);
    }
  });

  it("createLinkSchema accepts http URL", () => {
    expectSuccess(createLinkSchema, {
      workspaceId: VALID_UUID,
      destinationUrl: "http://example.com",
    });
  });

  it("createLinkSchema accepts FTP URL (valid per URL spec)", () => {
    // Zod v4 z.string().url() validates per WHATWG URL spec, which allows ftp://
    expectSuccess(createLinkSchema, {
      workspaceId: VALID_UUID,
      destinationUrl: "ftp://files.example.com/data",
    });
  });

  it("hostnameSchema accepts international-style domain with numbers", () => {
    expectSuccess(hostnameSchema, "123.456.com");
  });

  it("createLinkSchema rejects tags with null entries", () => {
    expectFailure(createLinkSchema, {
      workspaceId: VALID_UUID,
      destinationUrl: "https://example.com",
      tags: [null],
    });
  });

  it("createLinkSchema accepts empty tags array", () => {
    expectSuccess(createLinkSchema, {
      workspaceId: VALID_UUID,
      destinationUrl: "https://example.com",
      tags: [],
    });
  });
});
