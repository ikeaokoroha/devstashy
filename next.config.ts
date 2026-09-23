import type { NextConfig } from 'next';

// next/image only loads a remote host that's listed here, so the R2 public host
// has to be allowed for the image gallery's thumbnails. It comes from the same
// variable r2.ts reads; when it's missing or malformed the entry is left out
// rather than failing the build, which matches how r2.ts degrades.
function r2RemotePatterns(): NonNullable<NextConfig['images']>['remotePatterns'] {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!publicUrl) {
    return [];
  }

  try {
    const { hostname } = new URL(publicUrl);
    return [{ protocol: 'https', hostname }];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  devIndicators: false,
  images: {
    remotePatterns: r2RemotePatterns(),
  },
};

export default nextConfig;
