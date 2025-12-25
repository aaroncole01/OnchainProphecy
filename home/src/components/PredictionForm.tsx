import { useState } from 'react';
import { Contract, ethers } from 'ethers';
import { useAccount } from 'wagmi';

import { PROPHECY_ADDRESS, PROPHECY_ABI } from '../config/contracts';
import { toScaledValue } from '../utils/format';

type Props = {
  address?: `0x${string}`;
  instance: any;
  signerPromise: Promise<any> | undefined;
  priceDecimals: number;
  currentDay?: bigint;
  instanceLoading: boolean;
  contractReady: boolean;
};

export function PredictionForm({
  address,
  instance,
  signerPromise,
  priceDecimals,
  currentDay,
  instanceLoading,
  contractReady,
}: Props) {
  const { isConnecting } = useAccount();
  const [asset, setAsset] = useState<'ETH' | 'BTC'>('ETH');
  const [direction, setDirection] = useState<'1' | '2'>('1');
  const [priceInput, setPriceInput] = useState('');
  const [stakeInput, setStakeInput] = useState('0.1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!contractReady) {
      setError('Set the deployed contract address before sending transactions.');
      return;
    }

    if (!instance || !signerPromise || !address) {
      setError('Connect your wallet and wait for the encryption service to load.');
      return;
    }

    try {
      const scaledPrice = toScaledValue(priceInput, priceDecimals);
      const maxUint64 = BigInt('18446744073709551615');
      if (scaledPrice > maxUint64) {
        throw new Error('Price is too large for the encrypted field.');
      }

      const stake = ethers.parseEther(stakeInput || '0');
      if (stake <= 0n) {
        throw new Error('Stake must be greater than 0.');
      }

      setIsSubmitting(true);

      const input = instance.createEncryptedInput(PROPHECY_ADDRESS, address);
      input.add64(scaledPrice);
      input.add8(BigInt(direction));
      const encrypted = await input.encrypt();

      const signer = await signerPromise;
      const contract = new Contract(PROPHECY_ADDRESS, PROPHECY_ABI, signer);

      const tx = await contract.placePrediction(
        asset === 'ETH' ? 0 : 1,
        encrypted.handles[0],
        encrypted.handles[1],
        encrypted.inputProof,
        { value: stake }
      );

      await tx.wait();
      setMessage(`Prediction submitted for day ${currentDay?.toString() ?? ''}.`);
      setPriceInput('');
      setStakeInput('0.1');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to submit prediction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="card-heading">
        <div>
          <h2>Place encrypted prediction</h2>
          <p className="subtext">
            Prices use {priceDecimals} decimals. Predictions close once the daily price is posted.
          </p>
        </div>
        <div className="badge badge-warn">UTC 00:00 cut-off</div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="input-grid">
          <div className="input-group">
            <label className="input-label">Asset</label>
            <select
              className="select-input"
              value={asset}
              onChange={(e) => setAsset(e.target.value as 'ETH' | 'BTC')}
            >
              <option value="ETH">ETH</option>
              <option value="BTC">BTC</option>
            </select>
            <div className="helper">One prediction per asset per day.</div>
          </div>

          <div className="input-group">
            <label className="input-label">Direction</label>
            <select
              className="select-input"
              value={direction}
              onChange={(e) => setDirection(e.target.value as '1' | '2')}
            >
              <option value="1">Above my price (1)</option>
              <option value="2">Below my price (2)</option>
            </select>
            <div className="helper">Direction is encrypted before sending.</div>
          </div>
        </div>

        <div className="input-grid" style={{ marginTop: 12 }}>
          <div className="input-group">
            <label className="input-label">Price threshold</label>
            <input
              className="text-input"
              placeholder="e.g., 2450.12"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
            />
            <div className="helper">Scaled by 10^{priceDecimals} and encrypted with Zama FHE.</div>
          </div>

          <div className="input-group">
            <label className="input-label">Stake (ETH)</label>
            <input
              className="text-input"
              placeholder="0.1"
              value={stakeInput}
              onChange={(e) => setStakeInput(e.target.value)}
            />
            <div className="helper">Earn equal points if correct. Stake is refunded on resolution.</div>
          </div>
        </div>

        <div className="actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || isConnecting || instanceLoading || !contractReady}
          >
            {isSubmitting ? 'Encrypting & sending...' : 'Submit encrypted prediction'}
          </button>
          {currentDay !== undefined ? (
            <span className="helper">Current day: {currentDay.toString()}</span>
          ) : null}
        </div>

        {message ? <div className="badge badge-success" style={{ marginTop: 10 }}>{message}</div> : null}
        {error ? <div className="badge badge-warn" style={{ marginTop: 10, color: '#fecdd3' }}>{error}</div> : null}
      </form>
    </div>
  );
}
