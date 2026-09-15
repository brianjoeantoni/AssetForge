import { config } from "../config.js";
import type {
  GenerateImageInput,
  GenerateImageResult,
  ImageProvider,
} from "./image-provider.js";

type CloudflareImageResponse = {
  success: boolean;
  errors: Array<{
    code: number;
    message: string;
  }>;
  messages: string[];
  result?: {
    image?: string;
  };
};

type CloudflareErrorDetails = {
  message: string;
  httpStatus?: number;
  contentType?: string;
  errors?: CloudflareImageResponse["errors"];
  messages?: string[];
};

export class CloudflareImageProviderError extends Error {
  provider = "cloudflare";
  model = config.cloudflareImageModel;
  httpStatus?: number;
  contentType?: string;
  errors?: CloudflareImageResponse["errors"];
  messages?: string[];

  constructor(details: CloudflareErrorDetails) {
    super(details.message);
    this.name = "CloudflareImageProviderError";
    this.httpStatus = details.httpStatus;
    this.contentType = details.contentType;
    this.errors = details.errors;
    this.messages = details.messages;
  }
}

function dataUrlFromBytes(bytes: ArrayBuffer, contentType: string) {
  const base64 = Buffer.from(bytes).toString("base64");

  return {
    imageUrl: `data:${contentType};base64,${base64}`,
    imageLength: base64.length,
  };
}

function requireCloudflareConfig() {
  if (!config.cloudflareAccountId) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID is required for Cloudflare image generation");
  }

  if (!config.cloudflareApiToken) {
    throw new Error("CLOUDFLARE_API_TOKEN is required for Cloudflare image generation");
  }
}

function styleFromModel(model: string) {
  return model.split("/").at(-1) ?? "cloudflare-image";
}

export const cloudflareImageProvider: ImageProvider = {
  provider: "cloudflare",
  model: config.cloudflareImageModel,
  parameters: {
    width: 1024,
    height: 1024,
    style: styleFromModel(config.cloudflareImageModel),
  },

  async generate(input: GenerateImageInput): Promise<GenerateImageResult> {
    requireCloudflareConfig();

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${config.cloudflareAccountId}/ai/run/${config.cloudflareImageModel}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.cloudflareApiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: input.prompt,
        }),
      },
    );

    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.startsWith("image/")) {
      if (!response.ok) {
        throw new CloudflareImageProviderError({
          message: `Cloudflare request failed with HTTP ${response.status}`,
          httpStatus: response.status,
          contentType,
        });
      }

      const generatedImage = dataUrlFromBytes(
        await response.arrayBuffer(),
        contentType,
      );

      return {
        imageUrl: generatedImage.imageUrl,
        provider: this.provider,
        model: this.model,
        parameters: this.parameters,
        rawResponse: {
          contentType,
          imageLength: generatedImage.imageLength,
        },
      };
    }

    const data = (await response.json()) as CloudflareImageResponse;

    if (!response.ok || !data.success || !data.result?.image) {
      const providerMessage =
        data.errors[0]?.message ?? `Cloudflare request failed with HTTP ${response.status}`;

      throw new CloudflareImageProviderError({
        message: providerMessage,
        httpStatus: response.status,
        contentType,
        errors: data.errors,
        messages: data.messages,
      });
    }

    const imageUrl = `data:image/png;base64,${data.result.image}`;

    return {
      imageUrl,
      provider: this.provider,
      model: this.model,
      parameters: this.parameters,
      rawResponse: {
        success: data.success,
        messages: data.messages,
        result: {
          image: "[base64 omitted]",
          imageLength: data.result.image.length,
        },
      },
    };
  },
};
