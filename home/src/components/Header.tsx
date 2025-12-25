import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Header() {
  return (
    <header className="hero">
      <div>
        <div className="pill">Encrypted daily prophecy</div>
        <h1 className="hero-title">Onchain Prophecy</h1>
        <p className="hero-subtitle">
          Predict BTC and ETH closing prices at UTC 00:00. Your thresholds, directions, and rewards stay private thanks to Zama FHE.
        </p>
        <div className="hero-tags">
          <span>FHE encrypted inputs</span>
          <span>Points = staked ETH</span>
          <span>Sepolia</span>
        </div>
      </div>
      <ConnectButton />
    </header>
  );
}
