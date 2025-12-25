import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Onchain Prophecy',
  projectId: '92f8892f8c4b43dfb6a598fca153a9b4',
  chains: [sepolia],
  ssr: false,
});
