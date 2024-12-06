"use client";
import * as multisig from "@sqds/multisig";
import { useState } from "react";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";

export default function Home() {
  const [multisigInput, setMultisigInput] = useState<string>("");
  const [ephemeralSignerPublicKeys, setEphemeralSignerPublicKeys] = useState<
    string[]
  >([]);
  const [error, setError] = useState<string>("");
  const connection = new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL as string
  );

  const handleMultisigSubmit = async () => {
    try {
      setError("");
      const multisigPublicKey = new PublicKey(multisigInput);
      const multisigState = await multisig.accounts.Multisig.fromAccountAddress(
        connection,
        multisigPublicKey
      );

      const nextTransactionIndex = Number(multisigState.transactionIndex) + 1;
      const nextTransactionPda = multisig.getTransactionPda({
        index: BigInt(nextTransactionIndex),
        multisigPda: multisigPublicKey,
      })[0];

      // Generate 10 ephemeral signer addresses with different indices
      const ephemeralSigners = Array.from({ length: 10 }, (_, i) => {
        const [ephemeralSignerKey] = multisig.getEphemeralSignerPda({
          transactionPda: nextTransactionPda,
          ephemeralSignerIndex: i,
        });
        return ephemeralSignerKey.toBase58();
      });

      setEphemeralSignerPublicKeys(ephemeralSigners);
    } catch (err) {
      setError("Invalid multisig address or network error");
      setEphemeralSignerPublicKeys([]);
    }
  };

  return (
    <div className="min-h-screen p-8 flex flex-col items-center gap-8 bg-gray-50">
      <h1 className="text-2xl font-bold mt-8">Ephemeral Signers Generator</h1>

      <div className="w-full max-w-2xl">
        <div className="flex gap-4 mb-8">
          <input
            type="text"
            value={multisigInput}
            onChange={(e) => setMultisigInput(e.target.value)}
            placeholder="Enter Multisig Public Key"
            className="flex-1 p-3 border rounded-lg"
          />
          <button
            onClick={handleMultisigSubmit}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Generate
          </button>
        </div>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        {ephemeralSignerPublicKeys.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">
              Ephemeral Signers for Next Transaction
            </h2>
            <div className="space-y-3">
              {ephemeralSignerPublicKeys.map((address, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded flex items-center gap-4"
                >
                  <span className="font-mono text-sm">Index {index}:</span>
                  <span className="font-mono text-sm flex-1">{address}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
