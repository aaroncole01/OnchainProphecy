import { useMemo, useState } from 'react';
import { Contract } from 'ethers';
import { useReadContract } from 'wagmi';

import { PROPHECY_ADDRESS, PROPHECY_ABI } from '../config/contracts';
import { formatDayLabel, formatScaledValue, formatStake, formatTimestamp } from '../utils/format';

type Props = {
  address?: `0x${string}`;
  signerPromise: Promise<any> | undefined;
  priceDecimals: number;
  currentDay?: bigint;
  decryptHandles: (handles: string[]) => Promise<Record<string, string>>;
  contractReady: boolean;
};

type RowProps = {
  assetIndex: 0 | 1;
  assetLabel: string;
  day: bigint;
  address: `0x${string}`;
  signerPromise: Promise<any> | undefined;
  priceDecimals: number;
  currentDay?: bigint;
  decryptHandles: (handles: string[]) => Promise<Record<string, string>>;
  contractReady: boolean;
};

export function PredictionsList({
  address,
  signerPromise,
  priceDecimals,
  currentDay,
  decryptHandles,
  contractReady,
}: Props) {
  const { data: ethDays } = useReadContract({
    address: PROPHECY_ADDRESS,
    abi: PROPHECY_ABI,
    functionName: 'getUserPredictionDays',
    args: address ? [address, 0] : undefined,
    query: { enabled: !!address && contractReady },
  });

  const { data: btcDays } = useReadContract({
    address: PROPHECY_ADDRESS,
    abi: PROPHECY_ABI,
    functionName: 'getUserPredictionDays',
    args: address ? [address, 1] : undefined,
    query: { enabled: !!address && contractReady },
  });

  const hasNoPredictions =
    !ethDays?.length && !btcDays?.length;

  if (!address) {
    return <div className="empty">Connect your wallet to see encrypted predictions.</div>;
  }

  if (!contractReady) {
    return <div className="empty">Set the contract address to load your predictions.</div>;
  }

  return (
    <div>
      <div className="card-heading">
        <div>
          <h2>My predictions</h2>
          <p className="subtext">Resolve the previous day after prices are recorded. Decrypt outcomes privately.</p>
        </div>
        <div className="badge badge-success">Encrypted state</div>
      </div>

      {hasNoPredictions ? (
        <div className="empty">
          No predictions yet. Place an encrypted call above and come back tomorrow to resolve it.
        </div>
      ) : (
        <div className="prediction-list">
          {([...((ethDays as bigint[]) || [])].reverse()).map((day) => (
            <PredictionRow
              key={`eth-${day.toString()}`}
              assetIndex={0}
              assetLabel="ETH"
              day={BigInt(day)}
              address={address}
              signerPromise={signerPromise}
              priceDecimals={priceDecimals}
              currentDay={currentDay}
              decryptHandles={decryptHandles}
              contractReady={contractReady}
            />
          ))}
          {([...((btcDays as bigint[]) || [])].reverse()).map((day) => (
            <PredictionRow
              key={`btc-${day.toString()}`}
              assetIndex={1}
              assetLabel="BTC"
              day={BigInt(day)}
              address={address}
              signerPromise={signerPromise}
              priceDecimals={priceDecimals}
              currentDay={currentDay}
              decryptHandles={decryptHandles}
              contractReady={contractReady}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PredictionRow({
  assetIndex,
  assetLabel,
  day,
  address,
  signerPromise,
  priceDecimals,
  currentDay,
  decryptHandles,
  contractReady,
}: RowProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [decrypting, setDecrypting] = useState(false);
  const [decrypted, setDecrypted] = useState<{ price?: string; direction?: string; outcome?: string }>({});
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: prediction } = useReadContract({
    address: PROPHECY_ADDRESS,
    abi: PROPHECY_ABI,
    functionName: 'getPrediction',
    args: [address, day, assetIndex],
    query: { enabled: contractReady },
  });

  const { data: pricePoint } = useReadContract({
    address: PROPHECY_ADDRESS,
    abi: PROPHECY_ABI,
    functionName: 'getPricesForDay',
    args: [day],
    query: { enabled: contractReady },
  });

  const priceHandle = (prediction as any)?.[0] as string | undefined;
  const directionHandle = (prediction as any)?.[1] as string | undefined;
  const outcomeHandle = (prediction as any)?.[2] as string | undefined;
  const stake = (prediction as any)?.[3] as bigint | undefined;
  const resolved = (prediction as any)?.[6] as boolean | undefined;
  const exists = (prediction as any)?.[5] as boolean | undefined;

  const updatedAt = pricePoint ? (pricePoint as any)[2] : undefined;
  const recordedPrice = pricePoint ? (assetIndex === 0 ? (pricePoint as any)[0] : (pricePoint as any)[1]) : undefined;

  const canConfirm =
    !!updatedAt &&
    typeof updatedAt === 'bigint' &&
    updatedAt > 0n &&
    !resolved &&
    currentDay !== undefined &&
    day < currentDay;

  const handleConfirm = async () => {
    if (!contractReady) {
      setActionError('Set the contract address before resolving.');
      return;
    }

    const signer = await signerPromise;
    if (!signer) {
      setActionError('Connect your wallet to resolve predictions.');
      return;
    }

    setActionError(null);
    setIsConfirming(true);
    try {
      const contract = new Contract(PROPHECY_ADDRESS, PROPHECY_ABI, signer);
      const tx = await contract.confirmPrediction(day, assetIndex);
      await tx.wait();
    } catch (error) {
      console.error(error);
      setActionError(error instanceof Error ? error.message : 'Failed to confirm prediction.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDecrypt = async () => {
    if (!priceHandle || !directionHandle) return;
    setDecrypting(true);
    setActionError(null);
    try {
      const handles = [priceHandle, directionHandle];
      if (outcomeHandle) {
        handles.push(outcomeHandle);
      }
      const result = await decryptHandles(handles);
      setDecrypted({
        price: result[priceHandle],
        direction: result[directionHandle],
        outcome: outcomeHandle ? result[outcomeHandle] : undefined,
      });
    } catch (error) {
      console.error(error);
      setActionError(error instanceof Error ? error.message : 'Failed to decrypt prediction.');
    } finally {
      setDecrypting(false);
    }
  };

  const statusText = resolved ? 'Resolved' : updatedAt && (updatedAt as bigint) > 0n ? 'Ready to confirm' : 'Waiting for price';
  const outcomeText = useMemo(() => {
    if (!decrypted.outcome) return undefined;
    const normalized = decrypted.outcome.toString().toLowerCase();
    const isTrue = normalized === '1' || normalized === 'true';
    return isTrue ? 'Winner' : 'Not matched';
  }, [decrypted.outcome]);

  if (!exists) {
    return null;
  }

  return (
    <div className="prediction-row">
      <div className="row-top">
        <div className="row-title">
          <div className="chip">{assetLabel}</div>
          <span>{formatDayLabel(day)}</span>
        </div>
        <div className="chip">{statusText}</div>
      </div>

      <div className="row-meta">
        <span>Stake: {formatStake(stake)}</span>
        <span>Recorded price: {formatScaledValue(recordedPrice as bigint | undefined, priceDecimals)}</span>
        <span>Posted: {formatTimestamp(updatedAt as bigint | undefined)}</span>
      </div>

      <div className="inline-actions">
        <button className="btn btn-primary" onClick={handleConfirm} disabled={!canConfirm || isConfirming}>
          {isConfirming ? 'Confirming...' : 'Confirm & settle'}
        </button>
        <button className="btn btn-secondary" onClick={handleDecrypt} disabled={decrypting}>
          {decrypting ? 'Decrypting...' : 'Decrypt details'}
        </button>
        {outcomeText ? <span className="badge badge-success">{outcomeText}</span> : null}
        {decrypted.price ? (
          <span className="chip">
            Price guess: {formatScaledValue(BigInt(decrypted.price), priceDecimals)} | Dir: {decrypted.direction}
          </span>
        ) : null}
      </div>

      {actionError ? <div className="helper" style={{ color: '#fecdd3' }}>{actionError}</div> : null}
    </div>
  );
}
