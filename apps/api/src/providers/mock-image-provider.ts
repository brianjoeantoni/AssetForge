import { fakeImageUrl } from "../utils.js";
import type {
  GenerateImageInput,
  GenerateImageResult,
  ImageProvider,
} from "./image-provider.js";

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export const mockImageProvider: ImageProvider = {
  provider: "mock",
  model: "WorkerMock-v1",
  parameters: {
    width: 960,
    height: 540,
    style: "placeholder",
  },

  async generate(input: GenerateImageInput): Promise<GenerateImageResult> {
    await wait(3000);

    const imageUrl = fakeImageUrl(input.name);

    return {
      imageUrl,
      provider: this.provider,
      model: this.model,
      parameters: this.parameters,
      rawResponse: {
        imageUrl,
      },
    };
  },
};
