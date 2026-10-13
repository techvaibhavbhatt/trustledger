"use client";

import { useState } from "react";
import { createPublicClient, http, defineChain } from "viem";
import { TRUSTLEDGER_ADDRESS, TRUSTLEDGER_ABI } from "@/lib/contract";

const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet-rpc.monad.xyz"] } },
});

const client = createPublicClient({ chain: monadTestnet, transport: http() });

export default function VerifyPage() {
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    owner: string;
    credentialHash: string;
    score: number;
    timestamp: number;
  } | null>(null);

  const verify = async () => {
    setError("");
    setResult(null);
    if (id === "") {
      setError("Please enter a credential ID.");
      return;
    }

    try {
      setLoading(true);
      const data = (await client.readContract({
        address: TRUSTLEDGER_ADDRESS as `0x${string}`,
        abi: TRUSTLEDGER_ABI,
        functionName: "verifyCredential",
        args: [BigInt(id)],
      })) as readonly [string, string, bigint, bigint];

      setResult({
        owner: data[0],
        credentialHash: data[1],
        score: Number(data[2]),
        timestamp: Number(data[3]),
      });
    } catch {
      setError("This credential does not exist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center px-6 py-20">
        <a href="/" className="text-sm text-gray-500 hover:text-gray-300 mb-8">
          Back to TrustLedger
        </a>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-br from-white to-indigo-300 bg-clip-text text-transparent">
          Verify Credential
        </h1>
        <p className="text-gray-400 mb-8 text-center">
          Read directly from the blockchain. No one can edit it.
        </p>

        <div className="w-full max-w-md bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4">
          <input
            type="number"
            min={0}
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="Credential ID (e.g. 0, 1, 2)"
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
          <button
            onClick={verify}
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 transition"
          >
            {loading ? "Checking..." : "Verify"}
          </button>

          {error && (
            <div className="text-sm text-center px-4 py-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              {error}
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 space-y-2 text-sm">
              <div className="text-green-400 font-semibold">Verified onchain</div>
              <div className="text-gray-300">
                <span className="text-gray-500">Score: </span>
                <span className="font-bold text-white">{result.score}/100</span>
              </div>
              <div className="text-gray-300 break-words">
                <span className="text-gray-500">Credential: </span>
                {result.credentialHash}
              </div>
              <div className="text-gray-300 break-all">
                <span className="text-gray-500">Owner wallet: </span>
                {result.owner}
              </div>
              <div className="text-gray-300">
                <span className="text-gray-500">Created: </span>
                {new Date(result.timestamp * 1000).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}