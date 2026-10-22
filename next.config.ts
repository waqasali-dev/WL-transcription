import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@ffmpeg-installer/ffmpeg",
    "@ffprobe-installer/ffprobe",
    "@huggingface/transformers",
    "onnxruntime-node",
    "sharp",
  ],
  outputFileTracingExcludes: {
    "*": ["./.data/**/*", "./public/uploads/**/*"],
  },
};

export default nextConfig;
