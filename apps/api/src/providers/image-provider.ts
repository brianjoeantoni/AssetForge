export type GenerateImageInput = {
  assetId: string;
  ownerId: string;
  prompt: string;
  name: string;
};

export type GenerateImageResult = {
  imageUrl: string;
  provider: string;
  model: string;
  parameters: {
    width: number;
    height: number;
    style: string;
  };
  rawResponse: Record<string, unknown>;
};

export type ImageProvider = {
  provider: string;
  model: string;
  parameters: GenerateImageResult["parameters"];
  generate(input: GenerateImageInput): Promise<GenerateImageResult>;
};
