import { useMemo, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';

import { Header } from './Header';
import { PredictionForm } from './PredictionForm';
import { PredictionsList } from './PredictionsList';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { PROPHECY_ADDRESS, PROPHECY_ABI } from '../config/contracts';
import { formatDayLabel, formatScaledValue, formatTimestamp } from '../utils/format';

export function ProphecyApp() {
  const { address } = useAccount();
  const { instance, isLoading: instanceLoading, error: instanceError } = useZamaInstance();
  const signer = useEthersSigner();
  const hasContract = true;

  const [pointsValue, setPointsValue] = useState<string | null>(null);
  const [decryptingPoints, setDecryptingPoints] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);

  const { data: decimalsData } = useReadContract({
    address: PROPHECY_ADDRESS,
    abi: PROPHECY_ABI,
    functionName: 'getPriceDecimals',
    query: { enabled: hasContract },
  });

  const priceDecimals = useMemo(() => Number(decimalsData ?? 8n), [decimalsData]);

  const { data: currentDay } = useReadContract({
    address: PROPHECY_ADDRESS,
    abi: PROPHECY_ABI,
    functionName: 'getCurrentDay',
    query: { enabled: hasContract },
  });

  const { data: lastRecordedDay } = useReadContract({
    address: PROPHECY_ADDRESS,
    abi: PROPHECY_ABI,
    functionName: 'lastRecordedDay',
    query: { enabled: hasContract },
  });

  const { data: lastPrices } = useReadContract({
    address: PROPHECY_ADDRESS,
    abi: PROPHECY_ABI,
    functionName: 'getPricesForDay',
    args: lastRecordedDay !== undefined ? [lastRecordedDay] : undefined,
    query: {
      enabled: hasContract && lastRecordedDay !== undefined,
    },
  });

  const { data: encryptedPoints } = useReadContract({
    address: PROPHECY_ADDRESS,
    abi: PROPHECY_ABI,
    functionName: 'getUserPoints',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && hasContract,
    },
  });

  const decryptHandles = async (handles: string[]) => {
    if (!hasContract) {
      throw new Error('Set the deployed contract address first.');
    }

    if (!instance) {
      throw new Error('Encryption service not ready.');
    }

    const signerInstance = await signer;
    if (!signerInstance) {
      throw new Error('Connect your wallet first.');
    }

    if (!address) {
      throw new Error('Connect your wallet to decrypt data.');
    }

    const keypair = instance.generateKeypair();
    const startTimeStamp = Math.floor(Date.now() / 1000).toString();
    const durationDays = '10';
    const contractAddresses = [PROPHECY_ADDRESS];

    const eip712 = instance.createEIP712(keypair.publicKey, contractAddresses, startTimeStamp, durationDays);
    const signature = await signerInstance.signTypedData(
      eip712.domain,
      {
        UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
      },
      eip712.message
    );

    return instance.userDecrypt(
      handles.map((h) => ({ handle: h, contractAddress: PROPHECY_ADDRESS })),
      keypair.privateKey,
      keypair.publicKey,
      signature.replace('0x', ''),
      contractAddresses,
      address,
      startTimeStamp,
      durationDays
    );
  };

  const decryptPoints = async () => {
    if (!encryptedPoints || encryptedPoints === '0x') {
      setPointsValue('0');
      return;
    }

    setDecryptingPoints(true);
    setUiError(null);
    try {
      const result = await decryptHandles([encryptedPoints as string]);
      const clearValue = result[encryptedPoints as string];
      if (clearValue !== undefined) {
        setPointsValue(clearValue.toString());
      }
    } catch (error) {
      console.error(error);
      setUiError(error instanceof Error ? error.message : 'Failed to decrypt points');
    } finally {
      setDecryptingPoints(false);
    }
  };

  const ethPrice = lastPrices ? (lastPrices as any)[0] : undefined;
  const btcPrice = lastPrices ? (lastPrices as any)[1] : undefined;
  const updatedAt = lastPrices ? (lastPrices as any)[2] : undefined;

  return (
    <div className="app-shell">
      <div className="content">
        <Header />

        {!hasContract ? (
          <div className="card" style={{ border: '1px solid rgba(248,113,113,0.3)', color: '#fecdd3' }}>
            Set <code>PROPHECY_ADDRESS</code> to the Sepolia deployment address and redeploy the frontend.
          </div>
        ) : null}

        <section className="status-grid">
          <div className="stat-card accent">
            <div className="stat-label">Encrypted points</div>
            <div className="stat-value">
              {pointsValue !== null ? `${pointsValue} pts` : 'Hidden'}
            </div>
            <div className="actions">
              <button
                className="btn btn-primary"
                onClick={decryptPoints}
                disabled={!address || decryptingPoints || instanceLoading}
              >
                {decryptingPoints ? 'Decrypting...' : 'Decrypt my points'}
              </button>
            </div>
            <div className="stat-meta">Points grow by the exact ETH you stake on correct calls.</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Last recorded prices</div>
            <div className="stat-value">
              <span>ETH</span>
              <span className="muted">{formatScaledValue(ethPrice, priceDecimals)}</span>
            </div>
            <div className="stat-value" style={{ marginTop: '-6px' }}>
              <span>BTC</span>
              <span className="muted">{formatScaledValue(btcPrice, priceDecimals)}</span>
            </div>
            <div className="stat-meta">
              {lastRecordedDay !== undefined ? formatDayLabel(lastRecordedDay as bigint) : 'No price posted'}
              {' • '}
              {formatTimestamp(updatedAt as bigint | undefined)}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Timeline</div>
            <div className="stat-value">
              Day {currentDay ? currentDay.toString() : '—'}
            </div>
            <div className="stat-meta">
              Place predictions before the daily price is locked at UTC 00:00. Resolve them the following day once prices are posted.
            </div>
            {instanceError ? (
              <div className="stat-meta" style={{ color: '#f87171' }}>
                {instanceError}
              </div>
            ) : null}
          </div>
        </section>

        {uiError ? (
          <div className="card" style={{ border: '1px solid rgba(248,113,113,0.3)', color: '#fecdd3' }}>
            {uiError}
          </div>
        ) : null}

        <section className="grid-split">
          <div className="card">
            <PredictionForm
              address={address}
              instance={instance}
              signerPromise={signer}
              priceDecimals={priceDecimals}
              currentDay={currentDay}
              instanceLoading={instanceLoading}
              contractReady={hasContract}
            />
          </div>
          <div className="card">
            <PredictionsList
              address={address}
              signerPromise={signer}
              priceDecimals={priceDecimals}
              currentDay={currentDay}
              decryptHandles={decryptHandles}
              contractReady={hasContract}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
